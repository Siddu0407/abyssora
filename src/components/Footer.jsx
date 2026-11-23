
import { Link } from 'react-router-dom'
import { Crown, Mail, ArrowUpRight } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-[#c58d98]/15 bg-[#191417]">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">

          {/* Brand */}
          <div>
            <Link to="/" className="mb-4 inline-flex items-center gap-3">
              <img
                src="/abyssora-mark.svg"
                alt="ABYSSORA"
                className="h-10 w-10 object-contain"
              />
              <span className="font-display text-3xl font-semibold tracking-wide text-[#f4e9e9]">
                ABYSSORA
              </span>
            </Link>

            <p className="mb-3 text-[10px] font-bold tracking-[0.3em] text-[#c58d98]">
              WORLDS BEYOND STORIES
            </p>

            <p className="max-w-xs text-sm leading-7 text-[#b9a8ac]">
              Discover captivating worlds, unforgettable characters and
              stories that stay with you.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h3 className="mb-5 text-xs font-bold tracking-[0.2em] text-[#f4e9e9]">
              EXPLORE
            </h3>
            <div className="flex flex-col items-start gap-3 text-sm text-[#b9a8ac]">
              <Link to="/" className="hover:text-[#d5a2aa]">Home</Link>
              <Link to="/discover" className="hover:text-[#d5a2aa]">Discover</Link>
              <Link to="/library" className="hover:text-[#d5a2aa]">My Library</Link>
              <Link to="/creator/submit" className="hover:text-[#d5a2aa]">Submit Your Story</Link>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-5 text-xs font-bold tracking-[0.2em] text-[#f4e9e9]">
              INFORMATION
            </h3>
            <div className="flex flex-col items-start gap-3 text-sm text-[#b9a8ac]">
              <Link to="/terms" className="hover:text-[#d5a2aa]">Terms & Conditions</Link>
              <Link to="/privacy" className="hover:text-[#d5a2aa]">Privacy Policy</Link>
              <Link to="/copyright" className="hover:text-[#d5a2aa]">Copyright & Content Removal</Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-5 text-xs font-bold tracking-[0.2em] text-[#f4e9e9]">
              GET IN TOUCH
            </h3>

            <p className="mb-4 text-sm leading-7 text-[#b9a8ac]">
              Questions, feedback or copyright concerns? Reach out to us.
            </p>

            <a
              href="mailto:thisismyteamhlo@gmail.com"
              className="inline-flex items-center gap-2 break-all text-sm text-[#d5a2aa] hover:text-[#f4e9e9]"
            >
              <Mail size={16} />
              thisismyteamhlo@gmail.com
              <ArrowUpRight size={14} />
            </a>
          </div>
        </div>

        <div className="mt-12 border-t border-[#c58d98]/15 pt-6 text-center">
          <p className="text-xs text-[#89777c]">
            © {new Date().getFullYear()} ABYSSORA. All rights reserved.
          </p>
          <p className="mt-2 text-xs text-[#89777c]">
            All third-party characters, artwork and stories remain the property
            of their respective owners.
          </p>
        </div>
      </div>
    </footer>
  )
}
