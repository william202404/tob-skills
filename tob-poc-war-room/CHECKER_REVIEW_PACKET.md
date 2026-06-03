# Checker Review Packet — tob-poc-war-room

## Scope

Review `tob-poc-war-room` as a ToB production POC war-room skill.

Files:
- `SKILL.md`
- `src/generator.js`
- `cli.js`
- `tests/run-tests.js`
- `package.json`

## Expected Behavior

The skill should:
- classify POC health from objective, day, pass rate, blocker list, and customer silence
- make 48h owner/action/deadline recommendations
- distinguish closeable status from contract-ready status
- distinguish closeable from contract-ready
- trigger `poc-to-contract-closer` only when POC is closeable or stalled after success
- flag missing procurement path as a buying-process risk when POC evidence is closeable
- provide a return path when `poc-to-contract-closer` rejects readiness
- avoid inventing customer names, contract values, or private project details

## Field Rules To Check

- 93% pass-rate style signal is treated as closeable evidence, not contract-ready status.
- P0/P1/P2 issues are not buried under positive summaries.
- P0 older than 48h requires owner/action escalation.
- 3-day silence prompts proactive touch; 7-day silence triggers buying-process risk.
- High pass rate plus unknown procurement path should not lead directly to quote.
- Closing and war-room must be a two-way loop: unresolved P0 or weak acceptance evidence returns to 48h issue closure.
- Every action has owner, next step, and evidence expectation.

## Test Evidence

Run:

```bash
npm test --prefix /Users/lining/.openclaw/workspace-tech/skills/tob-poc-war-room
node /Users/lining/.openclaw/workspace-tech/skills/tob-poc-war-room/src/generator.js --industry "零售" --objective "客服知识库 POC 通过率 >=90%" --day 8 --pass-rate 93 --silence-days 7 --problems "一个 SSO 问题 60h 未关闭，客户 champion 认可结果"
```

Expected:
- tests pass
- output contains pass rate, silence days, unknown procurement path risk, 48h action, and `poc-to-contract-closer` trigger

## Known Boundaries

- This is a skill/CLI for diagnosis and playbook generation, not a CRM or task tracker.
- It must not generate exact quote amounts or contract terms.
- It should not mark a POC successful without acceptance evidence.
