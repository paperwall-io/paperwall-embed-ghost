import { type BunFile } from "bun";
import { readdir } from "node:fs/promises";
import crypto from "crypto";
import { assetUrl, s3Upload } from "./tigris-upload";
import settings from "../src/settings";

type FetchOpts = {
  method: string;
  verbose?: boolean;
  body?: Record<string, any>;
};

const apiFetch = (path: string, opts: FetchOpts) => {
  let reqArgs: RequestInit = {};
  if (!["GET", "HEAD"].includes(opts.method)) {
    reqArgs.body = JSON.stringify(opts.body);
  }
  return fetch(`${settings.apiBaseUrl}${path}`, {
    method: opts.method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "pipeline-api-key": process.env.PIPELINE_API_KEY as string,
    },
    ...reqArgs,
  }).then((resp) => resp.json());
};

function getHash(type: string, content: string) {
  return crypto.createHash(type).update(content, "utf8").digest("base64");
}

const extractVersion = (filename: string) =>
  filename.replace(/\S+(v\d+\.\d+)\.(js|css)/, "$1");

const getBuildInfo = async () => {
  const distDir = import.meta.dirname + "/../dist/";
  const distFiles = await readdir(distDir);

  const cssFileName = distFiles.find((filename) =>
    filename.match(/v\d+\.\d+\.css$/)
  );
  const jsFileName = distFiles.find((filename) =>
    filename.match(/v\d+\.\d+\.js$/)
  );
  if (!(cssFileName && jsFileName)) {
    throw new Error(
      "Files not found - make sure the filename matches [name]-v[version].[js|css]"
    );
  }
  const cssContents = Bun.file(distDir + cssFileName);
  const cssHash = "sha256-" + getHash("sha256", await cssContents.text());
  const jsContents = Bun.file(distDir + jsFileName);
  const jsHash = "sha256-" + getHash("sha256", await jsContents.text());

  const jsVersion = extractVersion(jsFileName);
  const cssVersion = extractVersion(cssFileName);
  if (jsVersion !== cssVersion) {
    throw new Error("mismatch js and css version");
  }
  return {
    version: jsVersion,
    cssFile: {
      filename: cssFileName,
      hash: cssHash,
      contents: cssContents,
    },
    jsFile: {
      filename: jsFileName,
      hash: jsHash,
      contents: jsContents,
    },
  };
};

const uploadBuildAssets = async ({
  jsFile,
  cssFile,
}: Record<string, { filename: string; hash: string; contents: BunFile }>) => {
  const [jsUploaded, cssUploaded] = await Promise.all([
    s3Upload(jsFile),
    s3Upload(cssFile),
  ]);
  if (!(jsUploaded && cssUploaded)) {
    throw new Error("Upload failed");
  }
  // Built from the same helper that produced the storage key, so the URL we
  // register can never address an object other than the one just uploaded.
  return {
    jsUrl: assetUrl(jsFile.filename),
    cssUrl: assetUrl(cssFile.filename),
  };
};

export const saveBuildVersion = async () => {
  const { version, cssFile, jsFile } = await getBuildInfo();
  console.log("Built assets:", {
    version,
    cssFile: {
      filename: cssFile.filename,
      hash: cssFile.hash,
    },
    jsFile: {
      filename: jsFile.filename,
      hash: jsFile.hash,
    },
  });
  const { cssUrl, jsUrl } = await uploadBuildAssets({ jsFile, cssFile });
  console.log("uploading these assets", { cssUrl, jsUrl });
  console.log("uploading with settings.uploads", settings.uploads);
  const resp = await apiFetch("/pipelines/embed-version", {
    method: "POST",
    verbose: true,
    body: {
      // Required. The API defaults embedType to "standard", and publishing
      // under that type deactivates the standard build for every publisher —
      // one active version per type.
      embedType: "ghost",
      version: version,
      jsSri: jsFile.hash,
      cssSri: cssFile.hash,
      jsUrl,
      cssUrl,
    },
  });
  return resp.ok;
};

saveBuildVersion();
