<script lang="ts">
  import pw from "@lib/main";
  import wallStore from "@lib/stores";
  import PostWall from "./show-wall/ShowWall.svelte";
  import GhostCta from "./show-wall/GhostCta.svelte";
  import BeyondWall from "./show-article/ArticleInfoToggle.svelte";
  import { findGhostCtaAnchor } from "./ghostCta";
  import {
    fetchArticleContent,
    hasMembersPaywall,
    injectContent,
    showError,
    showLoading,
    type UnlockState,
  } from "./ghostContent";

  const articleDOM = pw.articleFinder.getEl() as unknown as HTMLElement;

  /**
   * Resolved once, before anything renders.
   *
   * When Ghost's upgrade CTA is on the page we render inside it. When it is not
   * — a custom theme overriding Ghost's partial, or a post gated some other way
   * — we fall back to the standalone wall. Rendering nothing would be invisible
   * to the publisher and would quietly cost them every sale on that page.
   */
  const ghostCtaAnchor = findGhostCtaAnchor();

  if (!ghostCtaAnchor) {
    console.warn(
      "[paperwall] no Ghost upgrade CTA found on this page (.gh-post-upgrade-cta-content > a.gh-btn); falling back to the standalone wall",
    );
  }

  let unlock = $state<UnlockState>({ status: "idle" });

  /**
   * Ghost serves the gated page on every visit, so this runs on each load of a
   * redeemed article — there is no client-side cache of paid content.
   */
  const unlockArticle = async () => {
    const { article, articleSession, siteSession } = $wallStore.entities;
    if (!article || !articleSession || !siteSession) return;

    // Nothing to unlock: Ghost served the real body, so replacing `.gh-content`
    // could only destroy it. Happens on public posts and on any post the reader
    // can already read, where being redeemed says nothing about the page.
    if (!hasMembersPaywall()) {
      unlock = { status: "done" };
      return;
    }

    unlock = { status: "loading" };
    showLoading();

    try {
      const html = await fetchArticleContent({
        apiBaseUrl: pw.config.apiBaseUrl,
        siteSession,
        articleId: article.id,
        sessionId: articleSession.id,
      });
      injectContent(html);
      unlock = { status: "done" };
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown error";
      console.error("[paperwall] article unlock failed", err);
      unlock = { status: "error", message };
      showError(message);
    }
  };
  $effect(() => {
    if ($wallStore.wallState === "@paperwall/app_pending") {
      console.log("triggering initArticle");
      pw.initArticle();
    }
  });

  /**
   * Clamping the article and locking body scroll only makes sense under the
   * standalone wall, which is a fixed panel covering the bottom of the
   * viewport.
   *
   * In CTA mode neither applies: Ghost already truncated the post server-side,
   * and our CTA is ordinary inline content. Locking body scroll there would
   * trap a reader part-way through the free portion — hostile, and for no
   * benefit, since there is nothing to scroll past.
   */
  $effect(() => {
    if (ghostCtaAnchor) return;

    if ($wallStore.wallState === "@paperwall/show_wall") {
      articleDOM.style.height = "55vh";
      articleDOM.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    } else if (
      $wallStore.wallState === "@paperwall/show_article" ||
      $wallStore.wallState === "@paperwall/no_wall"
    ) {
      articleDOM.style.height = "auto";
      articleDOM.style.overflow = "auto";
      document.body.style.overflow = "";
    }
  });

  $effect(() => {
    // `idle` guard keeps this to one fetch per load — the effect re-runs on any
    // entity change, and a failed unlock should not retry on its own. Recovery
    // is a page reload, which Ghost serves gated again anyway.
    if (
      $wallStore.wallState === "@paperwall/show_article" &&
      unlock.status === "idle"
    ) {
      unlockArticle();
    }
  });
</script>

{#if $wallStore.wallState !== "@paperwall/no_wall" && $wallStore.entities.article}
  {#if $wallStore.wallState === "@paperwall/show_wall"}
    {#if ghostCtaAnchor}
      <GhostCta anchor={ghostCtaAnchor} />
    {:else}
      <PostWall />
    {/if}
  {:else if $wallStore.wallState === "@paperwall/show_article"}
    <BeyondWall />
  {/if}
{/if}

<style lang="scss">
  // dialog.backdrop {
  //   position: fixed;
  //   top: 0;
  //   bottom: 0;
  //   right: 0;
  //   left: 0;
  //
  //   z-index: 999;
  //   width: 100%;
  //   height: 100%;
  //    background-color: rgba(234, 229, 220, 0.3);
  //   backdrop-filter: blur(1px);
  //   border-width: 0;
  // }
</style>
