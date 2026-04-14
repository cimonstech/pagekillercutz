import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Book a DJ in Ghana — Page KillerCutz",
  },
  description:
    "Book Page KillerCutz for your event in Ghana. Fill in your event details and choose a package. Available for weddings, corporate events, festivals, club nights, and private parties in Accra and across Ghana.",
  alternates: {
    canonical: "https://pagekillercutz.com/booking",
  },
};

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
