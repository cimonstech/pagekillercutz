import Link from "next/link";
import { cn } from "@/lib/utils";

type HomeAnnouncementBarProps = {
  className?: string;
};

export default function HomeAnnouncementBar({ className }: HomeAnnouncementBarProps) {
  return (
    <div className={cn("flex justify-center px-3 py-1.5 sm:px-6 sm:py-2 lg:px-10", className)}>
      <div
        className="inline-flex max-w-[min(100%,420px)] flex-col items-stretch gap-1.5 rounded-2xl border border-white/[0.08] px-3 py-2 shadow-[0_4px_24px_rgba(0,0,0,0.25)] sm:max-w-none sm:flex-row sm:items-center sm:gap-x-3 sm:gap-y-0 sm:rounded-full sm:px-5 sm:py-2.5"
        style={{
          background: "rgba(255,255,255,0.05)",
          backdropFilter: "blur(20px) saturate(150%)",
          WebkitBackdropFilter: "blur(20px) saturate(150%)",
        }}
      >
        <p className="font-body text-[11px] leading-snug text-white/70 sm:text-[13px]">
          <span aria-hidden>{'\u{1F3A7}'} </span>
          Available for bookings in Ghana and beyond.
        </p>
        <Link
          href="/booking"
          className="inline-flex shrink-0 items-center justify-center rounded-full border border-[#00BFFF]/40 bg-[#00BFFF]/10 px-3 py-1.5 font-body text-[11px] font-medium text-[#00BFFF] transition-colors hover:bg-[#00BFFF]/20 sm:px-4 sm:py-2 sm:text-[13px]"
        >
          Check availability →
        </Link>
      </div>
    </div>
  );
}
