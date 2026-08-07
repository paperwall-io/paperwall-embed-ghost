export default {
  env: 'production',
  apiBaseUrl: 'https://api.paperwall.io',
  uploads: {
    assetDomain: "https://assets.paperwall.io/",
    // Namespaced per environment: production and staging build different
    // bundles from the same version tag, so a shared key means whichever
    // publishes last overwrites the other.
    keyPrefix: "embed-assets/production/",
    endpoint: "https://t3.storage.dev",
    bucket: "assets.paperwall.io",
  }
}