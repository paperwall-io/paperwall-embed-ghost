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
 * Renders a small notice *inside* Ghost's paywall card rather than in place of
 * the article.
 *
 * Inline styles rather than a stylesheet, and every dimension in `em` rather
 * than `rem`: Ghost's Source theme sets `html { font-size: 62.5% }`, so `1rem`
 * is 10px there and a "0.8125rem" notice renders at 8px. Sizing against the
 * inherited font instead lands at ~13px next to 17px body copy, on any theme.
 *
 * Colours derive from `currentColor` for the same reason — the card is pink
 * with white text here, but a fixed palette would disappear on a theme that
 * inverts that.
 */
const renderStatus = (build: (el: HTMLElement) => void): void => {
  const host =
    document.querySelector<HTMLElement>(PAYWALL_BODY_SELECTOR) ?? getPaywallEl();
  if (!host) return;

  clearStatus();

  const el = document.createElement("div");
  el.id = STATUS_ID;
  el.setAttribute("aria-live", "polite");
  Object.assign(el.style, {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5em",
    flexWrap: "wrap",
    margin: "1em auto 0",
    maxWidth: "32em",
    padding: "0.5em 0.75em",
    borderRadius: "4px",
    border: "1px solid",
    borderColor: "currentColor",
    background: "transparent",
    color: "inherit",
    font: "inherit",
    fontSize: "0.8125em",
    lineHeight: "1.4",
    opacity: "0.9",
  } satisfies Partial<CSSStyleDeclaration>);

  build(el);
  host.appendChild(el);
};

/** Signals the unlock is in flight, leaving Ghost's paywall visible until it lands. */
export const showLoading = (): void => {
  renderStatus((el) => {
    el.textContent = "Unlocking this article…";
  });
};

export const showError = (message: string, onRetry: () => void): void => {
  renderStatus((el) => {
    const text = document.createElement("span");
    // The reader's real worry is whether they paid for nothing; the technical
    // detail is for us and stays in the console.
    text.textContent = "Couldn't load this article. Your purchase is safe.";

    const retry = document.createElement("button");
    retry.type = "button";
    retry.textContent = "Try again";
    Object.assign(retry.style, {
      font: "inherit",
      fontSize: "inherit",
      padding: "0.15em 0.6em",
      borderRadius: "3px",
      border: "1px solid",
      borderColor: "currentColor",
      background: "transparent",
      color: "inherit",
      cursor: "pointer",
    } satisfies Partial<CSSStyleDeclaration>);
    retry.addEventListener("click", onRetry);

    el.append(text, retry);
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
