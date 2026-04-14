import { z } from "zod";

export const bookingSchema = z.object({
  clientName: z.string().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  clientEmail: z.string().email("Invalid email address"),
  clientPhone: z.string().min(10, "Phone number too short").max(20, "Phone number too long"),
  eventType: z.enum(["Wedding", "Corporate", "Festival", "Club Night", "Birthday", "Other"]),
  eventDate: z.string().refine((d) => !Number.isNaN(Date.parse(d)), { message: "Invalid date" }),
  venue: z.string().min(3, "Venue is required").max(200, "Venue too long"),
  guestCount: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.coerce.number().int().min(1).max(100000).optional(),
  ),
  notes: z.string().max(1000, "Notes too long").nullable().optional(),
  eventName: z.string().max(200).nullable().optional(),
  packageName: z.string().nullable().optional(),
  genres: z.array(z.string()).optional(),
});

export const orderSchema = z.object({
  customerName: z.string().min(2).max(100),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(10).max(20),
  deliveryAddress: z.string().min(5, "Address required").max(500),
  region: z.string().min(2).max(100),
  notes: z.string().max(500).nullable().optional(),
  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        name: z.string(),
        size: z.string(),
        colour: z.string(),
        qty: z.number().int().min(1).max(100),
        price: z.number().min(0),
        image_url: z.string().max(2048).nullable().optional(),
      }),
    )
    .min(1, "At least one item required"),
  total: z.number().min(0),
});

const playlistSongIn = z.object({
  title: z.string(),
  artist: z.string(),
  note: z.string().optional(),
});

const playlistDnPIn = z.object({
  title: z.string(),
  artist: z.string(),
});

const timelineIn = z.object({
  time: z.string().optional(),
  moment: z.string(),
  notes: z.string().optional(),
});

export const playlistCreateSchema = z.object({
  event_id: z.string().min(1),
  genres: z.array(z.string()).optional(),
  vibe: z.string().nullable().optional(),
  must_play: z.array(playlistSongIn).optional(),
  do_not_play: z.array(playlistDnPIn).optional(),
  timeline: z.array(timelineIn).optional(),
  extra_notes: z.string().max(2000).nullable().optional(),
});

export const playlistPatchSchema = z.object({
  genres: z.array(z.string()).optional(),
  vibe: z.string().nullable().optional(),
  must_play: z.array(playlistSongIn).optional(),
  do_not_play: z.array(playlistDnPIn).optional(),
  timeline: z.array(timelineIn).optional(),
  extra_notes: z.string().max(2000).nullable().optional(),
  locked: z.boolean().optional(),
});

export const adminInviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "super_admin"]),
});
