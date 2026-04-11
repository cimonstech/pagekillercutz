import Image from "next/image";
import Link from "next/link";

export default function PublicFooter() {
  return (
    <footer className="border-t border-white/5 py-10 px-6 lg:px-12 mt-auto">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2 opacity-70">
          <Image
            src="/pageicon.png"
            alt=""
            width={20}
            height={20}
            className="h-5 w-auto object-contain"
          />
          <span className="font-display text-base uppercase tracking-tighter">Page KillerCutz</span>
        </div>
        <nav className="flex flex-wrap justify-center gap-4 sm:gap-6 text-sm text-on-surface-variant">
          <Link className="hover:text-primary transition-colors" href="/privacy">Privacy</Link>
          <Link className="hover:text-primary transition-colors" href="/terms">Terms</Link>
          <Link className="hover:text-primary transition-colors" href="/contact">Contact</Link>
          <Link className="hover:text-primary transition-colors" href="/about">About</Link>
        </nav>
        <p className="font-label text-xs text-outline">© 2025 PAGE KILLERCUTZ. ALL RIGHTS RESERVED.</p>
      </div>
    </footer>
  );
}
