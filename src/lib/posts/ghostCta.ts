/**
 * Locating Ghost's own upgrade CTA, which is where our offer belongs.
 *
 * Ghost emits this block itself — it is not part of the theme — from
 * `core/frontend/helpers/tpl/content-cta.hbs`, immediately after the truncated
 * post body:
 *
 *   <aside class="gh-post-upgrade-cta">
 *     <div class="gh-post-upgrade-cta-content" style="background-color: {accent}">
 *       <h2>This post is for paying subscribers only</h2>
 *       <a class="gh-btn" data-portal="signup" style="color:{accent}">Subscribe now</a>
 *       <p><small>Already have an account? <a data-portal="signin">Sign in</a></small></p>
 *     </div>
 *   </aside>
 *
 * Because Ghost injects both the markup and its styles, this is stable across
 * themes in a way a theme selector would not be. It is still absent in real
 * cases — a custom theme overriding the partial, or a post that was never
 * gated — so every lookup here can fail, and the caller falls back to the
 * standalone wall rather than showing the reader nothing.
 */

const CTA_CONTENT_SELECTOR = ".gh-post-upgrade-cta-content";
const SUBSCRIBE_BUTTON_SELECTOR = "a.gh-btn";

export interface GhostCtaAnchor {
  /** The accent-coloured block our CTA is inserted into. */
  readonly container: HTMLElement;
  /** Ghost's own primary button. Ours goes directly after it. */
  readonly button: HTMLElement;
  /**
   * The publisher's accent colour, taken from the block Ghost inlined it on.
   *
   * Read rather than guessed: it is the one colour on the page we know the
   * publisher chose, and matching it is what stops our CTA reading as a
   * third-party insert.
   */
  readonly accent: string;
}

const readAccent = (container: HTMLElement): string => {
  // Ghost writes this inline, but a theme could restyle the block, so the
  // computed value is the honest one.
  const computed = window.getComputedStyle(container).backgroundColor;
  return computed && computed !== "rgba(0, 0, 0, 0)" ? computed : "#15171a";
};

export const findGhostCtaAnchor = (): GhostCtaAnchor | null => {
  const container = document.querySelector<HTMLElement>(CTA_CONTENT_SELECTOR);
  if (!container) return null;

  const button = container.querySelector<HTMLElement>(SUBSCRIBE_BUTTON_SELECTOR);
  // The container without the button means Ghost changed the shape of a block
  // we are reaching into. Refusing to guess where to insert is better than
  // putting our offer somewhere arbitrary inside the publisher's paywall.
  if (!button) return null;

  return { container, button, accent: readAccent(container) };
};

/**
 * Places our CTA directly after Ghost's subscribe button.
 *
 * Deliberately before the "Already have an account? Sign in" line rather than
 * at the end of the block: the two purchase options belong together, and a
 * reader who has scrolled past the sign-in link has left the decision.
 */
export const attachAfterSubscribe = (
  anchor: GhostCtaAnchor,
  node: HTMLElement,
): void => {
  anchor.button.insertAdjacentElement("afterend", node);
};
