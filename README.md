# tob-skills — ToB 销售技能套件

OpenClaw 专业技能集合，覆盖 ToB 销售、售前、交付、POC 战情室、签约推进、知识库、RAG 可靠性治理与竞品应对。

## 技能一览

| 技能 | 说明 | 状态 |
|------|------|------|
| [presales-win-blueprint](presales-win-blueprint/README.md) | 售前方案通关秘籍 — 输入客户需求，输出售前方案框架+演示策略+关键利益点 | ✅ 已发布 |
| [delivery-risk-compass](delivery-risk-compass/README.md) | 项目交付罗盘 — 输入项目状态，输出交付风险分析+缓解建议+验收清单 | ✅ 已发布 |
| [tob-win-loss-review](tob-win-loss-review/README.md) | 丢单复盘助手 — 输入行业/阶段/竞品/关键事件，输出带知识库来源的根因分析 | ✅ 已发布 |
| [tob-sales-proposal](tob-sales-proposal/README.md) | 提案提纲生成器 — 基于真实案例输出 4 模块高转化提案框架 | ✅ 已发布 |
| [rag-hallucination-governor](rag-hallucination-governor/README.md) | RAG 幻觉治理助手 — 诊断 Top1 污染、引用缺口、冲突证据、权限串库和拒答/转人工边界 | ✅ 已发布 |
| [tob-competitor-snip](tob-competitor-snip/SKILL.md) | 竞品狙击卡片 — 输入竞品与客户关注点，输出差异化对比和反击话术 | ✅ 已发布 |
| [tob-poc-war-room](tob-poc-war-room/SKILL.md) | POC 战情室 — 输入 POC 进度、通过率、问题和客户沉默信号，输出 48h 排兵布阵 | ✅ 已发布 |
| [poc-to-contract-closer](poc-to-contract-closer/SKILL.md) | POC 转签约收口助手 — 检查采购路径、closing 窗口、冷却阈值和报价动作 | ✅ 已发布 |
| [enterprise-ai-knowledge](enterprise-ai-knowledge/SKILL.md) | 企业AI实施知识库 — 输入企业AI问题，输出基于 8 大洞察的实施建议、成熟度框架和能力路线图 | ✅ 已发布 |
| [industry-roi-calculator](industry-roi-calculator/SKILL.md) | 行业ROI测算卡 — 输入客户行业/规模/场景/成本，输出 ROI 测算卡、PoC 范围建议和风险假设 | ✅ 已发布 |
| [knowledge-base-ingestion](knowledge-base-ingestion/SKILL.md) | 知识库灌入 — 预扫描目录、分批灌入向量库并验证索引质量（核心脚本不在本目录） | ✅ 已发布 |
| [ontology-knowledge-graph-mgmt](ontology-knowledge-graph-mgmt/SKILL.md) | 知识图谱管理 — 图谱补录、格式校验、SQLite 同步与搜索（核心脚本不在本目录） | ✅ 已发布 |
| [tob-poc-budget-justify](tob-poc-budget-justify/SKILL.md) | POC预算论证 — 输入客户/行业/POC 目标，输出范围界定、资源估算和预算论证 | ✅ 已发布 |
| [tob-competitor-analyzer](tob-competitor-analyzer/README.md) | 竞品分析工具 | 🔜 待开发 |

## 安装

```bash
# 通过 ClawHub
clawhub install presales-win-blueprint
clawhub install delivery-risk-compass
clawhub install tob-sales-proposal
clawhub install tob-win-loss-review
clawhub install rag-hallucination-governor
clawhub install tob-competitor-snip
clawhub install tob-poc-war-room
clawhub install poc-to-contract-closer

# 或通过 OpenClaw SkillHub
openclaw skills install presales-win-blueprint
openclaw skills install delivery-risk-compass
openclaw skills install rag-hallucination-governor
openclaw skills install tob-competitor-snip
openclaw skills install tob-poc-war-room
openclaw skills install poc-to-contract-closer
openclaw skills install tob-sales-proposal
openclaw skills install tob-win-loss-review
```

`enterprise-ai-knowledge`、`industry-roi-calculator`、`knowledge-base-ingestion`、`ontology-knowledge-graph-mgmt`、`tob-poc-budget-justify` 已在本仓库发布；ClawHub / SkillHub 安装命令以各技能目录内说明为准，未在此添加未经确认的安装入口。

## 本地试用

```bash
npm test --prefix rag-hallucination-governor
npm test --prefix tob-poc-war-room
npm test --prefix poc-to-contract-closer
npm test --prefix industry-roi-calculator
```

## 仓库

所有代码及版本记录维护在此 monorepo。

## License

MIT-0 (No Attribution Required)
