import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import ProductsClient from '@/components/admin/products/ProductsClient';

export default async function ProductsPage() {
  await dbConnect();

  // 3. Fetch products to display
  const raw = await Product.find().sort({ createdAt: -1 }).lean();

  const products = raw.map((p: any) => ({
    _id: p._id.toString(),
    title: p.title,
    category: p.category || '',
    categories: p.categories || [],
    price: p.price,
    compareAtPrice: p.compareAtPrice || 0,
    quantity: p.quantity ?? 0,
    status: p.status as 'active' | 'draft',
    images: p.images || [],
    sku: p.sku || '',
    vendor: p.vendor || '',
    productType: p.productType || '',
    createdAt: p.createdAt?.toISOString() || new Date().toISOString(),
  }));

  return <ProductsClient products={products} />;
}
