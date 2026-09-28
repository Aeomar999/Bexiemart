import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { logger } from "../logger";

export type UploadableFile = {
  uri: string;
  name: string;
  type: string;
  /** Web only: the browser File/Blob behind `uri`. */
  file?: Blob;
};

// Longest edge sent to the server. Plenty for full-screen zoom on a phone, and
// turns a 3–10MB camera photo into a few hundred KB — which matters on mobile
// data and keeps every upload far below the server's 10MB cap.
export const MAX_IMAGE_DIMENSION = 2048;
const JPEG_QUALITY = 0.8;

const stripExtension = (name: string) => name.replace(/\.[^./]+$/, "") || "photo";

/**
 * Re-encode a picked image into something every client can render and the
 * server accepts: HEIC/HEIF/AVIF/GIF become JPEG and oversized photos are
 * scaled down. PNGs stay PNG so logos keep their transparency.
 */
export async function prepareImageForUpload(file: UploadableFile): Promise<UploadableFile> {
  const keepPng = /png$/i.test(file.type);
  try {
    let image = await ImageManipulator.manipulate(file.uri).renderAsync();
    if (Math.max(image.width, image.height) > MAX_IMAGE_DIMENSION) {
      image = await ImageManipulator.manipulate(image)
        .resize(
          image.width >= image.height
            ? { width: MAX_IMAGE_DIMENSION }
            : { height: MAX_IMAGE_DIMENSION }
        )
        .renderAsync();
    }
    const saved = await image.saveAsync(
      keepPng ? { format: SaveFormat.PNG } : { format: SaveFormat.JPEG, compress: JPEG_QUALITY }
    );
    return {
      uri: saved.uri,
      name: `${stripExtension(file.name)}.${keepPng ? "png" : "jpg"}`,
      type: keepPng ? "image/png" : "image/jpeg",
    };
  } catch (error) {
    // Never block an upload on preprocessing: the server still validates the
    // file and converts HEIC itself.
    logger.error("Image preprocessing failed; uploading original", error);
    return file;
  }
}
