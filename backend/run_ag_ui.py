# ─────────────────────────────────────────────────────────────────────────────
# VERBATIM from https://docs.ag2.ai/docs/user-guide/ag-ui/
# Snapshot: doc-snapshot/pages/index.md
# Section: "Basic server example" — the manual-dispatch pattern.
#
# The page's own highlight markers (hl_lines="14 17-25") point at the AGUIStream
# construction and the dispatch handler. Those are the lines the recording puts
# on screen.
#
# Do not "fix" this file. A snippet that fails as published IS the finding.
# ─────────────────────────────────────────────────────────────────────────────

from fastapi import FastAPI, Header
from fastapi.responses import StreamingResponse

from ag2 import Agent
from ag2.ag_ui import AGUIStream, RunAgentInput
from ag2.config import OpenAIConfig

agent = Agent(
    name="support_bot",
    prompt="You help users with billing questions.",
    config=OpenAIConfig(model="gpt-5.6-luna"),
)

stream = AGUIStream(agent)
app = FastAPI()

@app.post("/chat")
async def run_agent(
    message: RunAgentInput,
    accept: str | None = Header(None),
) -> StreamingResponse:
    return StreamingResponse(
        stream.dispatch(message, accept=accept),
        media_type=accept or "text/event-stream",
    )
