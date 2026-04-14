import type { Metadata } from "next";
import { getSupabaseAdmin } from "@/lib/supabase";
import { SITE_URL } from "@/lib/seo/site";

type Props = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase.from("music").select("title, description").eq("id", slug).maybeSingle();
    if (data) {
      const title = data.title;
      const description =
        (typeof data.description === "string" && data.description.trim().slice(0, 160)) ||
        `Listen to ${title} by Page KillerCutz — Afrobeats, Highlife, and more from Accra.`;
      return {
        title: { absolute: `${title} | Page KillerCutz` },
        description,
        alternates: {
          canonical: `${SITE_URL}/music/${slug}`,
        },
        openGraph: {
          title: `${title} | Page KillerCutz`,
          description,
          url: `${SITE_URL}/music/${slug}`,
        },
      };
    }
  } catch {
    /* ignore */
  }
  return {
    title: { absolute: `Music | Page KillerCutz` },
    alternates: { canonical: `${SITE_URL}/music/${slug}` },
  };
}

export default function MusicReleaseLayout({ children }: { children: React.ReactNode }) {
  return children;
}
