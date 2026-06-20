const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const parts = trimmed.split('=');
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      process.env[key] = val;
    }
  });
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vivasaya_ullagam';

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/&amp;/g, 'and')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const getEmojiForCategory = (slug) => {
  if (slug.includes('sweet') || slug.includes('snack')) return '🍪';
  if (slug.includes('oil') || slug.includes('ghee')) return '🥛';
  if (slug.includes('rice') || slug.includes('millet') || slug.includes('grain')) return '🌾';
  if (slug.includes('honey')) return '🍯';
  if (slug.includes('pickle') || slug.includes('thokku')) return '🌶️';
  if (slug.includes('herbal') || slug.includes('powder') || slug.includes('tea')) return '🍵';
  if (slug.includes('vegetable') || slug.includes('fruit') || slug.includes('green')) return '🥦';
  return '📦';
};

async function scrapeProducts() {
  console.log('Connecting to MongoDB at', MONGODB_URI);
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    const productsCollection = db.collection('products');
    const categoriesCollection = db.collection('categories');
    
    console.log('Successfully connected to database.');
    
    let paged = 1;
    let totalScraped = 0;
    let hasMore = true;
    
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    
    while (hasMore) {
      const shopPageUrl = `https://vivasayaulagam.com/?post_type=product&paged=${paged}`;
      console.log(`\n--- Fetching Shop Page ${paged}: ${shopPageUrl} ---`);
      
      let shopHtml;
      try {
        const response = await fetch(shopPageUrl, { headers: { 'User-Agent': userAgent } });
        if (response.status !== 200) {
          console.log(`Received status ${response.status}. Stopping pagination.`);
          hasMore = false;
          break;
        }
        shopHtml = await response.text();
      } catch (err) {
        console.error('Error fetching shop page:', err.message);
        hasMore = false;
        break;
      }
      
      const $ = cheerio.load(shopHtml);
      
      // Get all product links from loop
      const productLinks = [];
      $('ul.products li.product a.woocommerce-LoopProduct-link').each((i, el) => {
        const href = $(el).attr('href');
        if (href && !productLinks.includes(href)) {
          productLinks.push(href);
        }
      });
      
      if (productLinks.length === 0) {
        console.log('No product links found on page. Stopping.');
        hasMore = false;
        break;
      }
      
      console.log(`Found ${productLinks.length} product links on page ${paged}. Processing...`);
      
      for (const productUrl of productLinks) {
        try {
          console.log(`  Fetching product: ${productUrl}`);
          const res = await fetch(productUrl, { headers: { 'User-Agent': userAgent } });
          if (res.status !== 200) {
            console.log(`    Failed to fetch: status ${res.status}`);
            continue;
          }
          const productHtml = await res.text();
          const $p = cheerio.load(productHtml);
          
          // 1. Title
          const title = $p('h1.product_title').text().trim();
          if (!title) {
            console.log('    Could not extract title, skipping.');
            continue;
          }
          
          // 2. Category
          let categoryName = 'Organic Goods';
          $p('.posted_in a[rel="tag"]').each((i, el) => {
            const txt = $p(el).text().trim();
            if (txt) {
              categoryName = txt;
              return false; // take first category
            }
          });
          const categorySlug = slugify(categoryName);
          
          // Check/Create Category in DB
          const existingCategory = await categoriesCollection.findOne({ slug: categorySlug });
          if (!existingCategory) {
            console.log(`    Creating new Category: ${categoryName} (${categorySlug})`);
            await categoriesCollection.insertOne({
              name: categoryName,
              emoji: getEmojiForCategory(categorySlug),
              slug: categorySlug,
              bgColor: 'from-green-50 to-green-100',
              isVisible: true,
              order: 10,
              image: '',
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }
          
          // 3. Description
          let description = $p('.woocommerce-Tabs-panel--description').html() || '';
          if (!description) {
            description = $p('#tab-description').html() || '';
          }
          if (!description) {
            description = $p('.woocommerce-product-details__short-description').html() || '';
          }
          description = (description || '').trim();
          
          // 4. Images
          const images = [];
          $p('.woocommerce-product-gallery .woocommerce-product-gallery__image a').each((i, el) => {
            const href = $p(el).attr('href');
            if (href && !images.includes(href)) {
              images.push(href);
            }
          });
          $p('img[data-large_image]').each((i, el) => {
            const src = $p(el).attr('data-large_image');
            if (src && !images.includes(src)) {
              images.push(src);
            }
          });
          
          // Clean image URLs (remove query params from WordPress jetpack/i0.wp.com resizer)
          const cleanImages = images.map(img => {
            let clean = img;
            if (clean.includes('i0.wp.com/')) {
              clean = clean.split('i0.wp.com/')[1];
            }
            if (clean.includes('i1.wp.com/')) {
              clean = clean.split('i1.wp.com/')[1];
            }
            if (clean.includes('i2.wp.com/')) {
              clean = clean.split('i2.wp.com/')[1];
            }
            clean = clean.split('?')[0]; // remove resizing params
            if (!clean.startsWith('http')) {
              clean = 'https://' + clean;
            }
            return clean;
          });
          
          // 5. Pricing and Variants
          let basePrice = 0;
          let compareAtPrice = 0;
          const variants = [];
          
          // Check for variable variations JSON
          const variationsAttr = $p('form.variations_form').attr('data-product_variations');
          if (variationsAttr) {
            try {
              const decodedJson = variationsAttr
                .replace(/&quot;/g, '"')
                .replace(/&amp;/g, '&')
                .replace(/&#038;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>');
              const parsedVariations = JSON.parse(decodedJson);
              
              if (parsedVariations && parsedVariations.length > 0) {
                // Map variations
                parsedVariations.forEach(v => {
                  // Find weight attribute value
                  let val = '';
                  if (v.attributes) {
                    const keys = Object.keys(v.attributes);
                    const weightKey = keys.find(k => k.includes('weight') || k.includes('size'));
                    if (weightKey) {
                      val = v.attributes[weightKey];
                    } else if (keys.length > 0) {
                      val = v.attributes[keys[0]];
                    }
                  }
                  
                  if (!val) {
                    val = v.sku || 'Default';
                  }
                  
                  const vPrice = parseFloat(v.display_price || 0);
                  const vComparePrice = parseFloat(v.display_regular_price || 0);
                  
                  variants.push({
                    type: 'size',
                    value: val,
                    price: vPrice,
                    additionalPrice: 0, // In this model, selectedVariant.price is absolute if set
                    stock: v.is_in_stock ? 100 : 0
                  });
                });
                
                // Sort variants by price ascending and use lowest as base price
                variants.sort((a, b) => a.price - b.price);
                basePrice = variants[0]?.price || 0;
                
                // Extract compare price for base
                const matchedVar = parsedVariations.find(v => parseFloat(v.display_price) === basePrice);
                if (matchedVar) {
                  compareAtPrice = parseFloat(matchedVar.display_regular_price || 0);
                }
              }
            } catch (err) {
              console.error('    Error parsing product variations JSON:', err.message);
            }
          }
          
          // Single product pricing fallback
          if (basePrice === 0) {
            // Try single product price extraction
            let priceText = $p('.price').text().replace(/[\n\r]/g, '').trim();
            
            // Look for sale prices (ins and del)
            const insPrice = $p('.price ins .woocommerce-Price-amount').text().replace(/[^\d.]/g, '');
            const delPrice = $p('.price del .woocommerce-Price-amount').text().replace(/[^\d.]/g, '');
            
            if (insPrice) {
              basePrice = parseFloat(insPrice);
              compareAtPrice = delPrice ? parseFloat(delPrice) : 0;
            } else {
              const singlePrice = $p('.price .woocommerce-Price-amount').first().text().replace(/[^\d.]/g, '');
              basePrice = singlePrice ? parseFloat(singlePrice) : 0;
              compareAtPrice = 0;
            }
          }
          
          if (basePrice === 0) {
            console.log('    Price is 0 or could not be determined, setting default 199.');
            basePrice = 199;
          }
          
          // 6. Organization / SEO
          const cleanSlug = slugify(title);
          const weightString = variants.length > 0 ? variants[0].value : '250g';
          let weightVal = 0.25;
          let weightUnit = 'kg';
          
          const matchWeight = weightString.match(/^([\d.]+)\s*(g|kg|ml|l)$/i);
          if (matchWeight) {
            weightVal = parseFloat(matchWeight[1]);
            weightUnit = matchWeight[2].toLowerCase();
          }
          
          const productDoc = {
            title,
            description,
            images: cleanImages.length > 0 ? cleanImages : ['/uploads/organic-placeholder.png'],
            category: categorySlug,
            categories: [categorySlug],
            price: basePrice,
            compareAtPrice: compareAtPrice || Math.round(basePrice * 1.2),
            unitPrice: 0,
            chargeTax: false,
            costPerItem: Math.round(basePrice * 0.6),
            trackInventory: false,
            quantity: 100,
            sku: cleanSlug.slice(0, 10).toUpperCase(),
            barcode: '',
            continueSelling: true,
            isPhysical: true,
            weight: weightVal,
            weightUnit,
            variants,
            seoTitle: `${title} | Vivasaya Ulagam`,
            seoDescription: description.replace(/<[^>]+>/g, ' ').slice(0, 150).trim(),
            seoSlug: cleanSlug,
            status: 'active',
            productType: categoryName,
            vendor: 'Vivasaya Ulagam',
            collections: ['Featured Products'],
            tags: [categorySlug, 'organic', 'direct-farm'],
            themeTemplate: 'default',
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          // Insert or Update product in DB
          const existingProd = await productsCollection.findOne({ seoSlug: cleanSlug });
          if (existingProd) {
            console.log(`    Product exists. Updating: "${title}"`);
            await productsCollection.updateOne(
              { _id: existingProd._id },
              { $set: { ...productDoc, updatedAt: new Date() } }
            );
          } else {
            console.log(`    Inserting new product: "${title}"`);
            await productsCollection.insertOne(productDoc);
          }
          
          totalScraped++;
        } catch (err) {
          console.error(`    Error processing product details for ${productUrl}:`, err);
        }
      }
      
      paged++;
      // Safety limit: let's stop after page 8 to avoid overloading, or let it run.
      if (paged > 8) {
        console.log('Reached safety page limit of 8. Ending.');
        hasMore = false;
      }
    }
    
    console.log(`\n============================================`);
    console.log(`Scraping finished successfully!`);
    console.log(`Total products imported/updated: ${totalScraped}`);
    console.log(`============================================`);
    
  } catch (err) {
    console.error('Connection error:', err);
  } finally {
    await client.close();
  }
}

scrapeProducts();
