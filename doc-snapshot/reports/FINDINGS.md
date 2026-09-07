# QA findings — AG2, AG-UI section (external docs)

**Doc root** <https://docs.ag2.ai/docs/user-guide/ag-ui/>
**Snapshot taken** 2026-09-07 · 4 pages · `doc-snapshot/pages/`
**Assignment said** ✅ Fully Working
**This run says** ⚠️ **The four pages are accurate. The runnable starter one of them links to is broken in two independent ways.**
**Recordings** 4 clips, `autorecorder/videos/AG2-ext-*.webm` — recorded 2026-09-07 against `ag2` 1.0.4

## Versions pinned

| Package | Docs declare | Resolved 2026-09-07 | Note |
|---|---|---|---|
| `ag2` | `pip install "ag2[ag-ui,openai]"` (unpinned) | **1.0.4** | `ag-ui` extra exists |
| `@copilotkit/react-core` / `react-ui` / `runtime` | unpinned in the page | 1.70.1 | v1 surface, matching the page |
| `@ag-ui/client` | unpinned in the page | 0.0.59 | `HttpAgent` |

---

## Summary

| # | Page | Verdict |
|---|---|---|
| 1 | [CopilotKit Quickstart](#1--the-linked-reference-starter-does-not-import-under-ag2-104) | ❌ **Issue** — the linked starter is broken |
| 2 | [CopilotKit Quickstart](#2--the-page-publishes-a-frontend-whose-backend-tool-is-not-published-anywhere) | 💡 Suggestion |
| — | AG-UI (index) | ✅ Working — every published name verified |
| — | Backend deep dive | ✅ Working |
| — | Channels | ✅ Accurate, not runnable here (needs Slack credentials) |

---

## 0 · What was verified as correct

Worth stating first, because the finding below is about a linked repository
rather than about the pages, and the distinction matters when it is filed.

Every identifier the AG-UI index page publishes resolves against `ag2` 1.0.4.
Checked by unpacking the wheel and reading `__all__`, not by assuming:

| Published | Where it actually is |
|---|---|
| `from ag2 import Agent` | `ag2/__init__.py` — `Agent` is in `__all__` |
| `from ag2.ag_ui import AGUIStream` | `ag2/ag_ui/__init__.py` — in `__all__` |
| `from ag2.ag_ui import RunAgentInput` | re-exported from `ag_ui.core`, behind the `ag-ui` extra |
| `from ag2.config import OpenAIConfig` | `ag2/config/__init__.py` — in `__all__`, behind the `openai` extra |
| `AGUIStream(agent)` | `stream.py:73` — `def __init__(self, agent: Agent)` |
| `stream.dispatch(...)` | `stream.py:83` |
| `stream.build_asgi()` | `stream.py:76` |
| `pip install "ag2[ag-ui,openai]"` | both extras are declared on the 1.0.4 wheel |

The `ag-ui` extra also raises a helpful error when it is missing
(`"ag-ui-protocol is not installed. Please install it with: pip install
ag2[ag-ui]"`), which is more than most integration packages do.

The index page's token-usage section is unusually careful — it states that an
unreported count is *absent rather than `0`*, that `totalTokens` is never
derived, and that cache writes are not reported at all. Those are exactly the
three things a client author gets wrong, and documenting them is a point in the
page's favour.

---

## 1 · The linked reference starter does not import under `ag2` 1.0.4

**Page** `copilotkit-quickstart`, tab 2, "Clone the reference starter"
**Artefact** <https://github.com/ag2ai/ag2-copilotkit-starter>, `agent-py/`
**Vendored here as** `backend/starter-backend.py`, `backend/starter-requirements.txt`

The page calls that repo a *"Runnable reference implementation"* and gives this
as step 1:

```sh
cd agent-py
pip install -r requirements.txt
export OPENAI_API_KEY="your_openai_api_key"
python backend.py
```

That sequence fails at import.

### The evidence

`agent-py/requirements.txt`, in full:

```
ag2[openai,ag-ui]
python-dotenv
httpx
uvicorn
fastapi
```

No version bound, so `pip` resolves the current release: **`ag2` 1.0.4**.

`agent-py/backend.py` lines 11–12:

```python
from autogen import ConversableAgent, LLMConfig
from autogen.ag_ui import AGUIStream
```

The `ag2` 1.0.4 wheel:

```
top-level packages: ['ag2']
autogen/ag_ui present: False
ag2/ag_ui present: True
autogen in declared dependencies: NONE   (of 35)
```

So nothing in the documented install provides `autogen`, and `python backend.py`
raises `ModuleNotFoundError: No module named 'autogen'`.

### It is a generation of API behind, not just a renamed import

Renaming the imports would not be enough — the starter is written against AG2
0.x throughout:

| Starter (`agent-py/backend.py`) | The doc page's own AG-UI sample |
|---|---|
| `ConversableAgent(...)` | `Agent(...)` |
| `system_message=` | `prompt=` |
| `llm_config=LLMConfig({"model": ..., "stream": True})` | `config=OpenAIConfig(model=...)` |
| `functions=[get_weather]` | tools passed as `tools=` |
| `from autogen.ag_ui import AGUIStream` | `from ag2.ag_ui import AGUIStream` |

The docs moved to the 1.0 API and the starter did not follow. `backend/weather_backend.py`
in this repo is that port, done line by line, and its header lists every change —
it is the size of the gap, made concrete.

### And it is broken a second time, after the imports

**Executed 2026-09-07, not inferred.** Fixing the two `autogen` imports is not
enough. The starter annotates its tool parameter the AG2 0.x way:

```python
async def get_weather(
    location: Annotated[str, "City name to get weather for"],
) -> dict[str, str | float]:
```

Under `ag2` 1.0.4 that raises before the agent is built:

```
SyntaxError: Forward reference must be an expression
  -- got 'City name to get weather for'
```

ag2 1.0 routes tool signatures through `fast_depends`, which treats a bare
string inside `Annotated` as a forward reference and tries to compile it. The
1.0 form is a pydantic `Field`:

```python
    location: Annotated[str, Field(description="City name to get weather for")],   # accepted
```

Both were run side by side in the installed environment; the first raises, the
second is accepted. So a reader who works out the `autogen` → `ag2` rename hits
a second, less guessable failure immediately afterwards — and its message names
neither the tool nor the annotation.

`backend/weather_backend.py` in this repo is the starter with both fixes
applied, and its header lists every line that had to change.

### Why this matters more than a stale link usually would

The Quickstart's other tab is `npx copilotkit@latest create -f ag2`, which
scaffolds something else entirely. So a reader who picks the tab the page itself
labels "reference" — the one you pick when you want to see how it really works —
hits an import error on the first command, with nothing on the page to suggest
the starter and the docs are on different major versions.

### Ask

Update `ag2ai/ag2-copilotkit-starter` to the 1.0 API — the imports **and** the
`Annotated` form — and pin `ag2>=1.0` in its `requirements.txt` so the next
divergence fails loudly at install rather than quietly at import. Until then,
note the version skew on the Quickstart page.

A shorter fix for the docs alone: the AG-UI pages publish no tool example at
all, so there is nowhere on docs.ag2.ai that shows the 1.0 annotation form. Ten
lines on the Backend deep dive page would give readers something correct to copy
instead of the starter.

---

## 2 · The page publishes a frontend whose backend tool is not published anywhere

**Suggestion.** Section "5) Render a chat UI" publishes ~110 lines of React: a
`WeatherCard` component and a `useCopilotAction` registration for a tool named
`get_weather`, declared `available: "disabled"` — meaning render-only, with the
tool itself owned by the backend.

The card destructures seven fields:

```
location · temperature · feelsLike · humidity · windSpeed · windGust · conditions
```

Nothing on any of the four pages defines a `get_weather` tool, and nothing
states that contract. The only place those field names exist is inside the
starter repo — the one that does not run (finding 1). So a reader who follows
the page's own frontend instructions has a component that can never render,
and no published description of what would make it render.

This is finding 3 of the working rules — ambiguity as a defect — rather than a
bug: the code is correct, the prerequisite is unstated.

### Ask

Either publish the ten-line `get_weather` tool beside the component, or state
the field contract the card expects. One short block on the Quickstart page
closes it.

---

## Pages that work as published

| Page | Recording | Notes |
|---|---|---|
| AG-UI (index) | `AG2-ext-01-AgUi.webm` | Every name verified against `ag2` 1.0.4 — see §0 |
| CopilotKit Quickstart | `AG2-ext-02-CopilotKitQuickstart.webm` | The page's own snippets work; the clip's IDE segment ends on the starter's two import lines |
| Backend deep dive | `AG2-ext-03-BackendDeepDive.webm` | |
| Channels | `AG2-ext-04-Channels.webm` | Doc-and-code only. Running it needs `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` and a workspace to install into |

## How to reproduce

Finding 1 needs no API key and no install:

```bash
pip download "ag2[ag-ui,openai]" --no-deps -d /tmp/ag2 && unzip -l /tmp/ag2/ag2-*.whl | grep -c '^.*autogen/'
# 0  -- there is no autogen package in the wheel

grep -n '^from autogen' backend/starter-backend.py
# 11:from autogen import ConversableAgent, LLMConfig
# 12:from autogen.ag_ui import AGUIStream
```

Finding 2 is a reading of `doc-snapshot/pages/copilotkit-quickstart.md`: search
it for `get_weather` and note that every hit is in the frontend block.
