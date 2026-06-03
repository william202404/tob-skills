# Checker Review Packet

Status: Checker P1/P2 fixes applied, pending Checker recheck, not release-approved.

## Scope

Review `rag-hallucination-governor` as a ToB production RAG reliability skill.

It should help an agent produce operational governance advice for hallucination risks caused by retrieval, routing, scope, citations, conflicts, thresholds, and handoff design.

## Evidence Files

- `SKILL.md`: trigger rules, required output standard, and workflow.
- `ANTI_TEMPLATE_STANDARD.md`: anti-template boundary and source mix.
- `FIELD_SCENARIOS.md`: synthetic ToB delivery patterns.
- `TEST_CASES.md`: smoke test inputs and expected checks.
- `src/generator.js`: deterministic rule card generator.
- `cli.js`: CLI entry.
- `package.json`: npm metadata and test script.
- `tests/run-tests.js`: deterministic smoke tests.

## Current Coverage

- Top1 pollution.
- Citation coverage gap.
- Evidence/version conflict.
- Query rewrite drift.
- Permission, tenant, or department scope mismatch.
- Low-confidence hard answer.

## Self-Test Evidence

Last Tech smoke test: 2026-06-02.

Passed cases:

- TC1 Top1 pollution.
- TC2 Citation coverage gap.
- TC3 Query rewrite drift.
- TC4 Permission or scope mismatch.
- TC5 Evidence version conflict.
- TC6 Low-confidence hard answer.

Checker first-pass result on 2026-06-02:

- P0: 0.
- P1: mixed symptoms only matched the first rule.
- P2: duplicate quick examples; generic Required Logs across all rules.

Tech fixes applied:

- Added mixed-risk detection and additional risk type output.
- Changed Self-Test example to a different symptom from Quick Mode.
- Added rule-specific Required Logs.
- Added package/CLI/test entry so the skill can be self-tested consistently.

## Review Questions

1. Does every rule map to a production control rather than generic RAG education?
2. Does the output include trigger signal, failure mode, changed control, metric, and refuse/handoff condition?
3. Are privacy boundaries respected: no customer names, private snippets, prices, contracts, or exact incident claims?
4. Are Critical issues present in safety, leakage, or overclaiming?
5. Is the skill ready for release-owner confirmation, or should it stay in Tech development?

## Known Open Risks

- Real customer evidence is intentionally abstracted; Checker should verify that abstraction is still useful.
- The generator is deterministic and rule-based, so nuanced mixed failures may need agent judgment after loading the skill.
- Test cases are synthetic; before release, 二蛋 or Checker should add at least one anonymized field-style scenario if available.
