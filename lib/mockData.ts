export const mockBookings = [
  {
    id: "BK-2024-X1",
    client: "David K.",
    email: "david@example.com",
    phone: "+233 24 555 0192",
    eventType: "Wedding",
    venue: "Kempinski Gold Coast, Accra",
    date: "Dec 15, 2024 · 18:00",
    packageName: "Elite Platinum",
    status: "confirmed",
  },
  {
    id: "BK-2024-Z5",
    client: "Twist Nightclub",
    email: "twist@example.com",
    phone: "+233 50 112 3445",
    eventType: "Residency",
    venue: "Osu, Accra",
    date: "Weekly Friday · 23:00",
    packageName: "Nightlife Std",
    status: "pending",
  },
];

/** Client portal dashboard — single-event preview data */
export const mockClientDashboard = {
  eventName: "Asante-Mensah Wedding Reception",
  eventType: "Wedding",
  eventDate: "Saturday, 14 June 2025",
  venue: "Kempinski Hotel Gold Coast, Accra",
  eventId: "EVT-A1B2C3",
  paymentStatus: "pending" as const,
  amountDue: "GHS 2,800",
  djMoMo: "+233 24 412 3456",
  packageName: "Signature",
  packageInclusions: [
    "Up to 6 hours of live performance",
    "Pioneer CDJ-2000 + DJM-900 setup",
    "2× Technics 1200 turntables",
    "Dedicated playlist portal access",
    "7-day and 1-day SMS reminders",
  ],
  packagePrice: "GHS 2,800",
  daysUntilEvent: 14,
  mustPlayCount: 5,
  doNotPlayCount: 2,
  timelineMoments: 3,
  heroImageUrl:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDdU2mDBvR2NcNbiS88uh5kNhMx2fPrBf0yzSOsblmhjxy4fnAnniiCoqK5unJVh5caVTBiXlm2rlyKFu36hrMXqc8tysVNDlhzzVOIMRJZoPu0mPHG_Pt6rgiFof4YDuOpmvfYn6JZACyVTf6M0eiplEkCFn7agppRYme1kt91t0jtF-G-qXaLO7TkZDpUNPQOSIqnCyofYglruDuXlnaY-5Mx-blBnFwN850Tmpvgw2ma7q1gBUo12ojrPOUx8QZWF-3WVpr2EyIG",
};

export const mockPlaylists = [
  {
    id: "EVT-8829-KC",
    name: "Alexandra & Marcus",
    type: "Wedding Reception",
    date: "June 14, 2024",
    status: "unlocked",
    mustPlay: ["Last Last", "Asiwaju", "Before You Wake Up"],
    dontPlay: ["Macarena", "Cotton Eye Joe"],
    genres: ["Afrobeats", "90s R&B", "Amapiano"],
    vibe: "High Energy Editorial",
  },
];

export const mockOrders = [
  { id: "ORD-1092", customer: "Akwasi Antwi", item: "Standard Package", amount: 850, status: "paid" },
  { id: "ORD-1091", customer: "Sandra Boateng", item: "Premium Sound", amount: 2100, status: "processing" },
];

export const mockPackages = [
  { id: "pkg-1", name: "Essential", price: 450, active: true, order: 1, inclusions: ["2 Hour Set", "Basic Rig"] },
  { id: "pkg-2", name: "Signature", price: 1200, active: true, order: 2, inclusions: ["4 Hour Set", "Full Audio"] },
];

export const mockMusic = [
  { id: "m1", title: "Electric Pulse", type: "Album" },
  { id: "m2", title: "Void Theory", type: "EP" },
];

export const mockEvents = [
  { id: "e1", title: "Echoes of the Valley", type: "Festival", date: "Aug 24, 2024", featured: true },
  { id: "e2", title: "Neon Pulse Vol. IV", type: "Club Night", date: "Sep 12, 2024", featured: false },
];

export const mockAdmins = [
  { id: "a1", name: "K. Cutz", email: "admin@pagekillercutz.com", role: "super_admin", status: "active", lastLogin: "Today" },
  { id: "a2", name: "Ama Osei", email: "ops@pagekillercutz.com", role: "admin", status: "active", lastLogin: "Yesterday" },
];

export const mockAuditLog = [
  {
    id: "log-1",
    timestamp: "2026-03-31 09:22",
    actor: "K. Cutz",
    action: "UPDATE_PACKAGE",
    description: "Updated Signature package pricing.",
    targetId: "pkg-2",
    ip: "197.211.55.12",
  },
];
