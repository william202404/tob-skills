---
name: tob-sales-proposal
description: ToB销售提案生成器 - 基于行业最佳实践，自动生成专业销售提案文档
homepage: https://github.com/lining/tob-skills/tree/main/tob-sales-proposal
metadata:
  {
    "openclaw":
      {
        "emoji": "📄",
        "tags": ["tob", "sales", "proposal", "b2b"],
        "requires": { "bins": ["node"] }
      },
  }
---

# ToB 销售提案生成器

基于 ToB 软件行业最佳实践，自动生成专业销售提案文档。

## 核心能力

- 🎯 **客户痛点分析** - 基于行业特征自动识别关键痛点
- 📊 **解决方案匹配** - 产品功能与客户需求精准映射
- 💰 **ROI 量化分析** - 投资回报率和 TCO 计算
- 🏆 **案例匹配推荐** - 从实战案例库匹配最佳参考
- 📈 **实施路线图** - 分阶段交付计划

## 使用方法

### 交互模式（推荐）

```bash
tob-sales-proposal
```

按提示输入：
1. 客户名称
2. 所属行业
3. 核心痛点
4. 预算范围
5. 决策周期

### 命令行模式

```bash
# 基础用法
tob-sales-proposal --client "某银行" --industry "金融" --product "RAG知识库"

# 完整参数
tob-sales-proposal \
  --client "中信集团" \
  --industry "金融" \
  --painpoints "数据孤岛,知识管理混乱" \
  --product "智能知识库" \
  --budget "100-200万" \
  --timeline "3个月" \
  --output ./proposal.md

# 从 RFP 文件生成
tob-sales-proposal --rfp ./client_rfp.pdf --output ./proposal.md
```

## 提案结构

基于实战验证的 8 大模块：

1. **客户洞察** - 行业趋势 + 痛点分析（五看三定框架）
2. **解决方案** - 整体架构 + 核心功能
3. **产品匹配** - 功能清单 + 差异化优势
4. **实施计划** - 分阶段交付 + 里程碑
5. **投资回报** - ROI 计算 + TCO 分析
6. **成功案例** - 匹配案例 + 客户证言
7. **公司资质** - 团队介绍 + 服务能力
8. **商务方案** - 报价明细 + 付款条款

## 内置方法论

| 方法论 | 应用场景 |
|--------|---------|
| 五看三定 | 市场分析和战略规划 |
| 望闻问切 | 企业现状诊断 |
| 黄金圈法则 | 方案价值阐述 |
| PREP 表达 | 结构化汇报 |

## 案例库

内置 6 个实战案例：
- 中信集团 - 数字化转型规划
- 力方力合 - 供应链系统建设
- 东方电气 - 采购与供应链规划
- 联勤保障部队 - 军事物流信息化
- 中国通用 - 供应链中台建设
- 县域智慧城市 - 数字化建设

## 安装

```bash
# 通过 ClawHub 安装
clawhub install tob-sales-proposal

# 或手动安装
git clone https://github.com/lining/tob-skills.git
cd tob-skills/tob-sales-proposal
npm install
npm link
```

## 依赖

- Node.js >= 18
- Python >= 3.8（用于高级分析）

## 作者

ToB 软件行业从业者社区贡献

## License

MIT
