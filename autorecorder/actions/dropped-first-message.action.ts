import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { type Page } from 'playwright';
import { getAssistantMessageCount, sendPrompt } from '../core/actions';
import { humanGlide, idleNudge, sleep } from '../core/overlays/cursor';
import { closeNotepad, openNotepad, typeInNotepad } from '../core/overlays/notepad';
import { type PageActionHandler, type PageRecordConfig } from '../core/types';
import { finishWeatherCard } from './weather-card.action';

/**
 * The CopilotKit Quickstart, filmed as a finding when its first message is lost.
 *
 * What this page hits (found 2026-09-28): on a freshly started `next dev`, the
 * first message sent while `/api/copilotkit` is still compiling is silently
 * dropped. The browser only ever sends `info` and `agent/connect` for it -- never
 * `agent/run` -- so the AG2 backend is never called, and nothing errors. The
 * next message works. Seen on @copilotkit/* 1.70.1 and 1.74.0 alike, about
 * half of cold starts locally and on the first page of every CI shard.
 *
 * The take does what a person does: asks, waits, looks at the empty chat, asks
 * again. When the first question is answered after all, this is an ordinary
 * pass -- the Quickstart card check, no Notepad -- because a note on a passing
 * page trains people to ignore notes. When it is not, the second question
 * proves the code works, and Notepad records the evidence gathered during the
 * take itself: which runtime calls the browser made per question, how many
 * requests reached the backend, and the versions installed.
 */

/** How long a person waits in silence before asking again. */
const FIRST_REPLY_WAIT_MS = 28_000;

/** Installed version of an npm package in the frontend, or "?". */
function npmVersion(rootPath: string, pkg: string): string {
  try {
    const p = join(rootPath, 'frontend', 'node_modules', ...pkg.split('/'), 'package.json');
    return JSON.parse(readFileSync(p, 'utf8')).version;
  } catch {
    return '?';
  }
}

/** Installed ag2, read from the backend venv's dist-info, or "?". */
function ag2Version(rootPath: string): string {
  const roots = [join(rootPath, 'backend', '.venv', 'lib'), join(rootPath, 'backend', '.venv', 'Lib')];
  for (const lib of roots) {
    if (!existsSync(lib)) continue;
    const dirs = [lib, ...readdirSync(lib).map((d) => join(lib, d))];
    for (const d of dirs) {
      const sp = existsSync(join(d, 'site-packages')) ? join(d, 'site-packages') : d;
      if (!existsSync(sp)) continue;
      const hit = readdirSync(sp).find((f) => /^ag2-[\d.]+\.dist-info$/.test(f));
      if (hit) return hit.replace(/^ag2-|\.dist-info$/g, '');
    }
  }
  return '?';
}

/** Requests the backend has logged to /chat so far, or undefined without a log. */
function backendChatCount(rootPath: string): number | undefined {
  const log = join(rootPath, 'autorecorder', 'videos', 'logs', 'backend.log');
  if (!existsSync(log)) return undefined;
  return (readFileSync(log, 'utf8').match(/"POST \/chat\/? HTTP/g) ?? []).length;
}

/** Waits for a new assistant message with text, without throwing. */
async function replyStarted(page: Page, baseCount: number, timeoutMs: number, idle: boolean): Promise<boolean> {
  const sel = '.copilotKitAssistantMessage';
  const start = Date.now();
  let nudged = 0;
  while (Date.now() - start < timeoutMs) {
    const started = await page
      .evaluate(({ sel, base }) => {
        const msgs = document.querySelectorAll(sel);
        if (msgs.length <= base) return false;
        return (msgs[msgs.length - 1].textContent || '').trim().length > 2;
      }, { sel, base: baseCount })
      .catch(() => false);
    if (started) return true;
    // A person waiting does not freeze: small drifts, an occasional look up at
    // the message list. Never a click -- nothing here may change the page.
    if (idle && Date.now() - start > 6000 * (nudged + 1)) {
      nudged++;
      if (nudged === 2) {
        const list = await page.locator('.copilotKitMessages').first().boundingBox().catch(() => null);
        if (list) await humanGlide(page, list.x + list.width * 0.55, list.y + list.height * 0.45, 20);
      } else {
        await idleNudge(page);
      }
    }
    await sleep(500);
  }
  return false;
}

export const runDroppedFirstMessageAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
  rootPath,
  ctx,
) => {
  // Every runtime call the browser makes, tagged with which question it
  // followed. This is the proof: a question that was run has `agent/run`.
  let phase = 0;
  const calls: string[][] = [[], [], []];
  page.on('request', (r) => {
    if (!r.url().includes('/api/copilotkit') || r.method() !== 'POST') return;
    let method = '?';
    try {
      method = JSON.parse(r.postData() || '{}').method ?? '(graphql)';
    } catch {
      /* not JSON */
    }
    calls[phase].push(method);
  });

  const chatBefore = backendChatCount(rootPath);

  console.log(`   [DroppedFirst] Asking: "${config.prompt}"`);
  phase = 1;
  const base1 = await sendPrompt(page, config.prompt, { timeoutMs: 12_000 });
  const firstAnswered = await replyStarted(page, base1, FIRST_REPLY_WAIT_MS, true);
  const chatAfterFirst = backendChatCount(rootPath);

  if (firstAnswered) {
    console.log('   [DroppedFirst] First question answered; not reproduced this take.');
    phase = 0;
    await finishWeatherCard(page, config, ctx, base1);
    return;
  }

  // Silence. Ask again, the way anyone would.
  console.log('   [DroppedFirst] No reply to the first question. Asking again.');
  await sleep(1200);
  phase = 2;
  const base2 = await getAssistantMessageCount(page, '.copilotKitAssistantMessage');
  await sendPrompt(page, config.prompt, { timeoutMs: 12_000 });
  const secondAnswered = await replyStarted(page, base2, 45_000, false);
  if (secondAnswered) {
    await finishWeatherCard(page, config, ctx, base2);
  }
  const chatAfterSecond = backendChatCount(rootPath);

  const summarise = (list: string[]) => {
    const counts = new Map<string, number>();
    for (const m of list) counts.set(m, (counts.get(m) ?? 0) + 1);
    const text = [...counts].map(([m, n]) => (n > 1 ? `${m} x${n}` : m)).join(', ');
    return text || '(none)';
  };
  const reached = (before?: number, after?: number) =>
    before === undefined || after === undefined ? 'backend log not available' : `backend got ${after - before} request(s)`;

  const ck = npmVersion(rootPath, '@copilotkit/react-core');
  const rt = npmVersion(rootPath, '@copilotkit/runtime');
  const agui = npmVersion(rootPath, '@ag-ui/client');
  const next = npmVersion(rootPath, 'next');
  const ag2 = ag2Version(rootPath);

  const note = [
    'AG2 CopilotKit Quickstart - first message silently dropped',
    '',
    'What I did: started the app (npm run dev), opened the chat',
    `and asked "${config.prompt}" right away.`,
    '',
    'What happened: nothing. No reply and no error anywhere.',
    `I asked again${secondAnswered ? ' and that time it answered and drew the card.' : ' and got nothing either.'}`,
    '',
    'Proof - what the browser sent to /api/copilotkit:',
    `  1st ask: ${summarise(calls[1])}`,
    `           no agent/run -> ${reached(chatBefore, chatAfterFirst)}`,
    `  2nd ask: ${summarise(calls[2])}`,
    `           ${reached(chatAfterFirst, chatAfterSecond)}`,
    '',
    `Installed: @copilotkit/react-core ${ck}, runtime ${rt},`,
    `@ag-ui/client ${agui}, next ${next}, ag2 ${ag2}`,
    '',
    'Only the first message after a cold start is lost, while the',
    'API route is still compiling. Also seen on CopilotKit 1.70.1,',
    'so it is not new in 1.74. The page code is fine as published.',
  ].join('\n');

  // Rest on the chat for a beat, then open Notepad and write it down.
  await sleep(2500);
  await openNotepad(page, 'ag2-quickstart-first-message-lost.txt');
  await typeInNotepad(page, note);
  await closeNotepad(page, 7000);

  ctx.fail(
    `First question never reached the agent: the browser sent ${summarise(calls[1])} and no agent/run ` +
      `(${reached(chatBefore, chatAfterFirst)}). ` +
      (secondAnswered ? 'Asking again worked.' : 'Asking again did not work either.') +
      ` Installed: @copilotkit/react-core ${ck}, runtime ${rt}, ag2 ${ag2}.`,
  );
};
