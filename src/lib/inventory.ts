import Product from '@/models/Product';

export async function deductOrderStock(items: any[]) {
  for (const item of items) {
    try {
      const pId = String(item.productId || item.id || '');
      if (!pId) continue;

      const [mongoId, ...variantParts] = pId.split('-');
      const variantValue = item.variantName || variantParts.join('-');
      const variantId = String(item.variantId || '');

      const product = await Product.findById(mongoId);
      if (!product) continue;

      if (product.trackInventory) {
        if (variantId || variantValue) {
          // Find variant and decrement stock
          const variantIndex = product.variants.findIndex((variant: any) =>
            (variantId && String(variant._id || variant.id || '') === variantId) ||
            (variantValue && variant.value === variantValue)
          );
          if (variantIndex !== -1) {
            const currentStock = product.variants[variantIndex].stock || 0;
            product.variants[variantIndex].stock = Math.max(0, currentStock - item.quantity);
            product.markModified('variants');
          }
        } else {
          // Decrement product quantity
          const currentQty = product.quantity || 0;
          product.quantity = Math.max(0, currentQty - item.quantity);
        }
        await product.save();
      }
    } catch (err) {
      console.error(`Failed to deduct stock for item ${item.name || item.productId}:`, err);
    }
  }
}
