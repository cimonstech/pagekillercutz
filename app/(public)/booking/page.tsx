"use client";

import { AlertCircle, Calendar, Check, CheckCircle, Copy, Loader2, Lock, User, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AvailabilityCalendar from "@/components/booking/AvailabilityCalendar";
import PaymentDetails from "@/components/payment/PaymentDetails";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";

type BookingData = {
  fullName: string;
  email: string;
  phone: string;
  eventType: string;
  eventName: string;
  eventDate: string;
  eventStartTime: string;
  eventDurationHours: string;
  clientSegment: "personal" | "corporate";
  companyName: string;
  repTitle: string;
  venue: string;
  guestCount: string;
  additionalNotes: string;
  packageName: string;
};

const INITIAL_BOOKING: BookingData = {
  fullName: "",
  email: "",
  phone: "",
  eventType: "",
  eventName: "",
  eventDate: "",
  eventStartTime: "",
  eventDurationHours: "",
  clientSegment: "personal",
  companyName: "",
  repTitle: "",
  venue: "",
  guestCount: "",
  additionalNotes: "",
  packageName: "",
};

const packageDurations: Record<string, number> = {
  Essential: 3,
  Signature: 5,
  Premium: 6,
};

function generateTimeOptions() {
  const times: Array<{ value: string; label: string }> = [];
  for (let h = 6; h <= 23; h++) {
    for (const m of [0, 30]) {
      const hour = String(h).padStart(2, "0");
      const min = String(m).padStart(2, "0");
      const ampm = h < 12 ? "AM" : "PM";
      const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
      times.push({
        value: `${hour}:${min}`,
        label: `${hour12}:${min} ${ampm}`,
      });
    }
  }
  return times;
}

const MOCK_PACKAGES = [
  {
    id: "Essential",
    price: 1500,
    featured: false,
    tier: "essential" as const,
    inclusions: [
      "Up to 3 hours of live performance",
      "Pioneer CDJ setup",
      "Playlist portal access",
      "SMS and email reminders",
    ],
  },
  {
    id: "Signature",
    price: 2800,
    featured: true,
    tier: "signature" as const,
    inclusions: [
      "Up to 6 hours of live performance",
      "Pioneer CDJ-2000 + DJM-900 setup",
      "2x Technics 1200 turntables",
      "Dedicated playlist portal access",
      "7-day and 1-day SMS reminders",
      "Post-event mix recording",
    ],
  },
  {
    id: "Premium",
    price: 5000,
    featured: false,
    tier: "premium" as const,
    inclusions: [
      "Up to 10 hours of live performance",
      "Full Pioneer professional setup",
      "Scratch DJ showcase set",
      "Custom event playlist curation",
      "Priority playlist portal access",
      "Dedicated event coordinator",
      "Post-event mix recording",
      "Social media coverage",
    ],
  },
];

const inputClass =
  "w-full rounded-[10px] border border-white/[0.08] bg-white/[0.05] px-4 py-3 text-[14px] text-white outline-none transition-[border-color,box-shadow] placeholder:text-white/35 focus:border-[#00BFFF] focus:shadow-[0_0_0_3px_rgba(0,191,255,0.10)] font-body";

/** Native selects: pair with `.booking-form-native-controls` + globals.css so Windows/Chrome option lists stay readable */
const selectInputClass = `${inputClass} cursor-pointer pr-10 [color-scheme:dark]`;

/** Locked when logged in: name came from account metadata */
const lockedInputClass =
  "w-full cursor-not-allowed rounded-[10px] border border-white/[0.05] bg-white/[0.03] py-3 pl-4 pr-10 text-[14px] text-white/50 outline-none focus:border-white/[0.05] focus:shadow-none font-body";

const labelClass = "mb-1.5 block text-[12px] font-medium text-white font-body";

export default function BookingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState<BookingData>(INITIAL_BOOKING);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof BookingData, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  /** Set from POST /api/bookings — drives confirmation copy for new vs existing accounts */
  const [clientAuth, setClientAuth] = useState<"existing_user" | "invite_sent" | "failed" | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  /** True when full_name or name was present in Auth metadata at load (locks name field). */
  const [hadExistingName, setHadExistingName] = useState(false);
  const [selectedDateStatus, setSelectedDateStatus] = useState<"available" | "amber" | "blocked" | null>(null);
  const [requestAcknowledged, setRequestAcknowledged] = useState(false);
  const { settings } = usePlatformSettings();

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      setIsLoggedIn(true);
      const user = data.user;
      const meta = (user.user_metadata || {}) as Record<string, unknown>;
      const metaName =
        (typeof meta.full_name === "string" && meta.full_name.trim()) ||
        (typeof meta.name === "string" && meta.name.trim()) ||
        "";
      if (metaName) {
        setHadExistingName(true);
      }
      const em = user.email?.trim() || "";
      const rawPhone =
        (typeof meta.phone === "string" && meta.phone) ||
        (typeof meta.phone_number === "string" && meta.phone_number) ||
        "";
      const digits = rawPhone.replace(/\D/g, "").replace(/^0+/, "").slice(0, 12);

      setBookingData((prev) => ({
        ...prev,
        fullName: metaName,
        email: em,
        phone: digits || prev.phone,
      }));
    });
  }, []);

  const setField = (key: keyof BookingData, value: string) => {
    setBookingData((d) => ({ ...d, [key]: value }));
    setFieldErrors((e) => ({ ...e, [key]: undefined }));
  };

  /** Logged in, no metadata name: show helper until user types */
  const showNameHelper =
    isLoggedIn &&
    !hadExistingName &&
    bookingData.fullName.trim().length === 0;

  if (settings && !settings.accept_bookings) {
    return (
      <div style={{ textAlign: "center", padding: "80px 32px" }}>
        <Calendar size={48} color="rgba(255,255,255,0.20)" />
        <h2 style={{ fontFamily: "Space Grotesk", color: "white", marginTop: "16px" }}>Bookings Paused</h2>
        <p
          style={{
            fontFamily: "Inter",
            color: "#A0A8C0",
            maxWidth: "400px",
            margin: "8px auto 24px",
          }}
        >
          PAGE KillerCutz is not accepting new bookings at this time. Please check back soon or get in touch.
        </p>
        <Link
          href="/contact"
          style={{
            padding: "12px 28px",
            borderRadius: "999px",
            background: "#00BFFF",
            color: "#000",
            fontFamily: "Space Grotesk",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Contact Us →
        </Link>
      </div>
    );
  }

  const validateStep1 = (): boolean => {
    if (selectedDateStatus === "blocked" && !requestAcknowledged) {
      setSubmitError("Please acknowledge that this date is booked before continuing.");
      return false;
    }
    setSubmitError(null);
    const next: Partial<Record<keyof BookingData, string>> = {};
    if (!bookingData.fullName.trim()) next.fullName = "Required";
    if (!bookingData.email.trim()) next.email = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bookingData.email)) next.email = "Enter a valid email";
    const phoneDigits = bookingData.phone.replace(/\D/g, "");
    if (!phoneDigits) next.phone = "Required";
    else if (phoneDigits.length < 9) next.phone = "Enter a valid phone number";
    if (!bookingData.eventType.trim()) next.eventType = "Required";
    if (!bookingData.eventDate.trim()) next.eventDate = "Select a date on the calendar";
    if (!bookingData.venue.trim()) next.venue = "Required";
    if (bookingData.clientSegment === "corporate") {
      if (!bookingData.companyName.trim()) next.companyName = "Required";
      if (!bookingData.repTitle.trim()) next.repTitle = "Required";
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleStep1Continue = () => {
    if (!validateStep1()) return;
    setBookingData((d) => ({ ...d }));
    setSubmitError(null);
    setCurrentStep(2);
  };

  const DateStatusPanel = () => {
    if (!bookingData.eventDate) {
      return (
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "16px",
            padding: "28px 24px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "rgba(0,191,255,0.08)",
              border: "1px solid rgba(0,191,255,0.20)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <Calendar size={24} color="#00BFFF" />
          </div>

          <div
            style={{
              fontFamily: "Space Grotesk",
              fontWeight: 600,
              fontSize: "16px",
              color: "white",
              marginBottom: "8px",
            }}
          >
            Choose your event date
          </div>

          <p
            style={{
              fontFamily: "Inter",
              fontSize: "13px",
              color: "#5A6080",
              lineHeight: 1.6,
              marginBottom: "24px",
            }}
          >
            Select a date on the calendar to check availability and continue with your booking.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "12px",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              paddingTop: "20px",
            }}
          >
            {[
              { value: "100+", label: "Events" },
              { value: "12+", label: "Years" },
              { value: "Accra", label: "Ghana" },
            ].map((stat) => (
              <div key={stat.label} style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontFamily: "Space Grotesk",
                    fontWeight: 700,
                    fontSize: "18px",
                    color: "#00BFFF",
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    fontFamily: "Inter",
                    fontSize: "11px",
                    color: "#5A6080",
                    marginTop: "2px",
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    const formattedDate = new Date(`${bookingData.eventDate}T00:00:00`).toLocaleDateString("en-GH", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const statusConfig = {
      available: {
        icon: CheckCircle,
        iconColor: "#22c55e",
        bg: "rgba(34,197,94,0.06)",
        border: "rgba(34,197,94,0.20)",
        title: "Date available",
        subtitle: "Great choice — this date is open. Continue filling in your details below.",
      },
      amber: {
        icon: Zap,
        iconColor: "#F5A623",
        bg: "rgba(245,166,35,0.06)",
        border: "rgba(245,166,35,0.20)",
        title: "Limited availability",
        subtitle:
          "PAGE KillerCutz has a prior commitment on this date. Please specify your start time carefully in the next step — there may still be a slot open.",
      },
      blocked: {
        icon: AlertCircle,
        iconColor: "#FF4560",
        bg: "rgba(255,69,96,0.06)",
        border: "rgba(255,69,96,0.20)",
        title: "Date fully booked",
        subtitle:
          "This date is currently taken. You can still submit a request — the team will review if they can make it work.",
      },
    } as const;

    const config = statusConfig[(selectedDateStatus ?? "available") as keyof typeof statusConfig];
    const Icon = config.icon;

    return (
      <div
        style={{
          background: config.bg,
          border: `1px solid ${config.border}`,
          borderRadius: "16px",
          padding: "24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <Icon size={22} color={config.iconColor} />
          <div style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: "16px", color: "white" }}>
            {config.title}
          </div>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            borderRadius: "10px",
            padding: "12px 16px",
            marginBottom: "14px",
          }}
        >
          <div
            style={{
              fontFamily: "Space Mono",
              fontSize: "9px",
              color: "#5A6080",
              textTransform: "uppercase",
              marginBottom: "4px",
            }}
          >
            Selected date
          </div>
          <div style={{ fontFamily: "Space Grotesk", fontWeight: 600, fontSize: "15px", color: "white" }}>
            {formattedDate}
          </div>
        </div>

        <p style={{ fontFamily: "Inter", fontSize: "13px", color: "#A0A8C0", lineHeight: 1.6, margin: 0 }}>
          {config.subtitle}
        </p>

        {selectedDateStatus === "blocked" ? (
          <div style={{ marginTop: "14px", fontFamily: "Inter", fontSize: "12px", color: "#FF4560" }}>
            ↓ Tick the box below to proceed with a request.
          </div>
        ) : null}
      </div>
    );
  };

  const handleStep2Continue = async () => {
    setSubmitError(null);
    if (!selectedPackage) {
      setSubmitError("Please select a package to continue.");
      return;
    }
    if (!bookingData.eventStartTime.trim()) {
      setSubmitError("Please select your event start time to continue.");
      return;
    }

    const clientPhone = bookingData.phone.trim().startsWith("+")
      ? bookingData.phone.trim().replace(/\s/g, "")
      : `+233${bookingData.phone.replace(/\D/g, "").replace(/^0+/, "")}`;

    const isRequest = selectedDateStatus === "blocked";
    const includedHours = packageDurations[selectedPackage] ?? 3;
    const durationToSend = Number(bookingData.eventDurationHours) || includedHours;
    const body = {
      clientName: bookingData.fullName,
      clientEmail: bookingData.email,
      clientPhone,
      eventType: bookingData.eventType,
      eventName: bookingData.eventName.trim() || undefined,
      eventDate: bookingData.eventDate,
      venue: bookingData.venue,
      guestCount: bookingData.guestCount || null,
      notes: bookingData.additionalNotes.trim() || null,
      packageName: selectedPackage,
      genres: [] as string[],
      eventStartTime: bookingData.eventStartTime.trim() || null,
      eventDurationHours: durationToSend,
      isRequest,
      isCompany: bookingData.clientSegment === "corporate",
      companyName: bookingData.clientSegment === "corporate" ? bookingData.companyName.trim() : null,
      repTitle: bookingData.clientSegment === "corporate" ? bookingData.repTitle.trim() : null,
    };

    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as {
        booking?: { event_id: string };
        eventId?: string;
        error?: string;
        details?: string;
        clientAuth?: "existing_user" | "invite_sent" | "failed";
      };

      if (!res.ok) {
        console.error("[booking] API error:", json);
        setSubmitError(
          json.details ?? json.error ?? "Something went wrong. Please try again.",
        );
        return;
      }

      const id = json.eventId ?? json.booking?.event_id ?? "";
      setEventId(id);
      setClientAuth(json.clientAuth ?? "failed");
      setBookingData((d) => ({ ...d, packageName: selectedPackage }));

      if (isLoggedIn && !hadExistingName && bookingData.fullName.trim()) {
        void supabase.auth
          .updateUser({
            data: { full_name: bookingData.fullName.trim() },
          })
          .catch((err) => console.error("Failed to update name:", err));
      }

      setCurrentStep(3);
    } catch (e) {
      console.error("[booking] fetch failed:", e);
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyId = async () => {
    if (!eventId) return;
    try {
      await navigator.clipboard.writeText(eventId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="mx-auto max-w-[800px] px-4 pb-10 sm:px-6 lg:px-0">
      <header className="mb-8">
        <h1 className="font-headline text-[28px] font-semibold text-white">Book the DJ</h1>
        <p className="mt-1 font-body text-[14px] text-[#A0A8C0]">Fill in your details and choose your package.</p>
      </header>

      {/* Step indicator */}
      <nav className="mb-10 w-full" aria-label="Booking progress">
        <div className="flex w-full items-center px-1 sm:px-4">
          {(
            [
              [1, "Event Details"],
              [2, "Select Package"],
              [3, "Confirmed"],
            ] as const
          ).map(([n, label], i) => {
            const done = currentStep > n;
            const active = currentStep === n;
            return (
              <div key={n} className="contents">
                {i > 0 ? (
                  <div className="relative mx-1 mb-7 h-px min-w-[12px] flex-1 bg-[rgba(255,255,255,0.10)] sm:mx-2">
                    <div
                      className="absolute left-0 top-0 h-full bg-[#00BFFF] transition-[width] duration-300 ease-out"
                      style={{ width: currentStep > n - 1 ? "100%" : "0%" }}
                    />
                  </div>
                ) : null}
                <div className="flex max-w-[33%] flex-1 flex-col items-center text-center">
                  <div
                    className={[
                      "relative flex size-8 shrink-0 items-center justify-center rounded-full font-headline text-[12px] font-bold transition-all",
                      done || active                        ? "bg-[#00BFFF] text-white"
                        : "border border-[rgba(255,255,255,0.15)] bg-transparent text-white/40",
                    ].join(" ")}
                  >
                    {active ? (
                      <span className="pointer-events-none absolute -inset-1.5 rounded-full border-2 border-[#00BFFF]/45 opacity-80 animate-[pulse_2.2s_ease-in-out_infinite]" />
                    ) : null}
                    {done ? <Check className="relative z-[1] size-4 stroke-[3] text-white" /> : <span className="relative z-[1]">{n}</span>}
                  </div>
                  <span
                    className={[
                      "mt-2 max-w-[7.5rem] font-headline text-[12px] font-medium leading-tight tracking-wide",
                      active ? "font-semibold text-white" : done ? "text-[#00BFFF]" : "text-white/45",
                    ].join(" ")}
                  >
                    {label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </nav>

      {currentStep === 1 && (
        <section className="booking-form-native-controls space-y-6">
          <div>
            <label className={labelClass}>Select your event date</label>
            <div className="booking-calendar-grid mt-2">
              <AvailabilityCalendar
                onDateSelect={(date, status) => {
                  setBookingData((prev) => ({ ...prev, eventDate: date }));
                  setSelectedDateStatus(status);
                  setRequestAcknowledged(false);
                  setFieldErrors((e) => ({ ...e, eventDate: undefined }));
                }}
                selectedDate={bookingData.eventDate || null}
              />
              <DateStatusPanel />
            </div>
            {selectedDateStatus === "blocked" ? (
              <div
                className="mt-3 rounded-[12px] border border-[rgba(255,69,96,0.25)] bg-[rgba(255,69,96,0.08)] p-4"
                role="region"
                aria-label="Fully booked date notice"
              >
                <p className="font-headline text-[14px] font-semibold text-[#FF4560]">This date is currently fully booked</p>
                <p className="mt-2 font-body text-[13px] leading-relaxed text-[#A0A8C0]">
                  Page KillerCutz already has a commitment on this date. You can still submit a request and the team will review if they can accommodate your event. No payment will be required until your request is confirmed.
                </p>
                <label className="mt-3 flex cursor-pointer items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={requestAcknowledged}
                    onChange={(e) => setRequestAcknowledged(e.target.checked)}
                    className="mt-0.5 accent-[#FF4560]"
                  />
                  <span className="font-body text-[13px] leading-snug text-[#A0A8C0]">
                    I understand this date is currently booked. I am submitting a request only. No payment is required until my request is reviewed and confirmed.
                  </span>
                </label>
              </div>
            ) : null}
            {selectedDateStatus === "amber" ? (
              <div className="mt-3 rounded-[10px] border border-[rgba(245,166,35,0.20)] bg-[rgba(245,166,35,0.06)] px-4 py-3">
                <p className="font-body text-[13px] text-[#F5A623]">
                  Limited availability on this date. Please specify your event time carefully in the next step.
                </p>
              </div>
            ) : null}
            {fieldErrors.eventDate ? (
              <p className="mt-2 font-body text-[12px] text-[#FF4560]">{fieldErrors.eventDate}</p>
            ) : null}
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className={labelClass}>Full Name</label>
              <div className="relative">
                <input
                  readOnly={isLoggedIn && hadExistingName}
                  className={
                    isLoggedIn && hadExistingName
                      ? `${lockedInputClass} ${fieldErrors.fullName ? "border-[#FF4560]" : ""}`
                      : `${inputClass} ${fieldErrors.fullName ? "border-[#FF4560]" : ""}`
                  }
                  value={bookingData.fullName}
                  onChange={(e) => setField("fullName", e.target.value)}
                  placeholder={
                    isLoggedIn && !hadExistingName
                      ? "Enter your full name"
                      : "John Doe"
                  }
                  type="text"
                  aria-readonly={isLoggedIn && hadExistingName}
                />
                {isLoggedIn && hadExistingName ? (
                  <Lock
                    className="pointer-events-none absolute right-3 top-1/2 size-3 -translate-y-1/2 text-white/[0.25]"
                    aria-hidden
                  />
                ) : null}
              </div>
              {showNameHelper ? (
                <div className="mt-1.5 flex items-center gap-[6px]">
                  <User className="size-3 shrink-0 text-[#A0A8C0]" aria-hidden />
                  <p className="font-body text-[11px] leading-relaxed text-[#A0A8C0]">
                    Your name was not found on your account.
                  </p>
                </div>
              ) : null}
              {fieldErrors.fullName ? (
                <p className="mt-1 font-body text-[12px] text-[#FF4560]">{fieldErrors.fullName}</p>
              ) : null}
            </div>
            <div>
              <label className={labelClass}>Email Address</label>
              <div className="relative">
                <input
                  readOnly={isLoggedIn}
                  className={
                    isLoggedIn
                      ? `${lockedInputClass} ${fieldErrors.email ? "border-[#FF4560]" : ""}`
                      : `${inputClass} ${fieldErrors.email ? "border-[#FF4560]" : ""}`
                  }
                  value={bookingData.email}
                  onChange={(e) => setField("email", e.target.value)}
                  placeholder="you@example.com"
                  type="email"
                  aria-readonly={isLoggedIn}
                />
                {isLoggedIn ? (
                  <Lock
                    className="pointer-events-none absolute right-3 top-1/2 size-3 -translate-y-1/2 text-white/[0.25]"
                    aria-hidden
                  />
                ) : null}
              </div>
              {fieldErrors.email ? (
                <p className="mt-1 font-body text-[12px] text-[#FF4560]">{fieldErrors.email}</p>
              ) : null}
            </div>
            {isLoggedIn && hadExistingName ? (
              <div className="flex items-center gap-[6px] md:col-span-2">
                <Lock className="size-3 shrink-0 text-[#5A6080]" aria-hidden />
                <p className="font-body text-[11px] leading-relaxed text-[#5A6080]">
                  Name and email locked to your account.
                </p>
              </div>
            ) : null}
            <div>
              <label className={labelClass}>Phone Number</label>
              <div className="flex overflow-hidden rounded-[10px] border border-white/[0.08] bg-white/[0.05] focus-within:border-[#00BFFF] focus-within:shadow-[0_0_0_3px_rgba(0,191,255,0.10)]">
                <span className="flex shrink-0 items-center border-r border-white/[0.08] bg-white/[0.04] px-3 font-body text-[14px] text-white/80">
                  +233
                </span>
                <input
                  className="min-w-0 flex-1 border-0 bg-transparent px-3 py-3 font-body text-[14px] text-white outline-none placeholder:text-white/35"
                  value={bookingData.phone.replace(/^\+\s*233\s*/, "")}
                  onChange={(e) => setField("phone", e.target.value.replace(/\D/g, "").slice(0, 12))}
                  placeholder="24 412 3456"
                  type="tel"
                />
              </div>
              {fieldErrors.phone ? (
                <p className="mt-1 font-body text-[12px] text-[#FF4560]">{fieldErrors.phone}</p>
              ) : null}
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>
                Event Name{" "}
                <span className="font-body text-[12px] font-normal text-on-surface-variant">(optional)</span>
              </label>
              <input
                className={inputClass}
                value={bookingData.eventName}
                onChange={(e) => setField("eventName", e.target.value)}
                placeholder="e.g. Asante-Mensah Wedding Reception"
                type="text"
              />
            </div>
            <div>
              <label className={labelClass}>Event Type</label>
              <select
                className={`${selectInputClass} ${fieldErrors.eventType ? "border-[#FF4560]" : ""}`}
                value={bookingData.eventType}
                onChange={(e) => setField("eventType", e.target.value)}
              >
                <option value="">Select type</option>
                <option value="Wedding">Wedding</option>
                <option value="Corporate">Corporate</option>
                <option value="Festival">Festival</option>
                <option value="Club Night">Club Night</option>
                <option value="Birthday">Birthday</option>
                <option value="Other">Other</option>
              </select>
              {fieldErrors.eventType ? (
                <p className="mt-1 font-body text-[12px] text-[#FF4560]">{fieldErrors.eventType}</p>
              ) : null}
            </div>
            <div>
              <label className={labelClass}>Guest Count</label>
              <input
                className={inputClass}
                value={bookingData.guestCount}
                onChange={(e) => setField("guestCount", e.target.value)}
                placeholder="e.g. 120"
                type="number"
                min={1}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Booking type</label>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                {(
                  [
                    { value: "personal" as const, label: "Personal event", desc: "Wedding, birthday, party" },
                    { value: "corporate" as const, label: "Corporate / organisation", desc: "Company, institution, NGO" },
                  ] as const
                ).map((option) => {
                  const active = bookingData.clientSegment === option.value;
                  return (
                    <label
                      key={option.value}
                      className={[
                        "flex flex-1 cursor-pointer flex-col gap-1 rounded-[12px] border p-3.5 transition-all sm:p-3.5",
                        active
                          ? "border-[#00BFFF] bg-[rgba(0,191,255,0.06)]"
                          : "border-white/[0.08] bg-white/[0.03]",
                      ].join(" ")}
                    >
                      <input
                        type="radio"
                        name="clientSegment"
                        value={option.value}
                        checked={active}
                        onChange={() => {
                          setBookingData((prev) => ({ ...prev, clientSegment: option.value }));
                          setFieldErrors((e) => ({ ...e, companyName: undefined, repTitle: undefined }));
                        }}
                        className="sr-only"
                      />
                      <span className={`font-headline text-[13px] font-semibold ${active ? "text-[#00BFFF]" : "text-white"}`}>{option.label}</span>
                      <span className="font-body text-[11px] text-[#5A6080]">{option.desc}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            {bookingData.clientSegment === "corporate" ? (
              <>
                <div>
                  <label className={labelClass}>
                    Company / organisation name <span className="text-[#FF4560]">*</span>
                  </label>
                  <input
                    className={`${inputClass} ${fieldErrors.companyName ? "border-[#FF4560]" : ""}`}
                    value={bookingData.companyName}
                    onChange={(e) => setField("companyName", e.target.value)}
                    placeholder="e.g. Stanbic Bank Ghana"
                    type="text"
                    required
                  />
                  {fieldErrors.companyName ? (
                    <p className="mt-1 font-body text-[12px] text-[#FF4560]">{fieldErrors.companyName}</p>
                  ) : null}
                </div>
                <div>
                  <label className={labelClass}>
                    Your job title <span className="text-[#FF4560]">*</span>
                  </label>
                  <input
                    className={`${inputClass} ${fieldErrors.repTitle ? "border-[#FF4560]" : ""}`}
                    value={bookingData.repTitle}
                    onChange={(e) => setField("repTitle", e.target.value)}
                    placeholder="e.g. Events coordinator"
                    type="text"
                    required
                  />
                  {fieldErrors.repTitle ? (
                    <p className="mt-1 font-body text-[12px] text-[#FF4560]">{fieldErrors.repTitle}</p>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>
          <div>
            <label className={labelClass}>Venue / Location</label>
            <input
              className={`${inputClass} ${fieldErrors.venue ? "border-[#FF4560]" : ""}`}
              value={bookingData.venue}
              onChange={(e) => setField("venue", e.target.value)}
              placeholder="Venue name and address"
              type="text"
            />
            {fieldErrors.venue ? (
              <p className="mt-1 font-body text-[12px] text-[#FF4560]">{fieldErrors.venue}</p>
            ) : null}
          </div>
          <div>
            <label className={labelClass}>Additional Notes</label>
            <textarea
              className={`${inputClass} min-h-[104px] resize-none`}
              rows={4}
              value={bookingData.additionalNotes}
              onChange={(e) => setField("additionalNotes", e.target.value)}
              placeholder="Special requests, equipment on site, timeline notes…"
            />
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleStep1Continue}
              className="inline-flex h-[46px] items-center gap-2 rounded-pill bg-[#00BFFF] px-8 font-headline text-[14px] font-semibold text-[#004a65] transition-opacity hover:opacity-95"
            >
              Continue
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </section>
      )}

      {currentStep === 2 && (
        <section className="space-y-8">
          <div className="grid grid-cols-1 items-end gap-6 lg:grid-cols-3">
            {MOCK_PACKAGES.map((pkg) => {
              const selected = selectedPackage === pkg.id;
              const isSig = pkg.tier === "signature";
              return (
                <div
                  key={pkg.id}
                  className={[
                    "relative flex flex-col rounded-[20px] border p-6 transition-all",
                    "bg-white/[0.05] backdrop-blur-[20px]",
                    selected ? "border-2 border-[#00BFFF] bg-[rgba(0,191,255,0.06)]" : "border border-white/[0.08]",
                    isSig ? "lg:-mt-3 lg:pb-8 lg:pt-7 shadow-[0_0_32px_rgba(0,191,255,0.12)]" : "",
                  ].join(" ")}
                >
                  {isSig && !selected ? (
                    <span className="absolute left-3 top-3 rounded-full bg-[#00BFFF] px-2.5 py-0.5 font-headline text-[10px] font-bold uppercase tracking-wider text-[#004a65]">
                      Most Popular
                    </span>
                  ) : null}
                  {selected ? (
                    <span className="absolute right-3 top-3 rounded-full border border-[#00BFFF]/50 bg-black/40 px-2.5 py-0.5 font-headline text-[10px] font-semibold text-[#00BFFF]">
                      {"\u2713"} Selected
                    </span>
                  ) : null}
                  <h3 className="font-headline text-[18px] font-semibold text-white">{pkg.id}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span
                      className={[
                        "font-display text-[48px] font-bold leading-none",
                        pkg.tier === "essential" ? "text-white" : pkg.tier === "signature" ? "text-[#00BFFF]" : "text-[#F5A623]",
                      ].join(" ")}
                    >
                      GHS {pkg.price.toLocaleString()}
                    </span>
                    <span className="font-body text-[14px] text-[#A0A8C0]">/event</span>
                  </div>
                  <div className="my-5 h-px bg-white/[0.08]" />
                  <ul className="mb-6 flex flex-1 flex-col gap-3">
                    {pkg.inclusions.map((line) => (
                      <li key={line} className="flex gap-2 font-body text-[14px] text-white/90">
                        <span className="material-symbols-outlined mt-0.5 shrink-0 text-[18px] text-[#00BFFF]" style={{ fontVariationSettings: "'FILL' 1" }}>
                          check_circle
                        </span>
                        {line}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPackage(pkg.id);
                      setSubmitError(null);
                    }}
                    className={[
                      "mt-auto flex h-11 w-full items-center justify-center gap-1 rounded-pill font-headline text-[13px] font-semibold transition-colors",
                      pkg.tier === "essential"
                        ? "border border-[#00BFFF] text-[#00BFFF] hover:bg-[#00BFFF]/10"
                        : pkg.tier === "signature"
                          ? "bg-[#00BFFF] text-[#004a65] hover:brightness-110"
                          : "border border-[#F5A623] text-[#F5A623] hover:bg-[#F5A623]/10",
                    ].join(" ")}
                  >
                    Choose this
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                </div>
              );
            })}
          </div>

          {selectedPackage ? (
            <div
              style={{
                marginTop: "24px",
                padding: "20px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "14px",
              }}
            >
              <div
                style={{
                  fontFamily: "Space Mono",
                  fontSize: "9px",
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                  color: "#5A6080",
                  textTransform: "uppercase",
                  marginBottom: "16px",
                }}
              >
                Event Timing
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                }}
              >
                <div>
                  <label className={labelClass}>Event Start Time</label>
                  <select
                    value={bookingData.eventStartTime || ""}
                    onChange={(e) => setField("eventStartTime", e.target.value)}
                    className={selectInputClass}
                    required
                  >
                    <option value="">Select start time</option>
                    {generateTimeOptions().map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Duration</label>
                  <select
                    value={
                      bookingData.eventDurationHours ||
                      String(packageDurations[selectedPackage] ?? 3)
                    }
                    onChange={(e) => setField("eventDurationHours", e.target.value)}
                    className={selectInputClass}
                  >
                    {Array.from({
                      length: (packageDurations[selectedPackage] ?? 3) + 4,
                    }).map((_, i) => {
                      const hrs = i + 1;
                      const included = packageDurations[selectedPackage] ?? 3;
                      const isIncluded = hrs <= included;
                      return (
                        <option key={hrs} value={String(hrs)}>
                          {hrs} hour{hrs > 1 ? "s" : ""}
                          {!isIncluded ? " (overtime)" : ""}
                        </option>
                      );
                    })}
                  </select>

                  {Number(bookingData.eventDurationHours || 0) >
                  (packageDurations[selectedPackage] ?? 3) ? (
                    <div
                      style={{
                        marginTop: "6px",
                        fontFamily: "Inter",
                        fontSize: "11px",
                        color: "#F5A623",
                      }}
                    >
                      Overtime applies after {packageDurations[selectedPackage] ?? 3} hours at GHS 500/hr
                    </div>
                  ) : null}
                </div>
              </div>

              <div
                style={{
                  marginTop: "12px",
                  fontFamily: "Inter",
                  fontSize: "12px",
                  color: "#5A6080",
                }}
              >
                {selectedPackage} package includes up to {packageDurations[selectedPackage] ?? 3} hours of performance.
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <button
              type="button"
              onClick={() => {
                setSubmitError(null);
                setCurrentStep(1);
              }}
              className="rounded-pill border border-white/15 px-6 py-2.5 font-headline text-[14px] font-semibold text-white/80 transition-colors hover:bg-white/5"
            >
              ← Back
            </button>
            <button
              type="button"
              disabled={!selectedPackage || submitting}
              onClick={() => void handleStep2Continue()}
              className="inline-flex h-[46px] items-center gap-2 rounded-pill bg-[#00BFFF] px-8 font-headline text-[14px] font-semibold text-[#004a65] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {submitting ? <Loader2 className="size-5 animate-spin" /> : null}
              {submitting ? "Submitting…" : "Continue"}
              {!submitting ? <span className="material-symbols-outlined text-[18px]">arrow_forward</span> : null}
            </button>
          </div>

          {submitError ? (
            <div
              style={{
                background: "rgba(255,69,96,0.08)",
                border: "1px solid rgba(255,69,96,0.40)",
                borderRadius: "10px",
                padding: "12px 16px",
                marginTop: "12px",
                color: "#FF4560",
                fontSize: "13px",
                fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
              }}
            >
              {submitError}
            </div>
          ) : null}
        </section>
      )}

      {currentStep === 3 && eventId && (
        <section className="mx-auto max-w-[560px] text-center">
          <div className="relative mx-auto flex size-[72px] items-center justify-center">
            <span className="absolute inline-flex size-[72px] animate-ping rounded-full bg-[#00BFFF]/20 opacity-40" />
            <div className="relative flex size-[72px] items-center justify-center rounded-full border-2 border-[#00BFFF] bg-[rgba(0,191,255,0.12)]">
              <Check className="size-8 text-[#00BFFF]" strokeWidth={2.5} />
            </div>
          </div>
          <h2 className="mt-5 font-display text-[32px] font-bold text-white">Booking Confirmed.</h2>
          <p className="mt-2 font-body text-[14px] text-[#A0A8C0]">
            Your booking request has been received. Page KillerCutz will confirm within 24 hours.
          </p>

          <div
            className="mt-6 rounded-[20px] border border-white/[0.08] p-6 text-left"
            style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px)" }}
          >
            <p className="text-center font-mono text-[10px] font-medium uppercase tracking-widest text-[#A0A8C0]">
              Your event ID
            </p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <span className="font-display text-[28px] font-bold tracking-tight text-[#00BFFF]">{eventId}</span>
              <button
                type="button"
                onClick={() => void copyId()}
                className="flex size-7 items-center justify-center rounded-pill border border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
                aria-label="Copy event ID"
              >
                <Copy className="size-3.5" />
              </button>
            </div>
            {copied ? <p className="mt-1 text-center font-body text-[11px] text-[#00BFFF]">Copied!</p> : null}

            {!isLoggedIn ? (
              <div
                className="mt-5 rounded-[14px] border border-white/[0.08] border-l-[4px] border-l-[#00BFFF] p-4 text-left"
                style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(12px)" }}
              >
                <p
                  className="font-headline text-[13px] font-semibold text-white"
                  style={{ fontFamily: "'Space Grotesk', var(--font-space-grotesk), ui-sans-serif, system-ui, sans-serif" }}
                >
                  {clientAuth === "existing_user"
                    ? "You already have an account"
                    : clientAuth === "invite_sent"
                      ? "Next: set your password"
                      : "Playlist portal access"}
                </p>
                <p className="mt-2 font-body text-[13px] leading-relaxed text-[#A0A8C0]">
                  {clientAuth === "existing_user" ? (
                    <>
                      This email already has a Page KillerCutz login. Use <span className="text-white/90">Sign in</span>{" "}
                      below with your existing password to open your playlist and booking. We&apos;ve also emailed you a
                      confirmation of this new event.
                    </>
                  ) : clientAuth === "invite_sent" ? (
                    <>
                      We&apos;ve emailed <span className="text-white/90">{bookingData.email}</span> with a secure link to
                      choose your password. We also sent an SMS to your phone with a short reminder. After you set your
                      password, sign in here to build your playlist.
                    </>
                  ) : (
                    <>
                      If you&apos;re new, look for an email to set your password (check spam). Once you can sign in, you
                      can access your playlist. Need help? Contact us from the site footer.
                    </>
                  )}
                </p>
              </div>
            ) : null}

            <div className="my-5 h-px bg-white/[0.08]" />

            <p className="text-center font-mono text-[10px] font-medium uppercase tracking-widest text-[#A0A8C0]">
              Payment instructions
            </p>
            <div className="mt-3">
              <PaymentDetails
                reference={eventId}
                amount={MOCK_PACKAGES.find((p) => p.id === selectedPackage)?.price}
                amountLabel="Amount Due"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              isLoggedIn
                ? router.push("/client/dashboard")
                : router.push("/sign-in?redirect=/client/dashboard&notice=after_booking")
            }
            className="mt-6 flex h-12 w-full items-center justify-center rounded-pill bg-[#00BFFF] font-headline text-[14px] font-semibold text-[#004a65]"
          >
            {isLoggedIn ? "Go to my dashboard" : "Sign in for playlist"}
            <span className="material-symbols-outlined ml-1 text-[18px]">arrow_forward</span>
          </button>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-3 flex h-12 w-full items-center justify-center rounded-pill border border-white/15 font-headline text-[14px] font-semibold text-white/85 hover:bg-white/5"
          >
            Back to Home
          </button>
        </section>
      )}
    </div>
  );
}
