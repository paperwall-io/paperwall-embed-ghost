export default {
  env: "staging",
  apiBaseUrl: "https://sandbox-api.paperwall.io",
  uploads: {
    assetDomain: "https://assets.paperwall.io/",
    // Namespaced per environment: production and staging build different
    // bundles from the same version tag, so a shared key means whichever
    // publishes last overwrites the other.
    keyPrefix: "embed-assets/staging/",
    endpoint: "https://fly.storage.tigris.dev",
    bucket: "assets.paperwall.io",
  },
};
