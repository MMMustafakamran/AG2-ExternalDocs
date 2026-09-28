import { type Page } from 'playwright';
import { humanGlide, sleep } from '../core/overlays/cursor';
import { type PageActionHandler, type PageRecordConfig } from '../core/types';
import { sendPrompt, waitForAgentResponseCompletion } from '../core/actions';

/**
 * The CopilotKit Quickstart's `WeatherCard`, rendered from a `get_weather` tool
 * call.
 *
 * Why this needs a handler at all: the page's `useCopilotAction` is declared
 * `available: "disabled"`, which makes it **render-only** — the agent is never
 * offered it as a tool, it only supplies the UI for a tool the *backend* owns.
 * So there are two independent ways for this to half-work, and both look like a
 * pass to `runStandardAction`:
 *
 *   1. The agent answers in prose without calling `get_weather` at all. The
 *      reply streams, the clip looks fine, and no card is ever rendered.
 *   2. The agent calls it, but the action name does not match, so CopilotKit
 *      has no renderer registered and falls back to showing nothing.
 *
 * Both produce a good-looking reply and no card. The check below reads the DOM
 * for the card itself, so the summary says which happened.
 *
 * It warns rather than fails: a model that decides not to call a tool is a model
 * problem, not a documentation defect, and the clip is still worth having. The
 * page's own "Troubleshooting" section calls out exactly this ("Tool UI not
 * rendering: ensure tool/action names match exactly").
 */

/**
 * Text the card always paints, whatever the weather is.
 *
 * Matched case-INSENSITIVELY, and that is not defensive coding — it is
 * required. The published `WeatherCard` styles these labels with Tailwind's
 * `uppercase`, and `innerText` returns text as *rendered*, so the DOM says
 * "Current Weather" while `innerText` says "CURRENT WEATHER". A case-sensitive
 * check reported "no card rendered" on three runs where the card was plainly
 * on screen in the video — which is precisely the false finding this suite
 * exists to avoid.
 */
const CARD_MARKERS = ['Current Weather', 'Fetching weather', 'Humidity', 'Feels Like'];

export const runWeatherCardAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
  _rootPath,
  ctx,
) => {
  console.log(`   [WeatherCard] Prompting: "${config.prompt}"`);
  const msgCount = await sendPrompt(page, config.prompt, { timeoutMs: 12_000 });
  await finishWeatherCard(page, config, ctx, msgCount);
};

/**
 * Everything after the prompt is sent: rest on the card, wait for the reply,
 * then say whether the card mounted. Shared with the dropped-first-message
 * handler, which sends its own prompts.
 */
export async function finishWeatherCard(
  page: Page,
  config: PageRecordConfig,
  ctx: Parameters<PageActionHandler>[3],
  msgCount: number,
): Promise<void> {
  // The card mounts in its loading state as soon as the tool call starts, so it
  // is usually on screen well before the reply finishes. Resting the cursor on
  // it while it is still pulsing is the shot worth having.
  //
  // `text=A, text=B` is NOT an OR — the comma is part of the `text=` argument,
  // so it searches for the literal string "Current Weather, text=Fetching
  // weather...". Playwright's OR is `,` between *CSS* selectors or the
  // `:has-text()` pseudo-class. Use the latter, since these are text matches.
  const card = page
    .locator('div:has-text("Current Weather"), div:has-text("Fetching weather")')
    .last();
  await card.waitFor({ state: 'visible', timeout: 25_000 }).catch(() => {});
  await sleep(1200);

  if (await card.isVisible({ timeout: 4000 }).catch(() => false)) {
    const box = await card.boundingBox();
    if (box) {
      console.log(`   🎯 Weather card at (${Math.round(box.x)}, ${Math.round(box.y)})`);
      await humanGlide(page, box.x + Math.min(box.width / 2, 220), box.y + box.height / 2, 22);
      await sleep(2500);
    }
  }

  await waitForAgentResponseCompletion(page, config.waitAfterPromptMs ?? 6000, msgCount);

  // Did the card mount, or did the agent just talk about the weather?
  const body = (await page.locator('body').innerText().catch(() => '')).toLowerCase();
  const seen = CARD_MARKERS.filter((m) => body.includes(m.toLowerCase()));

  if (seen.length >= 2) {
    console.log(`   ✅ [WeatherCard] Rendered — matched ${seen.join(', ')}.`);
  } else if (seen.length === 1) {
    ctx.warn(
      `[WeatherCard] Only "${seen[0]}" appeared. The card mounted but did not reach its ` +
        `complete state — the tool call probably never returned a result.`,
    );
  } else {
    // Quote what the agent actually said. "No card rendered" on its own cannot
    // distinguish "the model answered from memory and never called the tool"
    // from "the tool ran and the renderer did not mount" — and those are a
    // model problem and a documentation problem respectively.
    const reply = await page
      .locator('.copilotKitAssistantMessage')
      .last()
      .innerText()
      .catch(() => '');
    const soundsLikeWeather = /\d+(\.\d+)?\s*°|humidity|wind/i.test(reply);

    ctx.warn(
      `[WeatherCard] No weather card rendered; nothing matched ${CARD_MARKERS.join(' / ')}. ` +
        (soundsLikeWeather
          ? `But the reply carries real weather data ("${reply.slice(0, 90).replace(/\n/g, ' ')}…"), ` +
            `so get_weather DID run and the useCopilotAction renderer did not mount — check that ` +
            `the action name matches the backend tool, which the page's own Troubleshooting ` +
            `section names as the likely cause.`
          : `The reply has no weather figures in it either ("${reply.slice(0, 90).replace(/\n/g, ' ')}…"), ` +
            `so the agent probably answered in prose without calling get_weather at all — a model ` +
            `choice, not a documentation defect.`),
    );
  }
}
