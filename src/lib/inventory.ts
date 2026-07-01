import Product from '@/models/Product';

export async function deductOrderStock(items: any[]) {
  for (const item of items) {
    try {
      const pId = String(item.id || item.productId || '');
      if (!pId) continue;

      const [mongoId, ...variantParts] = pId.split('-');
      const variantValue = variantParts.join('-');

      const product = await Product.findById(mongoId);
      if (!product) continue;

      if (product.trackInventory) {
        if (variantValue) {
          // Find variant and decrement stock
          const variantIndex = product.variants.findIndex((v: any) => v.value === variantValue);
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
