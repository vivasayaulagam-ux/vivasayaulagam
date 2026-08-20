import { Metadata } from 'next';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import { getProductPrices } from '@/lib/pricing';
import { getBaseUrl, toAbsoluteProductUrl, toAbsoluteImageUrl, sanitizeDescription } from '@/lib/shopping/urlHelpers';

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await props.params;
  const baseUrl = getBaseUrl();

  try {
    await dbConnect();
    let product = null;

    if (mongoose.isValidObjectId(params.id)) {
      product = await Product.findById(params.id).lean();
    }
    if (!product) {
      product = await Product.findOne({ seoSlug: params.id }).lean();
    }

    if (!product) {
      return {
        title: 'Product Not Found — Vivasaya Ulagam',
        description: 'The requested product could not be found.',
      };
    }

    const title = product.seoTitle || `${product.title} — Vivasaya Ulagam`;
    const description = sanitizeDescription(product.seoDescription || product.description || product.title);
    const canonicalUrl = toAbsoluteProductUrl(product.seoSlug, product._id?.toString(), baseUrl);

    const rawImages: string[] = Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : [product.image || '/placeholder.svg'];
    const imageUrls = rawImages.map(img => toAbsoluteImageUrl(img, baseUrl)).filter(Boolean);

    return {
      title,
      description,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title: product.title,
        description,
        url: canonicalUrl,
        siteName: 'Vivasaya Ulagam',
        images: imageUrls.map(url => ({ url, width: 800, height: 800, alt: product.title })),
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: product.title,
        description,
        images: imageUrls,
      },
    };
  } catch (err) {
    return {
      title: 'Vivasaya Ulagam — Premium Organic Products',
      description: 'Premium organic local foods direct from Tamil Nadu farms.',
    };
  }
}

export default async function ProductLayout(props: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const baseUrl = getBaseUrl();
  let jsonLd = null;

  try {
    await dbConnect();
    let product: any = null;

    if (mongoose.isValidObjectId(params.id)) {
      product = await Product.findById(params.id).lean();
    }
    if (!product) {
      product = await Product.findOne({ seoSlug: params.id }).lean();
    }

    if (product) {
      const canonicalUrl = toAbsoluteProductUrl(product.seoSlug, product._id?.toString(), baseUrl);
      const rawImages: string[] = Array.isArray(product.images) && product.images.length > 0
        ? product.images
        : [product.image || '/placeholder.svg'];
      const imageUrls = rawImages.map(img => toAbsoluteImageUrl(img, baseUrl)).filter(Boolean);

      const { sellingPrice } = getProductPrices(product);
      const isOutOfStock = product.trackInventory && (product.quantity ?? 0) <= 0 && !product.continueSelling;

      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.title,
        image: imageUrls,
        description: sanitizeDescription(product.description || product.title),
        sku: product.sku || product._id?.toString() || params.id,
        brand: {
          '@type': 'Brand',
          name: product.vendor?.trim() || 'Vivasaya Ulagam',
        },
        offers: {
          '@type': 'Offer',
          url: canonicalUrl,
          priceCurrency: 'INR',
          price: sellingPrice,
          availability: isOutOfStock ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
          itemCondition: 'https://schema.org/NewCondition',
        },
      };
    }
  } catch (err) {
    console.error('Failed to generate product JSON-LD:', err);
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {props.children}
    </>
  );
}
