"use client";

import type { Database } from "@/lib/database.types";
import { downloadContractPDF } from "@/lib/downloadContract";
import SignaturePad from "@/components/signing/SignaturePad";
import { usePaymentSettings } from "@/hooks/usePaymentSettings";
import {
  AlertCircle,
  Building2,
  Calendar,
  ChevronDown,
  Check,
  CheckCircle,
  Clock,
  Copy,
  Download,
  FileText,
  Fingerprint,
  Handshake,
  Lock,
  Package,
  Users,
  MapPin,
  Music,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];
type PlaylistRow = Database["public"]["Tables"]["playlists"]["Row"];
type PackageRow = Database["public"]["Tables"]["packages"]["Row"];
type OrderRow = Database["public"]["Tables"]["orders"]["Row"];

type PlaylistMapRow = Pick<
  PlaylistRow,
  "event_id" | "locked" | "must_play" | "do_not_play" | "timeline"
>;

type EventDataLite = {
  media_urls: string[];
  title: string;
  event_type: string;
};

const FALLBACK_IMAGES = [
  "https://assets.pagekillercutz.com/event-media/event-media_killercutzcover1.jpg",
  "https://assets.pagekillercutz.com/event-media/event-media_killercutzcover2.jpg",
  "https://assets.pagekillercutz.com/event-media/event-media_detty-december-festival.jpg",
  "https://assets.pagekillercutz.com/event-media/event-media_club-onyx-residency.webp",
  "https://assets.pagekillercutz.com/event-media/event-media_global-rhythm-fest.webp",
  "https://assets.pagekillercutz.com/event-media/event-media_totalenergies-gala.jpg",
  "https://assets.pagekillercutz.com/event-media/event-media_mensah-celebration.webp",
];

type DashboardData = {
  booking: BookingRow;
  contract: {
    id: string;
    status: "pending" | "signed" | "voided" | "pre-signed";
    signing_token: string | null;
    client_signed_at: string | null;
    pdf_url: string | null;
    contract_text?: string | null;
  } | null;
  contractSettings: {
    deposit_percentage: number | null;
  } | null;
  playlist: PlaylistRow | null;
  package: PackageRow | null;
  daysUntilEvent: number;
  eventData: EventDataLite | null;
  eventDataMap?: Record<string, EventDataLite>;
  upcomingBookings: BookingRow[];
  pastBookings: BookingRow[];
  playlistMap: Record<string, PlaylistMapRow>;
  recentOrders: OrderRow[];
  recentNotifications: {
    id: string;
    icon: "notifications";
    tone: "primary" | "secondary";
    message: string;
    time: string;
  }[];
};

const glass =
  "rounded-[20px] border border-white/[0.08] bg-white/[0.05] p-6 backdrop-blur-[20px]";

function jsonArrLen(v: unknown): number {
  return Array.isArray(v) ? v.length : 0;
}

function formatEventDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatShortEventDay(iso: string): string {
  try {
    return new Date(`${iso.trim()}T00:00:00`).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return iso;
  }
}

function daysUntilEventDate(iso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ed = new Date(`${iso.trim().split("T")[0]}T00:00:00`);
  const diff = ed.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function heroTitle(booking: BookingRow): string {
  const name = booking.event_name?.trim();
  if (name) return name;
  return `${booking.event_type} Event`;
}

function eventTypeEmoji(eventType: string): string {
  const x = eventType.toLowerCase();
  if (x.includes("wedd")) return "💍";
  if (x.includes("corporate")) return "💼";
  if (x.includes("festival")) return "🎪";
  if (x.includes("club")) return "🎶";
  if (x.includes("birth")) return "🎂";
  return "🎵";
}

function truncatePillLabel(s: string, max = 20): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function DashboardSkeleton() {
  const sk = "rounded-[20px] border border-white/[0.06] bg-[rgba(255,255,255,0.04)] overflow-hidden";
  return (
    <div className="mx-auto grid max-w-7xl grid-cols-12 gap-6">
      <div className={`col-span-12 min-h-[320px] lg:col-span-8 ${sk}`}>
        <div className="kc-shimmer h-full min-h-[320px] w-full" />
      </div>
      <div className={`col-span-12 min-h-[280px] lg:col-span-4 ${sk}`}>
        <div className="kc-shimmer h-full min-h-[280px] w-full" />
      </div>
      <div className={`col-span-12 min-h-[220px] md:col-span-4 lg:col-span-3 ${sk}`}>
        <div className="kc-shimmer h-full min-h-[220px] w-full" />
      </div>
      <div className={`col-span-12 min-h-[220px] md:col-span-4 lg:col-span-3 ${sk}`}>
        <div className="kc-shimmer h-full min-h-[220px] w-full" />
      </div>
      <div className={`col-span-12 min-h-[200px] md:col-span-12 lg:col-span-6 ${sk}`}>
        <div className="kc-shimmer h-full min-h-[200px] w-full" />
      </div>
      <div className={`col-span-12 min-h-[160px] ${sk}`}>
        <div className="kc-shimmer h-full min-h-[160px] w-full" />
      </div>
    </div>
  );
}

function LiveDateTime() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div
        style={{
          fontFamily: "Space Mono",
          fontSize: "11px",
          color: "#A0A8C0",
        }}
      >
        {now.toLocaleDateString("en-GH", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </div>
      <div
        style={{
          fontFamily: "Space Mono",
          fontWeight: 700,
          fontSize: "11px",
          color: "#00BFFF",
          background: "rgba(0,191,255,0.08)",
          border: "1px solid rgba(0,191,255,0.20)",
          padding: "3px 8px",
          borderRadius: "6px",
          letterSpacing: "0.05em",
        }}
      >
        {now.toLocaleTimeString("en-GH", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })}
      </div>
    </div>
  );
}

export default function ClientDashboardPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [data, setData] = useState<DashboardData | null>(null);
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const [activePackage, setActivePackage] = useState<PackageRow | null>(null);
  const { settings: paymentSettings } = usePaymentSettings();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedEventId, setCopiedEventId] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [bankOpen, setBankOpen] = useState(false);
  const [momoOpen, setMomoOpen] = useState(true);
  const [pastExpanded, setPastExpanded] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [generatingContract, setGeneratingContract] = useState(false);
  const [activeContract, setActiveContract] = useState<DashboardData["contract"] | null>(null);
  const [loadingContract, setLoadingContract] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [hasScrolledContract, setHasScrolledContract] = useState(false);
  const [signAgreed, setSignAgreed] = useState(false);
  const [signing, setSigning] = useState(false);
  const contractTextRef = useRef<HTMLDivElement>(null);
  const [contractTriggeredByPlaylist, setContractTriggeredByPlaylist] = useState(false);
  const [signatureTab, setSignatureTab] = useState<"draw" | "type">("draw");
  const [drawnSignature, setDrawnSignature] = useState<string | null>(null);
  const [typedName, setTypedName] = useState("");
  const [signedSuccess, setSignedSuccess] = useState(false);
  const [signedPdfUrl, setSignedPdfUrl] = useState("");

  const handleCloseModal = () => {
    setShowContractModal(false);
    setContractTriggeredByPlaylist(false);
    if (activeContract?.status === "pending" && !signedSuccess && activeBooking?.event_id) {
      sessionStorage.setItem(`contract-dismissed-${activeBooking.event_id}`, "true");
    }
  };

  const signContract = async (token: string) => {
    setSigning(true);
    try {
      const signatureData = signatureTab === "draw" ? drawnSignature : typedName;
      const res = await fetch(`/api/contracts/${token}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signatureType: signatureTab,
          signatureData,
        }),
      });
      const json = (await res.json()) as { success?: boolean; pdfUrl?: string; error?: string };
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Signing failed");
      }

      setSignedSuccess(true);
      if (json.pdfUrl) {
        setSignedPdfUrl(json.pdfUrl);
        downloadContractPDF(json.pdfUrl, `contract-${activeBooking?.event_id}-signed.pdf`);
      }
      setActiveContract((prev) =>
        prev
          ? {
              ...prev,
              status: "signed",
              client_signed_at: new Date().toISOString(),
              pdf_url: json.pdfUrl ?? prev.pdf_url,
            }
          : prev,
      );
    } catch (error) {
      alert(error instanceof Error ? error.message : "Signing failed. Please try again.");
    } finally {
      setSigning(false);
    }
  };

  const handleSign = async () => {
    const sigReady = signatureTab === "draw" ? Boolean(drawnSignature) : typedName.trim().length >= 2;
    if (!hasScrolledContract || !signAgreed || !sigReady || !activeBooking) return;

    if (!activeContract?.signing_token) {
      const genRes = await fetch("/api/contracts/generate-client", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: activeBooking.event_id,
        }),
      });
      const genData = (await genRes.json()) as { success?: boolean; contract?: DashboardData["contract"] };
      if (!genRes.ok || !genData.success || !genData.contract) {
        alert("Could not generate contract. Please contact PAGE KillerCutz.");
        return;
      }
      setActiveContract(genData.contract);
      if (!genData.contract.signing_token) {
        alert("Contract signing token missing. Please close and reopen this modal.");
        return;
      }
      await signContract(genData.contract.signing_token);
    } else {
      await signContract(activeContract.signing_token);
    }
  };

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (cancelled) return;
        if (!user?.email) {
          router.replace("/sign-in");
          return;
        }

        const { data: adminRecord } = await supabase
          .from("admins")
          .select("role")
          .eq("email", user.email)
          .maybeSingle();

        if (cancelled) return;
        if (adminRecord) {
          router.replace("/admin");
          return;
        }

        const res = await fetch("/api/client/dashboard");
        const json = (await res.json()) as { error?: string } & Partial<DashboardData>;
        if (cancelled) return;
        if (res.status === 401) {
          router.push("/sign-in");
          return;
        }
        if (!res.ok) {
          setError(json.error ?? "Failed to load dashboard");
          setLoading(false);
          return;
        }
        const payload: DashboardData = {
          ...(json as DashboardData),
          upcomingBookings: json.upcomingBookings ?? [],
          pastBookings: json.pastBookings ?? [],
          playlistMap: json.playlistMap ?? {},
          recentOrders: json.recentOrders ?? [],
          recentNotifications: json.recentNotifications ?? [],
        };
        setData(payload);
        setActivePackage(json.package ?? null);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes("lock:") || message.includes("Lock ") || message.includes("steal")) return;
        if (!cancelled) setError("Failed to load dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  const activeBooking = useMemo(() => {
    if (!data) return null;
    if (activeBookingId) {
      const found = [...data.upcomingBookings, ...data.pastBookings].find(
        (b) => b.event_id === activeBookingId,
      );
      return found ?? data.booking;
    }
    return data.booking;
  }, [data, activeBookingId]);

  useEffect(() => {
    if (!activeBooking?.package_name?.trim()) {
      setActivePackage(null);
      return;
    }
    const sameAsPrimary = activeBooking.event_id === data?.booking.event_id;
    if (sameAsPrimary && data?.package) {
      setActivePackage(data.package);
      return;
    }

    const ac = new AbortController();
    void (async () => {
      try {
        const res = await fetch(
          `/api/packages?name=${encodeURIComponent(activeBooking.package_name!.trim())}`,
          { signal: ac.signal },
        );
        const d = (await res.json()) as { packages?: PackageRow[] };
        if (!ac.signal.aborted) setActivePackage(d.packages?.[0] ?? null);
      } catch {
        if (!ac.signal.aborted) setActivePackage(null);
      }
    })();
    return () => ac.abort();
  }, [activeBooking, data?.booking?.event_id, data?.package]);

  const activePlaylist = useMemo(() => {
    if (!data || !activeBooking) return null;
    const fromMap = data.playlistMap[activeBooking.event_id];
    if (fromMap) return fromMap;
    if (activeBooking.event_id === data.booking.event_id && data.playlist) {
      return data.playlist as PlaylistMapRow;
    }
    return null;
  }, [data, activeBooking]);

  useEffect(() => {
    if (!activeBooking?.event_id) return;
    let cancelled = false;
    setActiveContract(null);
    setLoadingContract(true);
    fetch(`/api/client/dashboard?eventId=${encodeURIComponent(activeBooking.event_id)}`)
      .then((r) => r.json())
      .then((contractData: { contract?: DashboardData["contract"] | null }) => {
        if (cancelled) return;
        setActiveContract(contractData.contract ?? null);
      })
      .catch(() => {
        if (!cancelled) setActiveContract(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingContract(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeBooking?.event_id]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (showContractModal) {
      setScrollProgress(0);
      setHasScrolledContract(false);
      setSignatureTab("draw");
      setDrawnSignature(null);
      setTypedName("");
      setSignAgreed(false);
      setSigning(false);
      setSignedSuccess(false);
    }
  }, [showContractModal]);

  useEffect(() => {
    if (!showContractModal || !activeBooking?.event_id) return;
    if (activeContract?.contract_text?.trim()) return;

    let cancelled = false;
    setGeneratingContract(true);
    void (async () => {
      try {
        const genRes = await fetch("/api/contracts/generate-client", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId: activeBooking.event_id }),
        });
        const genData = (await genRes.json()) as { success?: boolean; contract?: DashboardData["contract"] };
        if (!cancelled && genRes.ok && genData.success && genData.contract) {
          setActiveContract(genData.contract);
        }
      } finally {
        if (!cancelled) setGeneratingContract(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [showContractModal, activeBooking?.event_id, activeContract?.contract_text]);

  useEffect(() => {
    if (!data || !activeContract || !activeBooking) return;
    if (
      activeContract.status === "pending" &&
      activeBooking.status === "confirmed" &&
      !sessionStorage.getItem(`contract-dismissed-${activeBooking.event_id}`)
    ) {
      const timeout = setTimeout(() => {
        setShowContractModal(true);
      }, 800);
      return () => clearTimeout(timeout);
    }
  }, [data, activeContract, activeBooking]);

  useEffect(() => {
    if (!data || !activeContract || !activeBooking) return;
    if (
      activeContract.status === "pending" &&
      activeBooking.status === "confirmed" &&
      !sessionStorage.getItem(`contract-dismissed-${activeBooking.event_id}`)
    ) {
      const t = setTimeout(() => setShowContractModal(true), 800);
      return () => clearTimeout(t);
    }
  }, [data, activeContract, activeBooking]);

  const activeDaysUntil = useMemo(() => {
    if (!activeBooking) return data?.daysUntilEvent ?? 0;
    return daysUntilEventDate(activeBooking.event_date);
  }, [activeBooking, data?.daysUntilEvent]);

  const copyEventId = useCallback(async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedEventId(true);
      setTimeout(() => setCopiedEventId(false), 2000);
    } catch {
      /* ignore */
    }
  }, []);

  const copyToClipboard = useCallback(async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // ignore
    }
  }, []);

  if (loading) {
    return (
      <main className="relative z-[1] w-full min-w-0 pb-8 text-on-surface">
        <DashboardSkeleton />
      </main>
    );
  }

  if (error === "No booking found") {
    return (
      <main className="relative z-[1] flex min-h-[60vh] w-full min-w-0 items-center justify-center pb-8 text-on-surface">
        <div className={`mx-auto w-full max-w-[480px] text-center ${glass} px-8 py-12`}>
          <Handshake className="mx-auto size-14 text-on-surface-variant/50" strokeWidth={1.25} aria-hidden />
          <h2 className="mt-6 font-headline text-2xl font-semibold text-white">Welcome to Page KillerCutz</h2>
          <p className="mt-3 font-body text-sm leading-relaxed text-on-surface-variant">
            You don&apos;t have any bookings yet. Book Page KillerCutz for your next event to get started.
          </p>
          <button
            type="button"
            onClick={() => router.push("/booking")}
            className="mt-8 inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-full bg-[#00BFFF] px-8 py-3.5 font-headline text-sm font-semibold text-black transition-all hover:brightness-110"
          >
            Book the DJ <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </button>
          <button
            type="button"
            onClick={() => router.push("/merch")}
            className="mt-3 inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-full border border-white/[0.12] bg-transparent px-8 py-3 font-headline text-sm font-medium text-on-surface-variant transition-colors hover:bg-white/[0.06]"
          >
            Browse Merch
          </button>
        </div>
      </main>
    );
  }

  if (error || !data || !activeBooking) {
    return (
      <main className="relative z-[1] w-full min-w-0 pb-8 text-on-surface">
        <p className="text-center font-body text-sm text-error">{error ?? "Something went wrong."}</p>
      </main>
    );
  }

  const firstName = data.booking.client_name?.trim().split(/\s+/)[0] ?? "there";
  const paid = activeBooking.payment_status === "paid";
  const mustPlay = jsonArrLen(activePlaylist?.must_play);
  const doNotPlay = jsonArrLen(activePlaylist?.do_not_play);
  const timeline = jsonArrLen(activePlaylist?.timeline);
  const hasPlaylist = Boolean(activePlaylist) && mustPlay + doNotPlay + timeline > 0;
  const isLocked = activePlaylist?.locked === true;
  const pkgPrice = activePackage?.price;

  const depositPct = data.contractSettings?.deposit_percentage ?? 30;
  const totalFee = Number(activeBooking.package_price ?? pkgPrice ?? 0);
  const depositAmount = Number(
    activeBooking.deposit_amount ?? Math.round((totalFee * Number(depositPct)) / 100),
  );
  const balanceAmount = Number(activeBooking.balance_amount ?? Math.max(0, totalFee - depositAmount));
  const isFullyPaid = activeBooking.payment_status === "paid";
  const depositPaid = Boolean(activeBooking.deposit_paid) || isFullyPaid;

  const nextPaymentAmount = isFullyPaid ? totalFee : !depositPaid ? depositAmount : balanceAmount;
  const nextPaymentDate = !depositPaid ? activeBooking.deposit_due_date : activeBooking.balance_due_date;

  const recentUpdates = data.recentNotifications.slice(0, 6);

  const playlistHref = `/client/playlist?eventId=${encodeURIComponent(activeBooking.event_id)}`;
  const upcomingBookings = data.upcomingBookings;
  const loadingContractText = generatingContract;

  const getCtaConfig = () => {
    const contractSigned = activeContract?.status === "signed";
    if (!activePlaylist) {
      return {
        label: "Curate Your Playlist →",
        background: "#00BFFF",
        color: "#000",
        icon: <Music size={16} />,
        action: contractSigned ? ("playlist" as const) : ("sign" as const),
      };
    }
    if (activePlaylist.locked) {
      return {
        label: "View Playlist (Locked)",
        background: "rgba(255,255,255,0.06)",
        color: "#A0A8C0",
        icon: <Lock size={16} />,
        action: "view" as const,
      };
    }
    return {
      label: "Edit My Playlist →",
      background: "#00BFFF",
      color: "#000",
      icon: <Music size={16} />,
      action: contractSigned ? ("playlist" as const) : ("sign" as const),
    };
  };

  const ctaConfig = getCtaConfig();

  const handleMainCta = () => {
    const contractSigned =
      activeContract?.status === "signed" || activeContract?.status === "pre-signed";

    if (contractSigned || !activeContract) {
      if (contractSigned) {
        router.push(`/client/playlist?eventId=${activeBooking.event_id}`);
      } else {
        setShowContractModal(true);
        setContractTriggeredByPlaylist(true);
      }
      return;
    }

    setShowContractModal(true);
    setContractTriggeredByPlaylist(true);
  };

  const handleContractBtn = () => {
    if (!activeContract?.pdf_url || activeContract.status !== "signed") {
      setShowContractModal(true);
    } else {
      downloadContractPDF(activeContract.pdf_url, `contract-${activeBooking.event_id}.pdf`);
    }
  };

  return (
    <main className="dashboard-container relative z-[1] w-full min-w-0 pb-8 text-on-surface">
      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-6">
        <div className="col-span-12" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
          <div>
            <div style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: "20px", color: "white", marginBottom: "3px" }}>
              Welcome back, {firstName}
            </div>
            <div style={{ fontFamily: "Inter", fontSize: "13px", color: "#A0A8C0" }}>
              You have {upcomingBookings.length} upcoming event{upcomingBookings.length !== 1 ? "s" : ""}.
            </div>
          </div>
          <button
            onClick={() => router.push("/booking")}
            style={{
              padding: "9px 18px",
              borderRadius: "999px",
              border: "1px solid rgba(0,191,255,0.35)",
              background: "transparent",
              color: "#00BFFF",
              fontFamily: "Space Grotesk",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Book Again →
          </button>
        </div>

        <div className="col-span-12 rounded-[16px] border border-white/[0.08] bg-white/[0.04] p-4">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <div style={{ fontFamily: "Space Grotesk", fontWeight: 600, fontSize: "13px", color: "white" }}>Your Upcoming Events</div>
            <LiveDateTime />
          </div>
          <div className="event-switcher-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
            <div style={{ position: "relative" }} ref={dropdownRef}>
              <div
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  borderRadius: "10px",
                  padding: "11px 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  userSelect: "none",
                  minHeight: "72px",
                }}
              >
                <span style={{ fontFamily: "Space Grotesk", fontWeight: 500, fontSize: "13px", color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginRight: "8px" }}>
                  {activeBooking.event_name || activeBooking.event_type} ·{" "}
                  {new Date(`${activeBooking.event_date}T00:00:00`).toLocaleDateString("en-GH", { day: "numeric", month: "short" })} · {activeBooking.event_id}
                </span>
                <ChevronDown
                  size={14}
                  color="#00BFFF"
                  style={{
                    transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 200ms ease",
                    flexShrink: 0,
                  }}
                />
              </div>
              {dropdownOpen ? (
                <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "rgba(10,10,20,0.98)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: "12px", overflow: "hidden", zIndex: 50, boxShadow: "0 8px 32px rgba(0,0,0,0.60)" }}>
                  {upcomingBookings.map((b, i) => (
                    <div
                      key={b.event_id}
                      onClick={() => {
                        setActiveBookingId(b.event_id);
                        setDropdownOpen(false);
                      }}
                      style={{
                        padding: "11px 14px",
                        cursor: "pointer",
                        background: activeBookingId === b.event_id ? "rgba(0,191,255,0.08)" : "transparent",
                        borderBottom: i < upcomingBookings.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span style={{ fontFamily: "Space Grotesk", fontWeight: 500, fontSize: "13px", color: activeBookingId === b.event_id ? "#00BFFF" : "white" }}>
                        {b.event_name || b.event_type}
                      </span>
                      <span style={{ fontFamily: "Space Mono", fontSize: "10px", color: "#5A6080", marginLeft: "8px", flexShrink: 0 }}>
                        {new Date(`${b.event_date}T00:00:00`).toLocaleDateString("en-GH", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
            <div style={{ background: "rgba(0,191,255,0.08)", border: "1px solid rgba(0,191,255,0.30)", borderRadius: "10px", padding: "11px 14px", minHeight: "72px" }}>
              <div style={{ fontFamily: "Space Mono", fontSize: "9px", color: "#00BFFF", textTransform: "uppercase", letterSpacing: "0.10em", fontWeight: 700, marginBottom: "3px" }}>
                Active
              </div>
              <div style={{ fontFamily: "Space Grotesk", fontWeight: 600, fontSize: "13px", color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {activeBooking.event_name || activeBooking.event_type}
              </div>
              <div style={{ fontFamily: "Inter", fontSize: "11px", color: "#5A6080", marginTop: "2px" }}>
                {activeBooking.event_id} ·{" "}
                {new Date(`${activeBooking.event_date}T00:00:00`).toLocaleDateString("en-GH", { day: "numeric", month: "short" })}
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-main-grid col-span-12" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "14px", marginBottom: "12px", alignItems: "stretch" }}>
          <div style={{ position: "relative", overflow: "hidden", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.08)", height: "100%" }}>
            {(() => {
              const media = (activeBooking as unknown as { media_url?: string | null }).media_url;
              const fallbackIndex =
                activeBooking?.event_id?.charCodeAt(4) % FALLBACK_IMAGES.length || 0;
              const heroImage = media || FALLBACK_IMAGES[fallbackIndex];
              return (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: `url(${heroImage})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    opacity: 0.25,
                    borderRadius: "14px",
                  }}
                />
              );
            })()}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(135deg, rgba(8,8,16,0.80) 0%, rgba(8,8,16,0.60) 100%)",
                borderRadius: "14px",
              }}
            />
            <div style={{ position: "relative", zIndex: 1, padding: "20px", display: "flex", flexDirection: "column", height: "100%", minHeight: "300px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
              <div style={{ display: "inline-flex", padding: "3px 10px", borderRadius: "999px", background: "rgba(0,191,255,0.12)", border: "1px solid rgba(0,191,255,0.30)", fontFamily: "Space Mono", fontSize: "9px", fontWeight: 700, color: "#00BFFF", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                {activeBooking.event_type}
              </div>
              <div style={{ textAlign: "center", padding: "8px 14px", borderRadius: "10px", background: activeDaysUntil <= 7 ? "rgba(255,69,96,0.08)" : activeDaysUntil <= 14 ? "rgba(245,166,35,0.08)" : "rgba(0,191,255,0.06)", border: activeDaysUntil <= 7 ? "1px solid rgba(255,69,96,0.20)" : activeDaysUntil <= 14 ? "1px solid rgba(245,166,35,0.20)" : "1px solid rgba(0,191,255,0.15)" }}>
                <div style={{ fontFamily: "Space Grotesk", fontWeight: 800, fontSize: "26px", color: activeDaysUntil <= 7 ? "#FF4560" : activeDaysUntil <= 14 ? "#F5A623" : "#00BFFF", lineHeight: 1 }}>
                  {activeDaysUntil}
                </div>
                <div style={{ fontFamily: "Space Mono", fontSize: "8px", color: "#5A6080", marginTop: "3px", letterSpacing: "0.06em" }}>DAYS</div>
              </div>
            </div>
            <div style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: "20px", color: "white", lineHeight: 1.2, marginBottom: "14px" }}>
              {activeBooking.event_name || activeBooking.event_type}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "14px" }}>
              {[
                {
                  icon: "calendar",
                  label: new Date(`${activeBooking.event_date}T00:00:00`).toLocaleDateString("en-GH", {
                    weekday: "short",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }),
                },
                { icon: "pin", label: activeBooking.venue },
                { icon: "package", label: `Package: ${activeBooking.package_name || "—"}`, bold: true },
                { icon: "users", label: `Guests: ${activeBooking.guest_count || "—"}` },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                  {item.icon === "calendar" ? <Calendar size={12} color="#5A6080" /> : null}
                  {item.icon === "pin" ? <MapPin size={12} color="#5A6080" /> : null}
                  {item.icon === "package" ? <Package size={12} color="#5A6080" /> : null}
                  {item.icon === "users" ? <Users size={12} color="#5A6080" /> : null}
                  <span style={{ fontFamily: "Inter", fontSize: "12px", color: item.bold ? "white" : "#A0A8C0", fontWeight: item.bold ? 600 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", marginBottom: "12px" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
              <div onClick={() => void copyEventId(activeBooking.event_id)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "5px 10px", borderRadius: "6px", background: "rgba(0,191,255,0.06)", cursor: "pointer" }}>
                <Fingerprint size={12} color="#00BFFF" />
                <span style={{ fontFamily: "Space Mono", fontSize: "11px", color: "#00BFFF", fontWeight: 700 }}>
                  {activeBooking.event_id}
                </span>
                {copiedEventId ? <Check size={11} color="#22c55e" /> : <Copy size={11} color="rgba(0,191,255,0.50)" />}
              </div>
              {activeBooking.status === "confirmed" ? (
                <div style={{ display: "flex", alignItems: "center", gap: "5px", padding: "4px 10px", borderRadius: "6px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.20)" }}>
                  <CheckCircle size={12} color="#22c55e" />
                  <span style={{ fontFamily: "Space Grotesk", fontWeight: 500, fontSize: "11px", color: "#22c55e" }}>
                    Booking Confirmed
                  </span>
                </div>
              ) : null}
              {activeBooking.status === "pending" ? (
                <div style={{ display: "flex", alignItems: "center", gap: "5px", padding: "4px 10px", borderRadius: "6px", background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.20)" }}>
                  <Clock size={12} color="#F5A623" />
                  <span style={{ fontFamily: "Space Grotesk", fontWeight: 500, fontSize: "11px", color: "#F5A623" }}>
                    Awaiting Confirmation
                  </span>
                </div>
              ) : null}
            </div>
            </div>
          </div>
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "14px",
              overflow: "hidden",
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              <div style={{ fontFamily: "Space Mono", fontSize: "8px", fontWeight: 700, letterSpacing: "0.12em", color: "#5A6080", textTransform: "uppercase" }}>
                Payment Status
              </div>
              {isFullyPaid ? (
                <div style={{ padding: "2px 9px", borderRadius: "999px", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)", fontFamily: "Space Mono", fontSize: "8px", fontWeight: 700, color: "#22c55e" }}>
                  FULLY PAID
                </div>
              ) : (
                <div style={{ padding: "2px 9px", borderRadius: "999px", background: "rgba(245,166,35,0.12)", border: "1px solid rgba(245,166,35,0.25)", fontFamily: "Space Mono", fontSize: "8px", fontWeight: 700, color: "#F5A623" }}>
                  DEPOSIT DUE
                </div>
              )}
            </div>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
              <div style={{ fontFamily: "Inter", fontSize: "12px", color: "#A0A8C0", marginBottom: "4px" }}>{isFullyPaid ? "Total paid" : "Next payment"}</div>
              <div style={{ fontFamily: "Space Grotesk", fontWeight: 800, fontSize: "26px", color: "#F5A623", marginBottom: "2px" }}>
                GHS {nextPaymentAmount.toLocaleString()}
              </div>
              {!isFullyPaid && nextPaymentDate ? (
                <div style={{ fontFamily: "Inter", fontSize: "11px", color: "#5A6080" }}>
                  By:{" "}
                  <span style={{ color: "white" }}>
                    {new Date(`${nextPaymentDate}T00:00:00`).toLocaleDateString("en-GH", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
              ) : null}
            </div>
            {paymentSettings?.momo_enabled ? (
              <div style={{ flexShrink: 0 }}>
                <button
                  onClick={() => {
                    setMomoOpen((prev) => {
                      const next = !prev;
                      if (next) setBankOpen(false);
                      return next;
                    });
                  }}
                  style={{ width: "100%", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "transparent", border: "none", borderTop: "1px solid rgba(255,255,255,0.06)", cursor: "pointer" }}
                >
                  <span style={{ fontFamily: "Space Grotesk", fontWeight: 600, fontSize: "12px", color: "#A0A8C0" }}>
                    Mobile Money
                  </span>
                  <ChevronDown size={14} color="#5A6080" style={{ transform: momoOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 200ms" }} />
                </button>
                {momoOpen ? (
                  <div style={{ padding: "0 16px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: paymentSettings.momo_network === "MTN" ? "#FFCC00" : paymentSettings.momo_network === "Vodafone" ? "#E60000" : "#0066CC" }} />
                      <span style={{ fontFamily: "Space Mono", fontSize: "10px", fontWeight: 700, color: "white" }}>
                        {paymentSettings.momo_network} MoMo
                      </span>
                    </div>
                    <div style={{ marginBottom: "6px" }}>
                      <div style={{ fontFamily: "Space Mono", fontSize: "9px", color: "#5A6080", textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: "2px" }}>Number</div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: "20px", color: "white" }}>{paymentSettings.momo_number}</div>
                      <div style={{ fontFamily: "Inter", fontSize: "11px", color: "#5A6080" }}>
                        {paymentSettings.momo_account_name}
                        {paymentSettings.bank_account_number ? ` · ${paymentSettings.bank_account_number}` : ""}
                      </div>
                        </div>
                        <button onClick={() => void copyToClipboard(paymentSettings.momo_number, "momo")} style={{ background: "none", border: "none", cursor: "pointer", color: copied === "momo" ? "#22c55e" : "rgba(255,255,255,0.35)", padding: "4px" }}>
                          {copied === "momo" ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "10px 12px" }}>
                      <div style={{ fontFamily: "Space Mono", fontSize: "9px", color: "#5A6080", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>Reference / Narration</div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontFamily: "Space Mono", fontWeight: 700, fontSize: "15px", color: "#F5A623" }}>{activeBooking.event_id}</div>
                        <button onClick={() => void copyToClipboard(activeBooking.event_id, "ref")} style={{ background: "none", border: "none", cursor: "pointer", color: copied === "ref" ? "#22c55e" : "rgba(255,255,255,0.35)", padding: "4px" }}>
                          {copied === "ref" ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                      <div style={{ fontFamily: "Inter", fontSize: "10px", color: "#5A6080", marginTop: "3px" }}>Use this as your narration</div>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
            {paymentSettings?.bank_enabled ? (
              <div style={{ flexShrink: 0 }}>
                <button
                  onClick={() =>
                    setBankOpen((prev) => {
                      const next = !prev;
                      if (next) setMomoOpen(false);
                      return next;
                    })
                  }
                  style={{ width: "100%", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "transparent", border: "none", borderTop: "1px solid rgba(255,255,255,0.06)", cursor: "pointer" }}
                >
                  <span style={{ fontFamily: "Space Grotesk", fontWeight: 600, fontSize: "12px", color: "#A0A8C0" }}>Bank Transfer</span>
                  <ChevronDown size={14} color="#5A6080" style={{ transform: bankOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 200ms" }} />
                </button>
                {bankOpen ? (
                  <div style={{ padding: "0 16px 14px" }}>
                    {[
                      { label: "Bank", value: paymentSettings.bank_name, key: "bank_name" },
                      {
                        label: "Account Number / Name",
                        value:
                          paymentSettings.bank_account_number && paymentSettings.bank_account_name
                            ? `${paymentSettings.bank_account_number} · ${paymentSettings.bank_account_name}`
                            : paymentSettings.bank_account_number || paymentSettings.bank_account_name,
                        key: "bank_account_combo",
                        mono: true,
                      },
                    ]
                      .filter((r) => r.value)
                      .map((row) => (
                        <div key={row.key} style={{ marginBottom: "8px" }}>
                          <div style={{ fontFamily: "Space Mono", fontSize: "9px", color: "#5A6080", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "2px" }}>{row.label}</div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontFamily: row.mono ? "Space Mono" : "Inter", fontSize: "13px", fontWeight: 500, color: "white" }}>{row.value}</span>
                            <button onClick={() => void copyToClipboard(String(row.value), row.key)} style={{ background: "none", border: "none", cursor: "pointer", color: copied === row.key ? "#22c55e" : "rgba(255,255,255,0.35)", padding: "4px", flexShrink: 0 }}>
                              {copied === row.key ? <Check size={13} /> : <Copy size={13} />}
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : null}
              </div>
            ) : null}
            <div style={{ padding: "10px 16px", borderTop: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
              <p style={{ fontFamily: "Inter", fontSize: "10px", color: "#5A6080", lineHeight: 1.5, margin: 0 }}>
                Send payment via Mobile Money or bank transfer. Use your Event ID as the payment reference.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "14px", marginBottom: "16px" }} className="dashboard-cta-row col-span-12">
          <button
            onClick={handleMainCta}
            style={{
              padding: "14px 24px",
              borderRadius: "12px",
              border: "none",
              cursor: "pointer",
              fontFamily: "Space Grotesk",
              fontWeight: 700,
              fontSize: "15px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              width: "100%",
              background: ctaConfig.background,
              color: ctaConfig.color,
              opacity: loadingContract ? 0.7 : 1,
            }}
          >
            {loadingContract ? (
              "Preparing..."
            ) : (
              <>
                <Music size={16} color="#000" />
                {ctaConfig.label}
              </>
            )}
          </button>
          <button
            onClick={handleContractBtn}
            style={{
              padding: "14px 16px",
              borderRadius: "12px",
              background: activeContract?.status === "signed" ? "rgba(34,197,94,0.10)" : "rgba(255,255,255,0.04)",
              border: activeContract?.status === "signed" ? "1px solid rgba(34,197,94,0.25)" : "1px solid rgba(255,255,255,0.10)",
              color: activeContract?.status === "signed" ? "#22c55e" : "#A0A8C0",
              cursor: "pointer",
              fontFamily: "Space Grotesk",
              fontWeight: 600,
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              width: "100%",
            }}
          >
            <Download size={14} />
            {activeContract?.status === "signed" ? "Signed Contract" : "Service Agreement"}
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }} className="dashboard-bento-row col-span-12">
        <div className={`flex h-[340px] min-w-0 flex-col ${glass}`}>
          <h3 className="mb-6 font-headline text-lg font-semibold text-on-surface">Your Playlist</h3>
          <div className="flex flex-1 flex-col space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_#8fd6ff]" />
              <span className="text-sm font-medium text-on-surface">{mustPlay} Must-play songs</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-2 w-2 rounded-full bg-error shadow-[0_0_8px_#ffb4ab]" />
              <span className="text-sm font-medium text-on-surface">{doNotPlay} Do-not-play</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-2 w-2 rounded-full bg-secondary shadow-[0_0_8px_#ffb955]" />
              <span className="text-sm font-medium text-on-surface">{timeline} Timeline moments</span>
            </div>
          </div>
          <div className="mt-8 min-w-0">
            {!hasPlaylist && (
              <span
                role="button"
                tabIndex={0}
                onClick={() => router.push(playlistHref)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(playlistHref);
                  }
                }}
                style={{ color: "#00BFFF", cursor: "pointer", fontSize: "13px" }}
                className="font-body inline-block"
              >
                Start building your playlist →
              </span>
            )}
            {hasPlaylist && !isLocked && (
              <span
                role="button"
                tabIndex={0}
                onClick={() => router.push(playlistHref)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(playlistHref);
                  }
                }}
                style={{ color: "#00BFFF", cursor: "pointer", fontSize: "13px" }}
                className="font-body inline-block"
              >
                Edit Playlist →
              </span>
            )}
            {hasPlaylist && isLocked && (
              <span
                role="button"
                tabIndex={0}
                onClick={() => router.push(playlistHref)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(playlistHref);
                  }
                }}
                style={{ color: "#A0A8C0", cursor: "pointer", fontSize: "13px" }}
                className="font-body inline-block"
              >
                View Playlist (Locked)
              </span>
            )}
          </div>
        </div>

        <div className={`flex h-[340px] flex-col ${glass}`}>
          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-headline text-lg font-semibold text-on-surface">Recent Updates</h3>
            <span className="cursor-pointer text-[10px] font-bold uppercase tracking-widest text-primary">View All</span>
          </div>
          <div className="updates-scrollbar flex-1 space-y-4 overflow-y-auto pr-1">
            {recentUpdates.length === 0 ? (
              <p className="font-body text-sm text-on-surface-variant">No updates yet.</p>
            ) : (
              recentUpdates.map((n) => (
                <div
                  key={n.id}
                  className="group flex items-center gap-4 rounded p-3 transition-colors hover:bg-surface-container-highest/30"
                >
                  <span
                    className={[
                      "material-symbols-outlined rounded p-2",
                      n.tone === "primary" ? "bg-primary/10 text-primary-container" : "bg-secondary/10 text-secondary",
                    ].join(" ")}
                  >
                    {n.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-body text-[13px] font-medium text-on-surface">{n.message}</p>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">
                      {n.time}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant opacity-0 transition-opacity group-hover:opacity-100">
                    chevron_right
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
        </div>

        {showContractModal ? (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <div style={{ background: "#0E0E1A", border: "1px solid rgba(255,255,255,0.10)", borderRadius: "18px", width: "100%", maxWidth: "860px", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                <div>
                  <div style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: "16px", color: "white" }}>Details &amp; Contract</div>
                  <div style={{ fontFamily: "Space Mono", fontSize: "11px", color: "#5A6080", marginTop: "2px" }}>{activeBooking.event_id}</div>
                  {contractTriggeredByPlaylist ? (
                    <div style={{ fontFamily: "Inter", fontSize: "11px", color: "#00BFFF", marginTop: "6px" }}>
                      Sign the contract to curate your playlist.
                    </div>
                  ) : null}
                </div>
                <button onClick={handleCloseModal} style={{ padding: "7px 16px", borderRadius: "8px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", color: "#A0A8C0", fontFamily: "Space Grotesk", fontWeight: 500, fontSize: "12px", cursor: "pointer" }}>Close</button>
              </div>
              <div className="contract-modal-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", flex: 1, overflow: "hidden" }}>
                <div style={{ padding: "20px", borderRight: "1px solid rgba(255,255,255,0.06)", overflowY: "auto" }}>
                  <div style={{ fontFamily: "Space Grotesk", fontWeight: 600, fontSize: "13px", color: "white", marginBottom: "14px" }}>Event details</div>
                  <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse", marginBottom: "16px" }}>
                    <tbody>
                      {[["Type", activeBooking.event_type], ["Date", formatEventDate(activeBooking.event_date)], ["Venue", activeBooking.venue], ["Package", activeBooking.package_name || "—"]].map(([label, value]) => (
                        <tr key={String(label)}>
                          <td style={{ color: "#5A6080", padding: "5px 0", verticalAlign: "top" }}>{label}</td>
                          <td style={{ color: "white", textAlign: "right", padding: "5px 0", fontWeight: 500 }}>{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "14px" }}>
                    <div style={{ fontFamily: "Space Mono", fontSize: "9px", fontWeight: 700, letterSpacing: "0.12em", color: "#5A6080", textTransform: "uppercase", marginBottom: "10px" }}>
                      Payment Summary
                    </div>
                    <div style={{ background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.18)", borderRadius: "10px", padding: "12px", marginBottom: "8px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontFamily: "Space Grotesk", fontWeight: 600, fontSize: "12px", color: "white", marginBottom: "2px" }}>Deposit ({depositPct || 30}%)</div>
                          <div style={{ fontFamily: "Inter", fontSize: "10px", color: "#5A6080" }}>
                            Due by{" "}
                            <span style={{ color: "#F5A623" }}>
                              {activeBooking.deposit_due_date
                                ? new Date(`${activeBooking.deposit_due_date}T00:00:00`).toLocaleDateString("en-GH", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
                                : "Within 3 days"}
                            </span>
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: "14px", color: "#F5A623" }}>GHS {depositAmount.toLocaleString()}</div>
                          <div style={{ fontFamily: "Space Mono", fontSize: "10px", color: depositPaid ? "#22c55e" : "#F5A623", marginTop: "2px" }}>{depositPaid ? "✓ Paid" : "⏳ Pending"}</div>
                        </div>
                      </div>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "10px", padding: "12px", marginBottom: "10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontFamily: "Space Grotesk", fontWeight: 600, fontSize: "12px", color: "white", marginBottom: "2px" }}>Balance</div>
                          <div style={{ fontFamily: "Inter", fontSize: "10px", color: "#5A6080" }}>
                            Due by{" "}
                            <span style={{ color: "white" }}>
                              {activeBooking.balance_due_date
                                ? new Date(`${activeBooking.balance_due_date}T00:00:00`).toLocaleDateString("en-GH", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
                                : "2 days before event"}
                            </span>
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: "14px", color: "white" }}>GHS {balanceAmount.toLocaleString()}</div>
                          <div style={{ fontFamily: "Space Mono", fontSize: "10px", color: isFullyPaid ? "#22c55e" : "#A0A8C0", marginTop: "2px" }}>{isFullyPaid ? "✓ Paid" : "⏳ Pending"}</div>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0 0", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      <span style={{ fontFamily: "Space Grotesk", fontWeight: 600, fontSize: "14px", color: "white" }}>Total</span>
                      <span style={{ fontFamily: "Space Grotesk", fontWeight: 800, fontSize: "20px", color: "#F5A623" }}>GHS {(activeBooking.package_price || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px", overflowY: "auto" }}>
                  {activeContract?.status === "signed" ? (
                    <>
                      <div style={{ fontFamily: "Inter", fontSize: "11px", color: "#5A6080" }}>
                        {activeContract.client_signed_at
                          ? new Date(activeContract.client_signed_at).toLocaleString("en-GH", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })
                          : "Signed"}
                      </div>
                      <button onClick={() => activeContract.pdf_url && downloadContractPDF(activeContract.pdf_url, `contract-${activeBooking.event_id}.pdf`)} style={{ width: "100%", padding: "11px", borderRadius: "10px", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.30)", color: "#22c55e" }}>Download Signed Contract</button>
                    </>
                  ) : null}
                  {(!activeContract || activeContract.status === "pending" || activeContract.status === "pre-signed") && !signedSuccess ? (
                    <>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <div style={{ fontFamily: "Space Grotesk", fontWeight: 600, fontSize: "11px", color: "white" }}>Read contract to sign</div>
                          <div style={{ fontFamily: "Space Mono", fontSize: "10px", color: hasScrolledContract ? "#22c55e" : "#5A6080" }}>{hasScrolledContract ? "✓ Read" : `${Math.round(scrollProgress)}% read`}</div>
                        </div>
                        <div
                          ref={contractTextRef}
                          onScroll={() => {
                            const el = contractTextRef.current;
                            if (!el) return;
                            const progress = (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100;
                            setScrollProgress(Math.min(100, progress));
                            if (progress >= 95) setHasScrolledContract(true);
                          }}
                          style={{ background: "#ffffff", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "12px", height: "180px", overflowY: "auto" }}
                        >
                          <pre style={{ fontFamily: "'Courier New', monospace", fontSize: "10px", color: "#111827", lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                            {activeContract?.contract_text?.trim()
                              ? activeContract.contract_text
                              : loadingContractText
                                ? "Loading contract..."
                                : "Contract text not available"}
                          </pre>
                        </div>
                      </div>
                      <div style={{ opacity: hasScrolledContract ? 1 : 0.35, pointerEvents: hasScrolledContract ? "auto" : "none", transition: "opacity 300ms" }}>
                        <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
                          {["draw", "type"].map((tab) => (
                            <button
                              key={tab}
                              onClick={() => setSignatureTab(tab as "draw" | "type")}
                              style={{ flex: 1, padding: "7px", borderRadius: "8px", border: signatureTab === tab ? "1px solid rgba(0,191,255,0.40)" : "1px solid rgba(255,255,255,0.08)", background: signatureTab === tab ? "rgba(0,191,255,0.10)" : "rgba(255,255,255,0.03)", color: signatureTab === tab ? "#00BFFF" : "#A0A8C0", cursor: "pointer" }}
                            >
                              {tab === "draw" ? "✏ Draw" : "Aa Type name"}
                            </button>
                          ))}
                        </div>
                        {signatureTab === "draw" ? (
                          <SignaturePad onSignature={setDrawnSignature} onClear={() => setDrawnSignature(null)} width={380} height={80} />
                        ) : (
                          <div>
                            <input value={typedName} onChange={(e) => setTypedName(e.target.value)} placeholder="Type your full name" style={{ width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: "8px", color: "white", marginBottom: "6px" }} />
                            {typedName ? (
                              <div style={{ padding: "10px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", textAlign: "center", fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: "22px", color: "rgba(255,255,255,0.80)" }}>
                                {typedName}
                              </div>
                            ) : null}
                          </div>
                        )}
                        <label style={{ display: "flex", alignItems: "flex-start", gap: "8px", cursor: "pointer", marginTop: "10px", marginBottom: "10px" }}>
                          <input type="checkbox" checked={signAgreed} onChange={(e) => setSignAgreed(e.target.checked)} style={{ marginTop: "2px", accentColor: "#00BFFF", flexShrink: 0 }} />
                          <span style={{ fontFamily: "Inter", fontSize: "11px", color: "#A0A8C0", lineHeight: 1.5 }}>
                            I have read and agree to all terms in this service agreement
                          </span>
                        </label>
                        {(() => {
                          const sigReady = signatureTab === "draw" ? !!drawnSignature : typedName.trim().length >= 2;
                          const canSign = hasScrolledContract && signAgreed && sigReady;
                          return (
                            <button onClick={handleSign} disabled={!canSign || signing} style={{ width: "100%", padding: "13px", borderRadius: "10px", background: canSign ? "#F5A623" : "rgba(245,166,35,0.15)", border: canSign ? "none" : "1px solid rgba(245,166,35,0.20)", color: canSign ? "#000" : "rgba(245,166,35,0.40)", cursor: canSign ? "pointer" : "not-allowed" }}>
                              {signing ? "Signing..." : "Sign & Download PDF"}
                            </button>
                          );
                        })()}
                      </div>
                    </>
                  ) : null}
                  {signedSuccess ? (
                    <div style={{ textAlign: "center", padding: "24px 16px" }}>
                      <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.30)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                        <CheckCircle size={28} color="#22c55e" />
                      </div>
                      <div style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: "18px", color: "white", marginBottom: "8px" }}>
                        Agreement Signed!
                      </div>
                      <p style={{ fontFamily: "Inter", fontSize: "13px", color: "#A0A8C0", lineHeight: 1.6, marginBottom: "20px" }}>
                        A signed copy has been sent to{" "}
                        <span style={{ color: "white" }}>{activeBooking?.client_email || "your email"}</span>
                        . You can now curate your playlist for this event.
                      </p>
                      {signedPdfUrl ? (
                        <button
                          onClick={() =>
                            downloadContractPDF(
                              signedPdfUrl,
                              `contract-${activeBooking.event_id}-signed.pdf`,
                            )
                          }
                          style={{ width: "100%", padding: "11px", borderRadius: "10px", background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.25)", color: "#22c55e", fontFamily: "Space Grotesk", fontWeight: 600, fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "10px" }}
                        >
                          <Download size={14} />
                          Download Signed Copy
                        </button>
                      ) : null}
                      <button
                        onClick={() => {
                          setShowContractModal(false);
                          router.push(`/client/playlist?eventId=${activeBooking.event_id}`);
                        }}
                        style={{ width: "100%", padding: "13px", borderRadius: "10px", background: "#00BFFF", border: "none", color: "#000", fontFamily: "Space Grotesk", fontWeight: 700, fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                      >
                        <Music size={16} />
                        Curate My Playlist →
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {data.recentOrders.length > 0 ? (
          <div className="col-span-12">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-headline text-[18px] font-semibold text-white">Recent Orders</h2>
              <button
                type="button"
                onClick={() => router.push("/client/orders")}
                className="font-headline text-[13px] font-medium text-[#00BFFF] transition-opacity hover:opacity-90"
              >
                View all →
              </button>
            </div>
            <div className="recent-orders-grid">
              {data.recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.05] p-4 backdrop-blur-[20px]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-[12px] text-[#00BFFF]">{order.order_number}</span>
                    <span className="font-body text-[11px] text-[#A0A8C0]">
                      {new Date(order.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-2 font-body text-[11px] text-on-surface-variant">
                    {order.items.map((it) => `${it.name} · ${it.size}`).join(" · ")}
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="font-syne text-[15px] font-bold text-white">
                      GH₵{Number(order.total).toLocaleString()}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        router.push(`/track-order?id=${encodeURIComponent(order.order_number)}`)
                      }
                      className="shrink-0 font-headline text-[11px] font-medium text-[#00BFFF]"
                    >
                      Track →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {data.pastBookings.length > 0 ? (
          <div className="col-span-12">
            <button
              type="button"
              onClick={() => setPastExpanded((v) => !v)}
              className="flex w-full items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-left transition-colors hover:bg-white/[0.05]"
            >
              <Clock className="size-4 shrink-0 text-on-surface-variant/60" strokeWidth={2} aria-hidden />
              <span className="font-headline text-sm font-medium text-on-surface-variant">Past Events</span>
              <span className="rounded-full border border-white/[0.08] bg-white/[0.05] px-2 py-0.5 font-body text-[11px] text-on-surface-variant">
                {data.pastBookings.length} event{data.pastBookings.length === 1 ? "" : "s"}
              </span>
              <ChevronDown
                className={`ml-auto size-4 shrink-0 text-on-surface-variant transition-transform ${pastExpanded ? "rotate-180" : ""}`}
                strokeWidth={2}
                aria-hidden
              />
            </button>
            {pastExpanded ? (
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                {data.pastBookings.map((b) => {
                  const hasPl = Boolean(data.playlistMap[b.event_id]);
                  const cancelled = b.status === "cancelled";
                  return (
                    <div
                      key={b.event_id}
                      className="flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-white/[0.04] p-4 opacity-60 sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="font-headline text-sm font-medium text-white/80">
                          <span className="mr-1.5">{eventTypeEmoji(b.event_type)}</span>
                          {heroTitle(b)}
                        </p>
                        <p className="mt-1 font-body text-xs text-on-surface-variant">{formatEventDate(b.event_date)}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        {cancelled ? (
                          <span className="rounded border border-red-500/40 bg-red-500/15 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-red-400">
                            Cancelled
                          </span>
                        ) : b.payment_status === "paid" ? (
                          <span className="rounded-full border border-primary/30 bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                            Paid
                          </span>
                        ) : (
                          <span className="rounded-full border border-[#F5A623]/30 bg-[#F5A623]/20 px-2 py-0.5 text-[10px] font-bold uppercase text-[#F5A623]">
                            Unpaid
                          </span>
                        )}
                        {!cancelled && hasPl ? (
                          <button
                            type="button"
                            onClick={() =>
                              router.push(`/client/playlist?eventId=${encodeURIComponent(b.event_id)}`)
                            }
                            className="font-body text-xs text-on-surface-variant underline-offset-2 transition-colors hover:text-[#00BFFF]"
                          >
                            View Playlist →
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </main>
  );
}
