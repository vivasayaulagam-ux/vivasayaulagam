"use client";

import { useState } from "react";
import { Mail, Phone, MapPin } from "lucide-react";

function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    setMsg("");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg("Thanks for subscribing!");
        setEmail("");
      } else {
        setMsg(data.error || "Failed to subscribe.");
      }
    } catch {
      setMsg("Connection error.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
      <div className="relative">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
          className="w-full bg-white/[0.08] border border-white/15 rounded-full px-5 py-3 pr-28 text-sm text-white placeholder-white/50 outline-none focus:border-accent-light/60 transition-all"
          aria-label="Newsletter email"
        />
        <button
          type="submit"
          disabled={submitting}
          className="absolute right-1 top-1 bottom-1 bg-cream text-primary-dark rounded-full px-5 text-sm font-bold hover:bg-white disabled:opacity-60 transition-colors"
          aria-label="Subscribe"
        >
          {submitting ? "..." : "Subscribe"}
        </button>
      </div>
      {msg && <p className="text-xs text-accent-light font-semibold pl-2">{msg}</p>}
    </form>
  );
}

// Inline SVG brand icons (lucide v1 removed brand icons)
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);
const YoutubeIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.96-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
    <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
  </svg>
);

const WhatsappIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885m8.413-18.297A11.815 11.815 0 0 0 12.052 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
  </svg>
);

const shopLinks: { label: string; href: string }[] = [
  { label: "Hair & Skin Care", href: "/categories?category=hair-skin-care" },
  { label: "Rice Powders", href: "/categories?category=rice-powders" },
  { label: "Thokku & Pickles", href: "/categories?category=thokku-pickles" },
  { label: "Masala & Spice Powders", href: "/categories?category=masala-spice-powders" },
  { label: "Sweets & Snacks", href: "/categories?category=sweets-snacks" },
  { label: "Health & Dairy", href: "/categories?category=health-dairy" }
];
const infoLinks: { label: string; href: string }[] = [
  { label: "Track Order", href: "/track-order" },
  { label: "About Us", href: "/about" },
  { label: "Delivery Info", href: "/pages/delivery-info" },
  { label: "Privacy Policy", href: "/pages/privacy-policy" },
  { label: "Terms & Conditions", href: "/pages/terms-and-conditions" },
  { label: "Blogs", href: "/blog" },
  { label: "Bulk Order", href: "/contact" }
];

export default function Footer() {
  return (
    <footer className="bg-[linear-gradient(135deg,#17251D_0%,#203B2A_58%,#113F25_100%)] text-white">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Col 1: Contact Us */}
          <div className="space-y-6">
            <h3 className="font-heading font-bold text-lg mb-5 text-white">
              Contact us
            </h3>
            <ul className="space-y-4 text-sm text-white/80 font-body">
              <li className="flex items-start gap-3">
                <MapPin size={20} strokeWidth={1.75} className="text-accent-light shrink-0 mt-0.5" />
                <span>
                  VIVASAYA ULAGAM AGRI PRODUCTS<br />
                  Tamilnadu, India
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={20} strokeWidth={1.75} className="text-accent-light shrink-0" />
                <a href="mailto:care@vivasayaulagam.com" className="hover:text-white transition-colors">
                  care@vivasayaulagam.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Phone size={20} strokeWidth={1.75} className="text-accent-light shrink-0 mt-0.5" />
                <span>
                  <a href="tel:+917708631801" className="hover:text-white transition-colors">
                    +91 7708631801
                  </a>
                  <br />
                  <span className="text-xs text-white/60">Timing(9:30AM - 6:30PM)</span>
                </span>
              </li>
            </ul>
            <div className="flex gap-3 pt-2">
              {[
                { Icon: FacebookIcon, label: "Facebook", href: "https://www.facebook.com/people/Vivasaya-Ulagam/100086884635234/" },
                { Icon: InstagramIcon, label: "Instagram", href: "https://www.instagram.com/vivasaya_ulagam/" },
                { Icon: YoutubeIcon, label: "YouTube", href: "https://www.youtube.com/@vivasayaulagam" },
                { Icon: WhatsappIcon, label: "WhatsApp", href: "https://wa.me/917708631801" },
              ].map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 border border-white/15 rounded-full flex items-center justify-center hover:bg-white/10 hover:border-accent-light/50 transition-all duration-300 hover:scale-110 active:scale-95 text-white"
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          {/* Col 2: Shop */}
          <div>
            <h3 className="font-heading font-bold text-lg mb-6 text-white">
              Shop
            </h3>
            <ul className="space-y-3.5">
              {shopLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                  className="text-white/75 text-sm font-body hover:text-accent-light transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Information */}
          <div>
            <h3 className="font-heading font-bold text-lg mb-6 text-white">
              Information
            </h3>
            <ul className="space-y-3.5">
              {infoLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-white/75 text-sm font-body hover:text-accent-light transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Newsletter Signup */}
          <div className="space-y-4">
            <h3 className="font-heading font-bold text-lg mb-6 text-white">
              Newsletter Signup
            </h3>
            <p className="text-white/70 text-sm mb-4 font-body">
              Stay connected. Stay healthy.<br />
              Subscribe now!
            </p>
            <NewsletterForm />
          </div>
        </div>

        {/* Payment Methods */}
        <div className="mt-16 pt-8">
          <h4 className="font-heading font-bold text-lg mb-4 text-white">
            100% secure payment
          </h4>
          <div className="flex flex-wrap gap-2">
             {/* Placeholder for payment method icons */}
             {["VISA", "Mastercard", "Amex", "PayPal", "Shop Pay", "Google Pay", "Razorpay"].map((pay) => (
                <div
                  key={pay}
                  className="bg-white/[0.92] rounded-full px-3 py-1.5 text-[10px] font-bold text-primary-dark border border-white/30"
                >
                  {pay}
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-black/[0.18] border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center md:text-left">
          <p className="text-white text-sm font-body">
            All Rights Reserved © 2026 Vivasaya Ulagam Agri Products
          </p>
        </div>
      </div>
    </footer>
  );
}
