import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Contact Page KillerCutz — DJ Booking Enquiries Ghana",
  },
  description:
    "Get in touch with Page KillerCutz for DJ booking enquiries, corporate event packages, and collaborations. Based in Accra, Ghana. Available across West Africa.",
  alternates: {
    canonical: "https://pagekillercutz.com/contact",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
