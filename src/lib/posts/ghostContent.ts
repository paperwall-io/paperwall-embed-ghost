/**
 * Ghost-specific article unlocking.
 *
 * Ghost gates paid posts server-side, so a redeemed reader is still served a
 * page whose body is nothing but an upgrade CTA. This module fetches the real
 * body from the API (which reads it from Ghost's Admin API) and swaps it in.
 *
 * POC scope: the `.gh-content` target is hardcoded for Ghost's Source theme
 * rather than being configurable. Generalising this means adding a content
 * selector to WallConfig in paperwall-lib.
 */

/** Where Ghost's Source theme renders {{content}} — see post.hbs. */
const CONTENT_SELECTOR = ".gh-content";

export type UnlockState =
  | { readonly status: "idle" }
  | { readonly status: "loading" }
  | { readonly status: "done" }
  | { readonly status: "error"; readonly message: string };

const getContentEl = (): HTMLElement | null =>
  document.querySelector(CONTENT_SELECTOR);

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

/** Swaps the upgrade CTA for a placeholder the moment we know we'll unlock. */
export const showLoading = (): void => {
  const el = getContentEl();
  if (!el) return;
  el.innerHTML =
    '<p class="paperwall-unlock-status" aria-live="polite">Unlocking this article…</p>';
};

export const showError = (message: string, onRetry: () => void): void => {
  const el = getContentEl();
  if (!el) return;

  el.innerHTML = "";

  const wrapper = document.createElement("p");
  wrapper.className = "paperwall-unlock-status";
  wrapper.setAttribute("aria-live", "polite");
  // Say plainly that they still own it — otherwise a failure is indistinguishable
  // from a paywall they just paid to remove.
  wrapper.textContent = `We couldn't load this article (${message}). Your purchase is safe — you have not been charged again. `;

  const retry = document.createElement("button");
  retry.type = "button";
  retry.textContent = "Try again";
  retry.addEventListener("click", onRetry);

  wrapper.appendChild(retry);
  el.appendChild(wrapper);
};

export const injectContent = (html: string): boolean => {
  const el = getContentEl();
  if (!el) {
    console.warn(`[paperwall] no ${CONTENT_SELECTOR} element to inject into`);
    return false;
  }

  el.innerHTML = html;
  rehydrateScripts(el);
  rehydrateCards();
  return true;
};
