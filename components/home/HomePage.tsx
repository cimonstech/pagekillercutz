"use client";

import HomeGenreChips from "@/components/home/HomeGenreChips";
import ArtistAboutSection from "@/components/home/ArtistAboutSection";
import BookingCtaSection from "@/components/home/BookingCtaSection";
import HeroSection from "@/components/home/HeroSection";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import NewReleasesSection from "@/components/home/NewReleasesSection";
import PopularTracksSection from "@/components/home/PopularTracksSection";
import RecentEventsSection from "@/components/home/RecentEventsSection";
import ReviewsShowcase from "@/components/public/ReviewsShowcase";

export default function HomePage() {
  return (
    <main className="min-w-0 flex-1 pb-[var(--player-offset,0px)]">
      <HeroSection />
      <div className="space-y-14 px-4 py-10 sm:px-8 lg:px-12">
        <section>
          <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-10">
            <PopularTracksSection />
            <HowItWorksSection />
          </div>
        </section>
        <HomeGenreChips />
        <RecentEventsSection />
        <ReviewsShowcase limit={6} />
        <NewReleasesSection />
        <ArtistAboutSection />
        <BookingCtaSection />
      </div>
    </main>
  );
}
