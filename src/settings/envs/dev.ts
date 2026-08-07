export default {
  env: "dev",
  apiBaseUrl: 'http://api.pw.local:3003',
  uploads: {
    assetDomain: "https://assets.paperwall.io/",
    // Namespaced per environment: production and staging build different
    // bundles from the same version tag, so a shared key means whichever
    // publishes last overwrites the other.
    keyPrefix: "embed-assets/dev/",
    endpoint: "https://fly.storage.tigris.dev",
    bucket: "assets.paperwall.io",
  },
};
