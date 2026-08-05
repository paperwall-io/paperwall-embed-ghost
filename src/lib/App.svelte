<script lang="ts">
  import { onMount, tick } from "svelte";
  import PostEmbed from "./posts/WallController.svelte";
  import pw from "@lib/main";
  import wallStore from "./stores";
  import type { WallState, WallStore } from "paperwall";

  let isPost = $state(false);

  onMount(() => {
    // create listeners in the store
    const unsubEntities = pw.entities.sub((state: WallStore) => {
      $wallStore.entities = state;
    });
    const unsubWallState = pw.wallState.sub((state: WallState) => {
      console.log("WallState", state);
      $wallStore.wallState = state;
    });
    const navUnsub = pw.resetOnNav();

    return () => {
      unsubEntities();
      unsubWallState();
      navUnsub();
    };
  });

  $effect(() => {
    if ($wallStore.wallState === "@paperwall/loading") {
      tick().then(() => {
        pw.initApp();
        isPost = pw.detectIsPost();
      });
    }
  });
</script>

{#if isPost}
  <PostEmbed />
{/if}
