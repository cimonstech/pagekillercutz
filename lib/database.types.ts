export type Database = {
  public: {
    Tables: {
      bookings: {
        Row: {
          id: string;
          event_id: string;
          client_name: string;
          client_email: string;
          client_phone: string;
          event_type: string;
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
        Insert: Omit<
          Database["public"]["Tables"]["bookings"]["Row"],
          "id" | "created_at" | "event_id"
        >;
        Update: Partial<Database["public"]["Tables"]["bookings"]["Row"]>;
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
          "id" | "created_at" | "order_number"
        >;
        Update: Partial<Database["public"]["Tables"]["orders"]["Row"]>;
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
        };
        Insert: Omit<
          Database["public"]["Tables"]["audit_logs"]["Row"],
          "id" | "created_at"
        >;
        Update: never;
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
      };
    };
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
};

export type AlbumTrack = {
  title: string;
  duration: number;
  audio_url?: string;
};
