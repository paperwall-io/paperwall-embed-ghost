import devSettings from "./envs/dev";
import stagingSettings from "./envs/staging";
import prodSettings from "./envs/prod";

let settings;
if (import.meta.env.APP_ENV === "production") {
  settings = prodSettings;
} else if (import.meta.env.APP_ENV === "staging") {
  settings = stagingSettings;
} else if (import.meta.env.APP_ENV === "dev") {
  settings = devSettings;
}

console.log("loaded env", import.meta.env.APP_ENV);

export interface ISettings {
  env: "dev" | "staging" | "production";
  mode: "live" | "sandbox" | "local";
  portalUrl: string;
  uploads: {
    /** Host the assets are served from, with no path. */
    assetDomain: string;
    /** Environment-scoped path, shared by the S3 key and the public URL. */
    keyPrefix: string;
    endpoint: string;
    bucket: string;
  };
}

const defaultSettings = {} as ISettings;

export default Object.assign(defaultSettings, settings);
