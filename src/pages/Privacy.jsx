
import { Link } from 'react-router-dom'
import { ArrowLeft, Crown } from 'lucide-react'

export default function Privacy() {
  return (
    <main className="min-h-screen bg-[#110e10] px-5 py-12 text-[#f4e9e9]">
      <div className="mx-auto max-w-4xl">

        <Link
          to="/"
          className="mb-10 inline-flex items-center gap-2 text-sm text-[#c58d98] hover:text-[#f4e9e9]"
        >
          <ArrowLeft size={16} />
          Back to ABYSSORA
        </Link>

        <div className="mb-10">
          <Crown size={30} className="mb-5 text-[#c58d98]" />

          <p className="mb-3 text-xs font-bold tracking-[0.3em] text-[#c58d98]">
            ABYSSORA • LEGAL
          </p>

          <h1 className="font-display text-5xl font-semibold">
            Privacy Policy
          </h1>

          <p className="mt-4 text-sm text-[#89777c]">
            Last updated: November 23, 2026
          </p>
        </div>

        <div className="space-y-9 text-sm leading-8 text-[#b9a8ac]">

          <section>
            <h2 className="mb-3 text-xl font-semibold text-[#f4e9e9]">
              1. Introduction
            </h2>
            <p>
              Your privacy matters to us. This Privacy Policy explains how
              ABYSSORA may collect, use and handle information when you visit
              or use our website.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-[#f4e9e9]">
              2. Information We Collect
            </h2>
            <p>
              Depending on how you use ABYSSORA, the information associated
              with your account may include:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Email address and account authentication information.</li>
              <li>Username and profile information you provide.</li>
              <li>Bookmarked comics and library activity.</li>
              <li>Reading history and chapter progress.</li>
              <li>Notifications and read/unread notification status.</li>
              <li>Comments, reactions and creator submissions you provide.</li>
            </ul>
            <p className="mt-3">
              The website or its hosting and service providers may also process
              technical information, such as browser, device and connection
              information, to operate and protect the service.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-[#f4e9e9]">
              3. How We Use Information
            </h2>
            <p>Information may be used to:</p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Create and manage user accounts.</li>
              <li>Provide login and account recovery features.</li>
              <li>Save bookmarks and reading progress.</li>
              <li>Display notifications and community interactions.</li>
              <li>Review creator submissions and manage website content.</li>
              <li>Maintain website security and improve functionality.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-[#f4e9e9]">
              4. Third-Party Services
            </h2>
            <p>
              ABYSSORA uses third-party services, including Supabase, to
              support account authentication, database and storage
              functionality. These providers may process information as
              necessary to provide their services under their own terms and
              privacy policies.
            </p>
            <p className="mt-3">
              Some comics or links may refer to external websites. We do not
              control the privacy practices or content of those websites.
              Please review their policies separately.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-[#f4e9e9]">
              5. Data Security
            </h2>
            <p>
              We take reasonable steps to protect information handled through
              the platform. However, no website or internet transmission can
              be guaranteed to be completely secure.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-[#f4e9e9]">
              6. Your Choices and Requests
            </h2>
            <p>
              If you have questions or want to request access, correction or
              deletion of information associated with your account, contact
              us. We may need to verify your identity before acting on a
              request, and some information may need to be retained where
              required for legitimate operational or legal reasons.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-[#f4e9e9]">
              7. Children's Privacy
            </h2>
            <p>
              ABYSSORA is not intended to knowingly collect personal
              information from children in violation of applicable law. If
              you believe a child has provided personal information
              improperly, please contact us.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-[#f4e9e9]">
              8. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. Any
              changes will be published on this page with a revised update
              date.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-[#f4e9e9]">
              9. Contact Us
            </h2>
            <p>
              For privacy-related questions or requests, contact:
            </p>
            <a
              href="mailto:thisismyteamhlo@gmail.com"
              className="text-[#d5a2aa] underline underline-offset-4"
            >
              thisismyteamhlo@gmail.com
            </a>
          </section>

        </div>

        <div className="mt-14 border-t border-[#c58d98]/15 pt-6">
          <p className="text-xs text-[#89777c]">
            © 2026 ABYSSORA. All rights reserved.
          </p>
          <Link
            to="/"
            className="mt-4 inline-block text-sm text-[#c58d98] hover:text-[#f4e9e9]"
          >
            Return to Home
          </Link>
        </div>

      </div>
    </main>
  )
}
