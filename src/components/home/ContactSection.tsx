"use client";

import { motion } from "framer-motion";
import { MapPin, Mail, Phone } from "lucide-react";
import SectionTitle from "@/components/ui/SectionTitle";
import { useState } from "react";
import { contactAddress, contactInfo } from "@/data/contact";

// Inline SVG brand icons
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
  </svg>
);
const YoutubeIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.96-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
    <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/>
  </svg>
);

export default function ContactSection() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <section id="contact" className="py-16 bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle
          title="Get In Touch"
          subtitle="We'd love to hear from you. Reach out anytime!"
          leafDecorator
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left: Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="bg-white rounded-2xl p-8 shadow-card space-y-5">
              <h3 className="font-heading font-bold text-xl text-text-dark">
                Contact Information
              </h3>

              <div className="space-y-4">
                {[
                  { icon: MapPin, label: "Address", value: contactAddress },
                  { icon: Mail, label: "Email", value: contactInfo.email },
                  { icon: Phone, label: "Phone", value: contactInfo.phoneDisplay },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon size={16} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-text-muted font-semibold uppercase tracking-widest">
                        {label}
                      </p>
                      <p className="text-text-dark font-body text-sm mt-0.5">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-xs text-text-muted font-semibold uppercase tracking-widest mb-3">
                  Follow Us
                </p>
                <div className="flex gap-3">
                  {[
                    { icon: FacebookIcon, label: "Facebook", href: contactInfo.socialLinks.facebook },
                    { icon: InstagramIcon, label: "Instagram", href: contactInfo.socialLinks.instagram },
                    { icon: YoutubeIcon, label: "YouTube", href: contactInfo.socialLinks.youtube },
                  ].map(({ icon: Icon, label, href }) => (
                    <a
                      key={label}
                      href={href}
                      aria-label={label}
                      className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white hover:bg-primary-dark transition-colors"
                    >
                      <Icon />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* WhatsApp CTA */}
            <a
              href={contactInfo.whatsappUrl}
              className="flex items-center gap-3 bg-green-500 text-white rounded-2xl p-5 hover:bg-green-600 transition-colors shadow-md"
              aria-label="Contact us on WhatsApp"
            >
              <span className="text-3xl">💬</span>
              <div>
                <p className="font-heading font-bold">Chat on WhatsApp</p>
                <p className="text-sm text-green-100">Typically replies in minutes</p>
              </div>
            </a>
          </motion.div>

          {/* Right: Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl p-8 shadow-card"
          >
            <h3 className="font-heading font-bold text-xl text-text-dark mb-6">
              Send us a Message
            </h3>

            {submitted ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="text-5xl mb-4">✅</span>
                <p className="font-heading font-bold text-lg text-primary">
                  Message Sent!
                </p>
                <p className="text-text-muted text-sm mt-1">
                  We&apos;ll get back to you within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="contact-name" className="block text-sm font-semibold text-text-dark mb-1.5">
                    Your Name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="John Doe"
                    className="input-organic"
                    aria-label="Your name"
                  />
                </div>

                <div>
                  <label htmlFor="contact-email" className="block text-sm font-semibold text-text-dark mb-1.5">
                    Email Address
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="john@example.com"
                    className="input-organic"
                    aria-label="Email address"
                  />
                </div>

                <div>
                  <label htmlFor="contact-message" className="block text-sm font-semibold text-text-dark mb-1.5">
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    required
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="How can we help you?"
                    className="input-organic resize-none"
                    aria-label="Your message"
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary w-full justify-center"
                  aria-label="Send message"
                >
                  Send Message 🌿
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
