<script lang="ts">
  import type { Article } from "paperwall";
  import pw from "@lib/main";

  type Props = {
    article: Article;
  };
  const { article }: Props = $props();
</script>

{#if article.num_tickets === 0}
  <div class="pw-under-threshold">
    {pw.thresholds.whyUnder(article)}
  </div>
{:else}
  <div class="pw-over-threshold">
    {pw.thresholds.whyOver(article)}
  </div>
{/if}
