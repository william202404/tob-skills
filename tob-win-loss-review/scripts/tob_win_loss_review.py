#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

try:
    from unified_knowledge_search import unified_search  # type: ignore
except Exception as e:  # pragma: no cover
    unified_search = None
    IMPORT_ERROR = e
else:
    IMPORT_ERROR = None

STOPWORDS = set("客户 我们 对方 竞品 虽然 但是 因为 所以 一个 这个 那个 阶段 有限 表现 更好 倾向 重新 评估".split())
PRIVATE_NAME_TOKENS = {"李宁", "李寧", "lining", "william"}

@dataclass
class WinLossInput:
    industry: str
    size: str
    duration: str
    stage: str
    competitor: str
    event: str
    amount: str = ""

@dataclass
class Evidence:
    strategy: str
    title: str
    path: str
    snippet: str
    score: float
    confidence: str
    source: str


def prompt_if_missing(v: str | None, label: str, default: str = "") -> str:
    if v:
        return v.strip()
    s = input(f"{label}{'（可选）' if default else ''}: ").strip()
    return s or default


def extract_keywords(text: str) -> list[str]:
    zh = re.findall(r"[\u4e00-\u9fffA-Za-z0-9%]+", text)
    terms: list[str] = []
    for t in zh:
        if len(t) >= 2 and t not in STOPWORDS:
            terms.append(t)
    # business phrase hints
    hints = ["价格", "预算", "功能", "CTO", "换人", "业务部门", "技术团队", "POC", "性能", "报价", "审批", "决策链", "价值"]
    for h in hints:
        if h.lower() in text.lower():
            terms.append(h)
    return list(dict.fromkeys(terms))[:12]

def sanitize_filename(name: str) -> str:
    """Show only a safe basename and strip personal-name tokens from filenames."""
    if not name:
        return ""
    base = Path(str(name)).name
    for token in PRIVATE_NAME_TOKENS:
        base = re.sub(re.escape(token), "", base, flags=re.IGNORECASE)
    base = re.sub(r"[-_—–\s]+(?=\.)", "", base)
    base = re.sub(r"^[-_—–\s]+|[-_—–\s]+$", "", base)
    return base or "已脱敏文件"


def sanitize_text(text: str) -> str:
    """Remove local absolute paths and personal filename tokens from output text."""
    if not text:
        return ""

    def repl(m: re.Match[str]) -> str:
        return sanitize_filename(m.group(0))

    # macOS/Linux absolute paths: keep only basename. First handle paths with spaces up to common file extensions.
    text = re.sub(r"/(?:Users|Volumes|private|tmp|var)/[^，。；：、（）()<>\[\]{}'\"]+?\.(?:pptx?|docx?|xlsx?|pdf|md|txt|xmind|html?)", repl, str(text), flags=re.IGNORECASE)
    text = re.sub(r"/(?:Users|Volumes|private|tmp|var)/[^\s，。；：、（）()<>\[\]{}'\"]+", repl, text)
    # Windows absolute paths just in case.
    text = re.sub(r"[A-Za-z]:\\[^\s，。；：、（）()<>\[\]{}'\"]+", repl, text)
    for token in PRIVATE_NAME_TOKENS:
        text = re.sub(re.escape(token), "", text, flags=re.IGNORECASE)
    return text.strip()


def strategy_params(strategy: str) -> tuple[str, str]:
    """Return narrow per-strategy retrieval hints to avoid all paths converging."""
    if strategy == "行业模式匹配":
        return "行业 痛点 成功案例", "行业方案/客户案例"
    if strategy == "竞品模式匹配":
        return "竞品 定价 优劣势 反制", "竞品分析/竞争策略"
    if strategy == "阶段风险匹配":
        return "商机 阶段 风险 合同 里程碑", "项目记录/售前过程"
    if strategy == "关键词匹配":
        return "客户原话 关键事件 相似场景", "项目记录/会议纪要"
    return "丢单 复盘 改进建议", "经验总结/方法论"


def run_search(strategy: str, query: str, top_k: int = 5) -> tuple[list[Evidence], list[dict[str, str]]]:
    if unified_search is None:
        return [], [{"type": "knowledge_unavailable", "message": f"未配置本地知识库检索，已降级为纯规则引擎：{IMPORT_ERROR}"}]
    module, output_type = strategy_params(strategy)
    payload = unified_search(
        query=query,
        top_k=top_k,
        domain="all",
        include_customer=True,
        timeout=25,
        scenario="presales",
        module=module,
        output_type=output_type,
        normalize="raw",
        per_source_k=max(top_k, 10),
    )
    evs: list[Evidence] = []
    for r in payload.get("results", []):
        score = float(r.get("rank_score") or 0)
        # Keep low-score items as background evidence but final synthesis will mark weak.
        evs.append(Evidence(
            strategy=strategy,
            title=sanitize_text(r.get("title") or "untitled"),
            path=sanitize_filename(r.get("path") or ""),
            snippet=sanitize_text((r.get("snippet") or "")[:260]),
            score=score,
            confidence=r.get("confidence") or "low",
            source=f"{r.get('source')}/{r.get('collection')}",
        ))
    return evs, payload.get("errors", [])


def source_line(e: Evidence) -> str:
    name = sanitize_text(e.title) or sanitize_filename(e.path) or e.source
    location = sanitize_filename(e.path) or e.source
    return f"{name}（{location}，score={e.score:.2f}）"


def evidence_key(e: Evidence) -> str:
    return e.path or e.title or e.source


def dedupe_evidence(rows: list[Evidence], limit: int = 3) -> list[Evidence]:
    best: dict[str, Evidence] = {}
    for e in rows:
        key = evidence_key(e)
        old = best.get(key)
        if old is None or e.score > old.score:
            best[key] = e
    return sorted(best.values(), key=lambda x: x.score, reverse=True)[:limit]


def independent_source_count(evidence: list[Evidence]) -> int:
    return len({evidence_key(e) for e in evidence})


def best_evidence(evidence: list[Evidence], *needles: str, min_score: float = 0.55) -> list[Evidence]:
    ns = [n.lower() for n in needles if n]
    out = []
    for e in evidence:
        hay = (e.title + " " + e.path + " " + e.snippet + " " + e.strategy).lower()
        if e.score >= min_score and (not ns or any(n in hay for n in ns)):
            out.append(e)
    return dedupe_evidence(out, limit=3)


def infer_causes(inp: WinLossInput, evidence: list[Evidence]) -> list[dict[str, Any]]:
    event = inp.event
    causes: list[dict[str, Any]] = []

    def add(name: str, diag: str, ev: list[Evidence], base_prob: int, actions: list[str]):
        supported = bool(ev)
        causes.append({
            "name": name,
            "prob": base_prob if supported else None,
            "prob_text": f"概率 {base_prob}%" if supported else "需要更多事实方可量化概率",
            "supported": supported,
            "diagnosis": diag if supported else f"待验证：{diag}",
            "evidence": ev,
            "actions": actions,
        })

    price_words = ["价格", "报价", "预算", "高", "便宜", "成本"]
    if any(w in event or w in inp.stage for w in price_words):
        ev = best_evidence(evidence, "价格", "报价", "预算", "框架价格", min_score=0.50)
        add(
            "价格竞争力/价值包装不足",
            "客户已把决策锚点拉到价格与预算，若价值差异没有被量化成业务收益，功能更全也会被视为溢价。",
            ev, 82,
            ["把功能差异翻译成节省成本/提升收入/降低风险的量化账。", "报价前准备可降配版本、分阶段采购和ROI对照表。"]
        )

    if inp.competitor and inp.competitor not in {"无", "略", "未知"}:
        ev = best_evidence(evidence, inp.competitor, "竞品", "厂商", min_score=0.50)
        add(
            "竞品打法未被拆解",
            "需要区分输在价格、性能、品牌背书还是客户关系；否则反制动作容易失焦。",
            ev, 68,
            ["补一页竞品对照：客户关心项、竞品承诺、我方反证材料。", "下次POC/方案阶段提前设置客户认可的评分表。"]
        )

    if any(w in event for w in ["换", "CTO", "业务部门", "技术团队", "重新评估", "风向"]):
        ev = best_evidence(evidence, "决策", "关键人", "部门", "业务", "CTO", min_score=0.50)
        add(
            "决策链/关键人风险",
            "关键人或部门偏好变化会让原有共识失效，单线推进时风险暴露较晚。",
            ev, 78,
            ["从第一轮开始画决策链：使用者/技术评审/预算方/拍板人/反对者。", "关键节点要形成多角色共识材料，而不是只维护单一支持者。"]
        )

    stage_ev = best_evidence(evidence, inp.stage, "商机", "售前", "报价", "方案", "POC", min_score=0.50)
    add(
        f"{inp.stage}阶段控制点不足",
        f"丢单发生在{inp.stage}，说明上一阶段进入该节点前，客户评价标准、预算边界或胜负手可能没有锁定。",
        stage_ev, 60,
        ["进入下一阶段前做Go/No-Go检查：预算、决策人、评分标准、竞品位置。", "把阶段风险前置为销售检查清单。"]
    )

    if not causes:
        ev = sorted([e for e in evidence if e.score >= 0.55], key=lambda x: x.score, reverse=True)[:3]
        add("证据不足的综合判断", "当前输入缺少可稳定归因的触发词，需要补充预算、决策链、竞品承诺和内部反对意见。", ev, 45, ["补充客户最终选择理由。", "补充关键会议纪要或客户原话。"])

    causes.sort(key=lambda c: c["prob"] or 0, reverse=True)
    return causes[:3]


def collect_evidence(inp: WinLossInput) -> tuple[dict[str, list[Evidence]], list[dict[str, str]]]:
    keywords = " ".join(extract_keywords(inp.event))
    queries = {
        "行业模式匹配": f"{inp.industry} 行业 ToB 项目 售前 方案 痛点 成功案例 客户需求",
        "竞品模式匹配": f"{inp.competitor} 竞品 分析 优势 劣势 定价 打法 反制" if inp.competitor and inp.competitor not in {"无", "略"} else f"{inp.industry} 竞品 价格 功能 预算 售前",
        "阶段风险匹配": f"{inp.stage} 阶段 商机 售前 报价 POC 合同 里程碑 风险 丢单",
        "关键词匹配": f"{inp.event} {keywords}",
        "综合推理补充": f"丢单 复盘 {inp.industry} {inp.size} {inp.stage} {inp.competitor} {keywords} 改进建议",
    }
    all_errors: list[dict[str, str]] = []
    bucket: dict[str, list[Evidence]] = {}
    for strategy, q in queries.items():
        try:
            evs, errs = run_search(strategy, q, top_k=5)
        except Exception as e:
            evs, errs = [], [{"type": "search_failed", "strategy": strategy, "message": f"知识库检索失败，已降级：{e}"}]
        bucket[strategy] = evs
        all_errors.extend(errs)
    return bucket, all_errors


def render_report(inp: WinLossInput, buckets: dict[str, list[Evidence]], errors: list[dict[str, str]]) -> str:
    evidence = [e for rows in buckets.values() for e in rows]
    causes = infer_causes(inp, evidence)
    strong = [e for e in evidence if e.score >= 0.62]
    unique_sources = independent_source_count(evidence)

    lines: list[str] = []
    lines.append("📉 丢单复盘报告")
    lines.append("")
    lines.append("【项目画像】")
    lines.append(f"行业: {sanitize_text(inp.industry)} | 规模: {sanitize_text(inp.size)} | 跟进: {sanitize_text(inp.duration)}")
    lines.append(f"丢单阶段: {sanitize_text(inp.stage)} | 竞品: {sanitize_text(inp.competitor) or '未提供'}" + (f" | 金额: {sanitize_text(inp.amount)}" if inp.amount else ""))
    lines.append(f"关键事件: {sanitize_text(inp.event)}")
    lines.append("")
    lines.append("【知识库检索概况】")
    for k, rows in buckets.items():
        deduped = dedupe_evidence(rows, limit=len(rows))
        top = deduped[0] if deduped else None
        if top:
            lines.append(f"- {k}: {len(deduped)}份独立来源，Top={top.title}（score={top.score:.2f}）")
        else:
            lines.append(f"- {k}: 0条，待补充知识库证据")
    if unique_sources <= 2:
        lines.append("- ⚠️ 5路检索仅命中≤2份独立文档：本次证据同质化，结论需降权，建议补充更多项目事实或扩展知识库。")
    if errors:
        lines.append(f"- 检索告警: {len(errors)}项（不影响已有证据，但需排查：{errors[:2]}）")
    lines.append("")

    labels = ["🔴 核心原因", "🟡 辅助原因", "🟢 潜在风险"]
    lines.append("【根因分析（按概率排序）】")
    for idx, c in enumerate(causes):
        lines.append(f"{idx+1}. {labels[min(idx, 2)]}：{c['name']}（{c['prob_text']}）")
        lines.append(f"   - 诊断：{c['diagnosis']}")
        if c["evidence"]:
            for ev in c["evidence"][:2]:
                lines.append(f"   - 证据来自：{source_line(ev)}")
        else:
            lines.append("   - 证据来自：待验证（当前知识库未检出足够相似来源，不能当作确定结论）")
        lines.append("")

    lines.append("【风险信号对照】")
    signal_count = 0
    for c in causes:
        evn = c["evidence"]
        if evn:
            signal_count += 1
            lines.append(f"- ☑️ {c['name']}：已有相似资料支撑（独立来源数：{independent_source_count(evn)}）")
        else:
            lines.append(f"- ☐ {c['name']}：待验证（建议补充客户原话/会议纪要/竞品承诺）")
    if signal_count == 0:
        lines.append("- ☐ 本次匹配偏弱：不能给确定风险概率，建议补充更多事实后复跑。")
    lines.append("")

    lines.append("【改进建议】")
    lines.append("如果重来一次：")
    short = []
    mid = []
    for c in causes:
        short.extend(c["actions"][:1])
        mid.extend(c["actions"][1:2])
    short_unique = list(dict.fromkeys(short))[:3]
    mid_unique = list(dict.fromkeys(mid))[:3]
    lines.append("- 短期（下次遇到类似情况）：" + "；".join(short_unique))
    lines.append("- 中期（提升能力/方法）：" + "；".join(mid_unique or ["沉淀行业/竞品/阶段风险检查清单，把复盘结论转成售前动作。"]))
    lines.append("- 长期（体系化）：建立丢单案例库字段：行业、阶段、竞品、关键事件、最终原因、证据链接、下次反制动作。")
    lines.append("")
    if len(strong) < 3:
        lines.append("【置信度说明】")
        lines.append("本次强匹配证据不足3条，部分建议已降权；未被知识库支撑的判断均标为「待验证」。")
    return "\n".join(lines)


def main() -> int:
    ap = argparse.ArgumentParser(description="ToB销售丢单复盘助手")
    ap.add_argument("--industry")
    ap.add_argument("--size")
    ap.add_argument("--duration")
    ap.add_argument("--stage")
    ap.add_argument("--competitor", default="")
    ap.add_argument("--event")
    ap.add_argument("--amount", default="")
    ap.add_argument("--json", action="store_true", help="输出调试JSON")
    args = ap.parse_args()

    inp = WinLossInput(
        industry=prompt_if_missing(args.industry, "客户行业"),
        size=prompt_if_missing(args.size, "客户规模"),
        duration=prompt_if_missing(args.duration, "跟进时长"),
        stage=prompt_if_missing(args.stage, "丢单阶段"),
        competitor=prompt_if_missing(args.competitor, "竞品", "未提供"),
        event=prompt_if_missing(args.event, "关键事件"),
        amount=args.amount or "",
    )
    try:
        buckets, errors = collect_evidence(inp)
    except Exception as e:
        print(f"[blocked] 知识库查询失败：{e}", file=sys.stderr)
        return 2

    if args.json:
        safe_input = {k: sanitize_text(str(v)) for k, v in asdict(inp).items()}
        print(json.dumps({"input": safe_input, "evidence": {k: [asdict(e) for e in v] for k, v in buckets.items()}, "errors": errors}, ensure_ascii=False, indent=2))
    else:
        print(render_report(inp, buckets, errors))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
