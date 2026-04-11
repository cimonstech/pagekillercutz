"use client";

import Image from "next/image";
import Link from "next/link";

export default function MaintenancePage() {
  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@800&family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@400;500;600&family=Space+Mono&display=swap"
        rel="stylesheet"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />
      <style jsx global>{`
        .vinyl-spin { animation: spin 4s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .bg-maintenance {
          background-color: #08080f;
          background-image: radial-gradient(circle at 50% 50%, rgba(0, 191, 255, 0.08) 0%, transparent 50%),
            linear-gradient(135deg, rgba(8, 8, 15, 1) 0%, rgba(19, 19, 26, 1) 100%);
        }
      `}</style>
      <div className="bg-maintenance text-on-surface font-body min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute right-[-10%] top-[10%] opacity-[0.04] pointer-events-none select-none w-1/2 max-w-4xl relative aspect-[4/3]">
          <Image
            className="w-full object-contain"
            alt=""
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAoRj3L9PS-ElKdwg_bbBT1VTZvd1UX9kd-9sqpMH7el5xVsJO40OsUo6az44zLLiyRRKGhE43pxqPGQs2OrWEHsrYLnDLyu6wqnuz3n5Wl44Qi2LD4OTvLAInImGpdlZvjr0tp22VJWFaOIMYgqebZUtIbvWcxJTGg3Ni75tdOPoeLfcqv6gUYRceNwgnSsFq3kJ_q74Cm93e2fz4RABAsKWjkd_CALUnS_MNPoDlOxT_Qu5zzg7_EGspKYuaBQ6o26ifgHPnJ4CAy"
            fill
            unoptimized
          />
        </div>
        <main className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl">
          <div className="mb-12 relative">
            <div className="vinyl-spin w-[120px] h-[120px] rounded-full border-[10px] border-[#1a1a24] flex items-center justify-center shadow-[0_0_40px_rgba(0,191,255,0.2)]">
              <div
                className="w-full h-full rounded-full border border-white/5 flex items-center justify-center"
                style={{ background: "repeating-radial-gradient(circle, #13131a 0%, #13131a 2px, #1a1a24 3px, #1a1a24 4px)" }}
              >
                <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-[#08080F]" /></div>
              </div>
            </div>
            <div className="absolute -right-4 top-0 w-16 h-1 bg-outline/20 origin-left rotate-45 rounded-full" />
          </div>
          <h1 className="font-display font-extrabold text-[56px] leading-[0.95] tracking-tight text-white mb-6 uppercase">We&apos;re Setting Up <br />the Next Set.</h1>
          <p className="font-headline text-on-surface-variant text-xl mb-12 max-w-lg">Page KillerCutz is currently undergoing maintenance. We&apos;ll be back shortly with a refined experience.</p>
          <div className="w-full max-w-md bg-surface-container-low/40 backdrop-blur-xl border-l-2 border-primary-container p-6 mb-8 text-left">
            <p className="italic text-on-surface/90 font-medium">&quot;Upgrading our digital racks to handle higher fidelity stream processing and artist dashboard integrations.&quot;</p>
          </div>
          <div className="flex flex-col gap-4 items-center mb-20">
            <div className="flex items-center gap-3"><span className="material-symbols-outlined text-outline text-sm">schedule</span><span className="font-mono text-[10px] uppercase tracking-[0.2em] text-outline">ESTIMATED BACK: 04:00 AM UTC</span></div>
            <Link className="group flex items-center gap-2" href="mailto:support@pagekillercutz.com"><span className="material-symbols-outlined text-primary-container text-base group-hover:scale-110 transition-transform">alternate_email</span><span className="font-mono text-sm text-primary-container tracking-wider border-b border-transparent group-hover:border-primary-container transition-all">support@pagekillercutz.com</span></Link>
          </div>
        </main>
        <footer className="absolute bottom-12 w-full flex justify-center"><div className="flex flex-col items-center gap-2 opacity-50"><span className="font-display font-black text-2xl text-white italic tracking-tighter">KILLERCUTZ</span><div className="h-[1px] w-8 bg-primary-container" /></div></footer>
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-primary-container/5 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-primary-container/5 to-transparent pointer-events-none" />
      </div>
    </>
  );
}
