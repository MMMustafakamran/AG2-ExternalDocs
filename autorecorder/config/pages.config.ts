/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ADAPT THIS FILE — 3 of 4
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * One entry per doc page, in the order the doc nav lists them.
 *
 * The AG-UI section of docs.ag2.ai has four pages:
 *
 *   AG-UI                    the protocol, AGUIStream, the manual-dispatch server
 *   CopilotKit Quickstart    the React client -- the only page with a UI
 *   Backend deep dive        event mapping, state snapshots, input-required
 *   Channels                 the same endpoint as a Slack bot
 *
 * Only one of them renders anything, so only one has a demo route. The other
 * three are recorded as doc-and-code clips: the page, then the file in this
 * repo that implements it. That is a deliberate choice rather than a gap —
 * inventing a chat surface for a page about server-side event mapping would
 * make the clip prove something the page never claimed.
 *
 * ── Line ranges ────────────────────────────────────────────────────────────
 * `startLine`/`endLine` are what the simulated IDE highlights, and they drift
 * the moment someone edits a file. `npm run doctor` names any range that no
 * longer points at real code.
 */

import { definePages, type PageDefinition } from '../core/types';

const PAGE_DEFS: PageDefinition[] = [
  {
    id: 'ag-ui',
    name: 'AG-UI — AGUIStream and the manual-dispatch server',
    videoName: 'AgUi',
    docPath: '',

    // No demo of its own: this page's subject is the server, and the server is
    // what every other clip in this repo is already talking to. The demo route
    // is the Quickstart's, so the clip ends on the endpoint actually answering.
    route: 'quickstart',

    ideFile: 'backend/run_ag_ui.py',
    // The page's own hl_lines are 14 and 17-25 of its snippet: the AGUIStream
    // construction and the dispatch handler. Offset by this file's 11-line
    // provenance banner.
    startLine: 13,
    endLine: 37,

    prompt: "What's the weather in Amsterdam?",
    waitAfterPromptMs: 9000,
  },
  {
    id: 'copilotkit-quickstart',
    name: 'CopilotKit Quickstart — the weather card rendered from a tool call',
    videoName: 'CopilotKitQuickstart',
    docPath: 'copilotkit-quickstart',
    route: 'quickstart',

    // The three files the page publishes, in the order it publishes them.
    ideFile: 'frontend/src/app/api/copilotkit/route.ts',
    startLine: 15,
    endLine: 37,
    extraTabs: [
      { filePath: 'frontend/src/app/layout.tsx', startLine: 11, endLine: 29 },
      // `useCopilotAction` with `available: "disabled"` -- render-only. This is
      // the part that turns a tool result into the card.
      { filePath: 'frontend/src/app/quickstart/demo-chat/page.tsx', startLine: 92, endLine: 126 },
      // The linked starter, which is the finding. Its two import lines are the
      // whole story, so the range is tight around them.
      { filePath: 'backend/starter-backend.py', startLine: 1, endLine: 20 },
    ],

    prompt: "What's the weather in Amsterdam?",
    waitAfterPromptMs: 12_000,
  },
  {
    id: 'backend-deepdive',
    name: 'Backend deep dive — event mapping and state snapshots',
    videoName: 'BackendDeepDive',
    docPath: 'backend-deepdive',
    route: 'quickstart',

    ideFile: 'backend/weather_backend.py',
    // The tool the agent calls, which is what produces the TOOL_CALL_* events
    // this page is about.
    startLine: 76,
    endLine: 112,

    prompt: 'What is the weather in Tokyo, and how does it feel?',
    waitAfterPromptMs: 12_000,
  },
  {
    id: 'channels',
    name: 'Channels — the same endpoint as a Slack bot',
    videoName: 'Channels',
    docPath: 'channels',
    route: 'quickstart',

    // Not implemented: Channels needs SLACK_BOT_TOKEN and SLACK_APP_TOKEN and a
    // Slack workspace to install into. The clip is the doc page plus the
    // endpoint it says can be reused -- which is the claim being checked.
    ideFile: 'backend/weather_backend.py',
    startLine: 125,
    endLine: 148,

    prompt: 'What is the weather in Reykjavik?',
    waitAfterPromptMs: 9000,
  },
];

export const PAGES = definePages(PAGE_DEFS);
