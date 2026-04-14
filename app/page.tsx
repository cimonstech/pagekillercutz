import type { Metadata } from "next";
import HomePage from "@/components/home/HomePage";
import PublicLayout from "@/app/(public)/layout";
import { OG_IMAGE_URL } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: {
    absolute: "Page KillerCutz | Ghana's Premier Scratch DJ — Book Now",
  },
  description:
    "Book Page KillerCutz, Ghana's premier scratch DJ based in Accra, for your wedding, corporate event, festival, or club night. Trusted by Republic Bank, Stanbic Bank Ghana, Bank of Ghana, and Helios Towers.",
  alternates: {
    canonical: "https://pagekillercutz.com",
  },
  openGraph: {
    title: "Page KillerCutz | Ghana's Premier Scratch DJ",
    description:
      "Ghana's premier scratch DJ. Book for weddings, corporate events, festivals across Ghana.",
    url: "https://pagekillercutz.com",
    images: [{ url: OG_IMAGE_URL, width: 1200, height: 630, alt: "Page KillerCutz — Ghana's Premier Scratch DJ" }],
  },
};

export default function Home() {
  return (
    <PublicLayout>
      <HomePage />
    </PublicLayout>
  );
}
