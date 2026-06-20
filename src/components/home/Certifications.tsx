"use client";

import { motion } from "framer-motion";
import SectionTitle from "@/components/ui/SectionTitle";
import Image from "next/image";
import { IMAGE_BLUR_DATA_URL } from "@/lib/image";

const certs = [
  {
    id: 1,
    name: "FSSAI Certified",
    number: "FSSAI 10012345678901",
    logo: "/uploads/fssai_logo.png",
  },
  {
    id: 2,
    name: "ISO 9001:2015",
    number: "ISO/IEC 9001",
    logo: "/uploads/iso_logo.png",
  },
  {
    id: 3,
    name: "Organic India",
    number: "APEDA / NOP Certified",
    logo: "/uploads/organic_logo.png",
  },
  {
    id: 4,
    name: "NPOP Certified",
    number: "NPOP Accredited",
    logo: "/uploads/npop_logo.png",
  },
];

const trustItems = [
  "Certified organic sourcing",
  "Cold-pressed oils",
  "Native grains",
  "Tamil Nadu farms",
  "No artificial additives",
  "Secure checkout",
];

type CertificationSettings = {
  section_certifications_title?: string;
  section_certifications_subtitle?: string;
};

export default function Certifications({ settings }: { settings?: CertificationSettings }) {
  return (
    <section id="certifications" className="bg-white py-[52px]">
      <div className="vivasaya-container">
        <SectionTitle
          title={settings?.section_certifications_title || "Our Certifications"}
          subtitle={settings?.section_certifications_subtitle || "Quality you can trust, verified by the best authorities in India"}
          leafDecorator
        />

        <div className="mb-10 overflow-hidden border-y border-[#eeeeee] bg-white py-3.5">
          <div className="marquee-track gap-8 text-[11px] font-bold uppercase tracking-wider text-primary">
            {[...trustItems, ...trustItems].map((item, index) => (
              <span key={`${item}-${index}`} className="inline-flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="mb-12 grid grid-cols-2 gap-[24px] lg:grid-cols-4">
          {certs.map((cert, i) => (
            <motion.div
              key={cert.id}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.25, 1, 0.5, 1] }}
              className="group flex cursor-pointer flex-col items-center gap-4 border border-[#eaeaea] bg-white p-6 rounded-xl text-center transition-all duration-300 hover:border-primary/50 hover:shadow-[0_10px_25px_rgba(0,0,0,0.04)]"
            >
              {/* Centered logo container with fixed height */}
              <div className="relative h-20 w-full flex items-center justify-center">
                <Image 
                  src={cert.logo} 
                  alt={cert.name} 
                  width={130}
                  height={80}
                  loading="lazy"
                  sizes="130px"
                  quality={75}
                  placeholder="blur"
                  blurDataURL={IMAGE_BLUR_DATA_URL}
                  className="h-full w-auto max-w-[130px] object-contain transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              
              <div>
                <h3 className="font-heading text-[15px] font-bold text-[#222222] tracking-wide">
                  {cert.name}
                </h3>
                <p className="mt-1 font-body text-xs font-medium text-[#777777]">{cert.number}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Farmers tagline */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 1, 0.5, 1] }}
          className="border border-[#eaeaea] bg-white px-6 py-10 rounded-xl text-center shadow-[0_4px_20px_rgba(0,0,0,0.02)]"
        >
          <span className="text-4xl block mb-3">🌾</span>
          <p className="font-heading text-2xl font-bold text-primary md:text-3xl">
            8,500+ Organic Farmers
          </p>
          <p className="text-text-muted font-body mt-2 text-sm sm:text-base">
            bringing Fresh Produce directly to your doorstep, every day.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
