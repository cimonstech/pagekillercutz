import type { MetadataRoute } from "next";
import { getSupabaseAdmin } from "@/lib/supabase";
import { SITE_URL } from "@/lib/seo/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_URL;

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/pricing`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/events`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/contact`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.7 },
    { url: `${base}/booking`, lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
    { url: `${base}/music`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
  ];

  let eventPages: MetadataRoute.Sitemap = [];
  try {
    const supabase = getSupabaseAdmin();
    const { data: events } = await supabase.from("events").select("id, created_at, event_date").order("event_date", {
      ascending: false,
    });
    if (events?.length) {
      eventPages = events.map((event) => ({
        url: `${base}/events/${event.id}`,
        lastModified: new Date(event.event_date || event.created_at),
        changeFrequency: "monthly" as const,
        priority: 0.7,
      }));
    }
  } catch {
    /* DB unavailable at build */
  }

  let musicPages: MetadataRoute.Sitemap = [];
  try {
    const supabase = getSupabaseAdmin();
    const { data: music } = await supabase.from("music").select("id, created_at").order("created_at", { ascending: false });
    if (music?.length) {
      musicPages = music.map((m) => ({
        url: `${base}/music/${m.id}`,
        lastModified: new Date(m.created_at),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      }));
    }
  } catch {
    /* skip */
  }

  return [...staticPages, ...eventPages, ...musicPages];
}
