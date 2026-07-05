#!/usr/bin/env node
const { parseArgs, generateReport } = require('./src/generator.js');

const args = parseArgs(process.argv);
if (!args.passRate && !args.decisionMaker && !args.procurementPath && !args.launchWindow) {
  console.log('Usage: node cli.js --pass-rate 94 --p0 0 --procurement-path "比价采购" ...');
  process.exit(1);
}
console.log(generateReport(args));
