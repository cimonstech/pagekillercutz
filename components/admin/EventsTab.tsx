"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { Database } from "@/lib/database.types";
import { writeAuditLog } from "@/lib/writeAuditLog";
import { useAdminToast } from "@/hooks/useAdminToast";

type EventRow = Database["public"]["Tables"]["events"]["Row"];

function eventTypeEmoji(t: string): string {
  const x = t.toLowerCase();
  if (x.includes("club")) return "🪩";
  if (x.includes("tour")) return "🎤";
  if (x.includes("fest")) return "🎉";
  return "🎵";
}

export default function EventsTab() {
  const { showToast, ToastComponent } = useAdminToast();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EventRow | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [venue, setVenue] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [featured, setFeatured] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [existingMedia, setExistingMedia] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const showPanel = editing !== null || isCreating;

  const load = () => {
    setLoading(true);
    fetch("/api/events?all=true")
      .then((r) => r.json())
      .then((d: { events?: EventRow[] }) => {
        setEvents(d.events || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const closePanel = () => {
    setEditing(null);
    setIsCreating(false);
    setMediaFiles([]);
  };

  const openNew = () => {
    setEditing(null);
    setIsCreating(true);
    setTitle("");
    setEventType("club");
    setEventDate("");
    setVenue("");
    setLocation("");
    setDescription("");
    setFeatured(false);
    setExistingMedia([]);
    setMediaFiles([]);
  };

  const openEdit = (e: EventRow) => {
    setIsCreating(false);
    setEditing(e);
    setTitle(e.title);
    setEventType(e.event_type);
    setEventDate(e.event_date.slice(0, 10));
    setVenue(e.venue);
    setLocation(e.location);
    setDescription(e.description ?? "");
    setFeatured(e.featured);
    setExistingMedia(e.media_urls || []);
    setMediaFiles([]);
  };

  const uploadMedia = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload/event-media", { method: "POST", body: fd });
    const j = (await res.json()) as { url?: string; error?: string };
    if (!res.ok || !j.url) throw new Error(j.error || "upload failed");
    return j.url;
  };

  const saveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const newUrls: string[] = [];
      for (const f of mediaFiles) {
        newUrls.push(await uploadMedia(f));
      }
      const media_urls = [...existingMedia, ...newUrls];

      const payload = {
        title: title.trim(),
        event_type: eventType.trim(),
        event_date: eventDate,
        venue: venue.trim(),
        location: location.trim(),
        description: description.trim() || null,
        featured,
        media_urls,
        video_urls: editing?.video_urls ?? [],
      };

      const url = editing ? `/api/events/${editing.id}` : "/api/events";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      const json = (await res.json()) as { event: EventRow };
      if (editing) {
        setEvents((prev) => prev.map((x) => (x.id === json.event.id ? json.event : x)));
        writeAuditLog("system", `Updated event ${json.event.title}`, json.event.id);
        showToast("Event saved.");
      } else {
        setEvents((prev) => [json.event, ...prev]);
        writeAuditLog("system", `Created event ${json.event.title}`, json.event.id);
        showToast("Event created.");
      }
      closePanel();
    } catch {
      showToast("Save failed.", "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteEvent = async (ev: EventRow) => {
    if (!confirm(`Delete “${ev.title}”?`)) return;
    try {
      const res = await fetch(`/api/events/${ev.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setEvents((prev) => prev.filter((x) => x.id !== ev.id));
      writeAuditLog("system", `Deleted event ${ev.title}`, ev.id);
      showToast("Event deleted.");
    } catch {
      showToast("Delete failed.", "error");
    }
  };

  const toggleFeatured = async (ev: EventRow) => {
    try {
      const res = await fetch(`/api/events/${ev.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: !ev.featured }),
      });
      if (!res.ok) throw new Error();
      const json = (await res.json()) as { event: EventRow };
      setEvents((prev) => prev.map((x) => (x.id === ev.id ? json.event : x)));
      showToast("Updated.");
    } catch {
      showToast("Failed.", "error");
    }
  };

  return (
    <main className="p-8 lg:p-12 relative z-10">
      <ToastComponent />
      <header className="flex justify-between items-center mb-12 flex-wrap gap-4">
        <div>
          <h2 className="text-3xl headline-font font-bold tracking-tight text-white">Events</h2>
          <p className="text-on-surface-variant text-sm mt-1">Manage performances, club nights, and global tours.</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            type="button"
            className="bg-primary-container text-on-primary-container px-5 py-2.5 rounded-sm text-sm font-bold flex items-center space-x-2 active:scale-95 transition-transform"
            onClick={openNew}
          >
            <span className="material-symbols-outlined text-lg">add</span>
            <span>Add New Event</span>
          </button>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 min-w-0">
          {loading ? (
            <p className="text-on-surface-variant">Loading…</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 w-full">
              {events.map((ev) => {
                  const src = ev.media_urls?.[0];
                  return (
                    <div
                      key={ev.id}
                      className="group relative bg-surface-container-low/40 backdrop-blur-md rounded-xl overflow-hidden transition-all hover:bg-surface-container-low/60 border border-white/5 min-w-0"
                    >
                      <div
                        className="h-[140px] relative overflow-hidden bg-surface-container rounded-t-xl"
                        style={{ borderRadius: "12px 12px 0 0" }}
                      >
                        {src ? (
                          <Image
                            src={src}
                            alt={ev.title}
                            fill
                            unoptimized
                            sizes="(max-width: 768px) 100vw, 33vw"
                            style={{ objectFit: "cover", borderRadius: "12px 12px 0 0" }}
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#12121a] via-[#0a0a12] to-[#1a1520] text-3xl">
                            {eventTypeEmoji(ev.event_type)}
                          </div>
                        )}
                      </div>
                      <div className="p-5 min-w-0">
                        <h3
                          className="text-sm font-semibold text-white mb-1 line-clamp-2 headline-font"
                          style={{ WebkitLineClamp: 2, display: "-webkit-box", WebkitBoxOrient: "vertical" }}
                          title={ev.title}
                        >
                          {ev.title}
                        </h3>
                        <div className="flex items-center text-on-surface-variant text-xs mb-4 mono-font uppercase tracking-tighter">
                          <span>{ev.event_type}</span>
                          <span className="mx-2">•</span>
                          <span>{ev.event_date}</span>
                        </div>
                        <div className="flex items-center justify-between border-t border-white/5 pt-4 gap-2">
                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              className="p-2 text-on-surface-variant hover:text-primary transition-colors"
                              onClick={() => openEdit(ev)}
                            >
                              <span className="material-symbols-outlined text-lg">edit</span>
                            </button>
                            <button
                              type="button"
                              className="p-2 text-on-surface-variant hover:text-error transition-colors"
                              onClick={() => void deleteEvent(ev)}
                            >
                              <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                          </div>
                          <button
                            type="button"
                            className={`shrink-0 p-2 rounded-sm text-lg leading-none transition-colors ${
                              ev.featured ? "text-[#F5A623] hover:bg-[#F5A623]/10" : "text-slate-500 hover:text-slate-400"
                            }`}
                            onClick={() => void toggleFeatured(ev)}
                            title={ev.featured ? "Featured" : "Feature"}
                            aria-label={ev.featured ? "Featured" : "Mark as featured"}
                          >
                            {ev.featured ? "★" : "☆"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
              })}
            </div>
          )}
        </div>

        {showPanel && (
          <section className="w-full lg:w-[560px] flex-shrink-0">
            <div className="bg-surface-container-low/60 backdrop-blur-2xl border border-white/10 p-8 rounded-sm sticky top-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold headline-font text-white flex items-center">
                  <span className="w-1 h-6 bg-primary mr-3" />
                  {editing ? "Edit Event" : "New Event"}
                </h3>
                <button type="button" onClick={closePanel}>
                  <span className="material-symbols-outlined text-on-surface-variant">close</span>
                </button>
              </div>
              <form className="space-y-6" onSubmit={saveEvent}>
                <label className="h-[120px] border-2 border-dashed border-white/10 bg-white/5 hover:bg-white/10 transition-colors flex flex-col items-center justify-center cursor-pointer group rounded-sm">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
                    multiple
                    className="hidden"
                    onChange={(ev) => setMediaFiles([...(ev.target.files ?? [])])}
                  />
                  <span className="material-symbols-outlined text-3xl text-outline group-hover:text-primary mb-2">cloud_upload</span>
                  <p className="text-xs text-on-surface-variant text-center px-2">
                    Add images or video {mediaFiles.length ? `(${mediaFiles.length} new)` : ""}
                  </p>
                </label>
                <div className="space-y-4">
                  <input
                    required
                    className="w-full bg-surface-container-highest border-none text-on-surface text-sm p-3 focus:ring-1 focus:ring-primary rounded-sm transition-all"
                    placeholder="Title"
                    value={title}
                    onChange={(ev) => setTitle(ev.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      className="w-full bg-surface-container-highest border-none text-on-surface text-sm p-3 focus:ring-1 focus:ring-primary rounded-sm transition-all"
                      placeholder="Type (e.g. club)"
                      value={eventType}
                      onChange={(ev) => setEventType(ev.target.value)}
                    />
                    <input
                      required
                      className="w-full bg-surface-container-highest border-none text-on-surface text-sm p-3 focus:ring-1 focus:ring-primary rounded-sm transition-all"
                      type="date"
                      value={eventDate}
                      onChange={(ev) => setEventDate(ev.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      className="w-full bg-surface-container-highest border-none text-on-surface text-sm p-3 focus:ring-1 focus:ring-primary rounded-sm transition-all"
                      placeholder="Venue"
                      value={venue}
                      onChange={(ev) => setVenue(ev.target.value)}
                    />
                    <input
                      className="w-full bg-surface-container-highest border-none text-on-surface text-sm p-3 focus:ring-1 focus:ring-primary rounded-sm transition-all"
                      placeholder="Location"
                      value={location}
                      onChange={(ev) => setLocation(ev.target.value)}
                    />
                  </div>
                  <textarea
                    className="w-full bg-surface-container-highest border-none text-on-surface text-sm p-3 focus:ring-1 focus:ring-primary rounded-sm min-h-[80px]"
                    placeholder="Description"
                    value={description}
                    onChange={(ev) => setDescription(ev.target.value)}
                  />
                  <label className="flex items-center gap-2 text-sm text-on-surface-variant cursor-pointer">
                    <input type="checkbox" checked={featured} onChange={(ev) => setFeatured(ev.target.checked)} />
                    Featured on site
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-primary-container text-on-primary-container font-black uppercase tracking-widest text-xs py-4 rounded-sm hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_10px_20px_rgba(0,191,255,0.2)] disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save Event"}
                </button>
              </form>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
