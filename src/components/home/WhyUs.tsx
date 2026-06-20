"use client";

import { motion } from "framer-motion";
import { Sprout, Globe2, ShieldCheck, FlaskConicalOff } from "lucide-react";
import SectionTitle from "@/components/ui/SectionTitle";

const reasons = [
  {
    Icon: Sprout,
    title: "High Nutritional Value",
    desc: "Organic foods preserve far more natural vitamins and minerals than conventional produce.",
  },
  {
    Icon: Globe2,
    title: "Preserves the Environment",
    desc: "Sustainable farming ensures soil conservation, biodiversity & reduced air pollution.",
  },
  {
    Icon: ShieldCheck,
    title: "Certified Organic Sources",
    desc: "Strictly quality controlled and independently verified by FSSAI and NPOP authorities.",
  },
  {
    Icon: FlaskConicalOff,
    title: "No Chemicals & Pesticides",
    desc: "Zero artificial fertilisers, additives, or harmful chemicals in any of our products.",
  },
];

type WhyUsSettings = {
  why_choose_title?: string;
  why_choose_subtitle?: string;
  paddingTop?: number;
  paddingBottom?: number;
};

export default function WhyUs({ settings }: { settings?: WhyUsSettings }) {
  const currentTitle = settings?.why_choose_title || "Why Choose Vivasaya Ulagam?";
  const currentSubtitle = settings?.why_choose_subtitle || "We believe in food that is good for you and good for the planet.";

  return (
    <section 
      id="why-us" 
      className="bg-white py-[40px] md:py-[50px] lg:py-[70px] transition-all duration-300"
      style={{
        paddingTop: settings?.paddingTop !== undefined ? `${settings.paddingTop}px` : undefined,
        paddingBottom: settings?.paddingBottom !== undefined ? `${settings.paddingBottom}px` : undefined,
      }}
    >
      <div className="mx-auto max-w-[1200px] px-4 md:px-6">
        <SectionTitle
          title={currentTitle}
          subtitle={currentSubtitle}
        />

        <div className="grid grid-cols-1 gap-[24px] sm:grid-cols-2 lg:grid-cols-4 items-stretch mt-8 lg:mt-10">
          {reasons.map((reason, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.25, 1, 0.5, 1] }}
              className="group flex flex-col items-center text-center bg-[#FFFFFF] border border-[#E8EEDC] rounded-[20px] p-[24px] transition-all duration-300 lg:hover:border-[#3F7D32] lg:hover:shadow-[0_8px_30px_rgba(0,0,0,0.03)] lg:hover:-translate-y-1 h-full"
            >
              {/* Icon Wrapper */}
              <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#EAF5E6] text-[#3F7D32] mb-5 transition-all duration-300 lg:group-hover:scale-105 lg:group-hover:bg-[#F0F8EA] shrink-0">
                <reason.Icon
                  size={32}
                  strokeWidth={1.8}
                  className="transition-transform duration-300"
                />
              </div>

              <h3 className="font-heading text-[18px] sm:text-[19px] font-bold leading-[1.35] text-[#111827] mb-2.5">
                {reason.title}
              </h3>
              
              <p className="font-body text-[14px] leading-relaxed text-[#6B7280]">
                {reason.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

