# AG2 · AG-UI — external-docs QA harness

Tests **AG2's own** AG-UI documentation. Not CopilotKit's docs — the sibling repo
`../../AG2-react` covers those.

**Doc root** <https://docs.ag2.ai/docs/user-guide/ag-ui/>
**Snapshot** 2026-09-07 · 4 pages · `doc-snapshot/`
**Verdict** ⚠️ **The pages are accurate. The runnable starter one of them links to is not.**
→ [`doc-snapshot/reports/FINDINGS.md`](doc-snapshot/reports/FINDINGS.md)

---

## 1 · What this repo is

A QA harness, not a demo app. Every snippet the four pages publish is pasted in
**verbatim**, and the job is to find where the docs are wrong. A clean run that
finds nothing when the docs are broken is a failed run.

The assignment listed AG2 as *Fully Working*. Its four pages are — every
identifier resolves against `ag2` 1.0.4, checked by unpacking the wheel. What
does not work is the reference starter the CopilotKit Quickstart tells you to
clone, which is still on the 0.x `autogen` API and cannot import.

## 2 · Architecture

```
docs.ag2.ai page  ──►  backend/*.py  ──AG-UI/SSE──►  OpenAI
                              ▲
                              │  POST /chat
                    frontend/src/app/api/copilotkit/route.ts   (HttpAgent)
                              │
                    Next.js frontend  ──►  CopilotChat + useCopilotAction
```

Backend: Python 3.10+, FastAPI, `ag2[ag-ui,openai]`.
Frontend: Next.js App Router, CopilotKit **v1** (`@copilotkit/react-ui`), which
is what the Quickstart publishes.

## 3 · Three backends, three provenances

This is the most important thing to understand before touching anything here.

| File | Source | Runs? |
|---|---|---|
| `backend/run_ag_ui.py` | The index page's own sample, **verbatim** | ✅ |
| `backend/starter-backend.py` | The linked starter, vendored as **evidence** | ❌ **by design** |
| `backend/weather_backend.py` | **Harness**: the starter ported to AG2 1.0 | ✅ |

`starter-backend.py` must stay byte-identical to upstream — a `git diff` against
it *is* the finding. `weather_backend.py` exists because the page's published
frontend registers a render-only action for a `get_weather` tool that no page
defines, so without it there is nothing to record.

See [`backend/README.md`](backend/README.md) for the full argument.

## 4 · Prerequisites

| Thing | Version | Why |
|---|---|---|
| Python | ≥ 3.10 | `ag2` 1.0.4's own minimum |
| `uv` (or pip) | any recent | |
| Node.js | ≥ 18.18 | the page's own prerequisite |
| `OPENAI_API_KEY` | — | the Quickstart's step 1 |

## 5 · Setup

```bash
cp .env.example .env          # fill in OPENAI_API_KEY
cd backend  && uv sync && cd ..
cd frontend && npm install && cd ..
cd autorecorder && npm install && npx playwright install chromium && cd ..
```

**Ports.** Backend **8008** is the doc's own and must not move — the published
`route.ts` hardcodes `http://localhost:8008/chat`. Frontend **3301** is ours,
because eleven sibling repos in this workspace default to 3000.

## 6 · Running it

Two terminals:

```bash
npm run agent     # backend/weather_backend.py  → http://127.0.0.1:8008
npm run dev       # frontend                    → http://localhost:3301
```

A healthy backend prints:

```
INFO:     Uvicorn running on http://127.0.0.1:8008 (Press CTRL+C to quit)
```

Then open <http://localhost:3301>.

## 7 · What to expect

| Route | Doc section | Try | Pass | Fail |
|---|---|---|---|---|
| `/` | — | — | A map of the four pages | — |
| `/quickstart/demo-chat` | CopilotKit Quickstart | `What's the weather in Amsterdam?` | A blue **weather card** renders inline, with temperature, humidity and wind | Prose only, no card — the agent never called `get_weather`, or the action name drifted |

The card is the whole test. The page's `useCopilotAction` is declared
`available: "disabled"` — render-only, with the tool owned by the backend — so a
streamed reply proves nothing on its own. `actions/weather-card.action.ts`
checks the DOM and reports which happened.

To see the finding rather than the demo:

```bash
cd backend && uv pip install -r starter-requirements.txt && python starter-backend.py
# ModuleNotFoundError: No module named 'autogen'
```

## 8 · Status

| Doc page | Route | Status | Notes |
|---|---|---|---|
| `/` (AG-UI) | `/quickstart/demo-chat` | ✅ Working | Every published name verified against `ag2` 1.0.4 |
| `/copilotkit-quickstart` | `/quickstart/demo-chat` | ⚠️ Partial | Page correct; linked starter broken (finding 1); `get_weather` unpublished (finding 2) |
| `/backend-deepdive` | `/quickstart/demo-chat` | ✅ Working | Event mapping and state snapshots |
| `/channels` | `/quickstart/demo-chat` | 🚧 Not run | Needs `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN` and a workspace |

## 9 · Known issues

Both in [`doc-snapshot/reports/FINDINGS.md`](doc-snapshot/reports/FINDINGS.md):

1. **The linked reference starter does not import under `ag2` 1.0.4.** It uses
   the 0.x `autogen` namespace; its `requirements.txt` is unpinned and resolves
   to 1.0.4, which ships no `autogen` package.
2. **The published frontend depends on a `get_weather` tool no page defines.**
   The `WeatherCard` destructures seven fields whose only definition lives in
   the starter repo from finding 1.

## 10 · Recording

```bash
npm run record:doctor            # config, files, line ranges, handlers
npm run record:doctor:online     # also every doc URL and the selectors
npm run record -- --copilotkit-quickstart
npm run record                   # all four
```

Each clip is: the doc page scrolled at reading pace → VS Code showing the exact
lines → the live app answering. **No Notepad** — the pages work, and a note on a
passing page trains people to ignore notes. The Quickstart clip's IDE segment
ends on `starter-backend.py`'s two import lines, which is where the finding is.

Clips land in `autorecorder/videos/` as `AG2-ext-<NN>-<Name>.webm`. That folder
is gitignored: recordings are build output, and committing them took one sibling
repo's `.git` to 348 MB before its history had to be rewritten.

## 11 · Drift

```bash
npm run drift          # live pages vs doc-snapshot/, by sha256
npm run drift:sync     # accept upstream and update the snapshot
```

Re-check finding 1 whenever the starter repo changes:

```bash
curl -s https://raw.githubusercontent.com/ag2ai/ag2-copilotkit-starter/main/agent-py/backend.py \
  | diff - backend/starter-backend.py && echo "starter unchanged — finding still stands"
```

## 12 · References

- [AG-UI](https://docs.ag2.ai/docs/user-guide/ag-ui/)
- [CopilotKit UI Quickstart](https://docs.ag2.ai/docs/user-guide/ag-ui/copilotkit-quickstart)
- [Backend deep dive](https://docs.ag2.ai/docs/user-guide/ag-ui/backend-deepdive)
- [Channels](https://docs.ag2.ai/docs/user-guide/ag-ui/channels)
- [ag2-copilotkit-starter](https://github.com/ag2ai/ag2-copilotkit-starter) — the subject of finding 1
