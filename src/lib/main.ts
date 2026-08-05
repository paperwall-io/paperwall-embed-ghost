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
    articleFinder: {
      selector: "blog-post",
      postUrls: [/posts\/\w+\/?/],
    },
  }
);

// initialize app in the body element
const $appEl = document.createElement("div");
$appEl.id = "paperwall";
$appEl.style.position = "relative";
document.body.append($appEl);
mount(App, { target: $appEl });
