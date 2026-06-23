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

// Visa SVG Logo component
const VisaLogo = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-auto" fill="#1A1F71" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.112 8.262L5.97 15.758H3.92L2.374 9.775c-.094-.368-.175-.503-.461-.658C1.447 8.864.677 8.627 0 8.479l.046-.217h3.3a.904.904 0 01.894.764l.817 4.338 2.018-5.102zm8.033 5.049c.008-1.979-2.736-2.088-2.717-2.972.006-.269.262-.555.822-.628a3.66 3.66 0 011.913.336l.34-1.59a5.207 5.207 0 00-1.814-.333c-1.917 0-3.266 1.02-3.278 2.479-.012 1.079.963 1.68 1.698 2.04.756.367 1.01.603 1.006.931-.005.504-.602.725-1.16.734-.975.015-1.54-.263-1.992-.473l-.351 1.642c.453.208 1.289.39 2.156.398 2.037 0 3.37-1.006 3.377-2.564m5.061 2.447H24l-1.565-7.496h-1.656a.883.883 0 00-.826.55l-2.909 6.946h2.036l.405-1.12h2.488zm-2.163-2.656l1.02-2.815.588 2.815zm-8.16-4.84l-1.603 7.496H8.34l1.605-7.496z"/>
  </svg>
);

// Mastercard SVG Logo component
const MastercardLogo = () => (
  <svg viewBox="0 0 36 24" className="h-5 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="13" cy="12" r="9" fill="#EB001B"/>
    <circle cx="23" cy="12" r="9" fill="#F79E1B"/>
    <path d="M 18 4.52 A 9 9 0 0 0 18 19.48 A 9 9 0 0 0 18 4.52 Z" fill="#FF5F00"/>
  </svg>
);

// Amex SVG Logo component
const AmexLogo = () => (
  <svg viewBox="0 0 64 24" className="h-5 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="24" rx="4" fill="#016FD0"/>
    <text x="32" y="16.5" fill="white" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" fontWeight="900" fontSize="11" letterSpacing="1.5" textAnchor="middle">AMEX</text>
  </svg>
);

// PayPal SVG Logo component
const PaypalLogo = () => (
  <svg viewBox="0 0 16 16" className="h-5 w-auto" fill="#003087" xmlns="http://www.w3.org/2000/svg">
    <path d="M14.06 3.713c.12-1.071-.093-1.832-.702-2.526C12.628.356 11.312 0 9.626 0H4.734a.7.7 0 0 0-.691.59L2.005 13.509a.42.42 0 0 0 .415.486h2.756l-.202 1.28a.628.628 0 0 0 .62.726H8.14c.429 0 .793-.31.862-.731l.025-.13.48-3.043.03-.164.001-.007a.35.35 0 0 1 .348-.297h.38c1.266 0 2.425-.256 3.345-.91q.57-.403.993-1.005a4.94 4.94 0 0 0 .88-2.195c.242-1.246.13-2.356-.57-3.154a2.7 2.7 0 0 0-.76-.59l-.094-.061ZM6.543 8.82a.7.7 0 0 1 .321-.079H8.3c2.82 0 5.027-1.144 5.672-4.456l.003-.016q.326.186.548.438c.546.623.679 1.535.45 2.71-.272 1.397-.866 2.307-1.663 2.874-.802.57-1.842.815-3.043.815h-.38a.87.87 0 0 0-.863.734l-.03.164-.48 3.043-.024.13-.001.004a.35.35 0 0 1-.348.296H5.595a.106.106 0 0 1-.105-.123l.208-1.32z"/>
  </svg>
);

// Shop Pay SVG Logo component
const ShopPayLogo = () => (
  <svg viewBox="0 0 64 24" className="h-5 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="24" rx="4" fill="#5A31F4"/>
    <path d="M9 7 C8.2 7 7.5 7.7 7.5 8.5 V9 H12.5 V8.5 C12.5 7.7 11.8 7 11 7 Z M6 9 V17 C6 17.6 6.4 18 7 18 H13 C13.6 18 14 17.6 14 17 V9 H6 Z" fill="white"/>
    <text x="18" y="15.5" fill="white" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" fontWeight="bold" fontSize="11" letterSpacing="-0.3">shop<tspan fontWeight="normal" fill="#b8c2ff">pay</tspan></text>
  </svg>
);

// Google Pay SVG Logo component
const GooglePayLogo = () => (
  <svg viewBox="0 0 64 24" className="h-5 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(6, 6) scale(0.8)">
      <path d="M10 15.3c0-.6-.05-1.17-.15-1.7H5v3.2h2.8c-.12.65-.48 1.2-1.03 1.57v2.6h1.66c.97-.9 1.57-2.22 1.57-3.83z" fill="#4285F4"/>
      <path d="M5 20.4c1.46 0 2.68-.48 3.57-1.3l-1.66-2.6c-.46.3-.96.48-1.5.48-1.46 0-2.7-1-3.14-2.35H.5v2.7A9.9 9.9 0 0 0 5 20.4z" fill="#34A853"/>
      <path d="M1.86 14.63A6 6 0 0 1 1.86 12.3V9.6H.5a9.9 9.9 0 0 0 0 7.8l1.36-2.77z" fill="#FBBC05"/>
      <path d="M5 10.6c.8 0 1.52.28 2.08.8l1.56-1.56A9.9 9.9 0 0 0 5 8.4C2.56 8.4.45 9.8.05 11.97l2.67 2.08c.44-1.35 1.68-2.35 3.14-2.35z" fill="#EA4335"/>
    </g>
    <text x="21" y="15.5" fill="#5F6368" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" fontWeight="bold" fontSize="11" letterSpacing="-0.2">Pay</text>
  </svg>
);

// Razorpay SVG Logo component
const RazorpayLogo = () => (
  <svg viewBox="0 0 64 24" className="h-5 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 17.5 L10.5 11.5 H7 L13.5 5.5 L12 12 H15.5 L8 17.5 Z" fill="#0B44CD"/>
    <text x="18" y="15.5" fill="#0B44CD" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" fontWeight="bold" fontSize="10" letterSpacing="-0.2">Razorpay</text>
  </svg>
);

const paymentMethods = [
  { name: "Visa", Logo: VisaLogo },
  { name: "Mastercard", Logo: MastercardLogo },
  { name: "Amex", Logo: AmexLogo },
  { name: "PayPal", Logo: PaypalLogo },
  { name: "Shop Pay", Logo: ShopPayLogo },
  { name: "Google Pay", Logo: GooglePayLogo },
  { name: "Razorpay", Logo: RazorpayLogo },
];

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
  { label: "About Us", href: "/about-us" },
  { label: "Delivery Info", href: "/delivery-info" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms & Conditions", href: "/terms-and-conditions" }
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
              <li className="flex">
                <a
                  href="https://share.google/bQ76u9FIoO6puAF0G"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 hover:text-white transition-colors group"
                >
                  <MapPin size={20} strokeWidth={1.75} className="text-accent-light shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  <span>
                    VIVASAYA ULAGAM AGRI PRODUCTS<br />
                    Tamilnadu, India
                  </span>
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={20} strokeWidth={1.75} className="text-accent-light shrink-0" />
                <a href="mailto:vivasayaulagam@gmail.com" className="hover:text-white transition-colors">
                  vivasayaulagam@gmail.com
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
          <div className="flex flex-wrap gap-3">
             {paymentMethods.map(({ name, Logo }) => (
                <div
                  key={name}
                  className="bg-white rounded-md h-8 px-3 flex items-center justify-center shadow-[0_2px_4px_rgba(0,0,0,0.06)] border border-white/10 shrink-0"
                  title={name}
                >
                  <Logo />
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-black/[0.18] border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-2 text-center md:text-left">
          <p className="text-white text-sm font-body">
            All Rights Reserved © 2026 Vivasaya Ulagam Agri Products
          </p>
          <p className="text-white/60 text-sm font-body">
            Developed by <span className="text-white font-medium">WEB Craft Studio</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
