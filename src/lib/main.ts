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

export default initPaperwall({
  ...wallConfig,
  articleFinder: wallConfig.articleFinder ?? GHOST_ARTICLE_FINDER,
});

// initialize app in the body element
const $appEl = document.createElement("div");
$appEl.id = "paperwall";
$appEl.style.position = "relative";
document.body.append($appEl);
mount(App, { target: $appEl });
