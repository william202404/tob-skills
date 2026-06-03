# Checker Review Packet — tob-competitor-snip

Status: Tech CLI/test fixes applied, pending Checker review.

## Scope

Review `tob-competitor-snip` as a ToB competitive-response skill.

Files:
- `SKILL.md`
- `src/generator.js`
- `cli.js`
- `package.json`
- `tests/run-tests.js`

## Expected Behavior

The skill should:
- detect customer competitor concerns such as price, feature gap, and brand trust
- produce a concise competitor card with profile, differentiation, talking points, and action advice
- avoid fabricating competitor facts, customer names, win rates, or case details
- offer POC validation when no real competitor evidence exists

## CLI/Test Fixes To Check

- CLI wrapper exists at `cli.js`.
- `package.json` exposes `tob-competitor-snip` bin and `npm test`.
- Generator can be required by tests without entering interactive mode.
- Tests cover scenario detection, full card output, quick mode, and argument parsing.

## Test Evidence

Run:

```bash
npm test --prefix tob-competitor-snip
node tob-competitor-snip/src/generator.js --competitor "X公司" --industry "零售" --concern "价格便宜30%"
```

Expected:
- tests pass
- output includes 3-year TCO framing
- output does not claim private or unverified competitor facts

## Known Boundaries

- This is a rules engine, not a live competitor intelligence database.
- If no field evidence exists, it must say the knowledge base has no交手 record and suggest POC validation.
