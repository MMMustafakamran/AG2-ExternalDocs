/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ADAPT THIS FILE — 1 of 4
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Who this project is: which documentation it tests, where those docs live, and
 * how its two services are reached and started.
 *
 * ── What is different about this copy ──────────────────────────────────────
 * The eleven repos in the parent folder test CopilotKit's own docs at
 * `docs.copilotkit.ai/<framework>`. This one tests **AG2's own** documentation
 * at docs.ag2.ai. So `docBaseUrl` is written out in full rather than composed
 * from a CopilotKit slug, and `framework` is just an identifier.
 */

/** Sentinel for values an adaptation must supply. Doctor fails while any remain. */
export const REPLACE_ME = 'REPLACE_ME' as const;

export interface ProjectConfig {
  /** Doc identifier. Not a docs.copilotkit.ai slug here — see the header. */
  framework: string;

  /** Human name for logs and the README. */
  frameworkLabel: string;

  /**
   * Filename prefix for exported videos:
   * `<videoPrefix>-<NN>-<videoName>.webm`.
   *
   * `-ext` separates these from the sibling `AG2-react` repo, which tests the
   * same integration through *CopilotKit's* docs and writes `AG2-react-*`.
   */
  videoPrefix: string;

  /** Doc root this repo tracks. Every page's docPath is appended to it. */
  docBaseUrl: string;

  /** Where the app runs. Every page's route is appended to it. */
  frontendUrl: string;

  /** Where the agent runs. Used only for the pre-flight health check. */
  backendUrl: string;

  /** Health path on the backend. The check falls back to `/docs` then `/`. */
  backendHealthPath: string;

  /** Printed verbatim when the pre-flight check fails, so the fix is copy-pasteable. */
  frontendStartCmd: string;
  backendStartCmd: string;

  /** Appended to each page's route to reach the chrome-free demo. */
  demoSuffix: string;

  /** Project-wide overrides of the recorder's fixed waits. */
  timeouts?: Partial<import('../core/types').RecorderTimeouts>;
}

export const PROJECT: ProjectConfig = {
  framework: 'ag2-ag-ui',
  frameworkLabel: 'AG2 — AG-UI (external docs)',
  videoPrefix: 'AG2-ext',

  docBaseUrl: 'https://docs.ag2.ai/docs/user-guide/ag-ui',

  // 3301, not 3000. Eleven sibling repos in this workspace default to 3000 and
  // a collision means the recorder films whichever app answered — which looks
  // like a pass while proving nothing. The external-docs repos take 3301-3303.
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3301',

  // 8008 is the Quickstart's own port: "The starter backend mounts the AG-UI
  // endpoint at /chat and runs on port 8008." Kept because the published
  // `route.ts` hardcodes `http://localhost:8008/chat`, and changing it would
  // mean editing a doc snippet.
  backendUrl: process.env.BACKEND_URL || 'http://127.0.0.1:8008',

  // No page adds a health route. FastAPI serves `/docs`, which is what the
  // pre-flight falls back to anyway; naming it here skips a wasted probe.
  backendHealthPath: '/docs',

  frontendStartCmd: 'cd frontend && npm run dev',
  backendStartCmd: 'cd backend && uv run python weather_backend.py',

  demoSuffix: '/demo-chat',
};

/** Absolute doc URL for a page's `docPath`. */
export function docUrlFor(docPath: string): string {
  const base = PROJECT.docBaseUrl.replace(/\/$/, '');
  const path = docPath.replace(/^\//, '');
  return path ? `${base}/${path}` : base;
}

/** Absolute demo URL for a page's `route`. */
export function demoUrlFor(route: string): string {
  return `${PROJECT.frontendUrl.replace(/\/$/, '')}/${route.replace(/^\//, '')}${PROJECT.demoSuffix}`;
}
