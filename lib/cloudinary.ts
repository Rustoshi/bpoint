/**
 * Browser-side, unsigned Cloudinary uploads.
 *
 * Files are POSTed straight from the user's browser to Cloudinary — they
 * never pass through our Next.js API routes. This is the only pattern
 * that works reliably on Vercel, which caps serverless function payloads
 * at ~4.5 MB on Hobby / ~10 MB on Pro and was never designed to proxy
 * large media uploads.
 *
 * Setup
 * ─────
 *   1. In your Cloudinary dashboard create an **unsigned** upload preset.
 *   2. Set these two env vars (prefixed NEXT_PUBLIC so they ship to the browser):
 *
 *        NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
 *        NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-unsigned-preset
 *
 *   3. (Recommended) Lock the preset down in Cloudinary:
 *        - Set "Folder" to e.g. "bpoint"
 *        - Set "Allowed formats" (jpg,png,webp,pdf,mp4,m4a,…) and a max file size
 */

const CLOUD_NAME    = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export type CloudinaryAsset = {
  url:           string;   // secure_url (https://res.cloudinary.com/…)
  publicId:      string;
  resourceType:  "image" | "video" | "raw" | "auto";
  format:        string;
  bytes:         number;
  originalName:  string;
};

export class CloudinaryConfigError extends Error {}
export class CloudinaryUploadError extends Error {}

function assertConfigured(): { cloudName: string; uploadPreset: string } {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new CloudinaryConfigError(
      "Cloudinary is not configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in your env."
    );
  }
  return { cloudName: CLOUD_NAME, uploadPreset: UPLOAD_PRESET };
}

export function isCloudinaryConfigured(): boolean {
  return Boolean(CLOUD_NAME && UPLOAD_PRESET);
}

/**
 * Upload a single File to Cloudinary using the unsigned preset.
 * Returns the secure URL and metadata.
 *
 * The `auto` resource type lets Cloudinary route by MIME — images, videos,
 * audio, and raw files (PDFs etc.) all work with the same call.
 */
export async function uploadToCloudinary(
  file: File,
  options: {
    onProgress?: (pct: number) => void;
    folder?: string;
    signal?: AbortSignal;
  } = {}
): Promise<CloudinaryAsset> {
  const { cloudName, uploadPreset } = assertConfigured();

  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", uploadPreset);
  if (options.folder) form.append("folder", options.folder);

  // Use XHR (not fetch) so we get real progress events.
  return new Promise<CloudinaryAsset>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && options.onProgress) {
        options.onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new CloudinaryUploadError(`Upload failed (${xhr.status}): ${xhr.responseText.slice(0, 200)}`));
        return;
      }
      try {
        const data = JSON.parse(xhr.responseText);
        resolve({
          url:          data.secure_url,
          publicId:     data.public_id,
          resourceType: data.resource_type,
          format:       data.format,
          bytes:        data.bytes,
          originalName: file.name,
        });
      } catch (e) {
        reject(new CloudinaryUploadError(`Could not parse Cloudinary response: ${(e as Error).message}`));
      }
    };

    xhr.onerror   = () => reject(new CloudinaryUploadError("Network error during upload."));
    xhr.ontimeout = () => reject(new CloudinaryUploadError("Upload timed out."));

    if (options.signal) {
      options.signal.addEventListener("abort", () => { xhr.abort(); reject(new CloudinaryUploadError("Upload cancelled.")); });
    }

    xhr.send(form);
  });
}

/**
 * Upload many files in sequence, reporting overall progress.
 * Sequential, not parallel — keeps the user's connection sane on mobile,
 * and Cloudinary's free tier rate-limits concurrent uploads anyway.
 */
export async function uploadManyToCloudinary(
  files: File[],
  options: {
    onProgress?: (completed: number, total: number, currentPct: number) => void;
    folder?: string;
    signal?: AbortSignal;
  } = {}
): Promise<CloudinaryAsset[]> {
  const out: CloudinaryAsset[] = [];
  for (let i = 0; i < files.length; i++) {
    const asset = await uploadToCloudinary(files[i], {
      folder: options.folder,
      signal: options.signal,
      onProgress: (pct) => options.onProgress?.(i, files.length, pct),
    });
    out.push(asset);
    options.onProgress?.(i + 1, files.length, 100);
  }
  return out;
}
