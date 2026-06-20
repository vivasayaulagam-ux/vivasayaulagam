"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Product } from "@/data/products";
import ProductCard from "@/components/ui/ProductCard";
import SectionTitle from "@/components/ui/SectionTitle";

interface ProductGridProps {
  title: string;
  subtitle?: string;
  products: Product[];
  id?: string;
  urgency?: string;
}

export default function ProductGrid({
  title,
  subtitle,
  products,
  id,
  urgency,
}: ProductGridProps) {
  return (
    <section id={id} className="bg-white py-[34px]">
      <div className="vivasaya-product-container">
        {(title || subtitle) && (
          <SectionTitle title={title} subtitle={subtitle} leafDecorator />
        )}

        <div className="grid grid-cols-2 gap-x-3 gap-y-7 pt-6 md:-mt-[30px] md:grid-cols-4 md:gap-x-0 md:gap-y-0 md:pt-0">
          {products.map((product) => (
            <div key={product.id} className="min-w-0 md:px-[15px] md:pt-[30px]">
              <ProductCard product={product} urgency={urgency} />
            </div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.25, duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
          className="mt-8 text-center"
        >
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 btn-outline px-7"
            aria-label={title ? `View all ${title}` : "View all products"}
          >
            View All <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
