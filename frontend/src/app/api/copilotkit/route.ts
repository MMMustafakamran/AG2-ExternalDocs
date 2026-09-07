// ─────────────────────────────────────────────────────────────────────────────
// VERBATIM from https://docs.ag2.ai/docs/user-guide/ag-ui/copilotkit-quickstart
// Snapshot: doc-snapshot/pages/copilotkit-quickstart.md
// Section: "3) Connect CopilotKit runtime to the AG-UI endpoint"
// Published path on the page: ui-react/app/api/copilotkit/route.ts
//
// The one thing worth knowing before reading it: `http://localhost:8008/chat` is
// hardcoded on the page, and it is the port + path the Quickstart's step 1 says
// the starter backend uses. `backend/weather_backend.py` in this repo serves
// exactly that, so this file needs no edit to work here.
//
// Do not "fix" this file. A snippet that fails as published IS the finding.
// ─────────────────────────────────────────────────────────────────────────────

import { HttpAgent } from "@ag-ui/client";
import {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { NextRequest } from "next/server";

const agent = new HttpAgent({ url: "http://localhost:8008/chat" });

const runtime = new CopilotRuntime({
  agents: {
    weather_agent: agent,
  },
});

export async function POST(req: NextRequest) {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter: new ExperimentalEmptyAdapter(),
    endpoint: "/api/copilotkit",
  });
  return handleRequest(req);
}
