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
    assetDomain: string;
    endpoint: string;
    bucket: string;
  };
}

const defaultSettings = {} as ISettings;

export default Object.assign(defaultSettings, settings);
