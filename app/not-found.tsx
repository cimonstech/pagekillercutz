"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@800&family=Inter:wght@400;500&family=Space+Grotesk:wght@600&family=Space+Mono&display=swap"
        rel="stylesheet"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />
      <style jsx global>{`
        .font-hero { font-family: "Barlow Condensed", sans-serif; }
        .font-headline { font-family: "Space Grotesk", sans-serif; }
        .font-mono { font-family: "Space Mono", monospace; }
        .vinyl-ring { border: 2px solid rgba(143, 214, 255, 0.2); border-radius: 50%; background: repeating-radial-gradient(circle, #13131a 0%, #13131a 5%, #1b1b23 6%, #1b1b23 10%); }
        .watermark-404 { line-height: 1; user-select: none; pointer-events: none; }
      `}</style>
      <div className="bg-[#08080F] text-on-surface min-h-screen flex items-center justify-center overflow-hidden selection:bg-primary-container selection:text-on-primary-container">
        <div className="fixed inset-0 bg-gradient-to-br from-surface via-surface-container-lowest to-surface z-0" />
        <div className="fixed inset-0 opacity-30 bg-[radial-gradient(circle_at_50%_50%,rgba(143,214,255,0.05),transparent_70%)] z-0" />
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0"><h1 className="watermark-404 text-[400px] font-hero font-extrabold text-white/[0.02] tracking-tighter">404</h1></div>

        <main className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl">
          <div className="relative mb-12">
            <div className="vinyl-ring w-[120px] h-[120px] flex items-center justify-center shadow-[0_0_30px_rgba(0,191,255,0.15)]"><div className="w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-primary-container" /></div></div>
            <div className="absolute -top-2 -right-4 w-12 h-1 bg-outline/40 rotate-[35deg] origin-left rounded-full" />
          </div>
          <div className="space-y-2 mb-8"><h2 className="text-[96px] font-hero font-extrabold text-white leading-none tracking-tighter">404</h2><p className="text-[16px] font-headline text-primary font-semibold tracking-[0.4em]">PAGE NOT FOUND</p></div>
          <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-outline-variant/30 to-transparent mb-8" />
          <div className="space-y-3 mb-10 max-w-md"><h3 className="text-2xl font-headline text-on-surface">Looks like this track got scratched.</h3><p className="text-on-surface-variant font-body">The beat you&apos;re looking for has been moved or doesn&apos;t exist. Check the URL or return to the main stage.</p></div>
          <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
            <Link href="/" className="bg-primary-container text-on-primary-container px-8 py-3 rounded-sm font-headline font-bold text-sm tracking-wide hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,191,255,0.2)]">Go Home</Link>
            <Link href="/music" className="border border-primary-container/40 text-primary-container px-8 py-3 rounded-sm font-headline font-bold text-sm tracking-wide hover:bg-primary-container/5 active:scale-95 transition-all">Browse Music</Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link className="px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-[10px] font-mono text-on-surface-variant hover:text-primary hover:border-primary/50 transition-colors tracking-widest" href="/">HOME</Link>
            <Link className="px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-[10px] font-mono text-on-surface-variant hover:text-primary hover:border-primary/50 transition-colors tracking-widest" href="/booking">BOOK DJ</Link>
            <Link className="px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-[10px] font-mono text-on-surface-variant hover:text-primary hover:border-primary/50 transition-colors tracking-widest" href="/">MERCH</Link>
            <Link className="px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-[10px] font-mono text-on-surface-variant hover:text-primary hover:border-primary/50 transition-colors tracking-widest" href="/">PORTAL</Link>
          </div>
        </main>

        <div className="fixed bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-30 z-20" />
        <div className="fixed top-0 left-0 w-full h-[64px] flex items-center justify-between px-8 z-40 pointer-events-none">
          <span className="font-hero text-2xl font-black tracking-tighter text-white opacity-40">Page KillerCutz</span>
          <span className="font-mono text-[10px] text-on-surface-variant tracking-widest">SYSTEM STATUS: INTERRUPTED</span>
        </div>
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden"><div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" /><div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/5 blur-[120px]" /></div>
      </div>
    </>
  );
}
