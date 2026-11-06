import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Star,
  Compass,
  ArrowUpRight,
} from 'lucide-react'

import { manga } from '../data/manga'

function Emblem({ size = 42 }) {
  return (
    <img
      src="/abyssora-mark.svg"
      alt="ABYSSORA"
      width={size}
      height={size}
      className="object-contain"
    />
  )
}

function Brand() {
  return (
    <Link to="/" className="group flex shrink-0 items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#c69aa1]/30 bg-[#211a1e] transition group-hover:border-[#c69aa1]/70">
        <Emblem size={34} />
      </div>

      <div className="leading-none">
        <div className="font-display text-[25px] font-semibold tracking-[0.15em] text-[#f1e7e8] transition group-hover:text-[#dfb9bf]">
          ABYSSORA
        </div>

        <div className="mt-1.5 font-sans text-[8px] font-semibold tracking-[0.32em] text-[#a88b91]">
          WORLDS BEYOND STORIES
        </div>
      </div>
    </Link>
  )
}

export default function Genre() {
  const { genreName } = useParams()

  const formattedGenre = genreName
    ? genreName.charAt(0).toUpperCase() + genreName.slice(1).toLowerCase()
    : ''

  const genreManga = useMemo(() => {
    return manga.filter((item) =>
      (item.genres || [item.genre]).some(
        (genre) =>
          typeof genre === 'string' &&
          genre.toLowerCase() === formattedGenre.toLowerCase()
      )
    )
  }, [formattedGenre])

  return (
    <main className="min-h-screen bg-[#110e10] text-[#f4e9e9]">

      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-[#dcb1b9]/10 bg-[#110e10]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Brand />

          <Link
            to="/"
            className="flex shrink-0 items-center gap-2 rounded-xl border border-[#dcb1b9]/15 bg-[#191417] px-4 py-2.5 text-xs font-semibold text-[#cbb9bd] transition hover:border-[#c58d98]/50 hover:text-[#f4e9e9]"
          >
            <ArrowLeft size={15} />
            Back to Home
          </Link>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <section className="mx-auto max-w-7xl px-5 pb-20 pt-9 sm:px-8 sm:pt-12">

        {/* BREADCRUMB */}
        <div className="mb-10 flex flex-wrap items-center gap-2 text-[11px] font-medium text-[#89777c]">
          <Link to="/" className="transition hover:text-[#d5a2aa]">
            Home
          </Link>

          <ChevronRight size={13} />

          <span className="text-[#c58d98]">Genres</span>

          <ChevronRight size={13} />

          <span className="text-[#e0cbd0]">
            {formattedGenre}
          </span>
        </div>

        {/* HERO */}
        <div className="relative overflow-hidden rounded-3xl border border-[#dcb1b9]/10 bg-[#191417] p-6 sm:p-10 lg:p-12">

          <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-[#c58d98]/[0.07] blur-3xl" />

          <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-[#c58d98]/[0.04] blur-3xl" />

          <div className="relative flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#c58d98]/20 bg-[#c58d98]/[0.08] text-[#c58d98]">
                <Compass size={22} />
              </div>

              <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.3em] text-[#c58d98]">
                Explore ABYSSORA
              </p>

              <h1 className="mt-3 font-display text-5xl font-semibold tracking-tight text-[#f4e9e9] sm:text-6xl lg:text-7xl">
                {formattedGenre}
                <span className="text-[#c58d98]"> Manga.</span>
              </h1>

              <p className="mt-5 max-w-xl text-sm leading-7 text-[#a9959a] sm:text-base">
                Discover incredible {formattedGenre.toLowerCase()} stories,
                unforgettable characters, and your next favourite adventure.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-4 rounded-2xl border border-[#dcb1b9]/10 bg-[#110e10]/60 px-5 py-4 backdrop-blur-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#c58d98]/20 bg-[#c58d98]/[0.08] text-[#c58d98]">
                <BookOpen size={20} />
              </div>

              <div>
                <p className="font-display text-3xl font-semibold text-[#f4e9e9]">
                  {genreManga.length}
                </p>

                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#89777c]">
                  Available titles
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* MANGA COLLECTION */}
        <div className="mt-12">
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#c58d98]">
                The collection
              </p>

              <h2 className="mt-2 font-display text-3xl font-semibold text-[#f4e9e9] sm:text-4xl">
                Explore stories
              </h2>

              <p className="mt-2 text-xs text-[#89777c]">
                Handpicked worlds waiting to be discovered.
              </p>
            </div>

            {genreManga.length > 0 && (
              <span className="shrink-0 rounded-lg border border-[#dcb1b9]/10 bg-[#191417] px-3 py-2 text-[10px] font-semibold text-[#b9a8ac]">
                {genreManga.length} titles
              </span>
            )}
          </div>

          {genreManga.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 xl:grid-cols-5">
              {genreManga.map((item) => (
                <Link
                  key={item.id}
                  to={`/manga/${item.id}`}
                  className="group min-w-0"
                >
                  {/* COVER */}
                  <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-[#dcb1b9]/10 bg-gradient-to-br from-stone-900 via-[#38272d] to-black transition duration-300 group-hover:-translate-y-1 group-hover:border-[#c58d98]/40">

                    {item.coverImage ? (
                      <img
                        src={item.coverImage}
                        alt={item.title}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                        onError={(event) => {
                          event.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="font-display text-7xl text-[#c58d98]/30">
                          {item.symbol || 'A'}
                        </span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />

                    {/* STATUS */}
                    <div className="absolute left-3 top-3 rounded-lg border border-white/10 bg-black/55 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[#e5c4ca] backdrop-blur-md">
                      {item.status || 'Ongoing'}
                    </div>

                    {/* RATING */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-[11px] font-bold text-[#e7c9a3]">
                      <Star size={13} fill="currentColor" />
                      {item.rating || 'N/A'}
                    </div>

                    <div className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white opacity-0 backdrop-blur-md transition group-hover:opacity-100">
                      <ArrowUpRight size={15} />
                    </div>
                  </div>

                  {/* DETAILS */}
                  <div className="mt-3">
                    <h2 className="truncate text-sm font-bold text-[#f0e4e6] transition group-hover:text-[#d5a2aa] sm:text-base">
                      {item.title}
                    </h2>

                    <p className="mt-1.5 truncate text-[10px] text-[#89777c]">
                      {item.chapter || `${item.chapters || 0} Chapters`}
                    </p>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="truncate text-[10px] text-[#b9a8ac]">
                        {item.genre || formattedGenre}
                      </span>

                      <ChevronRight
                        size={15}
                        className="shrink-0 text-[#75666a] transition group-hover:translate-x-1 group-hover:text-[#c58d98]"
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-[#dcb1b9]/10 bg-[#191417] px-6 py-20 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-[#c58d98]/20 bg-[#c58d98]/[0.07]">
                <BookOpen size={34} className="text-[#c58d98]" />
              </div>

              <h2 className="mt-7 font-display text-3xl font-semibold text-[#f4e9e9]">
                No stories found.
              </h2>

              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#a9959a]">
                We couldn't find any manga in this genre yet. Check out the full collection to discover something new.
              </p>

              <Link
                to="/"
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#c58d98] px-6 py-3 text-sm font-bold text-[#211619] transition hover:bg-[#d5a2aa]"
              >
                Explore all manga
                <ArrowUpRight size={16} />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#dcb1b9]/10 bg-[#0e0b0d] px-5 py-8 text-center">
        <div className="flex items-center justify-center gap-2">
          <Emblem size={22} />

          <span className="font-display text-sm font-semibold tracking-[0.2em] text-[#d9c5c9]">
            ABYSSORA
          </span>
        </div>

        <p className="mt-3 text-[10px] tracking-wider text-[#75666a]">
          © 2026 ABYSSORA · YOUR MANGA UNIVERSE
        </p>
      </footer>
    </main>
  )
}