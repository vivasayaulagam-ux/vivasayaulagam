import dbConnect from '../db';
import Product from '@/models/Product';
import { mapProductToShoppingItems, buildSkuFrequencyMap, deduplicateFeedItems, ShoppingFeedItem } from './productMapper';
import { getBaseUrl, escapeXml } from './urlHelpers';

/**
 * Generates the XML string for Google Merchant Center & YouTube Shopping RSS 2.0 feed.
 */
export async function generateGoogleXmlFeed(req?: Request): Promise<string> {
  await dbConnect();

  const baseUrl = getBaseUrl(req);
  const products = await Product.find({ status: 'active' }).lean();

  return buildGoogleXmlFeed(products, baseUrl);
}

export function buildGoogleXmlFeed(products: any[], baseUrl: string): string {
  const skuFreqMap = buildSkuFrequencyMap(products);

  const rawItems: ShoppingFeedItem[] = [];
  products.forEach((p: any) => {
    if (p.enableShoppingSync !== false) {
      const items = mapProductToShoppingItems(p, baseUrl, skuFreqMap);
      rawItems.push(...items);
    }
  });

  const allItems = deduplicateFeedItems(rawItems);

  const xmlItems = allItems.map((item) => {
    const itemGroupIdTag = item.item_group_id ? `<g:item_group_id>${escapeXml(item.item_group_id)}</g:item_group_id>` : '';
    const salePriceTag = item.sale_price ? `<g:sale_price>${escapeXml(item.sale_price)}</g:sale_price>` : '';
    const weightTag = item.shipping_weight ? `<g:shipping_weight>${escapeXml(item.shipping_weight)}</g:shipping_weight>` : '';
    const shippingLabelTag = item.shipping_label ? `<g:shipping_label>${escapeXml(item.shipping_label)}</g:shipping_label>` : '';
    const additionalImages = item.additional_image_links
      .map(img => `<g:additional_image_link>${escapeXml(img)}</g:additional_image_link>`)
      .join('\n        ');

    return `    <item>
      <g:id>${escapeXml(item.id)}</g:id>
      <g:title>${escapeXml(item.title)}</g:title>
      <g:description>${escapeXml(item.description)}</g:description>
      <g:link>${escapeXml(item.link)}</g:link>
      <g:image_link>${escapeXml(item.image_link)}</g:image_link>
      ${additionalImages ? `${additionalImages}` : ''}
      <g:availability>${escapeXml(item.availability)}</g:availability>
      <g:condition>${escapeXml(item.condition)}</g:condition>
      <g:price>${escapeXml(item.price)}</g:price>
      ${salePriceTag}
      <g:brand>${escapeXml(item.brand)}</g:brand>
      <g:google_product_category>${escapeXml(item.google_product_category)}</g:google_product_category>
      <g:product_type>${escapeXml(item.product_type)}</g:product_type>
      ${weightTag}
      ${shippingLabelTag}
      ${itemGroupIdTag}
    </item>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Vivasaya Ulagam Product Feed (Google Merchant Center &amp; YouTube Shopping)</title>
    <link>${escapeXml(baseUrl)}</link>
    <description>Premium organic Tamil Nadu products direct from local farms</description>
${xmlItems}
  </channel>
</rss>`;
}
