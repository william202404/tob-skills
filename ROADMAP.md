# ToB Skills 套件 - 开发计划

> 目标：一个月上线 10 个 Skills，服务 ToB 软件公司
> 作者：李宁
> 时间：2026-03-17 启动

---

## 技能清单与排期

### Week 1: 售前获客（3个）

| # | Skill 名称 | 核心功能 | 你的经验输入 | 预计耗时 | 状态 |
|---|-----------|---------|-------------|---------|------|
| 1 | `tob-competitor-analyzer` | 竞品分析报告生成 | 京东/科金时期的市场分析方法论 | 2天 | 📝 待开始 |
| 2 | `tob-sales-proposal` | 销售提案/PPT大纲生成 | 2000万项目提案经验、中标模板 | 2天 | 📝 待开始 |
| 3 | `tob-icp-generator` | 理想客户画像(ICP)生成 | 50+客户积累的客户分类方法 | 1天 | 📝 待开始 |

### Week 2: 售中方案（3个）

| # | Skill 名称 | 核心功能 | 你的经验输入 | 预计耗时 | 状态 |
|---|-----------|---------|-------------|---------|------|
| 4 | `tob-requirement-questionnaire` | 需求调研问卷生成 | 标准化调研方法论、问题库 | 2天 | 📝 待开始 |
| 5 | `tob-solution-architect` | 解决方案架构设计 | RAG/AI方案、ERP/中台架构经验 | 2天 | 📝 待开始 |
| 6 | `tob-roi-calculator` | ROI/TCO 计算器 | 客户投资回报率计算模型 | 1天 | 📝 待开始 |

### Week 3: 交付实施（2个）

| # | Skill 名称 | 核心功能 | 你的经验输入 | 预计耗时 | 状态 |
|---|-----------|---------|-------------|---------|------|
| 7 | `tob-project-planner` | 项目计划自动生成 | 95%预算精准度的WBS拆解法 | 2天 | 📝 待开始 |
| 8 | `tob-risk-assessor` | 项目风险评估清单 | 踩过的坑、风险预警指标 | 1天 | 📝 待开始 |

### Week 4: 运营+通用（2个）

| # | Skill 名称 | 核心功能 | 你的经验输入 | 预计耗时 | 状态 |
|---|-----------|---------|-------------|---------|------|
| 9 | `tob-acceptance-checklist` | 验收文档模板生成 | 交付标准化流程 | 1天 | 📝 待开始 |
| 10 | `tob-contract-reviewer` | 合同条款风险检查 | 法务+商务条款经验 | 2天 | 📝 待开始 |

---

## 技术规范

### 每个 Skill 的标准结构

```
skill-name/
├── SKILL.md          # 技能说明文档（必须）
├── README.md         # GitHub 展示文档
├── package.json      # 如需要依赖
├── src/
│   ├── index.js      # 主入口
│   └── utils.js      # 工具函数
├── templates/        # 模板文件
├── examples/         # 使用示例
└── tests/            # 测试用例
```

### SKILL.md 标准格式

```markdown
---
name: skill-name
description: 简短描述（50字内）
homepage: https://github.com/lining/skills/tree/main/skill-name
metadata:
  {
    "openclaw":
      {
        "emoji": "🎯",
        "tags": ["tob", "sales", "proposal"],
        "requires": { "bins": [] },
      },
  }
---

# Skill 名称

## 功能概述

## 使用场景

## 快速开始

## 参数说明

## 示例

## 作者
李宁 - 19年ToB数字化经验
```

---

## 开发流程

1. **Day 1 上午** - 确定 Skill 功能范围，写 SKILL.md 框架
2. **Day 1 下午** - 开发核心逻辑
3. **Day 2** - 测试、写示例、完善文档
4. **Day 2 晚上** - GitHub 提交，ClawHub 发布

---

## 发布渠道

| 渠道 | 用途 | 链接 |
|-----|------|------|
| GitHub | 代码托管、开源展示 | github.com/lining/tob-skills |
| ClawHub | OpenClaw 官方技能市场 | clawhub.ai |
| SkillHub | 国内技能市场（如有） | - |
| 公众号 | 内容营销、使用教程 | 数字矛盾体 |

---

## 成功指标

- [ ] 10 个 Skills 全部上线
- [ ] 每个 Skill 有完整文档+示例
- [ ] GitHub 仓库 Star > 100
- [ ] 至少 3 个真实用户反馈
- [ ] 1 篇公众号推广文章

---

## 下一步行动

1. [ ] 创建 GitHub 仓库 `tob-skills`
2. [ ] 设计第一个 Skill: `tob-competitor-analyzer`
3. [ ] 写 SKILL.md 和核心代码
4. [ ] 测试并发布

---

*开始时间: 2026-03-17*
*目标完成: 2026-04-17*
