#!/usr/bin/env python3
"""Unified knowledge search: main ChromaDB + image ChromaDB.

Safe dual-DB retrieval for the knowledge-base "usage" phase.
- Main DB:  ~/.openclaw/workspace/memory/chroma
- Image DB: ~/.openclaw/workspace-tech/memory/chroma

The script intentionally avoids Chroma collection.query() and uses
collection.get()+NumPy cosine to prevent the known macOS/Python/Chroma segfault
seen on image collections.
"""
from __future__ import annotations

import argparse
import concurrent.futures as futures
import json
import os
import re
import time
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Iterable

import chromadb
import numpy as np
import requests

MAIN_CHROMA = os.path.expanduser("~/.openclaw/workspace/memory/chroma")
IMAGE_CHROMA = os.path.expanduser("~/.openclaw/workspace-tech/memory/chroma")
EMBED_MODEL = os.environ.get("KNOWLEDGE_EMBED_MODEL", "qwen3-embedding:0.6b")
EMBED_URL = os.environ.get("KNOWLEDGE_EMBED_URL", "http://localhost:11434/api/embed")

DEFAULT_MAIN_COLLECTIONS = ["knowledge-unified-v2"]
DEFAULT_IMAGE_COLLECTIONS = ["knowledge-images-v1-clean"]

CUSTOMER_COLLECTIONS = {
    "baisheng": "knowledge-baisheng", "百胜": "knowledge-baisheng",
    "jd": "knowledge-jd", "京东": "knowledge-jd",
    "zhongruan": "knowledge-zhongruan", "中软": "knowledge-zhongruan",
    "zhichi": "knowledge-zhichi", "智齿": "knowledge-zhichi",
    "qinglan": "knowledge-qinglan", "清澜": "knowledge-qinglan",
    "huibo": "knowledge-huibo", "慧博": "knowledge-huibo",
    "old-hdd": "knowledge-old-hdd", "旧硬盘": "knowledge-old-hdd",
    "self": "knowledge-self", "自己": "knowledge-self",
    "feiliu": "knowledge-feiliu", "飞榴": "knowledge-feiliu",
    "zhongkejin": "knowledge-zhongkejin", "中科金": "knowledge-zhongkejin",
    "lianxiang": "knowledge-lianxiang", "联想": "knowledge-lianxiang",
    "xiangzheng": "knowledge-xiangzheng", "象征": "knowledge-xiangzheng",
}

DOMAIN_LEXICON = {
    "inventory": ["库存", "进销存", "补货", "配货", "仓储", "WMS", "库存管理"],
    "reporting": ["报表", "看板", "数据分析", "统计", "BI", "dashboard"],
    "customer_ops": ["客户", "会员", "标签", "分群", "CRM", "SCRM", "企微", "客服", "会话", "质检", "运营", "营销", "RFM"],
    "solution": ["方案", "架构", "流程", "案例", "售前", "项目", "实施"],
    "config": ["配置", "部署", "接口", "对接", "异常", "错误", "排查"],
}

IMAGE_TYPE_HINTS = {
    "ui_screenshot": ["界面", "页面", "截图", "后台", "管理端", "小程序", "APP", "菜单"],
    "flowchart": ["流程", "流程图", "步骤", "节点", "审批", "流转"],
    "architecture": ["架构", "架构图", "系统", "平台", "中台", "模块", "服务"],
    "config_screenshot": ["配置", "设置", "参数", "规则", "后台", "控制台"],
}

SCENARIO_THRESHOLDS = {
    "presales": (0.78, 0.62),
    "product": (0.78, 0.62),
    "delivery": (0.82, 0.70),
    "experience": (0.72, 0.55),
    "auto": (0.78, 0.62),
}


@dataclass
class SearchResult:
    rank_score: float
    confidence: str
    source: str  # main / image / customer
    collection: str
    id: str
    title: str
    path: str
    snippet: str
    distance: float
    cosine_sim: float
    normalized_sim: float
    boost: float
    scenario_weight: float
    metadata: dict[str, Any]


def toks(s: str) -> set[str]:
    zh = re.findall(r"[\u4e00-\u9fff]{2,}", s)
    en = re.findall(r"[A-Za-z0-9_]{2,}", s.lower())
    bigrams: list[str] = []
    for z in zh:
        bigrams.extend(z[i:i + 2] for i in range(max(0, len(z) - 1)))
    return set(zh + en + bigrams)


def expanded_query(query: str, module: str | None = None, output_type: str | None = None, scenario: str = "auto") -> str:
    extra: list[str] = []
    q = " ".join(x for x in [query, module or "", output_type or ""] if x)
    for terms in DOMAIN_LEXICON.values():
        if any(t.lower() in q.lower() for t in terms):
            extra.extend(terms)
    if scenario == "product":
        extra.extend(["PRD", "需求", "字段", "流程", "界面"])
    elif scenario == "delivery":
        extra.extend(["配置", "部署", "接口", "数据库", "排查", "实施"])
    elif scenario == "presales":
        # Keep presales expansion intentionally narrow for win/loss review.
        # Broad terms like “案例/方案/行业/客户” made all retrieval strategies
        # collapse to the same top documents. Strategy-specific query terms now
        # carry the retrieval intent.
        extra.extend(["售前", "商机"])
    elif scenario == "experience":
        extra.extend(["经验", "案例", "总结", "方法论", "项目"])
    return q + (" " + " ".join(dict.fromkeys(extra)) if extra else "")


def embed(text: str) -> np.ndarray:
    r = requests.post(EMBED_URL, json={"model": EMBED_MODEL, "input": [text]}, timeout=30)
    r.raise_for_status()
    data = r.json()
    if "embeddings" in data:
        return np.asarray(data["embeddings"][0], dtype=np.float32)
    if "data" in data:
        return np.asarray(data["data"][0]["embedding"], dtype=np.float32)
    raise RuntimeError(f"Unexpected embedding response keys: {list(data.keys())}")


def meta_path(meta: dict[str, Any]) -> str:
    return str(meta.get("source_path") or meta.get("file_path") or meta.get("path") or "")


def meta_title(meta: dict[str, Any], path: str) -> str:
    return str(meta.get("file_name") or Path(path).name or meta.get("title") or "untitled")


def meta_hay(meta: dict[str, Any], doc: str = "") -> str:
    return (doc + " " + " ".join(str(v) for v in meta.values() if isinstance(v, (str, int, float)))).lower()


def domain_ok(meta: dict[str, Any], domain: str | None) -> bool:
    if not domain or domain == "all":
        return True
    d = domain.lower()
    hay = meta_hay(meta)
    mapped = {
        "百胜": ["百胜", "b-百胜", "baisheng"], "京东": ["京东", "j-京东", "jd"],
        "中软": ["中软", "z-中软", "zhongruan"], "智齿": ["智齿", "z-智齿", "zhichi"],
        "清澜": ["清澜", "qinglan"], "自己": ["自己", "self", "personal"],
    }
    needles = mapped.get(domain, [domain, d])
    return any(n.lower() in hay for n in needles)


def image_type_ok(doc: str, meta: dict[str, Any], output_type: str | None) -> bool:
    if not output_type:
        return True
    ot = output_type.lower()
    if not any(k in ot for k in ["界面", "截图", "流程", "架构", "配置"]):
        return True
    # Weak filter only: current image DB has no explicit image_category metadata.
    hay = meta_hay(meta, doc)
    if "流程" in output_type:
        return meta.get("file_type") in {".xmind", ".drawio", ".svg"} or any(x in hay for x in IMAGE_TYPE_HINTS["flowchart"])
    if "架构" in output_type:
        return meta.get("file_type") in {".xmind", ".drawio", ".svg"} or any(x in hay for x in IMAGE_TYPE_HINTS["architecture"])
    if "配置" in output_type:
        return any(x.lower() in hay for x in IMAGE_TYPE_HINTS["config_screenshot"])
    if "界面" in output_type or "截图" in output_type:
        return meta.get("file_type") in {".png", ".jpg", ".jpeg"} and any(x.lower() in hay for x in IMAGE_TYPE_HINTS["ui_screenshot"])
    return True


def low_quality_text(doc: str) -> bool:
    """Filter obvious binary/garbled extraction fragments from old .doc files."""
    if not doc:
        return True
    sample = doc[:500]
    useful = re.findall(r"[\u4e00-\u9fffA-Za-z0-9]", sample)
    # Very short binary-ish chunks like "!#$%" should not enter top results.
    return len(useful) < max(12, len(sample) * 0.18)


def keyword_boost(query: str, doc: str, meta: dict[str, Any], source: str, module: str | None, customer: str | None, error_type: str | None) -> float:
    qtokens = toks(" ".join(x for x in [query, module or "", customer or "", error_type or ""] if x))
    path = meta_path(meta)
    hay = (doc + " " + path + " " + meta_title(meta, path)).lower()
    hit = sum(1 for t in qtokens if t.lower() in hay)
    file_hit = sum(1 for t in qtokens if t.lower() in Path(path).name.lower())
    boost = hit * 0.025 + file_hit * 0.06
    if module and module.lower() in hay:
        boost += 0.10
    if customer and customer.lower() in hay:
        boost += 0.12
    if error_type:
        if "配置" in error_type and any(x in hay for x in ["配置", "参数", "设置", "部署"]):
            boost += 0.10
        if "数据" in error_type and any(x in hay for x in ["数据", "数据库", "字段", "表"]):
            boost += 0.10
        if "对接" in error_type and any(x in hay for x in ["接口", "api", "对接", "同步"]):
            boost += 0.10
    if source == "image" and meta.get("extract_method") in {"vision-caption", "xmind-text", "svg-text", "drawio-xml"}:
        # Keep image structured/captioned assets visible, but avoid letting
        # caption hits dominate document evidence in product/PRD searches.
        boost += 0.015
    if source in {"main", "customer"} and meta.get("source_type") == "company-personal":
        boost += 0.02
    return min(boost, 0.60)


def scenario_weight(source: str, scenario: str, output_type: str | None, include_customer: bool, module: str | None = None) -> float:
    w = 1.0
    if scenario == "presales":
        if source == "image": w *= 1.08
        if source == "customer": w *= 1.25
    elif scenario == "product":
        if output_type and any(x in output_type for x in ["界面", "截图", "流程图"]):
            if source == "image": w *= 1.28
        if output_type and any(x in output_type for x in ["PRD", "字段", "说明"]):
            if source in {"main", "customer"}: w *= 1.35
    elif scenario == "delivery":
        if source == "customer": w *= 2.0
        elif source == "image": w *= 0.70
        elif source == "main": w *= 1.10
        if module and "知识库" in module:
            if source in {"main", "customer"}: w *= 1.25
            if source == "image": w *= 0.75
    elif scenario == "experience":
        if source == "image": w *= 0.8
        if source in {"main", "customer"}: w *= 1.1
    if include_customer and source == "customer":
        w *= 1.15
    return w


def confidence(score: float, scenario: str) -> str:
    hi, mid = SCENARIO_THRESHOLDS.get(scenario, SCENARIO_THRESHOLDS["auto"])
    if score >= hi:
        return "high"
    if score >= mid:
        return "medium"
    return "low"


def search_collection(
    chroma_path: str,
    collection_name: str,
    query: str,
    qvec: np.ndarray,
    source: str,
    top_k: int,
    domain: str | None = None,
    module: str | None = None,
    output_type: str | None = None,
    customer: str | None = None,
    error_type: str | None = None,
) -> list[SearchResult]:
    client = chromadb.PersistentClient(path=chroma_path)
    col = client.get_collection(collection_name)
    # Some customer collections are large enough to trigger SQLite's
    # "too many SQL variables" if Chroma expands a full collection get into
    # one oversized query. Page through the collection to keep the HTTP API
    # stable across both main and customer专题库.
    ids: list[str] = []
    docs: list[str] = []
    metas: list[dict[str, Any]] = []
    embeddings: list[Any] = []
    batch_size = 2000
    offset = 0
    while True:
        batch = col.get(include=["embeddings", "documents", "metadatas"], limit=batch_size, offset=offset)
        batch_ids = batch.get("ids") or []
        if not batch_ids:
            break
        ids.extend(batch_ids)
        batch_docs = batch.get("documents")
        batch_metas = batch.get("metadatas")
        batch_embeddings = batch.get("embeddings")
        docs.extend(batch_docs if batch_docs is not None else [""] * len(batch_ids))
        metas.extend(batch_metas if batch_metas is not None else [{}] * len(batch_ids))
        if batch_embeddings is not None:
            embeddings.extend(list(batch_embeddings))
        if len(batch_ids) < batch_size:
            break
        offset += batch_size

    if not ids:
        return []
    rows: list[SearchResult] = []
    embs = np.asarray(embeddings, dtype=np.float32)
    q_norm = qvec / (np.linalg.norm(qvec) + 1e-9)
    embs_norm = embs / (np.linalg.norm(embs, axis=1, keepdims=True) + 1e-9)
    sims = embs_norm @ q_norm
    cand_n = min(len(sims), max(top_k * 8, 40))
    candidate_idx = np.argpartition(-sims, cand_n - 1)[:cand_n]
    for i in candidate_idx:
        meta = metas[int(i)] or {}
        doc = docs[int(i)] or ""
        if source in {"main", "customer"} and low_quality_text(doc):
            continue
        if not domain_ok(meta, domain):
            continue
        if source == "image" and not image_type_ok(doc, meta, output_type):
            continue
        path = meta_path(meta)
        title = meta_title(meta, path)
        sim = float(sims[int(i)])
        dist = 1 - sim
        boost = keyword_boost(query, doc, meta, source, module, customer, error_type)
        rows.append(SearchResult(
            rank_score=round(sim, 6), confidence="", source=source, collection=collection_name,
            id=ids[int(i)], title=title, path=path, snippet=doc[:360].replace("\n", " "),
            distance=round(dist, 6), cosine_sim=round(sim, 6), normalized_sim=round(sim, 6),
            boost=round(boost, 6), scenario_weight=1.0, metadata=meta,
        ))
    rows.sort(key=lambda r: r.cosine_sim, reverse=True)
    return rows[:top_k]


def normalize_by_source(results: list[SearchResult], mode: str) -> None:
    if mode == "raw" or not results:
        for r in results:
            r.normalized_sim = r.cosine_sim
        return
    groups: dict[str, list[SearchResult]] = {}
    for r in results:
        groups.setdefault(r.source, []).append(r)
    for rows in groups.values():
        vals = [r.cosine_sim for r in rows]
        lo, hi = min(vals), max(vals)
        for r in rows:
            r.normalized_sim = 0.5 + 0.5 * ((r.cosine_sim - lo) / (hi - lo)) if hi > lo else r.cosine_sim
            r.normalized_sim = round(r.normalized_sim, 6)


def rerank(results: list[SearchResult], scenario: str, output_type: str | None, include_customer: bool, normalize: str, module: str | None = None) -> list[SearchResult]:
    normalize_by_source(results, normalize)
    for r in results:
        w = scenario_weight(r.source, scenario, output_type, include_customer, module)
        r.scenario_weight = round(w, 4)
        r.rank_score = round(r.normalized_sim * w + r.boost, 6)
        r.confidence = confidence(r.rank_score, scenario)
    return dedupe(results)


def dedupe(results: Iterable[SearchResult]) -> list[SearchResult]:
    best: dict[str, SearchResult] = {}
    for r in results:
        key = r.path or r.id
        old = best.get(key)
        if old is None or r.rank_score > old.rank_score:
            best[key] = r
    out = list(best.values())
    out.sort(key=lambda r: r.rank_score, reverse=True)
    return out


def selected_main_jobs(domain: str | None, include_customer: bool, customer: str | None) -> list[tuple[str, str, str]]:
    jobs = [(MAIN_CHROMA, "knowledge-unified-v2", "main")]
    key = customer or domain
    if include_customer and key:
        c = CUSTOMER_COLLECTIONS.get(key) or CUSTOMER_COLLECTIONS.get(str(key).lower())
        if c and c != "knowledge-unified-v2":
            jobs.append((MAIN_CHROMA, c, "customer"))
    return jobs


def unified_search(
    query: str,
    top_k: int,
    domain: str | None,
    include_customer: bool,
    timeout: float,
    scenario: str = "auto",
    module: str | None = None,
    output_type: str | None = None,
    customer: str | None = None,
    error_type: str | None = None,
    normalize: str = "raw",
    per_source_k: int | None = None,
) -> dict[str, Any]:
    t0 = time.time()
    qvec = embed(expanded_query(query, module=module, output_type=output_type, scenario=scenario))
    jobs: list[tuple[str, str, str]] = []
    jobs.extend(selected_main_jobs(domain, include_customer, customer))
    jobs.extend((IMAGE_CHROMA, c, "image") for c in DEFAULT_IMAGE_COLLECTIONS)

    results: list[SearchResult] = []
    errors: list[dict[str, str]] = []
    per_k = per_source_k or max(top_k, 12)

    # Chroma's local PersistentClient is not fully thread-safe when multiple
    # collections under the same path are opened concurrently.  Run one worker
    # per Chroma path (main DB and image DB can still run in parallel), and
    # serialize collections inside each path.
    grouped: dict[str, list[tuple[str, str]]] = {}
    for p, c, source in jobs:
        grouped.setdefault(p, []).append((c, source))

    def search_path_group(p: str, group_jobs: list[tuple[str, str]]) -> tuple[list[SearchResult], list[dict[str, str]]]:
        group_results: list[SearchResult] = []
        group_errors: list[dict[str, str]] = []
        for c, source in group_jobs:
            try:
                group_results.extend(search_collection(p, c, query, qvec, source, per_k, domain, module, output_type, customer, error_type))
            except Exception as e:
                group_errors.append({"collection": c, "source": source, "error": str(e)[:240]})
        return group_results, group_errors

    with futures.ThreadPoolExecutor(max_workers=min(2, len(grouped))) as ex:
        futs = {ex.submit(search_path_group, p, group_jobs): p for p, group_jobs in grouped.items()}
        try:
            done_iter = futures.as_completed(futs, timeout=timeout + 2)
            for fut in done_iter:
                try:
                    group_results, group_errors = fut.result(timeout=timeout)
                    results.extend(group_results)
                    errors.extend(group_errors)
                except Exception as e:
                    errors.append({"collection": "*", "source": futs[fut], "error": str(e)[:240]})
        except futures.TimeoutError:
            errors.append({"collection": "*", "source": "*", "error": f"timeout>{timeout}s"})

    merged = rerank(results, scenario, output_type, include_customer, normalize, module)[:top_k]
    return {
        "query": query,
        "scenario": scenario,
        "domain": domain or "all",
        "module": module,
        "output_type": output_type,
        "customer": customer,
        "top_k": top_k,
        "normalize": normalize,
        "embedding_model": EMBED_MODEL,
        "elapsed_ms": int((time.time() - t0) * 1000),
        "searched": [{"path": p, "collection": c, "source": s} for p, c, s in jobs],
        "errors": errors,
        "insufficient": len(merged) < top_k,
        "results": [asdict(r) for r in merged],
    }


def print_text(payload: dict[str, Any]) -> None:
    print(f"Query: {payload['query']} | scenario={payload['scenario']} | domain={payload['domain']} | elapsed={payload['elapsed_ms']}ms")
    if payload["errors"]:
        print("Errors:", payload["errors"])
    if payload.get("insufficient"):
        print(f"Notice: results less than requested top_k={payload['top_k']} (宁缺毋滥).")
    for i, r in enumerate(payload["results"], 1):
        print(f"\n{i}. [{r['source']}/{r['collection']}] score={r['rank_score']:.3f} cos={r['cosine_sim']:.3f} norm={r['normalized_sim']:.3f} w={r['scenario_weight']} confidence={r['confidence']} title={r['title']}")
        print(f"   path: {r['path']}")
        print(f"   snippet: {r['snippet']}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--query", required=True, help="natural language query")
    ap.add_argument("--top-k", type=int, default=8)
    ap.add_argument("--per-source-k", type=int, default=0)
    ap.add_argument("--domain", default="all", help="all/百胜/京东/中软/智齿/清澜/自己 or customer alias")
    ap.add_argument("--customer", default=None, help="customer name/alias for customer专题库")
    ap.add_argument("--module", default=None, help="business module filter/boost keyword")
    ap.add_argument("--output-type", default=None, help="PRD参考/界面截图/字段说明/流程图/配置截图 etc")
    ap.add_argument("--error-type", default=None, help="配置异常/数据异常/对接异常/其他")
    ap.add_argument("--scenario", choices=["auto", "presales", "product", "delivery", "experience"], default="auto")
    ap.add_argument("--include-customer", action="store_true", help="also search matched customer专题库 when domain/customer is set")
    ap.add_argument("--normalize", choices=["raw", "source-minmax"], default="raw")
    ap.add_argument("--timeout", type=float, default=20)
    ap.add_argument("--format", choices=["text", "json"], default="text")
    args = ap.parse_args()
    payload = unified_search(
        args.query, args.top_k, None if args.domain == "all" else args.domain, args.include_customer,
        args.timeout, scenario=args.scenario, module=args.module, output_type=args.output_type,
        customer=args.customer, error_type=args.error_type, normalize=args.normalize,
        per_source_k=args.per_source_k or None,
    )
    if args.format == "json":
        print(json.dumps(payload, ensure_ascii=False, indent=2))
    else:
        print_text(payload)


if __name__ == "__main__":
    main()
