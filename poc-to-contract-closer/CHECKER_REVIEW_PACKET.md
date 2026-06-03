# Checker Review Packet — poc-to-contract-closer

Status: Tech P1/P2 fixes applied, pending Checker recheck.

## Scope

Review `poc-to-contract-closer` as a ToB POC-to-contract closing skill.

Files:
- `SKILL.md`
- `src/generator.js`
- `cli.js`
- `tests/run-tests.js`
- `package.json`

## Expected Behavior

The skill should:
- convert a closeable POC into a contract path, not generic sales copy
- block readiness when P0 issues remain or acceptance evidence is weak
- require decision maker status before detailed commercial action
- require procurement path before declaring the deal ready
- require a real closing window or mark urgency missing
- define cooling thresholds for 3/7/14 days of customer silence
- distinguish closeable from contract-ready
- return to `tob-poc-war-room` when technical readiness is not enough

## P1 Fixes To Check

- Closing window / cooling threshold: output includes dedicated `Closing Window` and `Cooling Threshold` checks; 3 days means proactive recap, 7 days means danger signal, 14 days means stalled closing.
- Procurement path: output includes a dedicated `Procurement Path` check covering tender, price comparison, single-source, framework agreement, renewal, and direct purchase paths.

## P2 Fixes To Check

- CLI exists and supports quick deterministic generation.
- `npm test` exists and covers procurement path, closing window, readiness, and war-room return path.
- Terminology aligns with `tob-poc-war-room`: P0/P1/P2, procurement path, closing window, return path.
- Terminology aligns on `closeable` vs `contract-ready`.

## Test Evidence

Run:

```bash
npm test --prefix /Users/lining/.openclaw/workspace-tech/skills/poc-to-contract-closer
node /Users/lining/.openclaw/workspace-tech/skills/poc-to-contract-closer/src/generator.js --pass-rate 94 --p0 0 --p1 1 --accepted-value "核心问答准确率达标" --decision-maker "经济买方已确认" --procurement-path "比价采购" --launch-window "6月试点上线"
```

Expected:
- tests pass
- ready case says `Status: Ready`
- missing procurement path says `Quote now? no`
- unresolved P0 returns to `tob-poc-war-room`

## Known Boundaries

- Do not invent price, discount, contract terms, customer names, or exact launch dates.
- Do not call a deal ready if decision maker, procurement path, or closing window is missing.
- Use POC evidence as the anchor for customer message and quote action.
