# ToB Skill 套件 — Roadmap

更新日期：2026-06-03

## 定位

这个仓库沉淀可离线运行的 ToB 现场经验 Skill，覆盖售前、竞品、POC、签约、交付、复盘和 RAG 可靠性治理。

核心原则：

1. 经验规则化：把可复用判断沉淀成规则、CLI 和测试。
2. 去敏发布：不包含真实客户名、个人名、厂商名、项目名、报价、合同条款或私有知识库片段。
3. 默认离线：不联网、不编事实；需要真实材料时由用户提供或明确授权联网。
4. 可验证：每个可执行 Skill 至少包含 README、SKILL.md、CLI 或脚本入口、测试。

## 当前 Skill 状态

| Skill | 方向 | 状态 | 下一步 |
|-------|------|------|--------|
| `presales-win-blueprint` | 售前方案通关 | 已发布 | 维护 |
| `delivery-risk-compass` | 交付风险判断 | 已发布 | 维护 |
| `tob-win-loss-review` | 丢单复盘 | 已发布 | 维护 |
| `tob-sales-proposal` | 销售提案 | 已发布 | 后续可统一测试依赖 |
| `rag-hallucination-governor` | RAG 幻觉治理 | 已开发 / 自测通过 / 待发布 | 发布确认 |
| `tob-competitor-snip` | 竞品狙击卡片 | 已开发 / 自测通过 / 待发布 | 发布确认 |
| `tob-poc-war-room` | POC 战情室 | 已开发 / 自测通过 / Checker 通过 / 待发布 | 发布确认 |
| `poc-to-contract-closer` | POC 转签约 | 已开发 / 自测通过 / Checker 通过 / 待发布 | 首次注册发布 |
| `tob-competitor-analyzer` | 深度竞品分析 | 待开发 | 重新定义联网/资料边界 |

## 建议后续方向

| 优先级 | Skill | 价值 | 注意事项 |
|--------|-------|------|----------|
| P1 | `tob-competitor-analyzer` | 从“即时话术卡”扩展到深度竞品报告 | 必须明确联网、来源引用和事实更新机制 |
| P1 | `biz-dx-navigator` | 数字化转型避坑诊断 | 继续保持行业抽象，不写真实案例 |
| P2 | `gov-project-handbook` | 政府/央企项目流程与风险控制 | 避免招投标敏感表述和真实项目影射 |
| P2 | `vendor-selection-matrix` | 供应商选型矩阵 | 需区分公开事实、用户材料和经验判断 |
| P3 | `meeting-battle-log` | 会议攻防复盘 | 可先做本地输入模板，不接入私有会议内容 |

## 标准结构

```text
skill-name/
├── SKILL.md
├── README.md
├── package.json 或脚本入口说明
├── src/
│   ├── generator.js 或 index.js
│   └── rules.js
└── tests/
    └── run-tests.js 或 test.js
```

SkillHub 兼容要求：

- 不提交 `node_modules/`
- 不提交 `package-lock.json`
- 不提交 `LICENSE`
- 不提交 `templates/` 目录
- 不提交 `.pyc`、`.exe`、`.dll`、`.so` 等非文本/二进制产物

## 发布流程

1. 需求确认。
2. Tech 开发实现。
3. 本地自测。
4. Checker 做隐私、平台兼容、逻辑和边界审查。
5. 发布负责人确认。
6. 发布 ClawHub / SkillHub / GitHub。
7. 二蛋同步发布状态和素材。

## 本地验证

```bash
npm test --prefix presales-win-blueprint
npm test --prefix delivery-risk-compass
npm test --prefix rag-hallucination-governor
npm test --prefix tob-competitor-snip
npm test --prefix tob-poc-war-room
npm test --prefix poc-to-contract-closer
```

`tob-sales-proposal` 当前使用 Jest 依赖，发布前如需纳入一键全量测试，应先补齐依赖安装或改为无外部依赖 smoke test。
