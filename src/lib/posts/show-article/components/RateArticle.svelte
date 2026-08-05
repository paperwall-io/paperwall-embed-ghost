<script lang="ts">
  import type { IArticle, IArticleSession } from "paperwall";
  import StarRating from "./StarRating.svelte";
  import wallStore from "@lib/stores";
  import pw from "@lib/main";

  let { article, articleSession } = $derived($wallStore.entities) as {
    article: IArticle;
    articleSession: IArticleSession;
  };
  interface Props {
    label: string;
    onSuccess?: (() => void) | null;
  }

  let { label, onSuccess = null }: Props = $props();

  const rateArticle = (rating: number) => async (e: MouseEvent) =>
    pw.rateArticle(article.id, articleSession.id, rating);
</script>

<div class="pw-rate-article">
  <div class="pw-rate-article__label">
    {label}
  </div>
  <div class="pw-rate-article__cta">
    <StarRating
      rating={articleSession.rating || 0}
      submitRating={rateArticle}
    />
  </div>
</div>

<style lang="scss">
  .pw-rate-article {
    text-align: center;
    color: #333;
    margin-top: 6px;
    .pw-rate-article__label {
      font-size: 0.9rem;
      margin-bottom: 0.5rem;
      white-space: pre;
    }
    .pw-rate-article__cta {
      display: flex;
      justify-content: center;
    }
  }
  .pw-rating-option {
    appearance: none;
    -webkit-appearance: button; /* For Safari */
    background: none;
    color: inherit; /* Use the current text color */
    border: none;
    padding: 0;
    margin: 0 8px;
    font: inherit; /* Use the current font */
    cursor: pointer;
    text-align: left; /* Align text to the left */
    line-height: normal; /* Use the default line height */
    overflow: visible; /* Show content that overflows */
    font-size: 1.5rem;

    &:hover,
    &:focus {
      background: none;
      border: none;
      outline: none;
    }
  }
</style>
