import type { Metadata } from "next";
import StructuredData from "@/components/seo/StructuredData";
import EventsPageClient from "./EventsPageClient";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getEventSchema } from "@/lib/seo/structuredData";
import type { Database } from "@/lib/database.types";

export const metadata: Metadata = {
  title: {
    absolute: "Past Events & Performances — Page KillerCutz Ghana DJ",
  },
  description:
    "View Page KillerCutz past performances across Ghana — corporate galas, weddings, festivals, and club nights. Clients include Republic Bank, Stanbic Bank Ghana, Bank of Ghana, Helios Towers, and Bank of America Ghana.",
  alternates: {
    canonical: "https://pagekillercutz.com/events",
  },
};

type EventRow = Database["public"]["Tables"]["events"]["Row"];

export default async function EventsPage() {
  let events: EventRow[] = [];
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase.from("events").select("*").order("event_date", { ascending: false });
    events = (data ?? []) as EventRow[];
  } catch {
    /* build / DB unavailable */
  }

  return (
    <>
      {events.map((event) => (
        <StructuredData
          key={event.id}
          data={getEventSchema({
            title: event.title,
            eventType: event.event_type,
            date: event.event_date,
            venue: event.venue,
            location: event.location,
            description: event.description ?? "",
            imageUrl: event.media_urls?.[0],
          })}
        />
      ))}
      <EventsPageClient />
    </>
  );
}
