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

export default initPaperwall(
  window.wallConfig || {
    mode: 'local',
    siteToken: "DbZJhUWu62P", // jweatherby.dev
    // Only used when the page has no wallConfig — i.e. local development
    // against ghost-blog. Kept in the same shape the portal now generates, so
    // developing here exercises what a publisher actually installs.
    articleFinder: {
      selector: ".gh-content",
      postUrls: [/^\/[^\/]+\/?$/],
      excludeUrls: [/^\/(about|contact|privacy)\/?$/, /^\/tag\//, /^\/author\//, /^\/ghost\//],
    },
  }
);

// initialize app in the body element
const $appEl = document.createElement("div");
$appEl.id = "paperwall";
$appEl.style.position = "relative";
document.body.append($appEl);
mount(App, { target: $appEl });
