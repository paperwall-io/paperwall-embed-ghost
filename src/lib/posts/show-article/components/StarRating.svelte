<script lang="ts">
  interface Props {
    rating: number;
    submitRating?: (rating: number) => (e: MouseEvent) => void;
  }
  let { rating, submitRating }: Props = $props();
  let newRating = $state(rating);
  const updateNewRating = (_newRating: number) => (e: MouseEvent) => {
    newRating = _newRating;
    return e;
  };
  console.log("submitRating", !!submitRating);
</script>

{#each Array.from({ length: 5 }, (_, n) => n + 1) as idx}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <!-- svelte-ignore element_invalid_self_closing_tag -->
  {#if submitRating}
    <span
      class={`pw-star-icon pw-selectable ${idx <= newRating ? "pw-fill" : ""}`}
      onclick={submitRating(idx)}
      onmouseenter={updateNewRating(idx)}
      onmouseleave={updateNewRating(rating)}
    />
  {:else}
    <span class={`pw-star-icon ${idx <= newRating ? "pw-fill" : ""}`} />
  {/if}
{/each}

<style lang="scss">
  .pw-selectable {
    cursor: pointer;
  }
</style>
