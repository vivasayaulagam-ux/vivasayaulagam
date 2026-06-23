import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { products as staticProducts, Product } from "@/data/products";
import dbConnect from "@/lib/db";
import SettingModel from "@/models/Setting";
import CategoryModel from "@/models/Category";
import ShopPageClient from "./ShopPageClient";
import { getProducts } from "@/lib/productService";

export const revalidate = 0; // Ensure data is never cached

type SettingsDoc = {
  key: string;
  value: unknown;
};

export default async function ShopPage(props: { searchParams: Promise<{ category?: string; sort?: string; page?: string; maxPrice?: string }> }) {
  const resolvedParams = await props.searchParams;
  const category = resolvedParams.category || "all";
  const sort = resolvedParams.sort || "Featured";
  const pageStr = resolvedParams.page || "1";
  const maxPriceStr = resolvedParams.maxPrice;

  let liveProducts: Product[] = [];
  let settingsMap: Record<string, unknown> = {};
  let totalProductsCount = 0;
  let maxProductPriceLimit = 2000;
  let dbCategoriesList: any[] = [];

  try {
    await dbConnect();
    
    // Fetch settings
    const settings = await SettingModel.find().lean<SettingsDoc[]>();
    settingsMap = settings.reduce<Record<string, unknown>>((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    // Fetch categories from DB
    const dbCats = await CategoryModel.find()
      .select('name emoji slug bgColor isVisible order parentId image redirectUrl')
      .sort({ order: 1, name: 1 })
      .lean();

    dbCategoriesList = (dbCats || [])
      .filter((c: any) => c.isVisible !== false)
      .map((c: any) => ({
        id: c._id.toString(),
        name: c.name,
        slug: c.slug || c.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'),
        emoji: c.emoji || '📦',
        bgColor: c.bgColor || 'from-green-50 to-green-100'
      }));

    // Fetch products using unified service
    const result = await getProducts({
      category: category !== "all" ? category : undefined,
      maxPrice: maxPriceStr || undefined,
      sort: sort,
      page: pageStr,
      limit: 24,
      status: "active"
    });

    liveProducts = result.products as any[];
    totalProductsCount = result.totalProducts;
    maxProductPriceLimit = result.maxProductPriceLimit;

  } catch (err) {
    console.error("Failed to fetch live shop products:", err);
  }

  // Combine database products with default static ones
  const combinedProducts = [...liveProducts, ...staticProducts];

  const paginationInfo = {
    totalProducts: totalProductsCount,
    currentPage: Math.max(1, parseInt(pageStr, 10)),
    totalPages: Math.ceil(totalProductsCount / 24),
    limit: 24
  };

  return (
    <>
      <Navbar />
      {/* Push content below fixed navbar */}
      <div className="pt-[var(--navbar-height)] bg-white min-h-screen flex flex-col justify-between">
        <ShopPageClient 
          initialProducts={combinedProducts} 
          categories={dbCategoriesList}
          pagination={paginationInfo} 
          maxProductPriceLimit={maxProductPriceLimit}
          settings={settingsMap} 
        />
        <Footer />
      </div>
    </>
  );
}
