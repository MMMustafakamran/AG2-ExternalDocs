# backend/ — what each file is, and where it came from

Three files, three different provenances. Keeping them apart is the point: a
finding is only worth filing if it names exactly which artefact is wrong.

| File | Source | Runs? |
|---|---|---|
| `run_ag_ui.py` | **Published on the doc page**, verbatim | ✅ yes |
| `starter-backend.py` | **The repo the doc links to**, verbatim | ❌ **no** — see below |
| `starter-requirements.txt` | Same repo, verbatim | — |

## `run_ag_ui.py` — the page's own sample

Pasted from the "Basic server example" block of
<https://docs.ag2.ai/docs/user-guide/ag-ui/>. Every name in it resolves against
`ag2` 1.0.4:

- `ag2.Agent` — exported from `ag2/__init__.py`
- `ag2.ag_ui.AGUIStream`, `ag2.ag_ui.RunAgentInput` — both in `__all__`
- `ag2.config.OpenAIConfig` — exported, behind the `openai` extra

Run it exactly as the page says:

```bash
uvicorn run_ag_ui:app --reload --port 8000
```

## `starter-backend.py` — the linked reference, which does not run

The **CopilotKit Quickstart** page offers two paths. Its second tab, "Clone the
reference starter", calls `ag2ai/ag2-copilotkit-starter` a *"Runnable reference
implementation"* and its step 1 is:

```sh
cd agent-py
pip install -r requirements.txt
export OPENAI_API_KEY="your_openai_api_key"
python backend.py
```

That sequence fails at import. The file vendored here — unmodified, fetched
2026-09-07 — begins:

```python
from autogen import ConversableAgent, LLMConfig
from autogen.ag_ui import AGUIStream
```

and `requirements.txt` declares `ag2[openai,ag-ui]` with **no version bound**,
so it resolves to the current release, `ag2` 1.0.4. That wheel ships one
top-level package:

```
top-level packages: ['ag2']
autogen/ag_ui present: False
ag2/ag_ui present: True
```

and none of its 35 declared dependencies provides `autogen`. So `python
backend.py` raises `ModuleNotFoundError: No module named 'autogen'`.

The API is a generation behind too — `ConversableAgent` / `LLMConfig` /
`system_message=` / `functions=`, against the doc page's `Agent` /
`OpenAIConfig` / `prompt=` / tool config. The starter was written for AG2 0.x
and the docs moved to 1.0 without it.

This is the AG2 finding. Full write-up in
[`../doc-snapshot/reports/FINDINGS.md`](../doc-snapshot/reports/FINDINGS.md).

**Do not fix this file.** It is vendored as evidence, and a `git diff` against
the upstream starter should stay empty.
