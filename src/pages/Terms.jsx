
import { Link } from 'react-router-dom'
import { ArrowLeft, Crown } from 'lucide-react'

export default function Terms() {
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
            Terms & Conditions
          </h1>

          <p className="mt-4 text-sm text-[#89777c]">
            Last updated: November 23, 2026
          </p>
        </div>

        <div className="space-y-9 text-sm leading-8 text-[#b9a8ac]">

          <section>
            <h2 className="mb-3 text-xl font-semibold text-[#f4e9e9]">
              1. About ABYSSORA
            </h2>
            <p>
              ABYSSORA is an online platform designed for discovering and
              reading comics, manga and manhwa. By accessing or using this
              website, you agree to these Terms & Conditions. If you do not
              agree, please discontinue using the website.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-[#f4e9e9]">
              2. Intellectual Property & Ownership
            </h2>
            <p>
              All third-party characters, stories, illustrations, artwork,
              logos and other intellectual property remain the property of
              their respective authors, artists, publishers, creators and
              rights holders.
            </p>
            <p className="mt-3">
              ABYSSORA does not claim ownership of third-party material unless
              explicitly stated. Displaying credits or acknowledging an owner
              does not transfer ownership or grant permission to publish or
              distribute copyrighted material.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-[#f4e9e9]">
              3. Content & Permissions
            </h2>
            <p>
              Content uploaded or submitted by creators should be owned by
              them or shared with appropriate authorization. Users and
              contributors are responsible for ensuring they have the rights
              and permissions needed to provide any material they submit.
            </p>
            <p className="mt-3">
              ABYSSORA aims to respect the work and rights of all creators.
              Unauthorized use of copyrighted content is not permitted.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-[#f4e9e9]">
              4. User Accounts
            </h2>
            <p>
              You are responsible for maintaining the confidentiality of your
              account credentials and for activity carried out through your
              account. Please provide accurate information and do not misuse
              the platform or attempt to interfere with its operation.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-[#f4e9e9]">
              5. Copyright & Content Removal Requests
            </h2>
            <p>
              If you are a copyright owner or an authorized representative
              and believe that material on ABYSSORA infringes your rights,
              please contact us at:
            </p>
            <p className="mt-3">
              <a
                href="mailto:thisismyteamhlo@gmail.com"
                className="text-[#d5a2aa] underline underline-offset-4"
              >
                thisismyteamhlo@gmail.com
              </a>
            </p>
            <p className="mt-3">
              Please include the relevant page or content link, a description
              of the copyrighted work, your contact details and information
              showing your ownership or authority to act. We will review
              legitimate requests and take appropriate action where
              necessary.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-[#f4e9e9]">
              6. Changes to These Terms
            </h2>
            <p>
              We may update these Terms & Conditions when necessary. Updated
              terms will be published on this page, with the revision date
              changed accordingly.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-[#f4e9e9]">
              7. Contact
            </h2>
            <p>
              For questions about these terms, contact:
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
