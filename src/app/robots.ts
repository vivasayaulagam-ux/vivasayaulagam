import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://vivasayaulagam.com').replace(/\/+$/, '');

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/shop',
          '/product/',
          '/categories',
          '/about-us',
          '/contact',
          '/delivery-info',
          '/privacy-policy',
          '/terms-and-conditions',
          '/uploads/',
          '/api/feeds/',
        ],
        disallow: [
          '/admin/',
          '/api/admin/',
          '/api/auth/',
          '/checkout',
          '/account',
          '/guest-order/',
        ],
      },
      {
        userAgent: [
          'facebookexternalhit',
          'Facebot',
          'Meta-ExternalAgent',
          'Meta-ExternalFetcher',
        ],
        allow: [
          '/',
          '/shop',
          '/product/',
          '/uploads/',
          '/api/feeds/',
        ],
        disallow: [
          '/admin/',
          '/api/admin/',
          '/api/auth/',
          '/checkout',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
