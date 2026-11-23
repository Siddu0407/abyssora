
import { Link } from 'react-router-dom'
import { ArrowLeft, Crown, Mail } from 'lucide-react'

export default function Copyright() {
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
            ABYSSORA • CREATOR RIGHTS
          </p>

          <h1 className="font-display text-5xl font-semibold">
            Copyright & Content Removal
          </h1>

          <p className="mt-4 text-sm text-[#89777c]">
            Last updated: November 23, 2026
          </p>
        </div>

        <div className="space-y-9 text-sm leading-8 text-[#b9a8ac]">

          <section>
            <h2 className="mb-3 text-xl font-semibold text-[#f4e9e9]">
              1. Respect for Creators
            </h2>
            <p>
              ABYSSORA respects the creative work and intellectual property
              rights of authors, artists, publishers and other rights holders.
              We believe creators deserve proper recognition and respect for
              their work.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-[#f4e9e9]">
              2. Ownership of Content
            </h2>
            <p>
              All third-party manga, manhwa, comics, characters, illustrations,
              stories and related materials belong to their respective
              copyright owners. Unless explicitly stated, ABYSSORA does not
              claim ownership of such material.
            </p>
            <p className="mt-3">
              Giving credit or naming the original creator does not replace
              the permission or licence required to publish copyrighted
              material.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-[#f4e9e9]">
              3. Request Content Removal
            </h2>
            <p>
              If you are a copyright owner or an authorized representative
              and believe content on ABYSSORA uses your work without
              authorization, you may contact us to request a review and
              removal where appropriate.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-[#f4e9e9]">
              4. Information to Include
            </h2>
            <p>Please include the following information in your request:</p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Your full name and contact email address.</li>
              <li>The title or description of the original copyrighted work.</li>
              <li>The exact ABYSSORA page or URL containing the material.</li>
              <li>Evidence that you own the rights or are authorized to represent the owner.</li>
              <li>A brief explanation of the concern and the action requested.</li>
            </ul>
            <p className="mt-3">
              Please provide accurate information. We may contact you if
              additional details are needed to review the request.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-[#f4e9e9]">
              5. Contact for Copyright Concerns
            </h2>
            <p>
              Send copyright or content removal requests to our official
              contact email:
            </p>

            <a
              href="mailto:thisismyteamhlo@gmail.com?subject=Copyright%20or%20Content%20Removal%20Request"
              className="mt-4 inline-flex items-center gap-2 break-all text-[#d5a2aa] underline underline-offset-4"
            >
              <Mail size={17} />
              thisismyteamhlo@gmail.com
            </a>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-[#f4e9e9]">
              6. Review of Requests
            </h2>
            <p>
              We will review requests in good faith and may temporarily
              restrict access to disputed material while reviewing a
              sufficiently detailed complaint. Appropriate action will be
              taken where necessary.
            </p>
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
