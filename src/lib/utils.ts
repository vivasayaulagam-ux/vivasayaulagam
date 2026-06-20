export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatPrice(price: number): string {
  return `₹${Number(price || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function renderStars(rating: number): string {
  return "⭐".repeat(Math.floor(rating));
}

export function normalizeImageUrl(src: string): string {
  if (!src) return "";

  let url = src;

  // Handle localhost asset path issues: strip localhost domain & port
  if (url.includes("localhost:")) {
    const uploadsIdx = url.indexOf("uploads/");
    if (uploadsIdx !== -1) {
      url = "/" + url.substring(uploadsIdx);
    }
  }

  // If it's already an external HTTP/HTTPS URL or a base64 string, keep it as is
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }

  // Normalize backslashes to forward slashes
  url = url.replace(/\\/g, "/");

  // Extract /uploads/... relative path if it's nested
  const uploadsIdx = url.indexOf("uploads/");
  if (uploadsIdx !== -1) {
    url = "/" + url.substring(uploadsIdx);
  }

  // Ensure it starts with a single leading slash
  url = url.replace(/^\/+/, "/");

  return url;
}

export function getFullImageUrl(src: string): string {
  const normalized = normalizeImageUrl(src);
  if (!normalized) return "";
  if (normalized.startsWith("http://") || normalized.startsWith("https://") || normalized.startsWith("data:")) {
    return normalized;
  }
  // Prepend origin if in browser, otherwise return normalized relative path
  if (typeof window !== "undefined") {
    return `${window.location.origin}${normalized}`;
  }
  return normalized;
}

