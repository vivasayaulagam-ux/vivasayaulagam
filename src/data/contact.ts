export const contactInfo = {
  companyName: "VIVASAYA ULAGAM AGRI PRODUCTS",
  addressLines: ["Tamilnadu, India"],
  email: "vivasayaulagam@gmail.com",
  emailSubtext: "Replies within 24 hours",
  phoneDisplay: "+91 7708631801",
  phoneHref: "tel:+917708631801",
  businessHours: "Timing(9:30AM - 6:30PM)",
  googleMapsUrl: "https://share.google/bQ76u9FIoO6puAF0G",
  googleMapsQuery: "VIVASAYA ULAGAM AGRI PRODUCTS, Tamilnadu, India",
  whatsappUrl: "https://wa.me/917708631801",
  socialLinks: {
    facebook: "https://www.facebook.com/people/Vivasaya-Ulagam/100086884635234/",
    instagram: "https://www.instagram.com/vivasaya_ulagam/",
    youtube: "https://www.youtube.com/@vivasayaulagam",
  },
} as const;

export const contactAddress = [
  contactInfo.companyName,
  ...contactInfo.addressLines,
].join(", ");
