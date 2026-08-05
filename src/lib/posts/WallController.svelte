<script lang="ts">
  import pw from "@lib/main";
  import wallStore from "@lib/stores";
  import PostWall from "./show-wall/ShowWall.svelte";
  import BeyondWall from "./show-article/ArticleInfoToggle.svelte";
  import {
    fetchArticleContent,
    injectContent,
    showError,
    showLoading,
    type UnlockState,
  } from "./ghostContent";

  const articleDOM = pw.articleFinder.getEl() as unknown as HTMLElement;
  console.log('pw config', pw.config)

  let unlock = $state<UnlockState>({ status: "idle" });

  /**
   * Ghost serves the gated page on every visit, so this runs on each load of a
   * redeemed article — there is no client-side cache of paid content.
   */
  const unlockArticle = async () => {
    const { article, articleSession, siteSession } = $wallStore.entities;
    if (!article || !articleSession || !siteSession) return;

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
      showError(message, unlockArticle);
    }
  };
  $effect(() => {
    if ($wallStore.wallState === "@paperwall/app_pending") {
      console.log("triggering initArticle");
      pw.initArticle();
    }
  });

  $effect(() => {
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
    // entity change, and a retry is driven by the error button instead.
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
    <!-- <dialog class="backdrop" open></dialog> -->
    <PostWall />
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
