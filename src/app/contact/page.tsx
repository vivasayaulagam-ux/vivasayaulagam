'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Mail, Phone, MapPin, Send, HelpCircle, Shield, Globe2, Loader2, CheckCircle2 } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [settings, setSettings] = useState<Record<string, string>>({});
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings");
        const data = (await res.json()) as { success?: boolean; settings?: Record<string, string> };
        if (data.success) {
          setSettings(data.settings || {});
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    }
    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      setError('Please fill in all required fields.');
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, subject, message }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setName('');
        setEmail('');
        setPhone('');
        setSubject('');
        setMessage('');
      } else {
        setError(data.error || 'Failed to submit form.');
      }
    } catch {
      setError('A network error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary flex flex-col font-sans">
      <Navbar />

      {/* Hero Header */}
      <section 
        className="hero-banner-container bg-gradient-to-br from-primary to-primary-dark py-20 px-6 text-center text-white relative overflow-hidden bg-cover bg-center"
        style={settings.contact_hero_image ? { backgroundImage: `url(${settings.contact_hero_image})` } : {}}
      >
        {settings.contact_hero_image ? (
          <div className="absolute inset-0 bg-black/40 pointer-events-none" />
        ) : (
          <div className="premium-radial-soft absolute inset-0" />
        )}
        <div className="relative z-10 space-y-4 max-w-xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-extrabold tracking-tight drop-shadow-sm"
          >
            {settings.contact_hero_title || "Get In Touch"}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-sm text-green-100 leading-relaxed drop-shadow-sm"
          >
            {settings.contact_hero_subtitle || "Have a question about our organic harvests or bulk orders? Reach out to us, and our farm support representatives will reply promptly."}
          </motion.p>
        </div>
      </section>

      {/* Content Grid */}
      <section className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Contact Info Cards (Left) */}
        <div className="space-y-6 lg:col-span-1">
          <h2 className="text-xl font-bold text-gray-800 border-b border-primary/10 pb-2">Direct Contact</h2>
          
          <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
              <Mail size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email Support</p>
              <p className="text-sm font-semibold text-gray-800 mt-1 font-mono break-all">{settings.contact_email || "support@vivasayauallagam.com"}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{settings.contact_email_sub || "Replies within 24 hours"}</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
              <Phone size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Phone Helpline</p>
              <p className="text-sm font-semibold text-gray-800 mt-1 font-mono">{settings.contact_phone || "+91 98765 43210"}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{settings.contact_helpline_hours || "Mon - Sat, 9 AM - 6 PM IST"}</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
              <MapPin size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">HQ Address</p>
              <p className="text-sm font-semibold text-gray-800 mt-1">{settings.shop_address || "12, Organic Green Valley, Coimbatore, Tamil Nadu - 641001"}</p>
            </div>
          </div>
        </div>

        {/* Contact Form (Center & Right) */}
        <div className="lg:col-span-2 bg-white border border-gray-200 p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-gray-800">Send A Message</h2>
          
          {success ? (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-8 text-center space-y-4 bg-green-50 border border-green-200 rounded-2xl text-green-800"
            >
              <CheckCircle2 size={44} className="mx-auto text-green-600 animate-bounce" />
              <h3 className="font-extrabold text-lg">Thank You!</h3>
              <p className="text-xs max-w-sm mx-auto leading-relaxed">
                Your contact submission has been saved securely and an alert email has been sent to our administrator team. We will get back to you shortly.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <Shield size={14} /> {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="floating-field">
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder=" "
                    className="text-sm px-4 pb-2.5 pt-4"
                  />
                  <label htmlFor="contact-name">Full Name *</label>
                </div>
                <div className="floating-field">
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder=" "
                    className="text-sm px-4 pb-2.5 pt-4"
                  />
                  <label htmlFor="contact-email">Email Address *</label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="floating-field">
                  <input
                    id="contact-phone"
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder=" "
                    className="text-sm px-4 pb-2.5 pt-4"
                  />
                  <label htmlFor="contact-phone">Phone Number</label>
                </div>
                <div className="floating-field">
                  <input
                    id="contact-subject"
                    type="text"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder=" "
                    className="text-sm px-4 pb-2.5 pt-4"
                  />
                  <label htmlFor="contact-subject">Subject</label>
                </div>
              </div>

              <div className="floating-field">
                <textarea
                  id="contact-message"
                  rows={4}
                  required
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder=" "
                  className="text-sm px-4 pb-2.5 pt-4 resize-none"
                />
                <label htmlFor="contact-message">Message / Details *</label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary-dark disabled:opacity-60 transition-colors shadow-sm"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {submitting ? 'Sending Message...' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Embedded Location and FAQ Section */}
      <section className="bg-gray-50 border-t border-gray-200 py-16 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* FAQ Column */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <HelpCircle size={20} className="text-primary" /> FAQ
            </h3>
            
            <div className="space-y-4">
              {[
                {
                  question: settings.contact_faq_q1 || "Do you offer home delivery outside Coimbatore?",
                  answer: settings.contact_faq_a1 || "Yes! We deliver across Tamil Nadu. Orders usually take 2-4 working days to arrive.",
                },
                {
                  question: settings.contact_faq_q2 || "Are all products 100% certified organic?",
                  answer: settings.contact_faq_a2 || "Absolutely. We maintain strict certifications and source directly from farms maintaining natural bio-diversity.",
                },
              ].map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div key={faq.question} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? -1 : index)}
                      className="flex w-full items-center justify-between gap-4 p-4 text-left"
                    >
                      <span className="text-xs font-bold text-gray-800">{faq.question}</span>
                      <ChevronDown size={16} className={`text-primary transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.24, ease: "easeOut" }}
                          className="overflow-hidden"
                        >
                          <p className="px-4 pb-4 text-xs text-gray-500 leading-relaxed">{faq.answer}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive simulated Google Map */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Globe2 size={20} className="text-primary" /> Our Farm Center Map
            </h3>
            <div className="w-full h-64 bg-secondary border border-gray-200 rounded-3xl overflow-hidden relative shadow-sm">
              <iframe
                title="Vivasaya Ulagam HQ Location Map"
                src={settings.contact_map_embed || `https://maps.google.com/maps?q=${encodeURIComponent(settings.shop_address || "Vivasaya Ulagam Agri Products, Coimbatore, Tamil Nadu, India")}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
