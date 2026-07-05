#!/usr/bin/env node

const assert = require('assert');
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const root = path.resolve(__dirname, '..');
const cli = path.join(root, 'src', 'generator.js');
const expectedModuleTitles = [
  '## 一、症状归类',
  '## 二、根因诊断',
  '## 三、阈值调参建议',
  '## 四、架构层建议',
  '## 五、立即可执行的 3 步修复',
];

function run(args) {
  return execFileSync(process.execPath, [cli, ...args], {
    cwd: root,
    encoding: 'utf8',
  });
}

function assertIncludes(output, expected, name) {
  assert(
    output.includes(expected),
    `${name}: expected output to include "${expected}"\n\nActual:\n${output.slice(0, 1200)}`
  );
}

const cases = [
  {
    name: '政务政策条款幻觉 P0',
    args: ['--symptom', 'AI经常编造不存在的政策条款', '--industry', '政务', '--hitRate', '0.4', '--firstHitAccuracy', '0.3'],
    expects: ['检索噪声型', 'P0', 'BM25 70% / Vector 30%', '低置信度转人工阈值'],
  },
  {
    name: '金融术语漂移双命中',
    args: ['--symptom', '融资融券问题经常匹配到无关语义', '--industry', '金融', '--hitRate', '0.55', '--firstHitAccuracy', '0.35', '--threshold', '0.5', '--topK', '10'],
    expects: ['金融', '双命中策略', '低置信度转人工阈值', '0.75'],
  },
  {
    name: '教育版本冲突',
    args: ['--symptom', '新旧教材内容拼接后答案前后矛盾', '--industry', '教育', '--hitRate', '0.7', '--firstHitAccuracy', '0.58', '--topK', '9'],
    expects: ['上下文拼接型', '减少 Top-K', '当前建议 5', '教材版本'],
  },
  {
    name: '未知行业默认规则不崩溃',
    args: ['--symptom', '答案偶尔瞎编', '--industry', '制造', '--hitRate', '0.62', '--firstHitAccuracy', '0.61'],
    expects: ['RAG 幻觉诊断报告', '制造', '混合检索权重', '直接检索 + 回答'],
  },
  {
    name: '无指标不误判 P0',
    args: ['--symptom', '检索结果正确但模型自己加了不存在的数字', '--industry', '零售'],
    expects: ['LLM 编造型', '严重程度', 'P2'],
  },
];

for (const testCase of cases) {
  const output = run(testCase.args);
  for (const expected of testCase.expects) {
    assertIncludes(output, expected, testCase.name);
  }
  for (const title of expectedModuleTitles) {
    assertIncludes(output, title, `${testCase.name} 输出结构完整性`);
  }
}

function withLogFile(content, callback) {
  const logFile = path.join(os.tmpdir(), `rag-hallucination-governor-${Date.now()}-${Math.random()}.json`);
  fs.writeFileSync(logFile, content);
  try {
    callback(logFile);
  } finally {
    fs.unlinkSync(logFile);
  }
}

withLogFile(JSON.stringify([
  { hit: true, top1_relevant: true },
  { hit: true, top1_relevant: false },
  { hit: false, top1_relevant: false },
]), (logFile) => {
  const output = run(['--log-file', logFile, '--top-n', '3']);
  assertIncludes(output, '日志分析结果', '日志分析模式');
  assertIncludes(output, '总查询数：3', '日志分析模式');
  assertIncludes(output, '命中率：0.667', '日志分析模式');
  assertIncludes(output, 'Top-1 准确率：0.333', '日志分析模式');
});

withLogFile(JSON.stringify([
  { hit: true },
  { hit: false },
]), (logFile) => {
  const output = run(['--log-file', logFile]);
  assertIncludes(output, 'Top-1 准确率：未提供', '日志缺少 Top-1 标注');
});

withLogFile(JSON.stringify({ hit: true }), (logFile) => {
  const output = run(['--log-file', logFile]);
  assertIncludes(output, 'JSON 必须是数组', '日志必须是数组');
});

withLogFile(JSON.stringify([true]), (logFile) => {
  const output = run(['--log-file', logFile]);
  assertIncludes(output, '第 1 条必须是对象', '日志条目必须是对象');
});

withLogFile(JSON.stringify([{ hit: 'true' }]), (logFile) => {
  const output = run(['--log-file', logFile]);
  assertIncludes(output, 'hit 必须是 boolean', '日志 hit 必须是 boolean');
});

withLogFile(JSON.stringify([{ hit: true, top1_relevant: 'yes' }]), (logFile) => {
  const output = run(['--log-file', logFile]);
  assertIncludes(output, 'top1_relevant 必须是 boolean', '日志 top1_relevant 必须是 boolean');
});

console.log('rag-hallucination-governor tests passed');
