import { BunFile, write, S3Client } from "bun";
import settings from "../src/settings";

const s3 = new S3Client({
  bucket: settings.uploads.bucket,
  endpoint: settings.uploads.endpoint,
  accessKeyId: Bun.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: Bun.env.AWS_SECRET_ACCESS_KEY,
  region: 'auto',
});

export const s3Upload = async ({
  filename,
  contents,
}: {
  filename: string;
  contents: BunFile;
}) => {
  const file = s3.file("embed-assets/" + filename);

  try {
    const result = await write(file, contents);
    console.log("upload complete", filename, result);
    return true;
  } catch (err) {
    console.log("err", err);
    return false;
  }
};
