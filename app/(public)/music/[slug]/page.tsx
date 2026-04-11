import Link from "next/link";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function MusicDetailPage({ params }: Props) {
  const { slug } = await params;
  const title = slug.replaceAll("-", " ");

  return (
    <div className="px-8 lg:px-12 py-10 max-w-5xl mx-auto">
      <Link
        href="/music"
        className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors mb-8 font-headline text-sm"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to Music
      </Link>
      <h1 className="font-display text-5xl uppercase tracking-tighter text-white mb-3 capitalize">{title}</h1>
      <p className="text-on-surface-variant text-sm">
        Full album detail coming soon. Sign in to stream every track.
      </p>
      <Link
        href="/sign-in"
        className="inline-flex items-center gap-2 mt-8 px-6 py-3 bg-primary text-on-primary-fixed font-bold rounded-full text-sm uppercase tracking-widest hover:scale-105 transition-transform glow-btn"
      >
        Sign In to Listen
        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
      </Link>
    </div>
  );
}
