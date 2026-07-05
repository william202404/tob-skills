#!/usr/bin/env node

/**
 * rag-hallucination-governor — RAG 幻觉治理 v1.0.0
 *
 * 基于 10+ 生产 RAG 交付实战经验萃取（去敏）
 * 不是 RAG 架构科普，是"只有交付过的人才知道"的诊断和调参规则
 *
 * 输入：症状描述 / 行业 / 当前指标（召回率、Top-1准确率等）
 * 输出：根因诊断 + 阈值调参建议 + 架构建议 + 3步修复方案
 *
 * 核心经验来源：
 *   - 政务 RAG：政策条款幻觉、BM25 权重优先、领导看板场景
 *   - 金融 RAG：bad case 零容忍、安全合规约束、双命中实践
 *   - 零售/电商 RAG：商品知识库碎片化、混合检索权重调优
 *   - 教育/出版 RAG：教材内容时效性、知识图谱增强检索
 */

const readline = require('readline');

// ═══════════════════════════════════════════════════════════
// 幻觉类型判定规则
// ═══════════════════════════════════════════════════════════

const HALLUCINATION_TYPES = {
  knowledge_gap: {
    name: '知识缺失型',
    symptoms: ['知识库没有相关内容', '问了知识库外的问题', '知识覆盖不足'],
    description: '知识库里根本没有相关文档，LLM 用自己的训练数据回答',
    signal: '检索返回空或极低相似度（<0.3），但 LLM 仍然生成了看似合理的答案',
  },
  retrieval_noise: {
    name: '检索噪声型',
    symptoms: ['检索到了相关内容但混入了大量无关内容', 'Top-K 里只有一两条相关'],
    description: '检索召回了内容，但噪声太多，LLM 被干扰',
    signal: 'Top-K 中有相关内容，但最终答案引用了不相关的片段',
  },
  context_splice: {
    name: '上下文拼接型',
    symptoms: ['多段检索结果拼在一起后产生矛盾', '前后文不连贯'],
    description: '单条检索结果都正确，但拼接后产生逻辑冲突',
    signal: '不同文档片段描述同一事物有不同说法，LLM 混合后产生错误',
  },
  llm_fabrication: {
    name: 'LLM 编造型',
    symptoms: ['检索结果正确但 LLM 自己加戏', '编造不存在的数字/条款/案例'],
    description: '检索结果没问题，LLM 在生成时添加了不存在的内容',
    signal: '检索内容中找不到答案依据，但 LLM 生成了"看似权威"的回答',
  },
};

// ═══════════════════════════════════════════════════════════
// 行业经验规则库
// ═══════════════════════════════════════════════════════════

const INDUSTRY_RULES = {
  政务: {
    bm25Weight: 0.7,       // BM25 权重：政务关键词匹配优先
    vectorWeight: 0.3,
    similarityThreshold: 0.65,  // 相似度阈值
    topK: 5,
    rerankerRecommended: true,
    top1Critical: true,    // Top-1 准确率极度重要（政策条款不能有歧义）
    doubleHitRecommended: false,  // 政务不建议双命中（性能代价大且收益低）
    intentRouting: {
      policy: 'fact',      // 政策查询 → 事实型
      procedure: 'action', // 办事流程 → 操作型
      chat: 'chitchat',    // 闲聊 → 不检索
    },
    lowConfThreshold: 0.7,  // 低置信转人工阈值（政务要求高）
    typicalIssues: [
      '政策条款幻觉：AI 编造不存在的政策条文或补贴金额',
      '过期政策未清理：新旧政策并存导致矛盾答案',
      '领导看板场景：检索结果不够精炼，无法直接汇报',
    ],
    caseStudy: {
      summary: '某市政务 RAG 上线后政策条款幻觉率高',
      problem: 'Top-1 准确率仅 35%，政策文件未做结构化拆分，整篇文档作为 chunk',
      fix: '① 按条款拆分为独立 chunk（每条政策一条记录）② BM25 权重调至 0.75 ③ 增加政策有效期字段，过期内容降权 ④ Top-1 准确率从 35% → 72%',
      keyMetric: '政策类问题准确率从 42% 提升至 89%',
    },
  },
  金融: {
    bm25Weight: 0.5,
    vectorWeight: 0.5,
    similarityThreshold: 0.7,
    topK: 8,
    rerankerRecommended: true,
    top1Critical: true,
    doubleHitRecommended: true,  // 金融场景需要高召回，双命中值得
    intentRouting: {
      product: 'fact',
      compliance: 'fact',
      operation: 'action',
      chat: 'chitchat',
    },
    lowConfThreshold: 0.75,  // 金融要求最高
    typicalIssues: [
      'bad case 零容忍：一个错误的理财建议就是合规事故',
      '专业术语语义漂移：向量检索对金融黑话理解偏差',
      '合规审查延迟：RAG 输出需要过合规审核才能对外',
    ],
    caseStudy: {
      summary: '某券商智能客服 RAG bad case 引发合规投诉',
      problem: '向量检索将"融资融券"与"融资租房"语义混淆，Top-3 全错，LLM 编造了错误流程',
      fix: '① 引入双命中（BM25+Vector），确保专业术语精确匹配 ② 增加金融术语同义词词典 ③ 低置信（<0.75）直接转人工 ④ 增加 output guardrail 检查',
      keyMetric: 'bad case 率从 3.2% 降至 0.08%',
    },
  },
  零售: {
    bm25Weight: 0.55,
    vectorWeight: 0.45,
    similarityThreshold: 0.6,
    topK: 6,
    rerankerRecommended: false,
    top1Critical: false,
    doubleHitRecommended: false,
    intentRouting: {
      product: 'fact',
      after_sale: 'action',
      promo: 'fact',
      chat: 'chitchat',
    },
    lowConfThreshold: 0.6,
    typicalIssues: [
      '商品知识库碎片化：SKU 信息散落在 Excel、PDF、系统多处',
      '促销活动时效性：活动过期后 AI 仍在推荐',
      '混合检索权重难题：商品名称用 BM25，商品描述用 Vector，比例难调',
    ],
    caseStudy: {
      summary: '某鞋服品牌客服 RAG 商品推荐准确率低',
      problem: '商品知识库来自 3 个不同系统，格式不统一，chunk 切割按固定 500 字，导致商品信息被截断',
      fix: '① 知识库重构：每个 SKU 一条完整记录 ② chunk 策略改为"按商品边界"切割 ③ BM25 权重调至 0.6（商品名匹配优先） ④ 增加"促销有效期"元数据过滤',
      keyMetric: '商品推荐准确率从 51% 提升至 83%',
    },
  },
  教育: {
    bm25Weight: 0.6,
    vectorWeight: 0.4,
    similarityThreshold: 0.6,
    topK: 5,
    rerankerRecommended: false,
    top1Critical: true,
    doubleHitRecommended: false,
    intentRouting: {
      knowledge: 'fact',
      homework: 'action',
      chat: 'chitchat',
    },
    lowConfThreshold: 0.65,
    typicalIssues: [
      '教材内容时效性：旧版教材内容未及时替换',
      '知识图谱缺失：概念之间的关联无法通过纯检索获得',
      '学生提问模糊：意图不清导致检索方向错误',
    ],
    caseStudy: {
      summary: '某教育出版社智能答疑 RAG 答案与教材不符',
      problem: '知识库混入了旧版教材内容（2019 版 vs 2023 版），且未按年级/科目做元数据隔离',
      fix: '① 按"教材版本+年级+科目"建立元数据索引 ② 旧版内容标记 deprecated 并降权 ③ 增加"答案来源教材版本"引用标注',
      keyMetric: '答案与教材一致率从 62% 提升至 94%',
    },
  },
};

const DEFAULT_RULES = {
  bm25Weight: 0.5,
  vectorWeight: 0.5,
  similarityThreshold: 0.6,
  topK: 5,
  rerankerRecommended: true,
  top1Critical: true,
  doubleHitRecommended: false,
  intentRouting: {
    fact: 'fact',
    action: 'action',
    chat: 'chitchat',
  },
  lowConfThreshold: 0.65,
  typicalIssues: [
    '知识库质量不可控：文档来源杂乱，格式不统一',
    '阈值设置凭感觉：没有基于真实数据做调参',
    '缺乏评估基线：不知道当前系统处于什么水平',
  ],
  caseStudy: null,
};

// ═══════════════════════════════════════════════════════════
// 严重度分级
// ═══════════════════════════════════════════════════════════

function severityLevel(firstHitAccuracy, hitRate) {
  if (firstHitAccuracy === null || firstHitAccuracy === undefined || Number.isNaN(firstHitAccuracy)) {
    firstHitAccuracy = 0.6;
  }
  if (hitRate === null || hitRate === undefined || Number.isNaN(hitRate)) {
    hitRate = 0.6;
  }
  if (firstHitAccuracy < 0.4 || hitRate < 0.3) return { level: 'P0', label: '不可用', color: '🔴' };
  if (firstHitAccuracy < 0.6 || hitRate < 0.5) return { level: 'P1', label: '偶发严重', color: '🟡' };
  if (firstHitAccuracy < 0.75 || hitRate < 0.7) return { level: 'P2', label: '可容忍但需优化', color: '🟢' };
  return { level: 'OK', label: '健康', color: '✅' };
}

// ═══════════════════════════════════════════════════════════
// 幻觉类型推断
// ═══════════════════════════════════════════════════════════

function inferHallucinationType(symptom, hitRate, firstHitAccuracy) {
  if (!symptom) return HALLUCINATION_TYPES.retrieval_noise;
  const s = symptom.toLowerCase();

  if (/知识库没有|没找到|没内容|覆盖不足|答不上来/.test(s)) {
    return HALLUCINATION_TYPES.knowledge_gap;
  }
  if (/编造|瞎编|捏造|不存在|自己加|hallucinat/.test(s)) {
    if (/检索结果正确|检索正确|召回正确|上下文正确/.test(s)) {
      return HALLUCINATION_TYPES.llm_fabrication;
    }
    if (hitRate > 0.6 && firstHitAccuracy > 0.5) {
      return HALLUCINATION_TYPES.llm_fabrication; // 检索对了但 LLM 乱编
    }
    return HALLUCINATION_TYPES.retrieval_noise; // 检索不对导致瞎编
  }
  if (/矛盾|冲突|不一致|前后|拼接/.test(s)) {
    return HALLUCINATION_TYPES.context_splice;
  }
  if (/噪声|混入|无关|不相关/.test(s)) {
    return HALLUCINATION_TYPES.retrieval_noise;
  }

  // 根据指标推断
  if (hitRate < 0.3) return HALLUCINATION_TYPES.knowledge_gap;
  if (firstHitAccuracy < 0.4) return HALLUCINATION_TYPES.retrieval_noise;
  return HALLUCINATION_TYPES.llm_fabrication;
}

// ═══════════════════════════════════════════════════════════
// 阈值调参建议引擎
// ═══════════════════════════════════════════════════════════

function generateThresholdAdvice(industry, currentThreshold, currentTopK, hitRate, firstHitAccuracy) {
  const rules = INDUSTRY_RULES[industry] || DEFAULT_RULES;
  const advice = [];

  // 相似度阈值建议
  if (currentThreshold !== null && currentThreshold !== undefined) {
    if (currentThreshold < rules.similarityThreshold - 0.1) {
      advice.push({
        param: '相似度阈值',
        current: currentThreshold.toFixed(2),
        suggested: rules.similarityThreshold.toFixed(2),
        reason: `当前阈值过低，召回了大量噪声（当前命中率 ${hitRate ? (hitRate * 100).toFixed(0) + '%' : '未知'}）。${industry} 行业建议阈值 ${rules.similarityThreshold}。`,
      });
    } else if (currentThreshold > rules.similarityThreshold + 0.15) {
      advice.push({
        param: '相似度阈值',
        current: currentThreshold.toFixed(2),
        suggested: rules.similarityThreshold.toFixed(2),
        reason: `当前阈值过高，可能导致召回不足（当前命中率 ${hitRate ? (hitRate * 100).toFixed(0) + '%' : '未知'}）。适当降低可增加召回面。`,
      });
    } else {
      advice.push({
        param: '相似度阈值',
        current: currentThreshold.toFixed(2),
        suggested: rules.similarityThreshold.toFixed(2),
        reason: '当前阈值在合理范围内，建议保持或微调。',
      });
    }
  }

  // Top-K 建议
  if (currentTopK) {
    if (currentTopK > rules.topK + 3) {
      advice.push({
        param: 'Top-K',
        current: String(currentTopK),
        suggested: String(rules.topK),
        reason: `Top-K 过大，上下文窗口被噪声占满。${rules.top1Critical ? '且 Top-1 准确率是关键，应优先优化 Top-1 而非扩大 K。' : ''}`,
      });
    } else if (currentTopK < rules.topK - 2) {
      advice.push({
        param: 'Top-K',
        current: String(currentTopK),
        suggested: String(rules.topK),
        reason: 'Top-K 过小，可能遗漏相关内容。建议适当增加。',
      });
    } else {
      advice.push({
        param: 'Top-K',
        current: String(currentTopK),
        suggested: String(rules.topK),
        reason: '当前 Top-K 在合理范围内。',
      });
    }
  }

  // 混合检索权重
  advice.push({
    param: '混合检索权重（BM25 vs Vector）',
    current: '未传入，请确认线上配置',
    suggested: `BM25 ${(rules.bm25Weight * 100).toFixed(0)}% / Vector ${(rules.vectorWeight * 100).toFixed(0)}%`,
    reason: `${industry || '通用'}场景建议：${rules.bm25Weight > 0.6 ? '关键词匹配优先（政策/商品名等精确匹配更重要）' : rules.vectorWeight > 0.6 ? '语义匹配优先（描述性内容、概念理解更重要）' : '两者均衡'}`,
  });

  // 重排序
  if (rules.rerankerRecommended) {
    advice.push({
      param: '重排序（Reranker）',
      current: '未启用',
      suggested: '启用（推荐 bge-reranker-v2 或同级别）',
      reason: '该场景 Top-1 准确率高优先，重排序可提升 Top-1 准确率 10-20%。代价：延迟增加 50-100ms。',
    });
  }

  // 双命中
  if (rules.doubleHitRecommended) {
    advice.push({
      param: '双命中策略',
      current: '未启用',
      suggested: '启用（BM25 Top-K + Vector Top-K，合并去重）',
      reason: '该场景需要高召回率，双命中可提升召回 15-20%。代价：延迟增加 30-50%，需评估是否可接受。',
    });
  }

  // 低置信转人工
  advice.push({
    param: '低置信度转人工阈值',
    current: '未传入，请确认线上配置',
    suggested: String(rules.lowConfThreshold),
    reason: `低于此值不生成 AI 回答，直接转人工。${industry === '金融' ? '金融场景零容忍 bad case，建议 ≥0.75。' : industry === '政务' ? '政务场景对准确性要求高，建议 ≥0.7。' : '可根据实际 bad case 率微调。'}`,
  });

  return advice;
}

// ═══════════════════════════════════════════════════════════
// 生成诊断报告
// ═══════════════════════════════════════════════════════════

function generateReport(config) {
  const { symptom, industry, hitRate, firstHitAccuracy, currentThreshold, currentTopK } = config;
  const rules = INDUSTRY_RULES[industry] || DEFAULT_RULES;
  const hType = inferHallucinationType(symptom, hitRate, firstHitAccuracy);
  const sev = severityLevel(firstHitAccuracy, hitRate);
  const thresholdAdvice = generateThresholdAdvice(industry, currentThreshold, currentTopK, hitRate, firstHitAccuracy);

  const lines = [];

  // 标题
  lines.push('# 🔬 RAG 幻觉诊断报告');
  lines.push('');
  if (symptom) lines.push(`> 症状：${symptom}`);
  if (industry) lines.push(`> 行业：${industry}`);
  if (hitRate !== null && hitRate !== undefined) lines.push(`> 当前命中率：${(hitRate * 100).toFixed(1)}%`);
  if (firstHitAccuracy !== null && firstHitAccuracy !== undefined) lines.push(`> 当前 Top-1 准确率：${(firstHitAccuracy * 100).toFixed(1)}%`);
  lines.push('');

  // 模块 1：症状归类
  lines.push('## 一、症状归类');
  lines.push('');
  lines.push(`- **幻觉类型**：${hType.name}`);
  lines.push(`- **类型说明**：${hType.description}`);
  lines.push(`- **识别信号**：${hType.signal}`);
  lines.push(`- **严重程度**：${sev.color} ${sev.level}（${sev.label}）`);
  if (firstHitAccuracy !== null && firstHitAccuracy !== undefined) {
    lines.push(`- **Top-1 准确率**：${(firstHitAccuracy * 100).toFixed(1)}% ${firstHitAccuracy < 0.5 ? '⚠️ 低于 50%，检索层是主要瓶颈' : firstHitAccuracy < 0.7 ? '⚠️ 偏低，有优化空间' : '✅ 可接受'}`);
  }
  if (hitRate !== null && hitRate !== undefined) {
    lines.push(`- **整体命中率**：${(hitRate * 100).toFixed(1)}% ${hitRate < 0.4 ? '⚠️ 知识库覆盖或检索策略有问题' : hitRate < 0.6 ? '⚠️ 偏低，需排查' : '✅ 可接受'}`);
  }
  lines.push('');

  // 模块 2：根因诊断
  lines.push('## 二、根因诊断');
  lines.push('');

  // 检索层
  lines.push('### 检索层');
  if (hType === HALLUCINATION_TYPES.knowledge_gap) {
    lines.push('- 🔴 **知识库覆盖不足**：用户问题在知识库中无对应内容');
    lines.push('- 建议：梳理高频问题清单，补充缺失知识；检查 chunk 策略是否过粗导致相关内容被切分');
  } else if (hType === HALLUCINATION_TYPES.retrieval_noise) {
    lines.push('- 🟡 **检索噪声过大**：Top-K 中混入大量不相关内容');
    lines.push('- 建议：调高相似度阈值、调整 BM25/Vector 权重、考虑引入重排序');
  } else if (hType === HALLUCINATION_TYPES.context_splice) {
    lines.push('- 🟡 **上下文拼接冲突**：多段检索结果存在矛盾');
    lines.push('- 建议：减少 Top-K、增加内容去重/冲突检测、使用更精细的 chunk 策略');
  } else {
    lines.push('- 🟡 **检索基本正确，但 LLM 生成时偏离上下文**');
    lines.push('- 建议：加强 system prompt 约束（"仅基于以下信息回答"）、降低 temperature、增加引用检查');
  }
  lines.push('');

  // 知识库层
  lines.push('### 知识库层');
  lines.push(`- **行业典型问题**：`);
  rules.typicalIssues.forEach((issue, i) => {
    lines.push(`  ${i + 1}. ${issue}`);
  });
  lines.push('- **知识库健康检查清单**：');
  lines.push('  - [ ] 文档是否过期？（特别是政策/促销/教材版本）');
  lines.push('  - [ ] Chunk 策略是否合理？（固定字数切割 vs 语义边界切割）');
  lines.push('  - [ ] 是否有元数据标记？（行业/版本/有效期/来源）');
  lines.push('  - [ ] 是否有重复/矛盾内容？');
  lines.push('');

  // 模块 3：阈值调参建议
  lines.push('## 三、阈值调参建议');
  lines.push('');
  lines.push('| 参数 | 当前值 | 建议值 | 原因 |');
  lines.push('|------|--------|--------|------|');
  thresholdAdvice.forEach((a) => {
    lines.push(`| ${a.param} | ${a.current} | ${a.suggested} | ${a.reason} |`);
  });
  lines.push('');

  // 模块 4：架构层建议
  lines.push('## 四、架构层建议');
  lines.push('');

  // 意图路由
  lines.push('### 意图路由');
  lines.push(`当前场景推荐启用意图路由，三层分类：`);
  lines.push('');
  const indLabel = industry || '通用';
  lines.push(`| 意图类型 | 处理方式 | ${indLabel}场景示例 |`);
  lines.push('|---------|---------|------|');
  Object.entries(rules.intentRouting).forEach(([key, type]) => {
    const typeDesc = type === 'fact' ? '直接检索 + 回答' : type === 'action' ? '检索 + 调用工具/API' : '不检索，直接回答';
    lines.push(`| ${key} | ${typeDesc} | - |`);
  });
  lines.push('');

  // 双命中
  if (rules.doubleHitRecommended) {
    lines.push('### 双命中策略 ✅ 推荐启用');
    lines.push('');
    lines.push('- **收益**：召回率提升 15-20%');
    lines.push('- **代价**：延迟增加 30-50%');
    lines.push('- **适用场景**：金融/高准确要求场景');
    lines.push('- **实现**：BM25 Top-K + Vector Top-K → 合并去重 → 重排序');
    lines.push('');
  } else {
    lines.push('### 双命中策略 ⏸️ 暂不推荐');
    lines.push('');
    lines.push(`当前 ${industry || '通用'} 场景双命中收益有限，建议优先优化 Top-1 准确率。`);
    lines.push('');
  }

  // 低置信转人工
  lines.push(`### 低置信度转人工`);
  lines.push('');
  lines.push(`- **建议阈值**：${rules.lowConfThreshold}`);
  lines.push(`- **规则**：相似度低于此值时，不生成 AI 回答，直接转人工或回复"暂未找到准确答案"`);
  lines.push(`- **注意**：阈值不是越低越好。过低的阈值会产生更多 bad case，而非更多回答`);
  lines.push('');

  // 模块 5：立即可执行的 3 步修复
  lines.push('## 五、立即可执行的 3 步修复');
  lines.push('');

  if (hType === HALLUCINATION_TYPES.knowledge_gap) {
    lines.push('1. **补充知识库**：收集过去一周用户提问中"无回答"的高频问题，优先补充 Top 20');
    lines.push('2. **优化 chunk 策略**：检查是否因 chunk 过大导致相关内容被截断。推荐按语义边界（段落/条款）切割');
    lines.push('3. **增加元数据**：为文档添加行业/版本/有效期标签，支持精准过滤');
  } else if (hType === HALLUCINATION_TYPES.retrieval_noise) {
    lines.push(`1. **调整相似度阈值**：当前建议调整为 ${rules.similarityThreshold}，过滤低质量召回`);
    lines.push(`2. **调整混合检索权重**：BM25 ${(rules.bm25Weight * 100).toFixed(0)}% / Vector ${(rules.vectorWeight * 100).toFixed(0)}%`);
    lines.push('3. **抽样审计 Top-10 召回结果**：随机抽样 50 次查询，人工标注 Top-1/Top-3/Top-5 的相关性，建立基线');
  } else if (hType === HALLUCINATION_TYPES.context_splice) {
    lines.push(`1. **减少 Top-K**：当前建议 ${rules.topK}，减少冲突源`);
    lines.push('2. **增加内容去重**：合并语义相似的 chunk，避免同一信息多版本并存');
    lines.push('3. **Prompt 增加冲突检测指令**："如果以下信息存在矛盾，请指出矛盾点而非强行回答"');
  } else {
    lines.push('1. **加强 system prompt**：添加"仅基于以下检索内容回答，不要使用外部知识"');
    lines.push('2. **降低 temperature**：建议 0.1-0.3，减少创造性生成');
    lines.push('3. **增加引用检查**：要求 LLM 标注答案来源的 chunk ID，便于事后审计');
  }
  lines.push('');

  // 实战案例参考
  if (rules.caseStudy) {
    lines.push('---');
    lines.push('');
    lines.push(`## 📌 ${industry}行业实战案例`);
    lines.push('');
    lines.push(`**案例**：${rules.caseStudy.summary}`);
    lines.push('');
    lines.push(`**问题**：${rules.caseStudy.problem}`);
    lines.push('');
    lines.push(`**解决方案**：${rules.caseStudy.fix}`);
    lines.push('');
    lines.push(`**效果**：${rules.caseStudy.keyMetric}`);
    lines.push('');
  }

  // 经验来源
  lines.push('---');
  lines.push('');
  lines.push('> 💡 规则来源：10+ 生产 RAG 交付实战经验（去敏）。每条规则来自真实踩坑，不是教科书理论。');
  lines.push('> ⚠️ 阈值建议为起点参考，实际需基于真实查询日志做 A/B 调参。');
  lines.push('');

  return lines.join('\n');
}

// ═══════════════════════════════════════════════════════════
// 日志分析模式（简化版）
// ═══════════════════════════════════════════════════════════

function analyzeLog(logContent, topN) {
  let total = 0;
  let hitCount = 0;
  let top1Correct = 0;
  let top1Provided = 0;
  let logs;

  try {
    logs = JSON.parse(logContent);
  } catch {
    return '日志格式解析失败，请使用 JSON 数组格式';
  }

  if (!Array.isArray(logs)) {
    return '日志格式解析失败：JSON 必须是数组';
  }

  const entries = logs.slice(0, topN || 20);
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const row = i + 1;

    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      return `日志格式解析失败：第 ${row} 条必须是对象`;
    }
    if (typeof entry.hit !== 'boolean') {
      return `日志格式解析失败：第 ${row} 条 hit 必须是 boolean`;
    }
    if (entry.top1_relevant !== undefined && typeof entry.top1_relevant !== 'boolean') {
      return `日志格式解析失败：第 ${row} 条 top1_relevant 必须是 boolean`;
    }

    total++;
    if (entry.hit) hitCount++;
    if (entry.top1_relevant !== undefined) {
      top1Provided++;
      if (entry.top1_relevant) top1Correct++;
    }
  }

  if (total === 0) return '日志为空';

  const hitRate = (hitCount / total).toFixed(3);
  const top1Acc = top1Provided > 0 ? (top1Correct / top1Provided).toFixed(3) : '未提供';
  const sev = severityLevel(top1Provided > 0 ? top1Correct / top1Provided : null, hitCount / total);

  return `📊 日志分析结果（前 ${topN || 20} 条）：\n` +
    `- 总查询数：${total}\n` +
    `- 命中率：${hitRate} (${sev.color} ${sev.level})\n` +
    `- Top-1 准确率：${top1Acc}\n\n` +
    `建议：使用 --symptom 模式获取详细诊断`;
}

// ═══════════════════════════════════════════════════════════
// 交互模式
// ═══════════════════════════════════════════════════════════

function interactiveMode() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (question) => new Promise((resolve) => rl.question(question, resolve));

  (async () => {
    console.log('\n🔬 RAG 幻觉治理助手 — 输入症状，输出诊断报告\n');

    const symptom = await ask('症状描述（如"AI 经常编造不存在的政策条款"）：');
    const industry = await ask('行业（政务/金融/零售/教育，回车跳过）：');
    const hitRateStr = await ask('当前命中率（如 0.4 表示 40%，回车跳过）：');
    const top1Str = await ask('当前 Top-1 准确率（如 0.3 表示 30%，回车跳过）：');
    const threshStr = await ask('当前相似度阈值（如 0.5，回车跳过）：');
    const topKStr = await ask('当前 Top-K（如 5，回车跳过）：');

    const report = generateReport({
      symptom: symptom.trim() || null,
      industry: industry.trim() || null,
      hitRate: hitRateStr ? parseFloat(hitRateStr) : null,
      firstHitAccuracy: top1Str ? parseFloat(top1Str) : null,
      currentThreshold: threshStr ? parseFloat(threshStr) : null,
      currentTopK: topKStr ? parseInt(topKStr) : null,
    });
    console.log('\n' + report);
    rl.close();
  })();
}

// ═══════════════════════════════════════════════════════════
// 主入口
// ═══════════════════════════════════════════════════════════

function parseArgs(argv) {
  const args = {
    symptom: null, industry: null, hitRate: null, firstHitAccuracy: null,
    currentThreshold: null, currentTopK: null, logFile: null, topN: 20,
  };
  for (let i = 2; i < argv.length; i++) {
    switch (argv[i]) {
      case '--symptom': args.symptom = argv[++i]; break;
      case '--industry': args.industry = argv[++i]; break;
      case '--hitRate': args.hitRate = parseFloat(argv[++i]); break;
      case '--firstHitAccuracy': args.firstHitAccuracy = parseFloat(argv[++i]); break;
      case '--threshold': args.currentThreshold = parseFloat(argv[++i]); break;
      case '--topK': args.currentTopK = parseInt(argv[++i]); break;
      case '--log-file': args.logFile = argv[++i]; break;
      case '--top-n': args.topN = parseInt(argv[++i]); break;
      case '--help': case '-h': printHelp(); process.exit(0);
    }
  }
  return args;
}

function printHelp() {
  console.log(`
rag-hallucination-governor — RAG 幻觉治理 v1.0.0

用法:
  rag-hallucination-governor                                    # 交互模式
  rag-hallucination-governor --symptom "症状描述" --industry "行业" \\
    --hitRate 0.4 --firstHitAccuracy 0.3
  rag-hallucination-governor --log-file /path/to/log.json --top-n 20

参数:
  --symptom          症状描述（如"AI 编造不存在的政策条款"）
  --industry         行业（政务/金融/零售/教育）
  --hitRate          当前命中率（0-1 小数）
  --firstHitAccuracy 当前 Top-1 准确率（0-1 小数）
  --threshold        当前相似度阈值（0-1 小数）
  --topK             当前 Top-K 值
  --log-file         检索日志文件路径（JSON 格式）
  --top-n            分析日志条数（默认 20）

行业支持：政务、金融、零售、教育
`);
}

function main(argv = process.argv) {
  const args = parseArgs(argv);

  if (args.logFile) {
    const fs = require('fs');
    try {
      const logContent = fs.readFileSync(args.logFile, 'utf8');
      console.log(analyzeLog(logContent, args.topN));
    } catch (e) {
      console.error('日志文件读取失败：' + e.message);
      process.exit(1);
    }
  } else if (!args.symptom && !args.industry) {
    interactiveMode();
  } else {
    const report = generateReport(args);
    console.log(report);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  analyzeLog,
  generateReport,
  generateThresholdAdvice,
  inferHallucinationType,
  main,
  parseArgs,
  severityLevel,
};
