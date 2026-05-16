# tob-win-loss-review — 丢单复盘助手

> 输入行业/规模/阶段/竞品/关键事件，输出带知识库来源的根因分析、风险信号和改进建议。

基于李宁 17+ 客户项目的 ToB 销售丢单复盘经验，通过 ChromaDB 客户项目知识库进行 5 路检索，输出可验证的复盘结论。

## 快速开始

```bash
# 交互模式
python3 scripts/tob_win_loss_review.py

# 快速模式
python3 scripts/tob_win_loss_review.py --industry 零售 --size 大型 \
  --duration 4个月 --stage 报价谈判 --competitor 略 \
  --event "客户说我们价格比竞品高30%"
```

## 输出结构

```
项目画像 → 根因分析(带来源) → 风险信号 → 改进建议
```

每条根因必须标注知识库来源；缺乏支撑的结论标注「待验证」。

## 技术栈

- ChromaDB 本地向量检索
- 5 路检索：行业模式 / 竞品模式 / 阶段风险 / 关键词匹配 / 综合推理
- NumPy cosine 路由，避免 collection.query() 触发已知索引风险

## 安装

```bash
clawhub install tob-win-loss-review
# 或
openclaw skills install tob-win-loss-review
```

## 链接

- GitHub: https://github.com/william202404/tob-skills
- ClawHub: `clawhub search tob-win-loss-review`
- SkillHub: `skillhub search tob-win-loss-review`

## License

MIT-0 (No Attribution Required)
