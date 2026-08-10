/**
 * Ghost-specific article unlocking.
 *
 * Ghost gates paid posts server-side, so a redeemed reader is still served a
 * page whose body is nothing but an upgrade CTA. This module fetches the real
 * body from the API (which reads it from Ghost's Admin API) and swaps it in.
 *
 * POC scope: the selectors are hardcoded for Ghost's Source theme rather than
 * being configurable. Generalising this means adding them to WallConfig in
 * paperwall-lib.
 */

import { attachAfterSubscribe, findGhostCtaAnchor } from "./ghostCta";

/** Where Ghost's Source theme renders {{content}} — see post.hbs. */
const CONTENT_SELECTOR = ".gh-content";

/**
 * Ghost's own members-only paywall, rendered in place of the body of a gated
 * post. Its presence is what tells us there is something to unlock.
 */
const PAYWALL_SELECTOR = ".gh-post-upgrade-cta";

/**
 * The visible card inside the paywall. The `aside` above is transparent and
 * full-bleed; this inner element carries the background, so a notice appended
 * to the outer one renders outside the card entirely.
 */
const PAYWALL_BODY_SELECTOR = ".gh-post-upgrade-cta-content";

const STATUS_ID = "paperwall-unlock-status";

/** Where a reader reaches us when the publisher is not the problem. */
const SUPPORT_URL = "https://paperwall.io/contact";

export type UnlockState =
  | { readonly status: "idle" }
  | { readonly status: "loading" }
  | { readonly status: "done" }
  | { readonly status: "error"; readonly message: string };

const getContentEl = (): HTMLElement | null =>
  document.querySelector(CONTENT_SELECTOR);

const getPaywallEl = (): HTMLElement | null =>
  document.querySelector(PAYWALL_SELECTOR);

/**
 * Whether this page actually has a Ghost members paywall to replace.
 *
 * Guards the whole unlock. Without it we would blow away `.gh-content` on any
 * page a redeemed reader visits — including posts that were never gated, where
 * the body already on the page is the real article and replacing it can only
 * make things worse.
 */
export const hasMembersPaywall = (): boolean => !!getPaywallEl();

export const fetchArticleContent = async (opts: {
  readonly apiBaseUrl: string;
  readonly siteSession: string;
  readonly articleId: string;
  readonly sessionId: string;
}): Promise<string> => {
  const res = await fetch(
    `${opts.apiBaseUrl}/articles/${opts.articleId}/content?sessionId=${encodeURIComponent(opts.sessionId)}`,
    {
      method: "GET",
      mode: "cors",
      credentials: "include",
      headers: new Headers({
        Accept: "application/json",
        "App-Origin": "embed",
        "App-Site-Session": opts.siteSession,
      }),
      referrerPolicy: "origin",
    },
  );

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(body?.errors?.[0]?.message ?? `Request failed (${res.status})`);
  }
  if (typeof body?.html !== "string") {
    throw new Error("No article content returned");
  }

  return body.html;
};

/**
 * `innerHTML` parses <script> tags but never executes them, so any script in a
 * Ghost HTML card arrives inert. Replacing each with a freshly created node
 * makes it run.
 *
 * `async = false` is set explicitly on external scripts: dynamically created
 * scripts default to async, which would let a later script execute before an
 * earlier one it depends on.
 *
 * Each swap is isolated — an embed calling document.write() throws on a closed
 * document, and one bad card should not abort the rest of the unlock.
 */
const rehydrateScripts = (container: HTMLElement): void => {
  const scripts = Array.from(container.querySelectorAll("script"));

  for (const old of scripts) {
    try {
      const replacement = document.createElement("script");
      for (const attr of Array.from(old.attributes)) {
        replacement.setAttribute(attr.name, attr.value);
      }
      if (replacement.src) {
        replacement.async = false;
      }
      replacement.text = old.textContent ?? "";
      old.parentNode?.replaceChild(replacement, old);
    } catch (err) {
      console.warn("[paperwall] could not rehydrate a script in article content", err);
    }
  }
};

/**
 * Ghost's cards.min.js binds click handlers for audio, video, gallery and
 * toggle cards at execution time, and exposes no re-init hook. Re-running it
 * is safe here precisely because we replaced `.gh-content` wholesale: the
 * previously-bound nodes were destroyed along with their listeners, so the
 * fresh nodes get bound exactly once.
 *
 * The URL is read off the tag Ghost already put in the page so we inherit its
 * cache-busting query and never hardcode a path.
 */
const rehydrateCards = (): void => {
  const existing = document.querySelector<HTMLScriptElement>(
    'script[src*="cards.min.js"]',
  );
  if (!existing) return;

  try {
    const replacement = document.createElement("script");
    replacement.src = existing.src;
    replacement.async = false;
    document.body.appendChild(replacement);
  } catch (err) {
    console.warn("[paperwall] could not rehydrate Ghost cards", err);
  }
};

const clearStatus = (): void => {
  document.getElementById(STATUS_ID)?.remove();
};

/**
 * Renders a status line in the slot Paperwall's own CTA occupied — directly
 * after Ghost's subscribe button — reusing the same anchor the CTA uses so
 * there is one rule for where Paperwall speaks inside a publisher's paywall.
 *
 * By the time this runs the CTA itself is gone: GhostCta removes its node on
 * unmount, and the reader is past the offer. This takes its place rather than
 * annotating the publisher's own copy.
 *
 * Sizes are absolute px, matching `.pw-explainer` in GhostCta. Deliberately not
 * `rem`: Ghost's Source theme sets `html { font-size: 62.5% }`, so `1rem` is
 * 10px there and anything sized that way renders far too small.
 */
const renderStatus = (build: (el: HTMLElement) => void): void => {
  const anchor = findGhostCtaAnchor();
  const fallback =
    document.querySelector<HTMLElement>(PAYWALL_BODY_SELECTOR) ?? getPaywallEl();
  if (!anchor && !fallback) return;

  clearStatus();

  const el = document.createElement("div");
  el.id = STATUS_ID;
  el.setAttribute("aria-live", "polite");
  // A text block rather than a flex row: the message wraps to two lines at this
  // width, and as a flex item the icon was pushed onto a line of its own above
  // the text. Inline, it stays with the first word.
  Object.assign(el.style, {
    width: "100%",
    maxWidth: "34em",
    margin: "12px auto 0",
    color: "inherit",
    fontSize: "14px",
    lineHeight: "1.5",
    opacity: "0.8",
    textAlign: "center",
  } satisfies Partial<CSSStyleDeclaration>);

  build(el);

  if (anchor) attachAfterSubscribe(anchor, el);
  else fallback!.appendChild(el);
};

/** The Paperwall mark, so a message in the publisher's paywall reads as ours. */
const paperwallIcon = (): HTMLImageElement => {
  const icon = document.createElement("img");
  icon.src = "https://assets.paperwall.io/logo-v3.1-icon.png";
  icon.alt = "";
  Object.assign(icon.style, {
    height: "16px",
    width: "16px",
    objectFit: "contain",
    display: "inline-block",
    // Optically centred against 14px text; `middle` sits it too high.
    verticalAlign: "-3px",
    marginRight: "6px",
  } satisfies Partial<CSSStyleDeclaration>);
  return icon;
};

/** Signals the unlock is in flight, leaving Ghost's paywall visible until it lands. */
export const showLoading = (): void => {
  renderStatus((el) => {
    el.append(paperwallIcon(), "Unlocking this article…");
  });
};

/**
 * Reports a failed unlock.
 *
 * Leads with the fact that the purchase went through — a reader who has already
 * paid and is looking at a subscribe button needs that first. The technical
 * detail goes to the title attribute and the console; it means nothing to them
 * and would only add noise to the publisher's paywall.
 */
export const showError = (message: string): void => {
  renderStatus((el) => {
    // Two routes on purpose. The publisher owns the content and may simply have
    // unpublished it; we own the delivery. A reader offered only one of us gets
    // bounced when they pick wrong.
    //
    // The author is named rather than linked: the reader is already on the
    // publisher's site and knows how to reach them, whereas inventing a contact
    // URL for an arbitrary Ghost install would send some of them to a 404.
    const support = document.createElement("a");
    support.href = SUPPORT_URL;
    support.target = "_blank";
    support.rel = "noreferrer";
    support.textContent = "Paperwall support";
    // Ghost already underlines anchors in this block; inheriting the colour is
    // what keeps the link legible on the publisher's accent background.
    Object.assign(support.style, {
      color: "inherit",
      textDecoration: "underline",
    } satisfies Partial<CSSStyleDeclaration>);

    el.append(
      paperwallIcon(),
      "Unlocked with Paperwall, could not load article at this time. Contact the author or ",
      support,
      " if this persists",
    );
    el.title = message;
  });
};

export const injectContent = (html: string): boolean => {
  const el = getContentEl();
  if (!el) {
    console.warn(`[paperwall] no ${CONTENT_SELECTOR} element to inject into`);
    return false;
  }

  clearStatus();
  el.innerHTML = html;
  rehydrateScripts(el);
  rehydrateCards();
  return true;
};
