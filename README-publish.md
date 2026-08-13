# 发布指南

更新日期：2026-08-13

## 当前发布状态

GitHub 仓库已收录 13 个已发布技能 + 1 个待开发占位。ClawHub / SkillHub 以本文件已记录的链接为准，不把仅存在于 GitHub 的技能写成已上架。

| Skill | 类型 | GitHub | ClawHub | SkillHub |
|-------|------|--------|---------|----------|
| `presales-win-blueprint` | 售前方案通关 | 已发布 | 已发布 | 以平台为准 |
| `delivery-risk-compass` | 交付风险判断 | 已发布 | 已发布 | 以平台为准 |
| `tob-win-loss-review` | 丢单复盘 | 已发布 | 根 README 有安装命令 | 待确认 |
| `tob-sales-proposal` | 销售提案 | 已发布 | 根 README 有安装命令 | 待确认 |
| `rag-hallucination-governor` | RAG 幻觉治理 | 已发布 | 已发布 | 待发布 |
| `tob-competitor-snip` | 竞品狙击卡片 | 已发布 | 已发布 | 待发布 |
| `tob-poc-war-room` | POC 战情室 | 已发布 | 已发布 | 待发布 |
| `poc-to-contract-closer` | POC 转签约 | 已发布 | 已发布 | 待发布 |
| `enterprise-ai-knowledge` | 企业AI实施知识库 | 已发布 | 未记录安装入口 | 未打包 |
| `industry-roi-calculator` | 行业ROI测算 | 已发布 | 未记录安装入口 | 未打包 |
| `knowledge-base-ingestion` | 知识库灌入 | 已发布（核心脚本不在本目录） | 未记录安装入口 | 未打包 |
| `ontology-knowledge-graph-mgmt` | 知识图谱管理 | 已发布（核心脚本不在本目录） | 未记录安装入口 | 未打包 |
| `tob-poc-budget-justify` | POC预算论证 | 已发布 | 未记录安装入口 | 未打包 |
| `tob-competitor-analyzer` | 深度竞品分析 | 待开发 | - | - |

## 建议后续发布

1. 为 7 月技能补 ClawHub / SkillHub 安装入口（先 industry-roi-calculator、tob-poc-budget-justify，二者有 CLI）。
2. 确认 tob-win-loss-review、tob-sales-proposal 的 ClawHub 链接并写回本文件。
3. knowledge-base-ingestion 与 ontology-knowledge-graph-mgmt 需先确认外部脚本是否纳入仓库，再谈上架。
4. tob-competitor-analyzer 仍待重新定义联网/资料边界。

## 发布前检查

对有 tests 目录的技能跑测试：presales-win-blueprint、delivery-risk-compass、rag-hallucination-governor、tob-poc-war-room、poc-to-contract-closer、industry-roi-calculator。

tob-competitor-snip 与 tob-poc-budget-justify 目前没有独立 tests 目录。tob-sales-proposal 依赖 Jest，需先安装依赖。

SkillHub 兼容规则仍要求不提交 node_modules、package-lock.json、LICENSE、templates。当前 poc-to-contract-closer 与 tob-sales-proposal 仍跟踪 package-lock.json。

## SkillHub 发布

1. 打开 SkillHub 发布入口。
2. 上传对应 Skill 目录打包产物。
3. 有 README.md 的用 README 作展示说明，否则用 SKILL.md。
4. 发布后记录 SkillHub 链接并同步到根 README。

字段草稿见 SKILLHUB-PUBLISH-CONTENT.md。7 月技能尚未打包 dist zip，不编造校验哈希。

## ClawHub 发布

已记录链接：

- https://clawhub.ai/skills/presales-win-blueprint
- https://clawhub.ai/skills/delivery-risk-compass
- https://clawhub.ai/william202404/rag-hallucination-governor
- https://clawhub.ai/william202404/tob-competitor-snip
- https://clawhub.ai/william202404/tob-poc-war-room
- https://clawhub.ai/william202404/poc-to-contract-closer

## 发布信息

- 售前方案通关秘籍：输入客户需求，输出售前方案框架、演示策略和关键利益点。
- 项目交付罗盘：输入项目状态，输出交付风险分析、缓解建议和验收清单。
- 丢单复盘助手：输入行业/阶段/竞品/关键事件，输出带知识库来源的根因分析。
- 提案提纲生成器：基于去敏案例输出 4 模块高转化提案框架。
- RAG 幻觉治理助手：诊断 Top1 污染、引用缺口、冲突证据、权限串库和拒答/转人工边界。
- 竞品狙击卡片：按竞品关注点生成差异化对比与反击话术。
- POC 战情室：按 POC 通过率、阻塞、采购路径和客户沉默信号生成 48h 排兵布阵。
- POC 转签约收口助手：按采购路径、closing 窗口和冷却阈值判断签约推进动作。
- 企业AI实施知识库：基于 8 大洞察回答企业 AI 实施、成熟度和能力建设问题。
- 行业ROI测算卡：输入行业/规模/场景/成本，输出 ROI 测算卡、PoC 范围建议和风险假设。
- 知识库灌入：预扫描目录、分批灌入向量库并验证索引质量（核心脚本不在本目录）。
- 知识图谱管理：图谱补录、格式校验、SQLite 同步与搜索（核心脚本不在本目录）。
- POC预算论证：输入客户/行业/POC 目标，输出范围界定、资源估算和预算论证。

## 边界说明

这批 Skill 默认不联网，不包含真实客户、个人、项目名称、报价、合同条款或私有知识库片段。需要真实竞品情报、RFP、验收表或客户材料时，由用户提供材料或明确允许联网查询。
