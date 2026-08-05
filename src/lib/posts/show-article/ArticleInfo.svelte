<script lang="ts">
  import settings from "@settings";
  import pw from "@lib/main";
  import wallStore from "@lib/stores";
  import RateArticle from "./components/RateArticle.svelte";
  interface Props {
    isVisible: boolean;
  }

  let { isVisible }: Props = $props();
  let { articleSession, article } = $derived($wallStore.entities);
  let isRating: boolean = $state(false);
  const setIsRating = (value: boolean) => () => {
    isRating = value;
  };
</script>

<div
  class={`pw-card pw-already-read --animate ${isVisible ? "--is-visible" : "--is-hidden"}`}
>
  {#if article?.use_ratings}
    {#if articleSession?.rating}
      <div class="pw-already-rated">
        {#if isRating}
          <RateArticle
            label={`Update your feedback:`}
            onSuccess={() => {
              isRating = false;
            }}
          />
        {:else}
          <div class="pw-rating-wrapper">
            You gave this article <strong>{articleSession.rating}</strong><span
              class="pw-star-icon pw-fill"
            />{articleSession.rating !== 1 ? "'s" : ""}
            <br />
            <span
              class="pw-update-rating"
              onclick={setIsRating(true)}
              onkeypress={setIsRating(true)}>edit</span
            >
          </div>
        {/if}
      </div>
    {:else}
      <RateArticle label={"Did you like this article?"} />
    {/if}
  {/if}

  <footer>
    <div class="pw-discover-more">
      Find more like this on the <a
        href={pw.config.portalUrl}
        class="pw-link"
        target="_blank">Discover Feed</a
      >
    </div>
    <div>
      Powered by <a class="pw-link" href="https://paperwall.io" target="_blank"
        >paperwall.io</a
      >
    </div>
  </footer>
</div>

<style lang="scss">
  .pw-rating-wrapper {
    font-size: 0.9rem;
    text-align: center;
    font-weight: 400;
    margin-top: 16px;
  }
  .pw-star-icon {
  }
  .pw-already-read {
    border: 1px solid #424751;

    background-size: cover;
    background-blend-mode: lighten;
    background-color: rgb(252 234 198 / 60%);
    background-image: url(https://assets.paperwall.io/tan-background-v2.png);
  }
  .pw-already-rated {
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .pw-update-rating {
    cursor: pointer;
    font-size: 0.55rem;
    font-weight: 400;
    position: absolute;
    top: 4px;
    right: 4px;
    background-color: #333;
    color: #fff;
    padding: 0px 4px;
    border-radius: 4px;
  }
  footer {
    text-align: center;
    font-size: 0.6rem;
    margin-top: 16px;
    .pw-discover-more {
      font-size: 0.7rem;
      margin-bottom: 8px;
    }
  }
</style>
