<script lang="ts">
  import { onMount } from "svelte";
  import pw from "@lib/main";
  import wallStore from "@lib/stores";
  import type { Article, ArticleFlags, PlatformSettings } from "paperwall";
  import { formatPrice } from "paperwall";
  import { attachAfterSubscribe, type GhostCtaAnchor } from "../ghostCta";

  /**
   * Paperwall's offer, rendered inside Ghost's own upgrade CTA rather than as a
   * panel over the page.
   *
   * The reader is already looking at a subscribe button and deciding. Putting
   * the single-article option next to it makes that one decision with two
   * answers, instead of a subscription decision interrupted by a floating wall.
   *
   * Styling follows Ghost's block — accent background, its button geometry —
   * so it reads as a second option the publisher offers. The Paperwall mark and
   * the "no subscription" line stay, because the whole proposition is that this
   * is *not* what the button above it does.
   */
  interface Props {
    anchor: GhostCtaAnchor;
  }

  let { anchor }: Props = $props();

  let el: HTMLDivElement;

  let pwCta = $derived.by(() => pw.getCta() as string);

  let { flags, article, currency, platform } = $derived($wallStore.entities) as {
    article: Article;
    flags: ArticleFlags;
    currency: string;
    platform: PlatformSettings;
  };

  let currencyConfig = $derived(platform?.currencies?.[currency]);
  let mode = $derived(platform?.pricingMode ?? "tickets");
  let requiresTickets = $derived(article.num_tickets > 0);
  let readingTime: null | number = $derived(pw.getReadingTime());

  // Moved rather than rendered in place: the app mounts into its own container
  // on the body, and this is the one piece that has to live inside the
  // publisher's markup.
  onMount(() => {
    attachAfterSubscribe(anchor, el);
    return () => el.remove();
  });
</script>

<div class="pw-ghost-cta" bind:this={el}>
  {#if flags?.previewMode}
    <div class="pw-sandbox">Sandbox Mode</div>
  {/if}

  <div class="pw-or">or</div>

  <a class="pw-btn" href={pwCta}>
    <img
      class="pw-logo"
      src="https://assets.paperwall.io/logo-v3.1-icon.png"
      alt=""
    />
    <span>
      {#if requiresTickets}
        Read this article for {formatPrice(
          article.num_tickets,
          mode,
          currencyConfig,
        )}
      {:else}
        Read this article for FREE
      {/if}
    </span>
  </a>

  <p class="pw-explainer">
    No subscription{#if readingTime}, {readingTime} min read{/if} — pay for this
    article only, with
    <a class="pw-link" href="https://paperwall.io" target="_blank" rel="noreferrer">
      Paperwall</a
    >.
  </p>
</div>

<style lang="scss">
  /**
   * Ghost styles this block with `.gh-post-upgrade-cta a { text-decoration:
   * underline }` and white text on the accent colour. Svelte's scoping gives
   * our selectors a class more than Ghost's, so these win without !important —
   * but every anchor still has to opt out of that underline explicitly.
   */
  .pw-ghost-cta {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    color: inherit;
  }

  .pw-or {
    margin: 16px 0 0;
    font-size: 14px;
    opacity: 0.75;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  /**
   * Ghost's own `.gh-btn` here is a solid white block with accent-coloured
   * text. Ours matches its geometry but is outlined, so the hierarchy is
   * visible: subscribing is still the publisher's primary ask.
   */
  .pw-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin: 12px 0 0;
    padding: 8px 18px;
    border-radius: 4px;
    font-size: 16px;
    font-weight: 600;
    color: #ffffff;
    text-decoration: none;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.65);
    transition:
      background-color 0.2s ease,
      border-color 0.2s ease;

    &:hover {
      text-decoration: none;
      background: rgba(255, 255, 255, 0.14);
      border-color: #ffffff;
      opacity: 1;
    }
  }

  .pw-logo {
    height: 20px;
    width: 20px;
    object-fit: contain;
  }

  .pw-explainer {
    margin: 12px 0 0;
    font-size: 14px;
    opacity: 0.8;
  }

  .pw-link {
    color: #ffffff;
    text-decoration: underline;
  }

  .pw-sandbox {
    background-color: #d63031;
    text-transform: uppercase;
    border-radius: 4px;
    color: #fff;
    font-size: 0.65rem;
    font-weight: 600;
    padding: 4px 16px;
    letter-spacing: 0.5px;
    margin-top: 16px;
  }
</style>
