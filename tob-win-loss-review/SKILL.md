---
name: tob-win-loss-review
description: ToB销售丢单复盘助手。输入行业/规模/阶段/竞品/关键事件，基于ChromaDB客户项目知识库输出带来源的根因分析、风险信号和改进建议。
priority: high
source: tech-built
workers: Tech, Sales, Checker
created: 2026-05-15
---

# tob-win-loss-review — 丢单复盘助手

## 何时使用

当用户需要复盘 ToB 销售丢单原因，尤其是需要结合李宁客户项目知识库、行业方案包、竞品/售前资料给出改进建议时使用。

## 使用方式

### 交互模式

```bash
tob-win-loss-review
```

### 快速模式

```bash
tob-win-loss-review --industry 零售 --size 大型 --duration 4个月 --stage 报价谈判 --competitor 略 --event "客户说我们价格比竞品高30%，虽然我们功能更全但对方预算有限"
```

### JSON 调试

```bash
tob-win-loss-review ... --json
```

## 实现逻辑

1. 行业模式匹配：行业 + 常见痛点 + 成功模式
2. 竞品模式匹配：竞品 + 竞品优势/劣势/打法
3. 阶段风险匹配：丢单阶段 + 合同/里程碑/变更/问题记录
4. 关键词匹配：从关键事件抽取关键词后检索相似描述
5. 综合推理：证据不足时降权，并明确标注「待验证」和补充问题

底层使用 skill 内置的 `scripts/unified_knowledge_search.py`，通过 ChromaDB `PersistentClient + get()+NumPy cosine` 安全检索路径，避免直接使用 `collection.query()` 触发已知本地索引风险。为避免 5 路检索同质化，presales 扩展词已收窄，并在报告中统计独立来源数。

## 输出约束

- 每条根因必须标注知识库来源；没有知识库支撑必须标「待验证」。
- 不编造客户、数据、概率；概率为基于检索证据数量/相似度的估算置信度。
- 中文输出，结构固定：项目画像 → 根因分析 → 风险信号 → 改进建议。

## 注意事项

- 如果 Chroma/Ollama 不可用，输出阻断原因，不做无来源复盘。
- 查询结果低于阈值时，不强行给确定结论。
- 提交审查前至少跑 TC1。
