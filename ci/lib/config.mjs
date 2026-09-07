/**
 * Shared paths, ports and URLs for the CI/CD pipeline.
 *
 * Everything under ci/ imports from here rather than rebuilding paths, so a
 * moved folder or a changed port is a one-line edit.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const ROOT_DIR = path.resolve(__dirname, '..', '..');
export const CI_DIR = path.join(ROOT_DIR, 'ci');
export const BACKEND_DIR = path.join(ROOT_DIR, 'backend');
export const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');
export const RECORDER_DIR = path.join(ROOT_DIR, 'autorecorder');
export const VIDEOS_DIR = path.join(RECORDER_DIR, 'videos');
export const AUDIO_DIR = path.join(RECORDER_DIR, 'audio');
export const LOGS_DIR = path.join(VIDEOS_DIR, 'logs');

export const isWindows = process.platform === 'win32';

/**
 * Prefix for CI artifact names. Matches the recorded video filenames
 * (`AG2-ext-02-CopilotKitQuickstart.webm`) so a downloaded folder and the clips
 * inside it read as the same thing.
 *
 * `-ext` separates these from the sibling `AG2-react` repo, which tests the
 * same integration through CopilotKit's docs and writes `AG2-react-*`.
 */
export const PROJECT_SLUG = 'AG2-ext';

/**
 * 8008 is the CopilotKit Quickstart's own port — "The starter backend mounts
 * the AG-UI endpoint at /chat and runs on port 8008" — and the published
 * `route.ts` hardcodes `http://localhost:8008/chat`. Keeping it means the doc
 * snippet needs no edit, which is rule 1.
 */
export const BACKEND_PORT = Number(process.env.AG2_PORT || 8008);

/**
 * 3301, not the doc's 3000. Eleven sibling repos in this workspace default to
 * 3000; a collision means the recorder films whichever app answered, which
 * looks like a pass while proving nothing. This is a harness choice, not a doc
 * deviation — `next dev --port` is not part of any published snippet.
 *
 * The external-docs repos take 3301 (ag2), 3302 (agno), 3303 (mastra).
 */
export const FRONTEND_PORT = Number(process.env.FRONTEND_PORT || 3301);

/**
 * The AG-UI endpoint is mounted at `/chat` and answers POST only, so it is not
 * a health check. FastAPI's `/docs` is the GET that proves the process is up.
 */
export const BACKEND_HEALTH_URL = `http://127.0.0.1:${BACKEND_PORT}/docs`;
export const FRONTEND_URL = `http://127.0.0.1:${FRONTEND_PORT}`;

/**
 * Routes compiled before recording starts. Next builds routes on demand, so the
 * first hit of each is slow enough to blow the recorder's preflight timeout.
 */
export const WARMUP_ROUTES = ['/', '/quickstart/demo-chat'];
