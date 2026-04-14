import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "DJ Packages & Pricing — Book a Ghana DJ",
  },
  description:
    "View Page KillerCutz DJ packages for weddings, corporate events, and festivals in Ghana. Essential from GHS 1,500. Signature from GHS 2,800. Premium from GHS 5,000. Book online.",
  alternates: {
    canonical: "https://pagekillercutz.com/pricing",
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
