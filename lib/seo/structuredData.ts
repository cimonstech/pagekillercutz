import { SCHEMA_IMAGE_URL, SITE_URL } from "@/lib/seo/site";

export const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Page KillerCutz",
  alternateName: "DJ Page",
  description:
    "Professional scratch DJ and music producer based in Accra, Ghana. Specialising in Afrobeats, Highlife, and Amapiano for weddings, corporate events, and festivals.",
  url: SITE_URL,
  image: SCHEMA_IMAGE_URL,
  jobTitle: "Professional DJ & Music Producer",
  worksFor: {
    "@type": "Organization",
    name: "Page KillerCutz",
  },
  address: {
    "@type": "PostalAddress",
    addressLocality: "Accra",
    addressRegion: "Greater Accra",
    addressCountry: "GH",
  },
  sameAs: [
    "https://www.instagram.com/pagekillercutz/",
    "https://web.facebook.com/DjPageGh/",
    "https://x.com/page_dj",
    "https://soundcloud.app.goo.gl/He5LHstB7MCq9VSJ6",
  ],
  knowsAbout: [
    "Scratch DJing",
    "Afrobeats",
    "Highlife music",
    "Amapiano",
    "Music production",
    "Corporate event entertainment",
    "Wedding entertainment Ghana",
  ],
};

export const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${SITE_URL}/#business`,
  name: "Page KillerCutz",
  description:
    "Ghana's premier scratch DJ service based in Accra. Professional DJ for weddings, corporate events, festivals, club nights and private parties.",
  url: SITE_URL,
  telephone: "+233244123456",
  image: SCHEMA_IMAGE_URL,
  priceRange: "GHS 1,500 - GHS 5,000",
  currenciesAccepted: "GHS",
  paymentAccepted: "Mobile Money, Bank Transfer",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Accra",
    addressRegion: "Greater Accra",
    postalCode: "GA",
    addressCountry: "GH",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 5.6037,
    longitude: -0.187,
  },
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    opens: "09:00",
    closes: "23:59",
  },
  sameAs: [
    "https://www.instagram.com/pagekillercutz/",
    "https://web.facebook.com/DjPageGh/",
    "https://x.com/page_dj",
    "https://soundcloud.app.goo.gl/He5LHstB7MCq9VSJ6",
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "DJ Service Packages",
    itemListElement: [
      {
        "@type": "Offer",
        name: "Essential DJ Package",
        description:
          "Up to 3 hours of live DJ performance with Pioneer CDJ setup. Ideal for intimate events and house parties.",
        price: "1500",
        priceCurrency: "GHS",
        availability: "https://schema.org/InStock",
        url: `${SITE_URL}/pricing`,
      },
      {
        "@type": "Offer",
        name: "Signature DJ Package",
        description:
          "Up to 6 hours with Pioneer CDJ-2000, DJM-900 and Technics 1200 turntables. For weddings and corporate events.",
        price: "2800",
        priceCurrency: "GHS",
        availability: "https://schema.org/InStock",
        url: `${SITE_URL}/pricing`,
      },
      {
        "@type": "Offer",
        name: "Premium DJ Package",
        description:
          "Up to 10 hours with full Pioneer professional setup and scratch DJ showcase. For festivals and headline events.",
        price: "5000",
        priceCurrency: "GHS",
        availability: "https://schema.org/InStock",
        url: `${SITE_URL}/pricing`,
      },
    ],
  },
  review: [
    {
      "@type": "Review",
      author: {
        "@type": "Organization",
        name: "Stanbic Bank Ghana",
      },
      reviewBody: "Performed at our Fabric Launch and Staff Durbar. Outstanding performance.",
      reviewRating: {
        "@type": "Rating",
        ratingValue: "5",
        bestRating: "5",
      },
    },
  ],
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "5",
    reviewCount: "12",
    bestRating: "5",
  },
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Page KillerCutz",
  url: SITE_URL,
  description: "Official website of Page KillerCutz, Ghana's premier scratch DJ based in Accra.",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/music?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export const musicGroupSchema = {
  "@context": "https://schema.org",
  "@type": "MusicGroup",
  name: "Page KillerCutz",
  url: SITE_URL,
  image: SCHEMA_IMAGE_URL,
  genre: ["Afrobeats", "Highlife", "Amapiano", "Hip-Hop", "Electronic"],
  member: {
    "@type": "Person",
    name: "Page KillerCutz",
    roleName: "DJ",
  },
  sameAs: [
    "https://www.instagram.com/pagekillercutz/",
    "https://web.facebook.com/DjPageGh/",
    "https://x.com/page_dj",
    "https://soundcloud.app.goo.gl/He5LHstB7MCq9VSJ6",
  ],
};

export function getBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function getEventSchema(event: {
  title: string;
  eventType: string;
  date: string;
  venue: string;
  location: string;
  description: string;
  imageUrl?: string;
}) {
  const desc =
    event.description?.trim() ||
    `${event.eventType} event with Page KillerCutz at ${event.venue} (${event.location}).`;
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: desc,
    startDate: event.date,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: event.venue,
      address: {
        "@type": "PostalAddress",
        addressLocality: event.location,
        addressCountry: "GH",
      },
    },
    image: event.imageUrl,
    performer: {
      "@type": "Person",
      name: "Page KillerCutz",
      url: SITE_URL,
    },
    organizer: {
      "@type": "Person",
      name: "Page KillerCutz",
      url: SITE_URL,
    },
  };
}
