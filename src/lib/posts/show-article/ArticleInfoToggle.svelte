<script lang="ts">
  import AlreadyRead from "./ArticleInfo.svelte";
  import wallStore from "@lib/stores";

  let isToggled = $state(false);
  let { flags } = $derived($wallStore.entities);
  const toggleSection = () => {
    isToggled = !isToggled;
  };
</script>

<div class="pw-beyond-the-wall">
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <span
    class="pw-no-ratings-display"
    onclick={toggleSection}
    onkeypress={toggleSection}
    ><img
      src="https://assets.paperwall.io/logo-v3.1-icon.png"
      title="Paperwall Icon"
      alt="Paperwall Icon"
    /></span
  >
  {#if isToggled && flags?.previewMode}
    <div class="pw-preview-mode">
      <span class="pw-sm-preview-mode">Preview Mode</span>
    </div>
  {/if}
  <div class="pw-beyond-wall-wrapper">
    <AlreadyRead isVisible={isToggled} />
  </div>
</div>

<style lang="scss">
  .pw-beyond-the-wall {
    position: fixed;
    bottom: 50px;
    right: 0px;
    z-index: 9999;
    display: flex;
    flex-direction: row-reverse;
    align-items: flex-end;
  }
  .pw-beyond-wall-wrapper {
    position: relative;
    padding-top: 1rem;
  }
  .pw-no-ratings-display {
    font-size: 1.5rem;
    border-radius: 4px !important;
    padding: 4px 8px !important;
    margin-left: 12px;
    background-color: rgb(234 229 220 / 75%);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.8);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    img {
      max-height: 24px;
      max-width: 24px;
    }
  }
  .pw-preview-mode {
    position: absolute;
    left: -8px;
    top: 16px;

    text-align: center;
    padding-bottom: 8px;
    font-size: 0.5rem;
    z-index: 99999;
    .pw-sm-preview-mode {
      background-color: #e7a226;
      text-transform: uppercase;
      color: #eee;
      padding: 2px 8px;
      border-radius: 4px;
      margin-left: 8px;
    }
  }
</style>
