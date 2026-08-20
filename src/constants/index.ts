export const NAV_LINKS = [
  { label: "Inicio", href: "/" },
  { label: "Servicios", href: "/servicios" },
  { label: "Tienda", href: "/tienda" },
  { label: "Galería", href: "/galeria" },
  { label: "Nosotros", href: "/sobre-nosotros" },
  { label: "Contacto", href: "/contacto" },
] as const;

export const SOCIAL_LINKS = {
  instagram: "https://instagram.com/adrianachavez",
  facebook: "https://facebook.com/adrianachavez",
  tiktok: "https://tiktok.com/@adrianachavez",
} as const;

export const CONTACT_INFO = {
  phone: "+57 300 000 0000", // actualizar cuando Adriana confirme
  email: "hola@adrianachavez.com",
  address: "Centro de Belleza Adriana Chávez, Bogotá D.C.",
  mapUrl: "https://maps.google.com/?q=Centro+de+Belleza+Adriana+Chavez",
  schedule: {
    weekdays: "Lun – Vie: 9:00 am – 7:00 pm",
    saturday: "Sábado: 9:00 am – 5:00 pm",
    sunday: "Domingo: Cerrado",
  },
} as const;

export const SITE_CONFIG = {
  name: "Adriana Chávez",
  description: "Salón de belleza premium en Bogotá, Colombia.",
  url: "https://adrianachavez.com",
} as const;
