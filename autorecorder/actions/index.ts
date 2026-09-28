/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ADAPT THIS DIRECTORY
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * What the recorder *does* on each demo page once it is open.
 *
 * A page with no entry falls back to `runStandardAction` — type the prompt,
 * submit, wait for the reply. Write a handler only when a page needs more, or
 * when "the agent replied" is not the same thing as "the feature worked".
 *
 * All four pages here share one demo route, because only one page of AG2's
 * AG-UI section renders a UI. They differ in what they put in the IDE segment
 * and what they ask, not in how they drive the chat — so three of them use the
 * standard action and the Quickstart uses the one below.
 *
 * The sixteen handlers this folder shipped with were written against
 * CopilotKit's own doc pages, none of which exist here. Deleted rather than
 * left orphaned: the doctor's orphan warning is only useful when it is quiet
 * by default.
 *
 * `ctx` is how a handler reports what it saw:
 *
 *   ctx.warn('No weather card rendered')   -> [PASS*] with the note
 *   ctx.fail('Chat never mounted')          -> [FAIL], clip still saved
 *
 * A `console.log` reaches nobody: the summary and the CI report only see what
 * goes through `ctx`.
 */

import { type ActionContext, type PageActionHandler, type PageRecordConfig } from '../core/types';
import { runStandardAction } from '../core/actions';
import { type Page } from 'playwright';

import { runDroppedFirstMessageAction } from './dropped-first-message.action';
import { runWeatherCardAction } from './weather-card.action';

/** Keys are page ids from `config/pages.config.ts`. Doctor flags any orphans. */
export const ACTION_MAP: Record<string, PageActionHandler> = {
  // The only page that renders generative UI, and the only one where a
  // streamed reply is not sufficient evidence. Also where the first message
  // after a cold `next dev` can be silently dropped -- filmed as a finding
  // when it happens, an ordinary card check when it does not.
  'copilotkit-quickstart': runDroppedFirstMessageAction,

  // `backend-deepdive` is about the events behind that same card, so it gets
  // the same check rather than a prose-only one.
  'backend-deepdive': runWeatherCardAction,
};

export async function executePageAction(
  page: Page,
  config: PageRecordConfig,
  rootPath: string,
  ctx: ActionContext,
): Promise<void> {
  const handler = ACTION_MAP[config.id] ?? runStandardAction;
  await handler(page, config, rootPath, ctx);
}
