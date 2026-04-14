/** Standalone row type avoids self-referential `Database[...]` in Insert/Update, which can break Supabase `.update()` inference. */
export type BookingsRow = {
  id: string;
  event_id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  event_type: string;
  event_name: string | null;
  event_date: string;
  venue: string;
  guest_count: number | null;
  notes: string | null;
  genres: string[];
  package_name: string | null;
  status: "pending" | "confirmed" | "cancelled";
  payment_status: "unpaid" | "paid";
  created_at: string;
};

export type ContactMessagesRow = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  subject: string;
  message: string;
};

export type PlayEventsRow = {
  id: string;
  user_id: string | null;
  music_id: string | null;
  track_title: string;
  artist: string;
  release_type: string | null;
  duration_played: number | null;
  source: string | null;
  session_id: string | null;
  played_at: string;
};

export type Database = {
  public: {
    Tables: {
      bookings: {
        Row: BookingsRow;
        Insert: Omit<BookingsRow, "id" | "created_at" | "event_id">;
        Update: Partial<BookingsRow>;
        Relationships: [];
      };
      playlists: {
        Row: {
          id: string;
          event_id: string;
          genres: string[];
          vibe: string | null;
          must_play: PlaylistSong[];
          do_not_play: PlaylistSong[];
          timeline: TimelineMoment[];
          extra_notes: string | null;
          locked: boolean;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["playlists"]["Row"],
          "id" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["playlists"]["Row"]>;
        Relationships: [];
      };
      packages: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price: number;
          inclusions: string[];
          display_order: number;
          active: boolean;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["packages"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["packages"]["Row"]>;
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price: number;
          category: string;
          badge: string | null;
          sizes: string[];
          colours: string[];
          stock: number;
          image_url: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["products"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["products"]["Row"]>;
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          delivery_address: string;
          region: string;
          items: OrderItem[];
          total: number;
          payment_status: "unpaid" | "paid";
          fulfillment_status: "processing" | "shipped" | "delivered";
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["orders"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["orders"]["Row"]>;
        Relationships: [];
      };
      music: {
        Row: {
          id: string;
          title: string;
          type: "album" | "single" | "mix";
          cover_url: string | null;
          audio_url: string | null;
          duration: number | null;
          tracks: AlbumTrack[] | null;
          release_date: string | null;
          genre: string | null;
          description: string | null;
          featured: boolean;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["music"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["music"]["Row"]>;
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          title: string;
          event_type: string;
          event_date: string;
          venue: string;
          location: string;
          description: string | null;
          media_urls: string[];
          video_urls: string[];
          featured: boolean;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["events"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["events"]["Row"]>;
        Relationships: [];
      };
      admins: {
        Row: {
          id: string;
          email: string;
          role: "admin" | "super_admin";
          status: "active" | "suspended";
          last_login: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["admins"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["admins"]["Row"]>;
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          actor: string;
          actor_role: "admin" | "super_admin" | "system";
          action_type: string;
          description: string;
          target_id: string | null;
          ip_address: string | null;
          created_at: string;
          archived: boolean;
          archived_at: string | null;
          archived_by: string | null;
        };
        Insert: Omit<
          Database["public"]["Tables"]["audit_logs"]["Row"],
          "id" | "created_at" | "archived" | "archived_at" | "archived_by"
        > & {
          archived?: boolean;
          archived_at?: string | null;
          archived_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Row"]>;
        Relationships: [];
      };
      password_resets: {
        Row: {
          id: string;
          email: string;
          token: string;
          expires_at: string;
          used: boolean;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["password_resets"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["password_resets"]["Row"]>;
        Relationships: [];
      };
      contact_messages: {
        Row: ContactMessagesRow;
        Insert: Omit<ContactMessagesRow, "id" | "created_at">;
        Update: Partial<ContactMessagesRow>;
        Relationships: [];
      };
      play_events: {
        Row: PlayEventsRow;
        Insert: Omit<PlayEventsRow, "id" | "played_at"> & {
          id?: string;
          played_at?: string;
        };
        Update: Partial<PlayEventsRow>;
        Relationships: [];
      };
      platform_settings: {
        Row: {
          key: string;
          value: unknown;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: unknown;
          updated_at?: string;
        };
        Update: Partial<{
          key: string;
          value: unknown;
          updated_at: string;
        }>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          type: string;
          recipient_email: string | null;
          recipient_phone: string | null;
          channel: string;
          status: string;
          subject: string | null;
          body: string | null;
          error_message: string | null;
          retry_count: number | null;
          booking_id: string | null;
          order_id: string | null;
          created_at: string;
          sent_at: string | null;
          failed_at: string | null;
        };
        Insert: {
          type: string;
          channel: string;
          status?: string;
          recipient_email?: string | null;
          recipient_phone?: string | null;
          subject?: string | null;
          body?: string | null;
          error_message?: string | null;
          retry_count?: number | null;
          booking_id?: string | null;
          order_id?: string | null;
          sent_at?: string | null;
          failed_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};

export type PlaylistSong = {
  title: string;
  artist: string;
  note?: string;
};

export type TimelineMoment = {
  moment: string;
  time?: string;
  notes?: string;
};

export type OrderItem = {
  product_id: string;
  name: string;
  size: string;
  colour: string;
  qty: number;
  price: number;
  /** Persisted from checkout for order history / UI (R2 or CDN URL). */
  image_url?: string | null;
};

export type AlbumTrack = {
  title: string;
  duration: number;
  audio_url?: string;
};
