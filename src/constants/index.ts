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
  phone: "+57 300 000 0000", // pendiente confirmar
  email: null as string | null, // Adriana confirmó que no tiene correo público
  address: "Monterrey, Casanare",
  mapUrl: "https://maps.google.com/?q=Centro+de+Belleza+Adriana+Chavez+Monterrey+Casanare",
  schedule: {
    weekdays: "Lun – Vie: 8:00 am – 12:00 pm · 2:00 pm – 6:00 pm",
    saturday: "Sábado: 8:00 am – 12:00 pm · 2:00 pm – 6:00 pm",
    sunday: "Domingo: Cerrado",
  },
} as const;

export const SITE_CONFIG = {
  name: "Adriana Chávez",
  description: "Centro de belleza en Monterrey, Casanare.",
  url: "https://adrianachavez.com",
} as const;
