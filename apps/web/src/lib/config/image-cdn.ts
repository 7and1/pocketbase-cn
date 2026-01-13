import type { ImageCdnConfig } from "../../components/ui/OptimizedImage";

export const IMAGE_CDN_CONFIG: ImageCdnConfig = {
  quality: 75,
  formats: ["webp", "avif", "jpeg"],
};

export const IMAGE_BREAKPOINTS = [320, 640, 960, 1280, 1920, 2560] as const;

export const IMAGE_SIZES = {
  thumbnail: "(max-width: 640px) 100vw, 320px",
  card: "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 320px",
  feature: "(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 1200px",
  full: "100vw",
} as const;

export const THUMBNAIL_SIZES = {
  sm: "80x80",
  md: "160x160",
  lg: "320x320",
  xl: "640x640",
} as const;

export const getThumbnailUrl = (
  baseUrl: string,
  collection: string,
  recordId: string,
  filename: string,
  size: keyof typeof THUMBNAIL_SIZES = "md",
): string => {
  const thumb = THUMBNAIL_SIZES[size];
  return (
    baseUrl +
    "/api/files/" +
    collection +
    "/" +
    recordId +
    "/" +
    filename +
    "?thumb=" +
    thumb
  );
};

export const getOptimizedImageUrl = (
  baseUrl: string,
  collection: string,
  recordId: string,
  filename: string,
  width: number,
  quality?: number,
): string => {
  const actualQuality = quality ?? IMAGE_CDN_CONFIG.quality;
  return (
    baseUrl +
    "/api/files/" +
    collection +
    "/" +
    recordId +
    "/" +
    filename +
    "?thumb=" +
    width +
    "x0&quality=" +
    actualQuality
  );
};
