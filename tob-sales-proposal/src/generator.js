const fs = require('fs-extra');
const path = require('path');
const Handlebars = require('handlebars');

class ProposalGenerator {
  constructor(config) {
    this.config = config;
    this.templateDir = path.join(__dirname, '..', 'templates');
    this.dataDir = path.join(__dirname, '..', 'data');

    // 注册 Handlebars helpers
    Handlebars.registerHelper('split', function(str, delimiter) {
      return (str || '').split(delimiter);
    });
  }

  async generate() {
    if (typeof this.config.painpoints === 'string' && this.config.painpoints.trim() === '') {
      this.config.painpoints = undefined;
    }

    // 加载数据
    const cases = await this.loadCases();
    const methodologies = await this.loadMethodologies();
    
    // 匹配最佳案例
    const matchedCases = this.matchCases(cases);
    
    // 构建提案数据
    const proposalData = {
      ...this.config,
      generatedAt: new Date().toLocaleDateString('zh-CN'),
      cases: matchedCases,
      methodologies: methodologies,
      // 基于行业生成洞察
      industryInsight: this.generateIndustryInsight(),
      // 生成解决方案
      solution: this.generateSolution(),
      // 生成实施计划
      implementation: this.generateImplementationPlan(),
      // 生成ROI分析
      roi: this.generateROI()
    };

    // 渲染 HTML 模板
    const templatePath = path.join(this.templateDir, 'proposal.html.hbs');
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    const template = Handlebars.compile(templateContent);
    
    return template(proposalData);
  }

  async loadCases() {
    try {
      const casesPath = path.join(this.dataDir, 'cases.json');
      const data = await fs.readJson(casesPath);
      return data.cases || [];
    } catch (error) {
      console.warn('警告: 无法加载案例库，使用默认案例');
      return this.getDefaultCases();
    }
  }

  async loadMethodologies() {
    try {
      const methodsPath = path.join(this.dataDir, 'methodologies.json');
      const data = await fs.readJson(methodsPath);
      return data.frameworks || [];
    } catch (error) {
      return [];
    }
  }

  matchCases(cases) {
    // 基于行业匹配最佳案例
    const industry = this.config.industry;
    const matched = cases.filter(c => {
      // 行业匹配
      if (c.industry && c.industry.includes(industry)) return true;
      // 关键词匹配
      if (this.config.painpoints) {
        const pains = this.config.painpoints.split(',').map(p => p.trim()).filter(Boolean);
        return pains.some(pain => 
          JSON.stringify(c).includes(pain)
        );
      }
      return false;
    });

    // 返回前3个最匹配的
    return matched.slice(0, 3).length > 0 ? matched.slice(0, 3) : cases.slice(0, 2);
  }

  generateIndustryInsight() {
    const insights = {
      '金融': {
        trends: ['数字化转型加速', '监管科技兴起', '客户体验升级'],
        challenges: [
          { name: '数据孤岛严重', desc: '各部门系统烟囱式建设，数据标准和接口不统一，跨部门协同困难，风控模型只能看到局部视角' },
          { name: '合规成本高', desc: '监管要求频繁更新，人工合规审查效率低，一旦违规面临巨额罚款和声誉损失风险' },
          { name: '系统老化', desc: '核心系统多为传统架构，迭代周期以月为单位，无法支持业务敏捷创新与秒级响应' }
        ],
        opportunities: ['智能风控', '精准营销', '流程自动化']
      },
      '零售': {
        trends: ['全渠道融合', '私域运营', '供应链数字化'],
        challenges: [
          { name: '获客成本高', desc: '公域流量红利见顶，单客获取成本三年翻倍，传统促销手段ROI持续走低' },
          { name: '库存管理难', desc: '线上线下渠道库存割裂，畅销品断货与滞销品积压并存，库存周转率低于行业均值' },
          { name: '客户留存低', desc: '会员体系缺乏差异化运营，复购率不足20%，私域转化链路存在明显断裂' }
        ],
        opportunities: ['智能选品', '会员运营', '供应链协同']
      },
      '制造': {
        trends: ['工业4.0', '智能制造', '绿色生产'],
        challenges: [
          { name: '生产效率低', desc: '设备综合效率(OEE)长期低于70%，产线换型时间长，人工排产难以应对多品种小批量需求' },
          { name: '质量管控难', desc: '依赖事后抽检而非过程控制，缺乏全链路质量追溯，客诉处理闭环周期超过7天' },
          { name: '供应链脆弱', desc: '供应商信息不透明，关键物料依赖单一来源，突发断供后平均恢复周期超2周' }
        ],
        opportunities: ['MES系统', '质量追溯', '预测性维护']
      },
      '能源': {
        trends: ['双碳目标', '新能源发展', '数字化运维'],
        challenges: [
          { name: '设备管理复杂', desc: '资产种类多且分布偏远，维修记录仍以纸质为主，设备故障平均修复时间(MTTR)超48h' },
          { name: '安全风险高', desc: '巡检依赖人工经验，隐患发现不及时，安全事件响应仍靠电话逐级上报' },
          { name: '成本控制难', desc: '能耗数据采集靠手工抄表，节能优化缺数据支撑，运维预算逐年压缩' }
        ],
        opportunities: ['智能运维', '能耗管理', '安全监控']
      },
      '政务': {
        trends: ['数字政府', '一网通办', '数据共享'],
        challenges: [
          { name: '系统割裂', desc: '各部门条线系统各自建设，群众办事需反复提交材料，数据核验跨部门流转周期长达数周' },
          { name: '服务体验差', desc: '线下窗口排队时间长，线上服务入口分散，适老化改造进展滞后' },
          { name: '数据孤岛', desc: '政务数据共享缺乏统一标准，跨部门协同审批耗时占整体办理时长60%以上' }
        ],
        opportunities: ['一体化平台', '智能审批', '数据治理']
      }
    };

    return insights[this.config.industry] || insights['零售'];
  }

  generateSolution() {
    const solutions = {
      '智能客服系统': {
        core: '全渠道智能客服平台',
        features: ['多渠道接入', '智能路由', '知识库管理', '数据分析'],
        value: '提升客服效率50%+，降低人力成本30%'
      },
      'RAG知识库': {
        core: '企业级智能知识库系统',
        features: ['文档智能解析', '语义搜索', '问答机器人', '知识图谱'],
        value: '知识检索准确率提升40%，响应时间缩短80%'
      },
      'CRM系统': {
        core: '客户关系管理平台',
        features: ['客户360视图', '销售漏斗', '自动化营销', '数据分析'],
        value: '销售转化率提升25%，客户留存率提升20%'
      },
      '供应链管理系统': {
        core: '端到端供应链协同平台',
        features: ['供应商协同', '智能排产', '库存优化', '物流追踪'],
        value: '库存周转提升30%，交付准时率提升至95%+'
      }
    };

    return solutions[this.config.product] || {
      core: `${this.config.product}解决方案`,
      features: ['定制化功能', '系统集成', '数据安全', '持续运维'],
      value: '提升业务效率，降低运营成本'
    };
  }

  generateImplementationPlan() {
    const timeline = this.config.timeline || '3个月';
    const months = parseInt(timeline) || 3;
    
    return {
      phases: [
        {
          name: '第一阶段：需求确认与方案设计',
          duration: `第1-${Math.ceil(months * 0.3)}周`,
          tasks: ['业务调研', '需求确认', '方案设计', '原型确认']
        },
        {
          name: '第二阶段：系统开发与测试',
          duration: `第${Math.ceil(months * 0.3) + 1}-${Math.ceil(months * 0.7)}周`,
          tasks: ['系统开发', '接口对接', '功能测试', '用户验收']
        },
        {
          name: '第三阶段：上线部署与培训',
          duration: `第${Math.ceil(months * 0.7) + 1}-${months}周`,
          tasks: ['生产部署', '数据迁移', '用户培训', '上线支持']
        }
      ]
    };
  }

  generateROI() {
    const budget = this.config.budget || '50-100万';
    // 简单解析预算范围
    const budgetMatch = budget.match(/(\d+).*?(\d+)/);
    const minBudget = budgetMatch ? parseInt(budgetMatch[1]) : 50;
    const maxBudget = budgetMatch ? parseInt(budgetMatch[2]) : 100;
    const avgBudget = (minBudget + maxBudget) / 2;

    return {
      investment: `${minBudget}-${maxBudget}万元`,
      benefits: [
        { item: '人力成本节约', value: `${Math.round(avgBudget * 0.3)}万元/年`, desc: '自动化替代重复工作' },
        { item: '效率提升收益', value: `${Math.round(avgBudget * 0.5)}万元/年`, desc: '流程优化带来效率提升' },
        { item: '风险降低价值', value: `${Math.round(avgBudget * 0.2)}万元/年`, desc: '减少错误和合规风险' }
      ],
      paybackPeriod: '12-18个月',
      threeYearROI: '250%-350%'
    };
  }

  getDefaultCases() {
    return [
      {
        name: '中信集团数字化转型',
        client: '中信集团',
        industry: '综合金融',
        solutions: ['业务中台', '数据中台'],
        keyResults: '实现数据互通，业务流程系统化'
      },
      {
        name: '力方力合供应链升级',
        client: '力方力合',
        industry: '服装鞋帽',
        solutions: ['供应链系统', '智能排产'],
        keyResults: '交付周期从45天缩短至30天'
      }
    ];
  }
}

module.exports = ProposalGenerator;
