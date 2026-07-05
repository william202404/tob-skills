# rag-hallucination-governor

RAG 幻觉治理工具。输入 RAG 系统当前症状、行业和检索指标，输出根因诊断、阈值调参建议、架构治理建议和 3 步修复路径。

这个 Skill 的目标不是讲 RAG 架构课，而是把生产交付里最容易踩坑的判断固化成可执行诊断：Top-1 污染、知识库质量、混合检索权重、双命中代价、低置信转人工、意图路由。

## 快速使用

```bash
rag-hallucination-governor --symptom "AI经常编造不存在的政策条款" \
  --industry "政务" \
  --hitRate 0.4 \
  --firstHitAccuracy 0.3
```

也可以直接运行交互模式：

```bash
rag-hallucination-governor
```

## 日志分析

日志文件支持 JSON 数组，字段使用 `hit` 和 `top1_relevant`：

```json
[
  { "hit": true, "top1_relevant": true },
  { "hit": true, "top1_relevant": false },
  { "hit": false, "top1_relevant": false }
]
```

运行：

```bash
rag-hallucination-governor --log-file ./retrieval-log.json --top-n 20
```

## 当前覆盖

- 行业：政务、金融、零售、教育，未知行业自动走默认规则
- 幻觉类型：知识缺失型、检索噪声型、上下文拼接型、LLM 编造型
- 严重度：P0 / P1 / P2 / OK
- 参数建议：相似度阈值、Top-K、BM25/Vector 权重、Reranker、双命中、低置信转人工

## 测试

```bash
npm test
```

测试矩阵覆盖政务、金融、教育、未知行业、无指标输入、日志分析模式。

## 经验来源

规则来自 10+ 生产 RAG 交付经验的脱敏萃取，强调实战判断，不承诺虚假准确率。所有阈值都是调参起点，最终必须基于真实查询日志做 A/B 验证。
