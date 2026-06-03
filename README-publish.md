# 发布指南

更新日期：2026-06-03

## 当前发布批次

| Skill | 类型 | 状态 | 发布动作 |
|-------|------|------|----------|
| `rag-hallucination-governor` | RAG 可靠性治理 | 已开发 / 已自测 / ClawHub 已发布 / 待发布 SkillHub | 发布 SkillHub |
| `tob-competitor-snip` | 竞品应对卡片 | 已开发 / 已自测 / ClawHub 已发布 / 待发布 SkillHub | 发布 SkillHub |
| `tob-poc-war-room` | POC 战情室 | 已开发 / 已自测 / 质量审查通过 / ClawHub 已发布 / 待发布 SkillHub | 发布 SkillHub |
| `poc-to-contract-closer` | POC 转签约 | 已开发 / 已自测 / 质量审查通过 / ClawHub 已发布 / 待发布 SkillHub | 发布 SkillHub |

## 建议发布顺序

1. `tob-poc-war-room`
2. `poc-to-contract-closer`
3. `rag-hallucination-governor`
4. `tob-competitor-snip`

原因：先发布 POC 主流程和签约收口，再发布 RAG 治理和竞品卡片，便于用户理解完整 ToB 现场链路。

## 发布前检查

```bash
npm test --prefix presales-win-blueprint
npm test --prefix delivery-risk-compass
npm test --prefix rag-hallucination-governor
npm test --prefix tob-competitor-snip
npm test --prefix tob-poc-war-room
npm test --prefix poc-to-contract-closer
```

平台兼容检查：

```bash
find . -name node_modules -o -name package-lock.json -o -name LICENSE -o -name templates -o -name '*.hbs' -o -name '*.pyc' -o -name '*.exe' -o -name '*.dll' -o -name '*.so'
```

该命令应无输出。

## SkillHub 发布

1. 打开 SkillHub 发布入口。
2. 上传对应 Skill 目录打包产物。
3. 使用 README.md 作为展示说明，SKILL.md 作为技能说明。
4. 发布后记录 SkillHub 链接并同步到根 README。

## ClawHub 发布

已发布 Skill：

- https://clawhub.ai/skills/presales-win-blueprint
- https://clawhub.ai/skills/delivery-risk-compass

本批次已发布：

- https://clawhub.ai/william202404/rag-hallucination-governor
- https://clawhub.ai/william202404/tob-competitor-snip
- https://clawhub.ai/william202404/tob-poc-war-room
- https://clawhub.ai/william202404/poc-to-contract-closer

## 发布信息

- **RAG 幻觉治理助手**：诊断 Top1 污染、引用缺口、冲突证据、权限串库和拒答/转人工边界。
- **竞品狙击卡片**：按竞品关注点生成差异化对比与反击话术。
- **POC 战情室**：按 POC 通过率、阻塞、采购路径和客户沉默信号生成 48h 排兵布阵。
- **POC 转签约收口助手**：按采购路径、closing 窗口和冷却阈值判断签约推进动作。

## 边界说明

这批 Skill 默认不联网，不包含真实客户、个人、项目名称、报价、合同条款或私有知识库片段。需要真实竞品情报、RFP、验收表或客户材料时，由用户提供材料或明确允许联网查询。
