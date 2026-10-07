# E2E Test Documentation

High-level, human-readable documentation of what each Cypress spec in [`../tests`](../tests)
is actually verifying and _why_. This is **not** a copy of the test code — it's the "why would
someone write this test" layer that's easy to lose once a spec grows past a handful of `it()`s.

Use it to:

- Onboard quickly to an unfamiliar spec without reading hundreds of lines of Cypress code.
- Decide where a new test case belongs before writing it.
- Spot coverage gaps or redundant tests when reviewing/refactoring the suite.
- Keep generated tests aligned with the test purpose.
- **Write the test case before it's implemented.** A test-case section can describe the
  intended behavior ahead of a tracking ticket, so an AI agent (or a person) implementing
  that ticket has an unambiguous spec to build and validate against — see
  [Planned vs. implemented test cases](#planned-vs-implemented-test-cases) below.

## A deliberate constraint: keep `it()` count minimal

This suite intentionally keeps the number of `it()` blocks low — which runs against the usual
"many small, focused tests" testing advice. That's a conscious trade-off, not an oversight:

- Failing tests are debugged via **Cypress Cloud** (run history, recordings, Test Replay).
- The project's Cypress Cloud subscription **limits the number of recorded tests**, i.e. the
  total `it()` count across the suite — not just execution minutes.
- Splitting a describe block into many granular `it()`s multiplies that count for little
  debugging benefit, since most of the value (reproducing and inspecting a failure) already
  comes from a single, richer `it()`'s recording.

**What this means in practice:**

- Favor grouping several related checks/steps into one broader `it()` over splitting them
  into separate ones — this is already how most of the existing specs are written (e.g. one
  `it()` walking through several UI entry points, or through grant → change → revoke as a
  single case).
- When adding a new 🧭 Planned test case, check first whether it can be folded in as an
  additional `Key assertions` bullet on an existing `it()` nearby, instead of creating a new
  heading/new `it()`. Only reach for a new `it()` when the behavior genuinely doesn't belong
  anywhere else (e.g. it needs different setup, or isolating the failure is important enough
  to be worth the extra count).
- This applies to the [Agent implementation workflow](#agent-implementation-workflow) too —
  default to extending an existing `it()` rather than adding a new one.

## Structure

```
test-docs/
├── README.md                      <- you are here
├── <spec-name>/                   <- one folder per *.spec.ts file in ../tests
│   ├── README.md                  <- spec-level overview + index of describe docs
│   ├── <describe-slug>.md         <- one file per top-level `describe()` block
│   └── <describe-slug>.md
└── <spec-name>/
    └── ...
```

- **Folder per spec file** — `tests/component-lifecycle.spec.ts` → `test-docs/component-lifecycle/`.
  The folder name is the spec file name without the `.spec.ts` extension.
- **`README.md` per spec folder** — a short index: what the spec as a whole is protecting,
  any shared state/fixtures across its `describe` blocks, and a table of links to every
  describe doc in that folder.
- **One Markdown file per `describe()` block** — named after a kebab-case slug of the
  describe title (e.g. `describe('Check Secrets Page', ...)` → `check-secrets-page.md`).
  If a spec nests `describe` blocks only to group other `describe` blocks (no `it()`s of its
  own), that outer describe doesn't get its own file — it's already represented by the
  spec's `README.md`. Only describes that directly contain `it()`s get a file.
- **One section per `it()`** — inside a describe doc, every `it()` (including `it.skip`,
  `it.only`, etc.) is documented as its own `###` subsection, using the template below.

## Describe-doc template

Copy this when adding a new describe doc, or a new test-case section to an existing one.
Keeping the shape identical across files is what makes this easy to scan and to extend.

```markdown
# <Describe Title>

**Spec file:** `tests/<file>.spec.ts`

**Describe block:** `<describe title>`

**Implementation:** <🧭 Planned | 🔶 Partially implemented | ✅ Implemented>

## Purpose

2-4 sentences on _why_ this group of tests exists: what user-facing flow or feature area it protects, and what regression/risk it's guarding against.

## Scope & Assumptions

Preconditions this describe block relies on (e.g. state created by a previous describe, required feature flags, environment variables like `STUDIO_MODE`/`LOCAL_CLUSTER`).

## Setup & Teardown

- **before / beforeEach:** what it does, in one line.
- **after / afterEach:** what it does, in one line.

## Test Cases

### 🧭 `<it title>` _(planned)_

- **Status:** Planned — not yet implemented.
- **Purpose:** one sentence — what behavior this specific case should guard once built.
- **Key assertions (expected):**
  - What should be checked.

### ✅ `<it title>`

- **Status:** Active
- **Purpose:** one sentence — what behavior this specific case guards.
- **Key assertions:**
  - What is actually checked.
- **Notes:** optional — known flakiness, follow-up work, links to a public tracking issue.

### ⏭️ `<it title>` _(skipped)_

- **Status:** Skipped — reason.
- **Purpose:** what it _would_ guard once re-enabled.
- **Key assertions:**
  - What is actually checked.
- **Notes:** optional — known flakiness, follow-up work, links to a public tracking issue.
```

### Status markers

Used as a prefix on each `###` test-case heading so the suite's health — and what's merely
_documented intent_ versus _actually running code_ — is scannable at a glance:

| Marker | Meaning                                                      |
| ------ | ------------------------------------------------------------ |
| 🧭     | **Planned** — documented, no corresponding `it()` exists yet |
| ✅     | Implemented & active, expected to run and pass               |
| ⏭️     | Implemented, but skipped (`it.skip`, `.skip`, etc.)          |
| 🧪     | Implemented, `it.only` / otherwise scoped during dev         |
| 🚧     | Implemented, but flaky / under investigation                 |

The same vocabulary rolls up to the whole describe doc via the `Implementation:` header field:

| Header value             | Meaning                                                     |
| ------------------------ | ----------------------------------------------------------- |
| 🧭 Planned               | Every test case in this file is still 🧭                    |
| 🔶 Partially implemented | A mix of 🧭 and (✅/⏭️/🧪/🚧) test cases                    |
| ✅ Implemented           | No 🧭 test cases remain — every case has corresponding code |

The same column (`Implementation`) appears in each spec folder's `README.md` index table, so
you can tell at a glance which describe docs still have planned-but-unbuilt work without
opening every file.

## Planned vs. implemented test cases

Documentation here doesn't have to trail the code — it can **lead** it. The intended workflow
for net-new coverage is:

1. **Doc first.** Someone (a human, or an agent during planning) adds a 🧭 **Planned**
   test-case section to the relevant describe doc (creating a new describe doc, or even a new
   spec folder, if nothing suitable exists yet) — `Purpose` and expected `Key assertions`,
   written as if the test already existed.
2. **Tracking ticket.** A ticket with the concrete implementation steps is filed in whichever
   tracker the project uses, referencing this MD section (by file path + test-case title) so
   whoever implements it knows exactly what to build. Because this repo is open source and
   not every tracker is publicly readable, the MD section itself stays the source of truth —
   it doesn't link out to the ticket.
3. **Agent implements.** An AI agent picks up the ticket and writes the actual `it()` (and any
   supporting page-object/helper code) in the corresponding `tests/*.spec.ts` file.
4. **Agent validates alignment**, then flips the status — see
   [Agent implementation workflow](#agent-implementation-workflow) below.

### Keeping doc and test titles in sync

The string inside backticks in a test-case heading (`` ### ✅ `<it title>` ``) **must exactly
match** the string literal passed to `it(...)` once implemented. This is what makes alignment
checking mechanical rather than guesswork: given a heading, `rg "<it title>" tests/` finds the
matching code (or proves it doesn't exist yet, i.e. it's still 🧭 Planned).

## Agent implementation workflow

When an AI agent implements a ticket that corresponds to a 🧭 Planned test case, it must,
before considering the ticket done:

0. **Check whether a new `it()` is actually warranted** — per
   [keeping `it()` count minimal](#a-deliberate-constraint-keep-it-count-minimal), prefer
   adding the planned assertions to an existing nearby `it()` over creating a new one, unless
   there's a good reason the behavior needs its own test case.
1. **Implement using the documented title verbatim** — the new `it('<it title>', ...)` string
   must match the doc heading exactly (fix the doc heading instead of the title if the ticket
   legitimately changed the test's name).
2. **Validate alignment** between the code it just wrote and the doc section:
   - Re-read the `Purpose` — does the implemented test actually guard that behavior? If the
     ticket's scope diverged from the original purpose, flag this to a human reviewer rather
     than silently rewriting `Purpose` to match whatever got built.
   - Re-read the `Key assertions (expected)` bullets against the real Cypress assertions.
     These bullets exist to describe _what the code actually checks_, so update them to match
     reality — drop assertions that weren't needed, add ones that were. Then drop the
     `(expected)` qualifier.
3. **Flip the status**: update the heading marker and the `Status:` line (🧭 Planned → ✅
   Active, or ⏭️ Skipped if the ticket intentionally lands it skipped), and update the
   describe doc's `Implementation:` header field (and the spec `README.md` index row) if this
   was the last 🧭 case in the file.
4. **Leave a note if something couldn't be reconciled** — e.g. the originally planned
   assertion isn't feasible — in the case's `Notes:` field, instead of quietly dropping it.

## Keeping this in sync

Whenever `tests/*.spec.ts` changes:

- **New spec file** → add a new `test-docs/<spec-name>/` folder with a `README.md`.
- **New `describe()` with its own `it()`s** → add a new `<describe-slug>.md` file, listed
  in the spec's `README.md` index.
- **New `it()`** → add a new `###` test-case section to the relevant describe doc (as 🧭
  Planned if written ahead of implementation, per the workflow above).
- **Removed/renamed test** → remove/rename the corresponding section or file.
- **Test case implemented** → flip 🧭 Planned → ✅/⏭️/🧪 per the
  [agent implementation workflow](#agent-implementation-workflow), and update the rollup
  `Implementation:` status on the describe doc and spec `README.md` index.

This doesn't need to happen in the same PR as the test change, but should land before/alongside
the next review of that spec.
