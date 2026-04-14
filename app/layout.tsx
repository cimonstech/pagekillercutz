import type { Metadata } from "next";
import {
  Barlow_Condensed,
  Space_Grotesk,
  Inter,
  Space_Mono,
  Syne,
} from "next/font/google";
import Script from "next/script";
import "./globals.css";
import GlobalPlayerMount from "@/components/layout/GlobalPlayerMount";
import StructuredData from "@/components/seo/StructuredData";
import {
  localBusinessSchema,
  musicGroupSchema,
  personSchema,
  websiteSchema,
} from "@/lib/seo/structuredData";
import { OG_IMAGE_URL, SITE_URL } from "@/lib/seo/site";

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: "800",
  variable: "--font-display",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-headline",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-label",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-syne",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: "Page KillerCutz | Ghana's Premier Scratch DJ — Accra",
    template: "%s | Page KillerCutz",
  },

  description:
    "Page KillerCutz is Ghana's premier scratch DJ and music producer based in Accra. Available for weddings, corporate events, festivals, club nights, and private parties across Ghana and beyond. Followed by Kofi Kinaata. Has performed for Republic Bank, Stanbic Bank Ghana, Bank of Ghana, Helios Towers, Bank of America Ghana, and OmniBSIC.",

  keywords: [
    "DJ Ghana",
    "scratch DJ Accra",
    "DJ for hire Ghana",
    "wedding DJ Ghana",
    "corporate DJ Accra",
    "event DJ Ghana",
    "Page KillerCutz",
    "DJ Page Ghana",
    "Afrobeats DJ Ghana",
    "Highlife DJ Accra",
    "club DJ Ghana",
    "festival DJ Ghana",
    "DJ booking Ghana",
    "best DJ Ghana",
    "professional DJ Accra",
    "DJ for corporate events Ghana",
    "DJ for weddings Accra",
    "scratch DJ West Africa",
    "Ghanaian DJ",
    "DJ hire Accra",
  ],

  authors: [{ name: "Page KillerCutz" }],
  creator: "Page KillerCutz",
  publisher: "Page KillerCutz",

  icons: {
    icon: [{ url: "https://assets.pagekillercutz.com/pagekillercutz/pageicon.png", type: "image/png" }],
    apple: [
      {
        url: "https://assets.pagekillercutz.com/pagekillercutz/pageicon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcut: "https://assets.pagekillercutz.com/pagekillercutz/pageicon.png",
  },

  manifest: "/favicon/site.webmanifest",

  openGraph: {
    type: "website",
    locale: "en_GH",
    url: SITE_URL,
    siteName: "Page KillerCutz",
    title: "Page KillerCutz | Ghana's Premier Scratch DJ",
    description:
      "Ghana's premier scratch DJ and music producer based in Accra. Available for weddings, corporate events, festivals and club nights. Book now.",
    images: [
      {
        url: OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: "Page KillerCutz — Ghana's Premier Scratch DJ",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    site: "@page_dj",
    creator: "@page_dj",
    title: "Page KillerCutz | Ghana's Premier Scratch DJ",
    description:
      "Ghana's premier scratch DJ based in Accra. Book for weddings, corporate events, festivals and more.",
    images: [OG_IMAGE_URL],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  alternates: {
    canonical: SITE_URL,
  },

  category: "music",

  other: {
    "geo.region": "GH-AA",
    "geo.placename": "Accra, Greater Accra, Ghana",
    "geo.position": "5.6037;-0.1870",
    ICBM: "5.6037, -0.1870",
    "DC.title": "Page KillerCutz — Ghana DJ",
    "DC.description": "Professional scratch DJ based in Accra, Ghana",
    "DC.subject": "DJ, Music, Entertainment, Ghana",
    "DC.language": "en-GH",
    "DC.coverage": "Ghana, West Africa",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en-GH"
      className={[
        barlowCondensed.variable,
        spaceGrotesk.variable,
        inter.variable,
        spaceMono.variable,
        syne.variable,
        "dark",
      ].join(" ")}
    >
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-PV36S9TT1C"
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-PV36S9TT1C');
          `}
        </Script>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen overflow-x-hidden bg-background text-on-surface font-body antialiased">
        <StructuredData data={personSchema} />
        <StructuredData data={localBusinessSchema} />
        <StructuredData data={websiteSchema} />
        <StructuredData data={musicGroupSchema} />
        {children}
        <GlobalPlayerMount />
      </body>
    </html>
  );
}
