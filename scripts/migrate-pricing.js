const mongoose = require('mongoose');

async function main() {
  const uri = "mongodb://127.0.0.1:27017/vivasaya_ullagam";
  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB via Mongoose for pricing migration.");
    
    const db = mongoose.connection.db;
    const productsCollection = db.collection('products');
    const products = await productsCollection.find({}).toArray();
    console.log(`Found ${products.length} products to migrate.`);

    let migratedCount = 0;
    for (const p of products) {
      const updateDoc = {};
      const unsetFields = { compareAtPrice: "", comparePrice: "" };

      // 1. Core product pricing fields
      // Default sellingPrice to p.price
      const sellingPrice = p.sellingPrice !== undefined ? p.sellingPrice : p.price;
      const mrp = p.mrp !== undefined ? p.mrp : p.compareAtPrice;
      const unit = p.unit !== undefined ? p.unit : (p.weightUnit || 'g');

      updateDoc.sellingPrice = Number(sellingPrice || 0);
      updateDoc.mrp = Number(mrp || 0);
      updateDoc.unit = unit;
      updateDoc.weightUnit = unit;

      // 2. Base weight pricing fields
      const base_price_1kg = p.base_price_1kg !== undefined ? p.base_price_1kg : 0;
      updateDoc.base_price_1kg = Number(base_price_1kg);

      // Proportional base MRP calculation
      let base_mrp_1kg = 0;
      if (base_price_1kg > 0 && mrp > 0 && sellingPrice > 0) {
        base_mrp_1kg = Math.round((mrp / sellingPrice) * base_price_1kg);
      }
      updateDoc.base_mrp_1kg = Number(base_mrp_1kg);

      // 3. Variants
      if (Array.isArray(p.variants) && p.variants.length > 0) {
        updateDoc.variants = p.variants.map(v => {
          const vSellingPrice = v.sellingPrice !== undefined ? v.sellingPrice : v.price;
          let vMrp = v.mrp !== undefined ? v.mrp : 0;

          // If variant MRP doesn't exist, compute proportionally
          if (!vMrp && mrp > 0 && sellingPrice > 0 && vSellingPrice > 0) {
            vMrp = Math.round((mrp / sellingPrice) * vSellingPrice);
          }

          return {
            ...v,
            sellingPrice: Number(vSellingPrice || 0),
            mrp: Number(vMrp || 0),
            price: Number(vSellingPrice || 0), // compatibility
            compareAtPrice: Number(vMrp || 0), // compatibility
            unit: v.unit !== undefined ? v.unit : unit
          };
        });
      }

      await productsCollection.updateOne(
        { _id: p._id },
        { 
          $set: updateDoc,
          $unset: unsetFields 
        }
      );
      migratedCount++;
    }

    console.log(`✓ Successfully migrated ${migratedCount} products to the new pricing schema!`);
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await mongoose.disconnect();
  }
}

main();
