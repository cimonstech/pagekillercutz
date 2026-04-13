import Link from "next/link";
import { DJ_INFO } from "@/lib/constants";

const LAST_UPDATED = "April 13, 2026";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#08080F] px-4 pb-16 pt-24 text-on-surface sm:px-8">
      <div className="mx-auto max-w-3xl">
        <p className="mb-6 font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
          <Link href="/" className="text-primary transition-colors hover:underline">
            Home
          </Link>
          <span className="mx-2 text-white/20">/</span>
          Privacy Policy
        </p>

        <h1 className="font-headline text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-2 font-body text-sm text-on-surface-variant">Last updated: {LAST_UPDATED}</p>

        <div className="mt-10 space-y-10 font-body text-[15px] leading-relaxed text-on-surface-variant">
          <section className="space-y-3">
            <h2 className="font-headline text-lg font-semibold text-white">1. Introduction</h2>
            <p>
              {DJ_INFO.name} (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) respects your privacy. This Privacy Policy explains how we
              collect, use, disclose, and safeguard personal information when you use our website, client portal, booking
              flows, and related services (collectively, the &quot;Services&quot;).
            </p>
            <p>
              By using the Services, you acknowledge this Policy. If you do not agree, please discontinue use of the Services.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline text-lg font-semibold text-white">2. Data controller</h2>
            <p>
              For the purposes of this Policy, the data controller is {DJ_INFO.name}. Contact:{" "}
              <a href={`mailto:${DJ_INFO.email}`} className="text-primary hover:underline">
                {DJ_INFO.email}
              </a>
              .
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline text-lg font-semibold text-white">3. Information we collect</h2>
            <p className="font-medium text-on-surface">3.1 You provide directly</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-on-surface">Account &amp; identity:</strong> name, email address, phone number, and
                similar details when you register, sign in, book, or contact us.
              </li>
              <li>
                <strong className="text-on-surface">Booking &amp; events:</strong> event details, venue information, timeline
                preferences, and communications about your engagement.
              </li>
              <li>
                <strong className="text-on-surface">Playlist &amp; preferences:</strong> where we offer a client playlist or
                preferences portal, song choices, notes, genres, and related content you submit.
              </li>
              <li>
                <strong className="text-on-surface">Orders:</strong> shipping address and payment-related references when you
                purchase merchandise or services, as applicable.
              </li>
            </ul>
            <p className="font-medium text-on-surface pt-2">3.2 Collected automatically</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-on-surface">Device &amp; usage:</strong> IP address, browser type, approximate region,
                pages viewed, and timestamps—to operate, secure, and improve the Services.
              </li>
              <li>
                <strong className="text-on-surface">Cookies &amp; similar technologies:</strong> session and preference
                cookies, analytics where enabled, and local storage for essential functionality (e.g., keeping you signed
                in). You can control cookies through your browser settings; some features may not work if cookies are
                disabled.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline text-lg font-semibold text-white">4. How we use information</h2>
            <p>We use personal information to:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Provide, personalize, and improve the Services;</li>
              <li>Process bookings, payments (via payment partners), and deliver merchandise;</li>
              <li>Communicate with you about your account, events, and service updates;</li>
              <li>Operate security, fraud prevention, and troubleshooting;</li>
              <li>Comply with legal obligations and enforce our terms;</li>
              <li>Where permitted, send marketing communications—you may opt out of non-essential emails using the link in
                those messages or by contacting us.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline text-lg font-semibold text-white">5. Legal bases (EEA, UK &amp; similar)</h2>
            <p>
              Where the GDPR or similar laws apply, we rely on one or more of: performance of a contract with you; our
              legitimate interests (e.g., securing the Services, analytics at an aggregated level); compliance with legal
              obligations; and consent where required (e.g., certain cookies or marketing).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline text-lg font-semibold text-white">6. Sharing &amp; processors</h2>
            <p>We do not sell your personal information. We may share data with:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-on-surface">Service providers</strong> who host our infrastructure, authenticate
                users, send email, process payments, or provide analytics—under contracts that require appropriate safeguards;
              </li>
              <li>
                <strong className="text-on-surface">Professional advisers</strong> where necessary (e.g., accountants,
                lawyers);</li>
              <li>
                <strong className="text-on-surface">Authorities</strong> when required by law or to protect rights, safety, and
                security.</li>
            </ul>
            <p>
              Payment card data is handled by PCI-compliant payment processors; we do not store full card numbers on our
              servers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline text-lg font-semibold text-white">7. International transfers</h2>
            <p>
              We may process or store information in Ghana and other countries where our providers operate. Where we transfer
              personal data from the EEA, UK, or Switzerland, we use appropriate safeguards such as standard contractual
              clauses or equivalent mechanisms where required.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline text-lg font-semibold text-white">8. Retention</h2>
            <p>
              We retain information only as long as needed for the purposes above, including legal, accounting, and dispute
              resolution requirements. Booking and financial records may be kept longer as required by law. Playlist and
              event-preference data may be retained for a limited period after your event unless we agree otherwise or law
              requires longer retention.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline text-lg font-semibold text-white">9. Security</h2>
            <p>
              We implement technical and organizational measures designed to protect personal information. No method of
              transmission over the Internet is 100% secure; we cannot guarantee absolute security.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline text-lg font-semibold text-white">10. Your rights</h2>
            <p>
              Depending on your location, you may have the right to access, correct, delete, or export your personal data;
              restrict or object to certain processing; withdraw consent where processing is consent-based; and lodge a
              complaint with a supervisory authority. To exercise these rights, contact us at the email above. We may need to
              verify your identity before responding.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline text-lg font-semibold text-white">11. Children</h2>
            <p>
              The Services are not directed at children under 16. We do not knowingly collect personal information from
              children. If you believe we have collected such information, contact us and we will take appropriate steps to
              delete it.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline text-lg font-semibold text-white">12. Third-party links</h2>
            <p>
              The Services may link to third-party sites (e.g., social networks, ticketing). We are not responsible for their
              privacy practices; review their policies before providing information.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline text-lg font-semibold text-white">13. Changes to this Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will post the revised version on this page and update
              the &quot;Last updated&quot; date. Material changes may be communicated by email or a notice on the Services where
              appropriate.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline text-lg font-semibold text-white">14. Contact</h2>
            <p>
              Questions or requests regarding privacy:{" "}
              <a href={`mailto:${DJ_INFO.email}`} className="text-primary hover:underline">
                {DJ_INFO.email}
              </a>
              .
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
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>
            .
          </p>
        </footer>
      </div>
    </main>
  );
}
