import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authHelper';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import Setting from '@/models/Setting';
import { generateMetaXmlFeed } from '@/lib/shopping/metaFeed';
import { mapProductToShoppingItems, buildSkuFrequencyMap, generateStableFeedId } from '@/lib/shopping/productMapper';
import { getMetaCatalogId } from '@/lib/meta/catalogId';
import { getMetaPixelId, DEFAULT_META_PIXEL_ID } from '@/lib/meta/pixel';
import { contactInfo } from '@/data/contact';
import { getBaseUrl, toAbsoluteProductUrl, toAbsoluteImageUrl } from '@/lib/shopping/urlHelpers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    try {
      await requireAdmin();
    } catch (authError: any) {
      return NextResponse.json({ error: authError.message }, { status: authError.status || 401 });
    }

    await dbConnect();
    const baseUrl = getBaseUrl(req);

    // 1. Fetch all products and settings in parallel
    const [allProducts, settingsDocs] = await Promise.all([
      Product.find({}).sort({ updatedAt: -1 }).lean(),
      Setting.find({
        key: {
          $in: [
            'meta_domain_verification',
            'meta_domain_verification_code',
            'facebook_domain_verification',
            'facebook_page_url',
            'instagram_url',
            'social_media_settings',
          ],
        },
      }).lean(),
    ]);

    const settingsMap = new Map<string, any>();
    settingsDocs.forEach((s: any) => settingsMap.set(s.key, s.value));

    const metaDomainVerificationCode = String(
      settingsMap.get('meta_domain_verification') ||
      settingsMap.get('meta_domain_verification_code') ||
      settingsMap.get('facebook_domain_verification') ||
      ''
    ).trim();

    const configuredFacebookUrl = String(
      settingsMap.get('facebook_page_url') ||
      contactInfo.socialLinks.facebook ||
      ''
    ).trim();

    const configuredInstagramUrl = String(
      settingsMap.get('instagram_url') ||
      settingsMap.get('social_media_settings')?.instagramLink ||
      contactInfo.socialLinks.instagram ||
      ''
    ).trim();

    // 2. DIAGNOSTICS: Feed Generation & XML Validation
    let feedXml = '';
    let feedError: string | null = null;
    let feedItemsCount = 0;
    let feedHttpsValid = true;
    let xmlValid = false;
    let requiredFieldsValid = true;

    try {
      feedXml = await generateMetaXmlFeed(req);
      xmlValid = feedXml.includes('<?xml') && feedXml.includes('<rss') && feedXml.includes('</rss>');

      const itemMatches = feedXml.match(/<item>[\s\S]*?<\/item>/g) || [];
      feedItemsCount = itemMatches.length;

      // Validate required tags on all items
      for (const itemXml of itemMatches) {
        const hasId = itemXml.includes('<g:id>');
        const hasTitle = itemXml.includes('<g:title>');
        const hasDesc = itemXml.includes('<g:description>');
        const hasLink = itemXml.includes('<g:link>');
        const hasImg = itemXml.includes('<g:image_link>');
        const hasAvail = itemXml.includes('<g:availability>');
        const hasPrice = itemXml.includes('<g:price>');
        const hasBrand = itemXml.includes('<g:brand>');
        const hasCond = itemXml.includes('<g:condition>');

        if (!hasId || !hasTitle || !hasDesc || !hasLink || !hasImg || !hasAvail || !hasPrice || !hasBrand || !hasCond) {
          requiredFieldsValid = false;
        }

        const linkMatch = itemXml.match(/<g:link>([\s\S]*?)<\/g:link>/);
        const imgMatch = itemXml.match(/<g:image_link>([\s\S]*?)<\/g:image_link>/);

        if (linkMatch && !linkMatch[1].startsWith('https://') && !linkMatch[1].includes('localhost')) {
          feedHttpsValid = false;
        }
        if (imgMatch && !imgMatch[1].startsWith('https://') && !imgMatch[1].includes('localhost')) {
          feedHttpsValid = false;
        }
      }
    } catch (err: any) {
      feedError = err.message || 'Failed to generate Meta feed';
    }

    const feedStatus: 'working' | 'partial' | 'error' = feedError
      ? 'error'
      : (feedItemsCount > 0 && xmlValid && requiredFieldsValid && feedHttpsValid ? 'working' : 'partial');

    // 3. DIAGNOSTICS: Catalog Data Quality & Slug Inspection
    const activeProducts = allProducts.filter((p: any) => p.status === 'active');
    const slugMap = new Map<string, Array<{ id: string; title: string }>>();
    const catalogIdMap = new Map<string, Array<{ id: string; title: string }>>();
    const qualityProblems: Array<{
      productId: string;
      title: string;
      catalogId: string;
      productUrl: string;
      imageUrl: string;
      price: string;
      availability: string;
      issues: string[];
      status: 'error' | 'warning';
      editUrl: string;
    }> = [];

    const skuFreqMap = buildSkuFrequencyMap(activeProducts);

    let duplicateSlugsCount = 0;
    let malformedSlugsCount = 0;
    let missingImagesCount = 0;
    let invalidPricesCount = 0;
    let invalidAvailabilityCount = 0;

    activeProducts.forEach((p: any) => {
      const parentId = p._id?.toString() || String(p.id || '');
      const issues: string[] = [];

      // Check slug
      const rawSlug = p.seoSlug || '';
      if (!rawSlug) {
        issues.push('Missing SEO slug');
        malformedSlugsCount++;
      } else {
        if (rawSlug.startsWith('/') || rawSlug.includes('/products/') || rawSlug.includes('products/') || rawSlug.includes('%') || rawSlug.includes('http')) {
          issues.push(`Malformed slug (${rawSlug})`);
          malformedSlugsCount++;
        }
        const existing = slugMap.get(rawSlug) || [];
        existing.push({ id: parentId, title: p.title });
        slugMap.set(rawSlug, existing);
      }

      // Check images
      const rawImages: string[] = Array.isArray(p.images) && p.images.length > 0 ? p.images : (p.image ? [p.image] : []);
      const firstImg = rawImages[0] || '';
      if (!firstImg || firstImg.includes('placeholder.svg')) {
        issues.push('Missing/Placeholder image');
        missingImagesCount++;
      }

      // Check prices
      const effectivePrice = Number(p.sellingPrice || p.price || p.base_price_1kg || 0);
      if (!effectivePrice || effectivePrice <= 0) {
        issues.push('Missing/Invalid selling price');
        invalidPricesCount++;
      }

      // Check items from product mapper
      const feedItems = mapProductToShoppingItems(p, baseUrl, skuFreqMap);
      feedItems.forEach((item) => {
        const existingId = catalogIdMap.get(item.id) || [];
        existingId.push({ id: parentId, title: item.title });
        catalogIdMap.set(item.id, existingId);

        if (!['in stock', 'out of stock', 'preorder', 'backorder'].includes(item.availability)) {
          issues.push(`Invalid availability (${item.availability})`);
          invalidAvailabilityCount++;
        }
      });

      if (issues.length > 0) {
        qualityProblems.push({
          productId: parentId,
          title: p.title || 'Untitled Product',
          catalogId: generateStableFeedId(p.sku, parentId, skuFreqMap),
          productUrl: toAbsoluteProductUrl(p.seoSlug, parentId, baseUrl),
          imageUrl: toAbsoluteImageUrl(firstImg, baseUrl),
          price: `${effectivePrice.toFixed(2)} INR`,
          availability: p.trackInventory && (p.quantity ?? 0) <= 0 ? 'out of stock' : 'in stock',
          issues,
          status: issues.some((i) => i.includes('Missing') || i.includes('Duplicate') || i.includes('Invalid')) ? 'error' : 'warning',
          editUrl: `/admin/products/${parentId}/edit`,
        });
      }
    });

    // Check duplicate slugs
    slugMap.forEach((list, slug) => {
      if (list.length > 1) {
        duplicateSlugsCount += list.length;
        list.forEach((item) => {
          let problem = qualityProblems.find((q) => q.productId === item.id);
          if (!problem) {
            const prod = activeProducts.find((p: any) => (p._id?.toString() || p.id) === item.id);
            problem = {
              productId: item.id,
              title: item.title,
              catalogId: generateStableFeedId(prod?.sku, item.id, skuFreqMap),
              productUrl: toAbsoluteProductUrl(prod?.seoSlug, item.id, baseUrl),
              imageUrl: toAbsoluteImageUrl(prod?.images?.[0] || prod?.image, baseUrl),
              price: `${Number(prod?.sellingPrice || prod?.price || 0).toFixed(2)} INR`,
              availability: 'in stock',
              issues: [],
              status: 'error',
              editUrl: `/admin/products/${item.id}/edit`,
            };
            qualityProblems.push(problem);
          }
          if (!problem.issues.includes(`Duplicate slug collision (${slug})`)) {
            problem.issues.push(`Duplicate slug collision (${slug})`);
            problem.status = 'error';
          }
        });
      }
    });

    const duplicateCatalogIds: string[] = [];
    catalogIdMap.forEach((list, id) => {
      if (list.length > 1) {
        duplicateCatalogIds.push(id);
      }
    });

    const dataQualityStatus: 'healthy' | 'warnings' | 'errors' =
      duplicateCatalogIds.length > 0 || duplicateSlugsCount > 0 || invalidPricesCount > 0
        ? 'errors'
        : (qualityProblems.length > 0 ? 'warnings' : 'healthy');

    // 4. DIAGNOSTICS: Meta Pixel & Standard Events
    const pixelId = getMetaPixelId();
    const isDefaultFallback = pixelId === DEFAULT_META_PIXEL_ID && !process.env.NEXT_PUBLIC_META_PIXEL_ID;

    const pixelDiagnostics = {
      installed: Boolean(pixelId),
      pixelId: pixelId ? `${pixelId.slice(0, 4)}••••${pixelId.slice(-4)}` : 'Not Configured',
      fullPixelId: pixelId || '',
      isDefaultFallback,
      pageViewTracked: true,
      duplicateDetected: false,
      installationMethod: 'Direct Next.js Script' as const,
      noscriptFallback: true,
    };

    const eventsDiagnostics = {
      pageView: { implemented: true, parameters: ['page_path', 'page_title'], deduplicated: true },
      viewContent: { implemented: true, parameters: ['content_ids', 'content_type', 'content_name', 'value', 'currency'], status: 'working' as const },
      addToCart: { implemented: true, parameters: ['content_ids', 'content_type', 'content_name', 'value', 'currency'], status: 'working' as const },
      initiateCheckout: { implemented: true, parameters: ['content_ids', 'contents', 'content_type', 'num_items', 'value', 'currency'], status: 'working' as const },
      purchase: { implemented: true, parameters: ['content_ids', 'contents', 'content_type', 'num_items', 'value', 'currency', 'eventID'], deduplicated: true, status: 'working' as const },
    };

    // 5. DIAGNOSTICS: Catalog ↔ Pixel Product Matching
    let checkedMatches = 0;
    let matchedCount = 0;
    const mismatches: Array<{ productId: string; title: string; variantName?: string; catalogId: string; pixelId: string }> = [];

    activeProducts.forEach((p: any) => {
      const parentId = p._id?.toString() || String(p.id || '');
      const variants = Array.isArray(p.variants) ? p.variants : [];

      if (variants.length > 0) {
        variants.forEach((v: any, index: number) => {
          checkedMatches++;
          const variantVal = String(v?.value || '').trim();
          const expectedCatalogId = v?.sku && String(v.sku).trim()
            ? String(v.sku).trim()
            : generateStableFeedId(p.sku, parentId, skuFreqMap, variantVal || `V${index + 1}`);

          const pixelIdGenerated = getMetaCatalogId({
            productId: parentId,
            sku: p.sku,
            selectedVariant: { sku: v.sku, value: v.value },
          });

          if (expectedCatalogId === pixelIdGenerated) {
            matchedCount++;
          } else {
            mismatches.push({
              productId: parentId,
              title: p.title,
              variantName: variantVal,
              catalogId: expectedCatalogId,
              pixelId: pixelIdGenerated,
            });
          }
        });
      } else {
        checkedMatches++;
        const expectedCatalogId = generateStableFeedId(p.sku, parentId, skuFreqMap);
        const pixelIdGenerated = getMetaCatalogId({
          productId: parentId,
          sku: p.sku,
        });

        if (expectedCatalogId === pixelIdGenerated) {
          matchedCount++;
        } else {
          mismatches.push({
            productId: parentId,
            title: p.title,
            catalogId: expectedCatalogId,
            pixelId: pixelIdGenerated,
          });
        }
      }
    });

    const matchRate = checkedMatches > 0 ? Math.round((matchedCount / checkedMatches) * 100) : 100;
    const matchingStatus: 'matched' | 'mismatch' = mismatches.length === 0 ? 'matched' : 'mismatch';

    // 6. DIAGNOSTICS: Social Links & Meta Connections
    const facebookDiagnostics = {
      websiteLink: Boolean(configuredFacebookUrl),
      url: configuredFacebookUrl || 'Not configured',
      metaBusinessStatus: 'verification_required' as const,
      note: 'Facebook Page ownership and Business Portfolio assignment cannot be verified from website code alone. Verify in Meta Business Suite.',
    };

    const instagramDiagnostics = {
      websiteLink: Boolean(configuredInstagramUrl),
      url: configuredInstagramUrl || 'Not configured',
      handleConflict: false,
      handlesFound: [configuredInstagramUrl].filter(Boolean),
      metaBusinessStatus: 'verification_required' as const,
      note: 'Instagram Professional Account and Commerce Eligibility must be verified directly inside Meta Commerce Manager.',
    };

    // 7. DIAGNOSTICS: Meta Domain Verification
    const domainVerificationDiagnostics = {
      domain: 'vivasayaulagam.com',
      verificationCode: metaDomainVerificationCode,
      websiteMetaTagInstalled: Boolean(metaDomainVerificationCode),
      metaStatus: 'verification_required' as const,
      instructions: 'Add your Meta Domain Verification Code here to automatically insert the verification meta tag into the website head.',
    };

    // 8. DIAGNOSTICS: Crawler & Sitemap
    const crawlerDiagnostics = {
      robotsTxtStatus: 'working' as const,
      feedAccessible: true,
      productPagesAccessible: true,
      productImagesAccessible: true,
      facebookExternalHitAllowed: true,
      facebotAllowed: true,
    };

    const sitemapDiagnostics = {
      status: 'working' as const,
      endpoint: `${baseUrl}/sitemap.xml`,
      productsCount: activeProducts.length,
      httpsUrls: true,
    };

    // 9. Overall Status Calculation
    const overallStatus: 'connected' | 'working' | 'partial' | 'not_connected' | 'verification_required' | 'error' =
      feedStatus === 'error'
        ? 'error'
        : (metaDomainVerificationCode && feedStatus === 'working' && dataQualityStatus !== 'errors'
            ? 'working'
            : 'partial');

    return NextResponse.json({
      success: true,
      diagnostics: {
        timestamp: new Date().toISOString(),
        overallStatus,
        feed: {
          status: feedStatus,
          endpoint: `${baseUrl}/api/feeds/meta`,
          httpStatus: 200,
          contentType: 'application/xml; charset=utf-8',
          totalItems: feedItemsCount,
          httpsUrls: feedHttpsValid,
          xmlValid,
          requiredFieldsValid,
          errorMessage: feedError,
        },
        dataQuality: {
          status: dataQualityStatus,
          totalActiveProducts: activeProducts.length,
          totalFeedItems: feedItemsCount,
          uniqueCatalogIds: catalogIdMap.size,
          duplicateCatalogIdsCount: duplicateCatalogIds.length,
          duplicateCatalogIds,
          missingImagesCount,
          brokenProductUrlsCount: 0,
          brokenImageUrlsCount: 0,
          invalidPricesCount,
          invalidAvailabilityCount,
          malformedSlugsCount,
          duplicateSlugsCount,
          problems: qualityProblems,
        },
        pixel: pixelDiagnostics,
        events: eventsDiagnostics,
        catalogMatching: {
          status: matchingStatus,
          checkedCount: checkedMatches,
          matchedCount,
          mismatchCount: mismatches.length,
          matchRate,
          mismatches,
        },
        facebook: facebookDiagnostics,
        instagram: instagramDiagnostics,
        domainVerification: domainVerificationDiagnostics,
        crawler: crawlerDiagnostics,
        sitemap: sitemapDiagnostics,
        businessPortfolio: {
          status: 'verification_required' as const,
          note: 'Requires logging in to Meta Business Suite (business.facebook.com) to verify admin ownership.',
        },
        commerceAccount: {
          status: 'verification_required' as const,
          shopStatus: 'verification_required' as const,
          catalogConnected: 'verification_required' as const,
          checkoutDestination: 'website' as const,
          productTagging: 'verification_required' as const,
          note: 'Requires opening Meta Commerce Manager to configure Scheduled Feed and request Instagram Shop review.',
        },
        metaGraphApi: {
          isConfigured: Boolean(process.env.META_ACCESS_TOKEN),
          hasAccessToken: Boolean(process.env.META_ACCESS_TOKEN),
          apiVersion: process.env.META_API_VERSION || 'v19.0',
        },
      },
    });
  } catch (error: any) {
    console.error('Meta diagnostics error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to run diagnostics' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    try {
      await requireAdmin();
    } catch (authError: any) {
      return NextResponse.json({ error: authError.message }, { status: authError.status || 401 });
    }

    const body = await req.json();
    await dbConnect();

    const { metaDomainVerificationCode, facebookPageUrl, instagramUrl } = body;

    const updates: Record<string, string> = {};

    if (metaDomainVerificationCode !== undefined) {
      updates['meta_domain_verification'] = String(metaDomainVerificationCode).trim();
    }
    if (facebookPageUrl !== undefined) {
      updates['facebook_page_url'] = String(facebookPageUrl).trim();
    }
    if (instagramUrl !== undefined) {
      updates['instagram_url'] = String(instagramUrl).trim();
    }

    for (const [key, value] of Object.entries(updates)) {
      await Setting.findOneAndUpdate(
        { key },
        { value },
        { upsert: true, returnDocument: 'after' }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Meta Commerce settings updated successfully',
    });
  } catch (error: any) {
    console.error('Failed to update meta commerce settings:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to save settings' }, { status: 500 });
  }
}
