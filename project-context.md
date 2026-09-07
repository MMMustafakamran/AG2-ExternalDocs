# Project Goal

QA on **AG2's own** documentation for its AG-UI / CopilotKit integration
(<https://docs.ag2.ai/docs/user-guide/ag-ui/>). The job is **finding bugs and ambiguity in those doc pages**. The
deliverable is a written QA report plus one recording per page. Everything here
is tooling for that; a clean run that finds nothing when the docs are broken is
a failed run, not a passing one.

This is an **external** vendor's documentation. The sibling repo `../../AG2-react`
tests CopilotKit's docs for the same framework. Findings do not transfer between
them: different pages, different authors, different code.

## Layout

| Path | What it is |
|---|---|
| `doc-snapshot/` | Version-controlled copy of the upstream pages, plus the QA report |
| ``backend/`` | The doc's own Python, verbatim where published |
| `frontend/` | The page's own React, verbatim -- AG2 is the one framework here that publishes a full client |
| `autorecorder/` | Per-page capture: doc page -> the code -> the live feature |
| `ci/` | Drift check and the automate pipeline |

## What this repo found

The four pages are accurate: every identifier they publish resolves
against `ag2` 1.0.4. The **reference starter one of them links to** does not
import under that version -- it is still on the 0.x `autogen` namespace.
`backend/starter-backend.py` is vendored as evidence and must stay
byte-identical to upstream.

## Cycle

```
drift check -> paste changed snippets in verbatim -> record -> report
```

## Rules

1. Snippets go in **verbatim**. A snippet that fails as published is the finding
   -- do not fix it.
2. Broken pages keep their broken implementation; the clip exists to show the
   defect.
3. Ambiguity is a defect: missing steps, undefined identifiers, unstated
   prerequisites, an "Expected Output" the code cannot produce. Report it even
   if inference makes the page work.
4. Every finding pins installed vs declared versions.
5. Mark harness code as harness code. Where the docs publish nothing, this repo
   supplies the minimum that the page's own prose implies -- and says so in the
   file header. That boundary is what makes the report defensible; blur it and a
   reader cannot tell which half was the vendor's.

## Gaps the pipeline misses -- check by hand

- **New pages** -- snapshotted but with no route and no recorder entry.
- **Removed/renamed pages** -- leave a live route and a passing clip behind.
- **Sections deliberately not recorded** -- listed in the README's status table
  rather than silently absent, or nothing notices when they start mattering.
- **A snippet that changed while its surrounding prose did not.** Drift catches
  the code; nothing catches the paragraph that describes it.
- **Silent failures** -- the agent replies and the documented feature never
  happens. This is why the actions check for specific DOM evidence rather than
  "did it answer".
- **Divergence from `../../AG2-react`**, which tests the same integration through
  CopilotKit's docs. Nothing compares them.

## Done

Drift implemented - gaps reconciled - all routes recorded - report rebuilt -
**clips actually watched**.
