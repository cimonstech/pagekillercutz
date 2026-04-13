import Link from "next/link";
import { DJ_INFO } from "@/lib/constants";

const LAST_UPDATED = "April 13, 2026";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#08080F] px-4 pb-16 pt-24 text-on-surface sm:px-8">
      <div className="mx-auto max-w-3xl">
        <p className="mb-6 font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
          <Link href="/" className="text-primary transition-colors hover:underline">
            Home
          </Link>
          <span className="mx-2 text-white/20">/</span>
          Terms of Service
        </p>

        <h1 className="font-headline text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Terms of Service
        </h1>
        <p className="mt-2 font-body text-sm text-on-surface-variant">Last updated: {LAST_UPDATED}</p>

        <div className="mt-10 space-y-10 font-body text-[15px] leading-relaxed text-on-surface-variant">
          <section className="space-y-3">
            <h2 className="font-headline text-lg font-semibold text-white">1. Agreement</h2>
            <p>
              These Terms of Service (&quot;Terms&quot;) govern your access to and use of the website, applications, and
              related services operated by or on behalf of {DJ_INFO.name} (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;)
              at pagekillercutz.com and associated domains (collectively, the &quot;Services&quot;). By accessing or using the
              Services, you agree to be bound by these Terms. If you do not agree, do not use the Services.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline text-lg font-semibold text-white">2. Contact</h2>
            <p>
              For questions about these Terms or the Services, contact us at{" "}
              <a href={`mailto:${DJ_INFO.email}`} className="text-primary hover:underline">
                {DJ_INFO.email}
              </a>
              .
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline text-lg font-semibold text-white">3. Services</h2>
            <p>The Services may include, among other things:</p>
            <ul className="list-disc space-y-2 pl-5 text-on-surface-variant">
              <li>Informational content about {DJ_INFO.name}, music, events, and merchandise;</li>
              <li>Tools to request or manage DJ bookings and related communications;</li>
              <li>A client area where confirmed clients may access event-related features (such as a playlist portal tied to
                a booking);</li>
              <li>E-commerce or catalog features for merchandise, where offered;</li>
              <li>Streaming or preview of music and media, subject to availability and rights.</li>
            </ul>
            <p>
              We may add, change, or discontinue features with reasonable notice where appropriate. Specific performance
              dates, packages, and deliverables for paid engagements are defined in your booking confirmation, contract, or
              written agreement—not solely by marketing copy on this site.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline text-lg font-semibold text-white">4. Eligibility &amp; accounts</h2>
            <p>
              You must be at least 18 years old (or the age of majority where you live) to enter into binding contracts with
              us. You are responsible for providing accurate information when you book, register, or use client features, and
              for safeguarding your login credentials. Notify us promptly of any unauthorized use of your account.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline text-lg font-semibold text-white">5. Bookings, payments &amp; commercial terms</h2>
            <p>
              Quotes, deposits, balances, taxes, travel, cancellation windows, rescheduling, and force-majeure handling are
              as stated in your proposal, invoice, or written agreement. Unless we expressly agree otherwise in writing,
              payment obligations are independent of weather, third-party venue rules, or other factors outside our direct
              control, except where mandatory consumer laws apply.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline text-lg font-semibold text-white">6. Client playlist portal</h2>
            <p>
              Where we provide a playlist or event-preferences portal in connection with a booking, you agree to use it only
              for lawful, respectful content. We may review, lock, or remove submissions that violate these Terms, infringe
              rights, or create safety or operational issues. Administrative staff accounts are not intended to use the
              client playlist experience as an end-user product; operational access is for support and production purposes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline text-lg font-semibold text-white">7. Intellectual property</h2>
            <p>
              The Services, branding, logos, text, graphics, software, and curated music presentations are protected by
              intellectual property laws. You may not copy, scrape, redistribute, or exploit them without permission, except
              for temporary personal viewing or sharing via features we expressly provide.
            </p>
            <p>
              Music and recordings remain the property of their respective owners. Your use of streamed or embedded audio is
              limited to personal, non-commercial listening through the Services unless you hold separate licenses.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline text-lg font-semibold text-white">8. Acceptable use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Violate laws or third-party rights;</li>
              <li>Attempt to gain unauthorized access to our systems, other users&apos; accounts, or data;</li>
              <li>Transmit malware, spam, or abusive content;</li>
              <li>Interfere with the integrity or performance of the Services;</li>
              <li>Use automated means to access the Services in a way that imposes an unreasonable load or bypasses
                restrictions.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline text-lg font-semibold text-white">9. Disclaimers</h2>
            <p>
              The Services are provided &quot;as is&quot; and &quot;as available.&quot; To the fullest extent permitted by law, we
              disclaim warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not
              guarantee uninterrupted or error-free operation.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline text-lg font-semibold text-white">10. Limitation of liability</h2>
            <p>
              To the maximum extent permitted by applicable law, we (and our team, contractors, and licensors) shall not be
              liable for any indirect, incidental, special, consequential, or punitive damages, or for loss of profits,
              data, or goodwill, arising from your use of the Services. Our aggregate liability for claims relating to the
              Services or these Terms shall not exceed the greater of (a) the amounts you paid us for the specific service
              giving rise to the claim in the twelve (12) months before the claim, or (b) fifty U.S. dollars (USD $50), except
              where such limitations are prohibited by law.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline text-lg font-semibold text-white">11. Indemnity</h2>
            <p>
              You will defend, indemnify, and hold harmless {DJ_INFO.name} and its representatives from claims, damages, and
              expenses (including reasonable legal fees) arising from your use of the Services, your content, or your breach
              of these Terms, except to the extent caused by our willful misconduct.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline text-lg font-semibold text-white">12. Changes</h2>
            <p>
              We may update these Terms from time to time. We will post the revised Terms on this page and update the
              &quot;Last updated&quot; date. Continued use after changes become effective constitutes acceptance of the revised
              Terms, except where applicable law requires additional steps.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline text-lg font-semibold text-white">13. Termination</h2>
            <p>
              We may suspend or terminate access to the Services if you materially breach these Terms or where required for
              legal or security reasons. Provisions that by their nature should survive (including intellectual property,
              disclaimers, limitations, and indemnity) will survive termination.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline text-lg font-semibold text-white">14. Governing law &amp; disputes</h2>
            <p>
              These Terms are governed by the laws of the Republic of Ghana, without regard to conflict-of-law principles,
              unless mandatory consumer protections in your country say otherwise. Courts in Accra, Ghana, shall have
              non-exclusive jurisdiction over disputes, subject to any rights you may have to bring claims in your place of
              residence where required by law.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline text-lg font-semibold text-white">15. Miscellaneous</h2>
            <p>
              If any provision is held invalid, the remainder remains in effect. These Terms constitute the entire agreement
              between you and us regarding the Services and supersede prior understandings on the same subject. Our failure
              to enforce a provision is not a waiver.
            </p>
          </section>
        </div>

        <footer className="mt-12 space-y-3 border-t border-white/10 pt-8 font-body text-sm text-on-surface-variant">
          <p>
            <Link href="/" className="text-primary hover:underline">
              Homepage
            </Link>
          </p>
          <p>
            See also our{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </footer>
      </div>
    </main>
  );
}
