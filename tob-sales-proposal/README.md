# ToB Sales Proposal Generator

> ToB 销售提案生成器 - 基于行业最佳实践

## 快速开始

```bash
# 安装
npm install

# 交互模式
node src/cli.js

# 命令行模式
node src/cli.js --client "某银行" --industry "金融" --product "智能客服系统"
```

## 功能特性

- 🎯 客户痛点分析
- 📊 解决方案匹配
- 💰 ROI 量化分析
- 🏆 案例智能匹配
- 📈 实施路线图

## 提案结构

1. **客户洞察与行业分析** - 基于行业特征自动识别关键痛点
2. **解决方案概述** - 整体架构 + 核心功能
3. **产品功能匹配** - 功能清单 + 差异化优势
4. **实施路线图** - 分阶段交付计划
5. **投资回报分析** - ROI 计算 + TCO 分析
6. **成功案例** - 匹配案例 + 客户证言
7. **公司资质** - 团队介绍 + 服务能力
8. **商务方案** - 报价明细 + 付款条款

## 使用方法

### 交互模式
```bash
tob-sales-proposal
```

按提示输入客户信息，自动生成完整提案。

### 命令行模式
```bash
tob-sales-proposal --client "客户名称" --industry "行业" --product "产品"
```

### 完整参数
```bash
tob-sales-proposal \
  --client "客户名称" \
  --industry "金融" \
  --product "智能客服" \
  --painpoints "数据孤岛,效率低下" \
  --budget "50-100万" \
  --timeline "3个月" \
  --output ./proposal.md
```

## License

MIT
