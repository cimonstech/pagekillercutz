"use client";

import Link from "next/link";

export default function TrackOrderPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="font-headline text-2xl font-semibold text-white">Track your order</h1>
      <p className="mt-3 font-body text-[14px] leading-relaxed text-[#A0A8C0]">
        Use the Order ID from your confirmation email or SMS. Full tracking will be available here soon — for now, contact support with your Order ID if you need help.
      </p>
      <Link href="/merch" className="mt-8 inline-flex font-body text-[14px] text-[#00BFFF] hover:underline">
        ← Back to Merch
      </Link>
    </div>
  );
}
