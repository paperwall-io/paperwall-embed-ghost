<script lang="ts">
  import pw from "@lib/main";
  import wallStore from "@lib/stores";
  import type {
    Article,
    ArticleFlags,
    ArticleSession,
    PlatformSettings,
  } from "paperwall";
  import { formatPrice } from "paperwall";

  let pwCta = $derived.by(() => pw.getCta() as string);

  let { flags, article, articleSession, currency, platform } = $derived(
    $wallStore.entities,
  ) as {
    article: Article;
    flags: ArticleFlags;
    articleSession: ArticleSession;
    currency: string;
    platform: PlatformSettings;
  };

  let currencyConfig = $derived(platform?.currencies?.[currency]);
  let mode = $derived(platform?.pricingMode ?? "tickets");
  let siteName: string = $derived(
    pw.config.theme?.siteName ?? (article.site.title || ""),
  );
  let siteLogo: string = $derived(
    pw.config.theme?.siteLogo ?? (article.site.logo || ""),
  );
  // The session's price, not the article's list price: a quote is honoured for
  // a window after a publisher changes a price, so the two legitimately differ
  // and only the session's is what this reader will be charged.
  let numTickets: number = $derived(
    articleSession?.data?.pricing?.num_tickets ?? article.num_tickets,
  );
  let requiresTickets: boolean = $derived(numTickets > 0);
  let readingTime: null | number = $derived(pw.getReadingTime());
</script>

<div class="pw-backdrop"></div>
<div class="pw-the-wall">
  {#if flags?.previewMode}
    <div class="pw-is-sandbox">
      <span class="pw-is-sandbox--label">Sandbox Mode</span>
    </div>
  {/if}
  <div class="pw-container">
    <header class="pw-cta-header">
      {#if siteLogo}
        <figure class="pw-site-logo">
          <img class="pw-site-logo-img" src={siteLogo} alt={siteName} />
        </figure>
      {/if}
      <div class="pw-article-info">
        <div class="pw-header-tagline">Read this article from</div>
        <div class="pw-site-logo-text">{siteName}</div>
        <div class="pw-header-readtime">
          {`${readingTime} min read`}
        </div>
      </div>
    </header>

    <div class="pw-paywall-content">
      <div class="pw-section">
        <div class="pw-row">
          <a class="pw-cta" href={pwCta}>
            <img
              class="pw-logo-sm"
              src="https://assets.paperwall.io/logo-v3.1-icon.png"
              alt="Paperwall"
            />
            {#if requiresTickets}
              Read for {formatPrice(numTickets, mode, currencyConfig)}
            {:else}
              Read for FREE
            {/if}
          </a>
        </div>
        <div class="pw-cta-divider" />
        <ul class="pw-features-list">
          <li>Just this article, no commitment</li>
          <li>Predictable pricing, no surprises</li>
          <li>One monthly payment across all publications</li>
        </ul>
        <p class="pw-explainer">
          Find out more at
          <a href="https://paperwall.io" target="_blank" rel="noreferrer"
            >Paperwall</a
          >
        </p>
      </div>
    </div>
  </div>
</div>

<style lang="scss">
  .pw-backdrop {
    position: fixed;
    z-index: 999;
    width: 100%;
    right: 0;
    left: 0;
    bottom: 40vh;
    height: 16vh;
    background: linear-gradient(
      to bottom,
      rgba(250, 250, 250, 0),
      rgba(250, 250, 250, 0.95)
    );
    backdrop-filter: blur(1px);
    border-width: 0;
  }

  .pw-the-wall {
    position: fixed;
    height: 40vh;
    min-height: 320px;
    bottom: 0px;
    right: 0;
    left: 0;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 32px 48px;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
    color: #1a1a1a;
    overflow: hidden;
    background: #fafafa;
    border-top: 1px solid #e0e0e0;
    font-family:
      "Source Sans 3",
      -apple-system,
      BlinkMacSystemFont,
      sans-serif;
  }

  .pw-is-sandbox {
    position: absolute;
    left: calc(50% - 54px);
    top: 0px;

    .pw-is-sandbox--label {
      background-color: #d63031;
      text-transform: uppercase;
      border-radius: 4px;
      color: #fff;
      font-size: 0.65rem;
      font-weight: 600;
      padding: 4px 16px;
      letter-spacing: 0.5px;
    }
  }

  .pw-container {
    max-width: 480px;
    width: 100%;
  }

  .pw-cta-divider {
    background-color: #ccc;
    height: 1px;
    margin: 16px 0;
  }

  .pw-cta-header {
    display: flex;
    align-items: center;
    text-align: center;
    margin-bottom: 16px;
    justify-content: center;
    column-gap: 24px;
    width: fit-content;
    margin-left: auto;
    margin-right: auto;

    .pw-header-tagline {
      display: block;
      font-size: 13px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .pw-article-info {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      margin-right: -16px;
    }

    .pw-site-logo {
      align-items: center;
      display: flex;
      padding: 0;
      margin: 0;
      

      img {
        height: 64px;
        border-radius: 6px;
        object-fit: cover;
      }
    }
  }

  .pw-site-logo-text {
    font-size: 24px;
    font-weight: 600;
    color: #111;
    letter-spacing: -0.5px;
  }

  .pw-paywall-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .pw-logo-sm {
    height: 24px;
    margin-right: 8px;
    margin-bottom: 2px;
  }

  .pw-section {
    width: 100%;
    text-align: center;

    .pw-row {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;
    }

    .pw-cta {
      font-size: 18px;
      font-weight: 600;
      color: #181714;
      border: 1px solid #181714;
      background-color: #eae5dc;
      text-decoration: none;
      padding: 8px 24px;
      display: flex;

      border-radius: 4px;
      transition: background-color 0.2s ease;
      cursor: pointer;

      &:hover {
      }
    }

    .pw-explainer {
      font-size: 12px;
      color: #888;
      margin: 0;

      a {
        color: #666;
        transition: all 0.2s ease;
        margin: 0 4px;
        cursor: pointer;
        &:hover {
        }
      }
    }
  }

  .pw-features-list {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 4px 16px;
    list-style: none;
    padding: 0;
    margin: 0 0 12px;
    font-size: 13px;
    color: #555;

    li {
      display: flex;
      align-items: center;
      gap: 4px;

      &::before {
        content: "✓";
        color: #0a9928;
        font-weight: 600;
        font-size: 12px;
      }
    }
  }

  @media (max-width: 600px) {
    .pw-the-wall {
      padding: 24px 20px;
      min-height: 280px;
      // height: auto;
    }

    .pw-paywall-header {
      .pw-site-logo {
        .pw-site-logo-text {
          font-size: 20px;
        }

        img {
          width: 32px;
          height: 32px;
        }
      }
    }

    .pw-features-list {
      flex-direction: row;
      column-gap: 12px;
      row-gap: 4px;
      font-size: 12px;
    }
  }
</style>
