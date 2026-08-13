# SkillHub 发布内容

更新日期：2026-08-13

7 月新增技能已在 GitHub 发布，但尚未生成 dist zip，故不填写校验哈希，也不把它们写成已上架 SkillHub。

本文件按 SkillHub 发布页字段整理。上传文件使用 `dist/*.zip`，每个 zip 内均包含 `SKILL.md`。

## 1. POC 战情室

- Skill 文件：`dist/tob-poc-war-room.zip`
- Slug：`tob-poc-war-room`
- 显示名称：`POC 战情室`
- 图标建议：`target` / `activity` / `briefcase`
- 描述：`根据 POC 目标、通过率、问题级别、客户沉默和采购路径信号，输出健康度评估、48 小时排兵布阵、客户沟通动作和 closing 触发判断。`
- 版本号：`1.0.0`
- 变更说明：`首次发布：支持 POC 通过率评估、P0/P1/P2 阻塞分类、客户沉默风险、采购路径检查和 48 小时战情室行动计划。`
- ClawHub：`https://clawhub.ai/william202404/tob-poc-war-room`

## 2. POC 转签约收口助手

- Skill 文件：`dist/poc-to-contract-closer.zip`
- Slug：`poc-to-contract-closer`
- 显示名称：`POC 转签约收口助手`
- 图标建议：`file-check` / `handshake` / `briefcase`
- 描述：`把已通过或接近通过的 ToB POC 转成可执行签约路径，检查决策人、采购路径、closing 窗口、冷却阈值、报价动作和上线节点。`
- 版本号：`1.0.0`
- 变更说明：`首次发布：支持 POC 成功证据整理、采购路径诊断、closing 时间窗口判断、签约缺口清单和上线节点推进建议。`
- ClawHub：`https://clawhub.ai/william202404/poc-to-contract-closer`

## 3. RAG 幻觉治理助手

- Skill 文件：`dist/rag-hallucination-governor.zip`
- Slug：`rag-hallucination-governor`
- 显示名称：`RAG 幻觉治理助手`
- 图标建议：`shield` / `search-check` / `brain`
- 描述：`诊断生产 RAG 系统中的幻觉风险，覆盖 Top1 污染、引用缺口、冲突证据、权限串库、阈值调优和拒答/转人工边界。`
- 版本号：`1.0.0`
- 变更说明：`首次发布：支持 RAG 可靠性风险分型、证据一致性检查、召回阈值治理、引用覆盖检查和人工转接规则建议。`
- ClawHub：`https://clawhub.ai/william202404/rag-hallucination-governor`

## 4. ToB 竞品狙击卡片

- Skill 文件：`dist/tob-competitor-snip.zip`
- Slug：`tob-competitor-snip`
- 显示名称：`ToB 竞品狙击卡片`
- 图标建议：`zap` / `swords` / `message-square`
- 描述：`客户提到竞品价格、功能、品牌等优势时，快速生成竞品画像、差异化对比、反击话术和案例模式卡片。`
- 版本号：`1.0.0`
- 变更说明：`首次发布：支持价格战、功能对比、品牌信任和通用竞品场景的差异化对比与话术生成。`
- ClawHub：`https://clawhub.ai/william202404/tob-competitor-snip`

## 校验信息

- `dist/tob-poc-war-room.zip`：`60a74f1c7d5f1ac362d475b82a00daf27945e3228e6c4ebfe0cbe37f403f8f31`
- `dist/poc-to-contract-closer.zip`：`8638ecd14a72a99a73d6bccbdd5c7145530632a6985729c2bde0f6ef5235e562`
- `dist/rag-hallucination-governor.zip`：`1bdc64c4b542d596b0ae69447d5c222701a562d94c6703ccebe6a1df3a3deda1`
- `dist/tob-competitor-snip.zip`：`badda0a8abfd32458eb1864e154251479f080b6bc28e8873e24b7c9c8138ab68`

## 待打包（GitHub 已有，无 dist zip）

字段来自各技能 SKILL.md。未生成 zip，不上校验哈希。

### 5. 企业AI实施知识库

- Slug：`enterprise-ai-knowledge`
- 显示名称：`企业AI实施知识库`
- 描述：企业AI实施知识库。8大洞察、5阶段教学计划、4级能力成长路线图。
- 版本号：`1.0.0`
- 展示说明：仅有 SKILL.md
- SkillHub / ClawHub：未记录

### 6. 行业ROI测算卡

- Slug：`industry-roi-calculator`
- 显示名称：`行业ROI测算卡`
- 描述：输入客户行业、规模、场景和当前成本，输出 ROI 测算卡、PoC 范围建议、风险假设和案例引用。
- 版本号：`1.0.0`
- 展示说明：仅有 SKILL.md；有 CLI 与 tests
- SkillHub / ClawHub：未记录

### 7. 知识库灌入

- Slug：`knowledge-base-ingestion`
- 显示名称：`知识库灌入`
- 描述：将外部知识库提取内容并灌入向量数据库的标准流程。核心脚本不在本目录。
- 版本号：`3.0.1`
- 展示说明：仅有 SKILL.md
- SkillHub / ClawHub：未记录

### 8. 知识图谱管理

- Slug：`ontology-knowledge-graph-mgmt`
- 显示名称：`知识图谱管理`
- 描述：知识图谱的补录、同步、修复、搜索全流程。核心脚本不在本目录。
- 版本号：`2.0.1`
- 展示说明：仅有 SKILL.md
- SkillHub / ClawHub：未记录

### 9. POC预算论证

- Slug：`tob-poc-budget-justify`
- 显示名称：`POC预算论证`
- 描述：输入客户/行业/POC目标，输出POC范围界定、资源估算和预算论证。
- 版本号：`1.0.0`
- 展示说明：仅有 SKILL.md；有 CLI，无独立 tests 目录
- SkillHub / ClawHub：未记录

