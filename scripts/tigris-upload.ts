import { BunFile, write, S3Client } from "bun";
import settings from "../src/settings";

const s3 = new S3Client({
  bucket: settings.uploads.bucket,
  endpoint: settings.uploads.endpoint,
  accessKeyId: Bun.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: Bun.env.AWS_SECRET_ACCESS_KEY,
  region: 'auto',
});

/**
 * Where a built asset lives, as a storage key and as a public URL.
 *
 * Both are derived from the same `keyPrefix` on purpose. They are one value in
 * two forms: the API registers the URL alongside an SRI hash, and if the URL
 * ever addresses a different object than the one that was uploaded and hashed,
 * the browser blocks the script and the page silently loses its paywall.
 *
 * The prefix is environment-scoped because production and staging build
 * different bundles from the same version tag — settings are baked in at build
 * time — so an unscoped key means whichever publishes second overwrites the
 * other's artifact while both APIs keep their own hash.
 */
export const assetKey = (filename: string): string =>
  settings.uploads.keyPrefix + filename;

export const assetUrl = (filename: string): string =>
  settings.uploads.assetDomain + assetKey(filename);

export const s3Upload = async ({
  filename,
  contents,
}: {
  filename: string;
  contents: BunFile;
}) => {
  const file = s3.file(assetKey(filename));

  try {
    const result = await write(file, contents);
    console.log("upload complete", filename, result);
    return true;
  } catch (err) {
    console.log("err", err);
    return false;
  }
};
