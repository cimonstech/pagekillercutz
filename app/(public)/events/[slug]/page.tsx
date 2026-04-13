import Image from "next/image";
import Link from "next/link";

const MEDIA = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuACsiqJbAZxzvq5fwbAx5MoiybvVjdkul7YllboPuSV4gwasJ1Fz5MZaBC9WCzDFYffQCeJkWhzv-Y1IjTkiNdvQ_L9JMuySdh47_dlxsBWp478cmM8UTPCjavHFrTkLYTKD3R6_uraB2ySg7kuYh1V5VPl17fZr659Q5lf43kjkDlvS1Cq9pcNNBVaDnSvOZtWCezdsWVDX92nnVZ1v6lmYT0mlUvLEtzJDb69Z-o30Uk1L7Qf-O9AiZEoNn7Cijrs90V_KdLIhxuA",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCN-cc4n3noISfJ3XdqqcZ1xfmEI8b9r0u3fjHVwYHb0na4pIyAiDrj5kholU8J-HV25YML1-JwSIfFLzAD1lrBwPr42VmO3ZI3CHBR8KOj-J7Oib8WlFOxI5uvf3hy-bO5pzQlNY_GWDTrbGp6HqEGtGdHE9i-jwP1Z1X33jO7vd5GfH5p3TXebds3e63MboxuygpaoxVFogsVlXfUuUWWKzx8obtbF_0_DBSxdkfOxdvAQan3sQlAIL6QzJHukFrc7-YZ62XYowac",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA2tSKwgW8fd1o5P1PWawEwnizlNMrbCHzLeofhIWwA_vhV3K5knT_2ZbYJczAvS93GB7JdIBQi4349Bg7SvMwwz8Yz2YikQwlQN9JcwFds8OebXCKo6E6zroIIr9xzO9231I3ar9Z3GNnIwp59i8m2Cnt5ozS8m_PV24YMvQ-oBYKDmJ2sea-48EdlnCzM1_TOhfBgx7LBP-7K212KFXZYOvTET-vf1rKwWgCcjdXIjWVtpzh47OwejEv4xUedlvapd9uLZ5I_y0FQ",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDrbi91DMo1s1H-EJXs9xGbd-atTVXaRwYpQUPHB208tfYwEfwynPunXzIZM5ktc1NVzlwFiFXBbMrgd599_v2mh17d-GOzk6InqGERXeRO0Dk6sRdDI75samP8JpdoaDP3x9C58LGFXYYvPvDkDTQEGpz_lQ4puuM7hF5-_IKwTzexCJDleDFlqqNJQP20fiwOE4jqVWABqWPhy3XCvwXcLXkEATNkOf0R1givB5COoJ7Di2eyL73loiixP4DvQ96XWY7WipepTn0Q",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDwLNLr0C-C2MtGLM-Ltj9l2yKCmU9I-vpqZOVKvGEiCy01AdLMD-xhuMFpe0vGVFzZifLtJss-i1SUwaf1gXjGbksKvGxdZ8_imLOrp5CtvJ_pWt54U9Ps0YbOio950DGefXXeDHsIe16wQzNdrFfBzxs6tZfhs3uKiRNwmxndDSVcx3kgw_Vt-mZ_2A7V14oRqG__M76Ytsra254yauyVpEDPjfJT96835mot8-R__Phm31u5EBm1TuJfPXJBzQpzCcKkMm0xoFKW",
];

const RELATED = [
  {
    slug: "basement-pulse",
    date: "SEPT 12",
    title: "Basement Pulse",
    location: "Labadi Beach, Accra",
    price: "$25.00",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCP3_28LFqwTWZ3scgh6Dq0yk-sehWn1bLWKDqHaOUsxPf1hRQ5f3ss3R_Z5rOW9rKavHelMnUD9bF-qnOKsc8w0eCHCQL6UW8gr9syHTN6PxzlkdMaLi2Pgj6aDLKJMcYUf2QVxsk2f3HnUxLoPKjE7SnLYvqgA1bF_jK4Azuk3rf-4SKGp-mvxKoZ6hmVyk3FbowxJCCHQcjkFpxCPdJsGFM2QZhj4VWe4qnIljQBfjWMMv3xAH5O1lhOSshDv9fSJigQuRwCKpOw",
  },
  {
    slug: "synthesized-soul",
    date: "OCT 05",
    title: "Synthesized Soul",
    location: "Skybar 25, Accra",
    price: "$40.00",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuB74nTdzyNps5RWeED2Tw2oKNhUCdBvOd4P52AzT2JbvhEQb6w7ebvotsS8q55cKx_ZAm8_RUeoJ1k5n6-c-QGHP_DXa-IuwdkXI2jPldu7v8G1Qd4jH0cWh9i2Kg7EiY11nS5lf_bMSUTD3itsOy1GhSMoRpqvdcD-abJv1lIagrcVDvqDCyKsdbwa5rkTPg-x1sHfd5DjhIomUZw0fL-CeGL5MyKiNfpoG2XPBA1Px5Oc0x_Pu4whscZP80nCqE1KbkMBqnsA1bgY",
  },
  {
    slug: "echoes-of-gold",
    date: "NOV 19",
    title: "Echoes of Gold",
    location: "Kumasi Stadium Area",
    price: "$15.00",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDaQT5ncoRl-boFAH2wTj4ZktJbwKrlLNHXrv6kho8m4tbPSdb6wF6F8j0ncWmUDFptur1yucfesZ0UAclvaN6mtFgp4P7u_AC-uZBqUmejuYOXmUFXD9cH-DlLZwHwBeS2aOxataxKR3UCbDAQADoJxWR72WXeB1FJQb2FcYT7TuXypbm_ETOArM0hs1qOYVpn6hW3BDMvV07ex51MRuqdqTx06GMZ2TmQuudzmg8kYo5-xMqqmwzJ2dm2elQvkeSNKEW_WBLCdG3i",
  },
];

const EVENT_DETAILS = [
  { icon: "calendar_month", label: "Date & Time", value: "Aug 14, 20:00 – Aug 16, 04:00" },
  { icon: "location_on", label: "Location", value: "Osu Night Plaza, Independence Ave" },
  { icon: "groups", label: "Attendance", value: "5,000+ Music Explorers" },
  { icon: "headphones", label: "Genres", value: "Afro-Tech, House, Highlife" },
  { icon: "schedule", label: "Door Policy", value: "18+ / Valid ID Required" },
];

export default function EventDetailPage() {
  return (
    <div>
      {/* Ambient glow */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[130px] pointer-events-none" />

      {/* Hero */}
      <section className="relative h-[420px] w-full overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB2a7N4KH2pLtLZ7W0DEwjD5jg4zjcYJmLYbkiGnvAG930GMRmBLUuXDoxvbPg2YBeN5tkC0f05TKpkhZf3oq9Qz3s5BK-LRQQuA4ivAavMeQiFVT-7TNAB_dN6QoiuEra7psAKtP5tnjZK2SQocs08OLNr1O57r0bFbHcDhOEpxdAFtCc2cCxeZuuSOtwfe4WIVCMryi8VNBY-TaPhtwKAUTY4vu50AmgYylBnf1M4X4MnWadPex7JrJzSam64IXfyKnStf_IlbQJy')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full px-8 lg:px-12 pb-10 flex flex-col items-start gap-3">
          <span className="bg-primary text-on-primary-fixed px-3 py-1 text-[10px] font-bold tracking-[0.2em] uppercase rounded-full">
            Festival
          </span>
          <h1 className="font-display text-[60px] lg:text-[80px] leading-none uppercase tracking-tighter text-white">
            Electric Horizon 2024
          </h1>
          <div className="flex flex-wrap items-center gap-6 text-on-surface-variant font-headline text-sm">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">location_on</span>
              Osu Night Plaza, Accra
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">calendar_today</span>
              August 14 – 16, 2024
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-8 lg:px-12 py-12 flex flex-col lg:flex-row gap-12">
        {/* Main content */}
        <div className="lg:flex-1 space-y-12">
          <article>
            <h2 className="font-headline text-xl font-bold mb-5 uppercase tracking-wide">About this Event</h2>
            <div className="space-y-4 text-on-surface-variant text-sm leading-relaxed">
              <p>
                Experience the peak of West African electronic music at Electric Horizon. This year, we&apos;re merging
                traditional highlife rhythms with cutting-edge synth landscapes to create a sonic journey unlike
                anything else. Featuring world-class DJs, immersive visual art installations, and a community of sound
                explorers.
              </p>
              <p>
                Join over 5,000 attendees for 48 hours of non-stop performance. The venue features a 360-degree spatial
                audio rig, ensuring that every beat is felt with crystal precision. Welcome to the future of the pulse.
              </p>
            </div>
          </article>

          {/* Media grid */}
          <div>
            <h3 className="font-headline text-xl font-bold mb-5 uppercase tracking-wide">Media Highlights</h3>
            <div className="grid grid-cols-3 gap-3">
              {MEDIA.map((src, i) => (
                <div
                  key={i}
                  className={[
                    "bg-surface-container-low rounded-xl overflow-hidden group relative",
                    i === 1 ? "row-span-2" : "aspect-square",
                  ].join(" ")}
                >
                  <Image
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    src={src}
                    alt=""
                    fill
                    unoptimized
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sticky sidebar */}
        <aside className="lg:w-[340px] shrink-0">
          <div className="glass rounded-2xl p-7 sticky top-24 space-y-6">
            {/* Price */}
            <div className="flex justify-between items-end">
              <div>
                <span className="font-label text-[10px] text-primary uppercase tracking-widest block mb-1">
                  Early Bird Ends Soon
                </span>
                <span className="font-headline text-4xl font-bold tracking-tighter">$85.00</span>
              </div>
              <span className="font-label text-xs text-on-surface-variant">42 tickets left</span>
            </div>

            {/* Details */}
            <div className="space-y-4">
              {EVENT_DETAILS.map(({ icon, label, value }) => (
                <div key={label} className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-on-primary-fixed transition-colors">
                    <span className="material-symbols-outlined text-[18px]">{icon}</span>
                  </div>
                  <div>
                    <p className="font-label text-[10px] text-outline uppercase tracking-wide">{label}</p>
                    <p className="text-sm font-headline font-medium">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-2">
              <Link
                href="/booking"
                className="h-13 py-3.5 flex items-center justify-center gap-2 bg-primary text-on-primary-fixed font-bold uppercase tracking-widest text-sm rounded-full hover:scale-105 transition-transform glow-btn"
              >
                Book Now <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
              <Link
                href="/pricing"
                className="h-13 py-3.5 flex items-center justify-center gap-2 border border-white/15 text-on-surface-variant font-bold uppercase tracking-widest text-sm rounded-full hover:bg-white/5 transition-colors"
              >
                View Packages
              </Link>
            </div>
          </div>
        </aside>
      </div>

      {/* Related events */}
      <section className="px-8 lg:px-12 pb-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="font-headline text-xl font-bold uppercase tracking-wide">More Events</h2>
          <Link href="/events" className="text-sm font-bold text-on-surface-variant hover:text-on-surface transition-colors">
            See all
          </Link>
        </div>
        <div className="flex gap-5 overflow-x-auto pb-4 no-scrollbar">
          {RELATED.map((ev) => (
            <Link
              key={ev.slug}
              href={`/events/${ev.slug}`}
              className="min-w-[280px] bg-surface-container-low rounded-2xl overflow-hidden group border border-transparent hover:border-primary/20 transition-all"
            >
              <div className="h-40 relative overflow-hidden">
                <Image
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  src={ev.src}
                  alt={ev.title}
                  fill
                  unoptimized
                />
                <div className="absolute top-3 left-3 bg-surface/80 backdrop-blur-md px-2 py-1 font-label text-[10px] text-white rounded-md">
                  {ev.date}
                </div>
              </div>
              <div className="p-5">
                <h4 className="font-headline font-bold text-base group-hover:text-primary transition-colors mb-1">
                  {ev.title}
                </h4>
                <p className="text-on-surface-variant text-xs flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">location_on</span>
                  {ev.location}
                </p>
                <div className="flex justify-between items-center mt-4">
                  <span className="font-label text-primary font-bold text-sm">{ev.price}</span>
                  <span className="material-symbols-outlined text-outline text-[18px] group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
