import "./app.css";
import App from "./App.svelte";
import type { WallConfig } from "paperwall";
import { mount } from "svelte";
import { initPaperwall } from "paperwall";

declare global {
  interface Window {
    wallConfig: WallConfig;
  }
}

/**
 * Ghost's page structure is known, so a publisher installing this embed should
 * not have to describe it — that is the whole point of a platform-specific
 * build. Overridable for themes that diverge from Ghost's defaults.
 *
 * Ghost serves posts at the root as `/:slug/`, so the only include pattern that
 * catches every post also catches `/about/` and `/contact/`. Hence the
 * exclusions rather than a cleverer include.
 *
 * Patterns are regex *sources* (see paperwall-lib's isPostUrl), not literals.
 */
const GHOST_ARTICLE_FINDER = {
  selector: ".gh-content",
  postUrls: ["^/[^/]+/?$"],
  excludeUrls: ["^/(about|contact|privacy)/?$", "^/tag/", "^/author/", "^/ghost/"],
};

const wallConfig: WallConfig = window.wallConfig || {
  // Only used when the page has no wallConfig — i.e. local development against
  // ghost-blog.
  mode: "local",
  siteToken: "DbZJhUWu62P", // jweatherby.dev
};

// Merged field by field in paperwall-lib, so a publisher overriding only the
// selector for a custom theme keeps Ghost's URL rules instead of silently
// losing them.
const pw = initPaperwall(wallConfig, {
  articleFinder: GHOST_ARTICLE_FINDER,
});

/**
 * Announce which build is running and which API it will talk to.
 *
 * `mode` is the single setting that decides whether a page is hitting
 * production, sandbox or a laptop, and getting it wrong looks like everything
 * else being broken — a wall that never unlocks, a site that will not verify.
 * The effective value is logged rather than the configured one, because an
 * omitted `mode` silently means live.
 */
console.log(
  `[paperwall] ghost embed · mode: ${wallConfig.mode ?? "live (default)"} · api: ${pw.config.apiBaseUrl}`,
);

export default pw;

// initialize app in the body element
const $appEl = document.createElement("div");
$appEl.id = "paperwall";
$appEl.style.position = "relative";
document.body.append($appEl);
mount(App, { target: $appEl });
