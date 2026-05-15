---
name: tob-sales-proposal
description: ToB销售提案生成器。输入客户信息/行业/痛点/产品，基于实战方法论输出8模块专业提案框架（五看三定+望闻问切+黄金圈+案例匹配）。
priority: high
source: tech-built
workers: Sales, PM
created: 2026-05-15
tags: [tob, sales, proposal, b2b]
---

# tob-sales-proposal — 销售提案生成器

基于 ToB 软件行业实战经验，按 8 大模块自动生成专业销售提案框架。

> 一个 Skill 只解决一个动作。这个 Skill 专注于：**把客户信息和痛点转化为结构化的专业提案提纲**。

## 使用方式

### 交互模式（推荐）

```bash
tob-sales-proposal
```

按提示依次输入：
1. 客户名称
2. 所属行业
3. 核心痛点（用逗号分隔多个）
4. 预算范围（如"100-200万"）
5. 决策周期

### 命令行模式

```bash
# 基础用法
tob-sales-proposal --client "某银行" --industry "金融" --product "智能知识库"

# 完整参数
tob-sales-proposal \
  --client "某金融集团" \
  --industry "金融" \
  --painpoints "数据孤岛,知识管理混乱" \
  --product "智能知识库" \
  --budget "100-200万" \
  --timeline "3个月" \
  --output ./proposal.md

# 从客户需求文档生成（需自行准备接口）
tob-sales-proposal --rfp ./client_rfp.pdf --output ./proposal.md
```

## 提案结构（8 模块）

基于实战验证的结构化框架：

| 模块 | 内容 | 方法论支撑 |
|:--|:--|:--|
| 1. 客户洞察 | 行业趋势 + 痛点分析 | 五看三定 |
| 2. 解决方案 | 整体架构 + 核心功能 | 黄金圈法则 |
| 3. 产品匹配 | 功能清单 + 差异化优势 | 价值定量分析 |
| 4. 实施计划 | 分阶段交付 + 里程碑 | 敏捷/瀑布 |
| 5. 投资回报 | ROI 计算 + TCO 分析 | 量化账本 |
| 6. 成功案例 | 匹配案例 + 客户证言 | 行业对标 |
| 7. 公司资质 | 团队介绍 + 服务能力 | PREP 表达 |
| 8. 商务方案 | 报价明细 + 付款条款 | 商务策略 |

## 内置方法论

| 方法论 | 应用场景 | 说明 |
|--------|---------|------|
| 五看三定 | 市场分析和战略规划 | 看行业/看客户/看竞品/看自己/看机会→定目标/定策略/定打法 |
| 望闻问切 | 企业现状诊断 | 企业调研四步法 |
| 黄金圈法则 | 方案价值阐述 | Why→How→What 层层深入 |
| PREP 表达 | 结构化汇报 | 结论→理由→例证→重述结论 |

## 案例库

内置 7 个行业案例模板（做提案时自动匹配最相关的参考）：

- 金融：某大型金融集团数字化转型规划
- 零售：某知名服装品牌供应链系统建设
- 制造：某装备制造集团采购与供应链规划
- 物流：某大型物流企业信息化平台建设
- 央企：某央企集团供应链中台建设
- 政府：某县域政府智慧城市数字化建设
- 金融AI：某金融机构AI知识库建设

## 依赖

- Python >= 3.8
- ChromaDB（用于案例相似度检索）
- Ollama embedding 服务（qwen3-embedding:0.6b）

## 安装

```bash
# 通过 ClawHub 安装
clawhub install tob-sales-proposal

# 或从 GitHub 获取
git clone git@github.com:lining/tob-skills.git
cd tob-skills/tob-sales-proposal
```

## 注意事项

- 该工具提供**提案框架和结构**，具体内容需结合客户实际情况填充
- 案例库数据基于公开行业最佳实践，不包含客户敏感信息
- ChromaDB 不可用时输出阻断说明，不做无依据提案

## License

MIT
