export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatPrice(price: number): string {
  return `₹${Number(price || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function renderStars(rating: number): string {
  return "⭐".repeat(Math.floor(rating));
}

export function normalizeSinglePath(pathVal: any): string | null {
  if (!pathVal || typeof pathVal !== 'string') return null;
  let cleaned = pathVal.trim();
  if (!cleaned) return null;

  // Handle localhost asset path issues: strip localhost domain & port
  if (cleaned.includes("localhost:")) {
    const uploadsIdx = cleaned.indexOf("uploads/");
    if (uploadsIdx !== -1) {
      cleaned = "/" + cleaned.substring(uploadsIdx);
    }
  }

  // If it starts with http://, https://, data:, or starts with //, use as-is
  if (cleaned.match(/^https?:\/\//i) || cleaned.startsWith("data:") || cleaned.startsWith("//")) {
    return cleaned;
  }

  // Normalize backslashes to forward slashes for Linux compatibility
  cleaned = cleaned.replace(/\\/g, "/");

  // Extract from "uploads/" if present (handles absolute path like /var/www/.../public/uploads/file.jpg or uploads/file.jpg)
  const uploadsIdx = cleaned.indexOf("uploads/");
  if (uploadsIdx !== -1) {
    return "/" + cleaned.substring(uploadsIdx);
  }

  // If it starts with /uploads, use directly
  if (cleaned.startsWith("/uploads")) {
    return cleaned;
  }

  // Add leading slash if missing
  if (!cleaned.startsWith("/")) {
    return "/" + cleaned;
  }

  return cleaned;
}

export function normalizeProductImage(product: any): string {
  if (!product) return "/placeholder.svg";

  // Fields to search in priority order
  const fields = ['image', 'images', 'imageUrl', 'thumbnail', 'gallery'];

  for (const field of fields) {
    const val = product[field];
    if (!val) continue;

    if (typeof val === 'string') {
      const normalized = normalizeSinglePath(val);
      if (normalized) return normalized;
    } else if (Array.isArray(val)) {
      for (const item of val) {
        if (!item) continue;
        if (typeof item === 'string') {
          const normalized = normalizeSinglePath(item);
          if (normalized) return normalized;
        } else if (typeof item === 'object') {
          const innerVal = item.url || item.path || item.src;
          if (innerVal && typeof innerVal === 'string') {
            const normalized = normalizeSinglePath(innerVal);
            if (normalized) return normalized;
          }
        }
      }
    } else if (typeof val === 'object') {
      const innerVal = val.url || val.path || val.src;
      if (innerVal && typeof innerVal === 'string') {
        const normalized = normalizeSinglePath(innerVal);
        if (normalized) return normalized;
      }
    }
  }

  return "/placeholder.svg";
}

export function normalizeImageUrl(src: string): string {
  return normalizeSinglePath(src) || "";
}

export function getFullImageUrl(src: string): string {
  const normalized = normalizeSinglePath(src);
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

export function getProductRatingSummary(product: any, reviewsArray?: any[]) {
  let rating = 0;
  let count = 0;

  if (product) {
    const ratingField = product.averageRating !== undefined ? product.averageRating :
                        product.rating !== undefined ? product.rating :
                        product.ratingsAverage !== undefined ? product.ratingsAverage : 0;
    
    const countField = product.reviewCount !== undefined ? product.reviewCount :
                       product.reviewsCount !== undefined ? product.reviewsCount :
                       product.totalReviews !== undefined ? product.totalReviews : 0;
    
    rating = Number(ratingField) || 0;
    count = Number(countField) || 0;
  }

  const reviews = reviewsArray || product?.reviews;
  if (Array.isArray(reviews)) {
    const approvedReviews = reviews.filter((r: any) => !r.status || r.status === 'approved');
    const actualCount = approvedReviews.length;
    let actualRating = 0;
    if (actualCount > 0) {
      const sum = approvedReviews.reduce((acc: number, r: any) => acc + (Number(r.rating) || 0), 0);
      actualRating = Number((sum / actualCount).toFixed(1));
    }
    rating = actualRating;
    count = actualCount;
  }

  return {
    averageRating: rating,
    reviewCount: count
  };
}

