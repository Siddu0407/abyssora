
import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Star,
  Compass,
} from 'lucide-react'

import { manga } from '../data/manga'

export default function Genre() {
  const { genreName } = useParams()

  const formattedGenre = genreName
    ? genreName.charAt(0).toUpperCase() + genreName.slice(1).toLowerCase()
    : ''

  const genreManga = useMemo(() => {
    return manga.filter((item) =>
      (item.genres || [item.genre]).some(
        (genre) => genre.toLowerCase() === formattedGenre.toLowerCase()
      )
    )
  }, [formattedGenre])

  return (
    <main className="min-h-screen bg-[#09090e] text-white">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#09090e]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-[0.18em] text-white">
              ABYSSORA
            </span>
          </Link>

          <Link
            to="/"
            className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:border-purple-500/40 hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 pb-16 pt-12 sm:px-8 sm:pt-16">
        <div className="mb-10">
          <div className="mb-5 flex items-center gap-2 text-sm text-gray-500">
            <Link to="/" className="transition hover:text-purple-400">
              Home
            </Link>
            <ChevronRight size={14} />
            <span className="text-purple-400">Genres</span>
            <ChevronRight size={14} />
            <span className="text-gray-300">{formattedGenre}</span>
          </div>

          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-purple-500/20 bg-purple-500/10 text-purple-400">
                <Compass size={23} />
              </div>

              <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-purple-400">
                Explore ABYSSORA
              </p>

              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                {formattedGenre}
                <span className="text-purple-500"> Manga</span>
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-7 text-gray-400 sm:text-base">
                Discover incredible {formattedGenre.toLowerCase()} stories,
                unforgettable characters, and your next favourite adventure.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
              <BookOpen className="text-purple-400" size={21} />
              <div>
                <p className="text-xl font-bold">{genreManga.length}</p>
                <p className="text-xs text-gray-500">Available titles</p>
              </div>
            </div>
          </div>
        </div>

        {genreManga.length > 0 ? (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {genreManga.map((item) => (
              <Link
                key={item.id}
                to={`/manga/${item.id}`}
                className="group min-w-0"
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-purple-950 via-[#171322] to-[#09090e]">
                  {item.coverImage ? (
                    <img
                      src={item.coverImage}
                      alt={item.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      onError={(event) => {
                        event.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <span className="text-7xl font-black text-purple-300/20">
                        {item.symbol || 'A'}
                      </span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />

                  <div className="absolute left-3 top-3 rounded-lg border border-white/10 bg-black/60 px-2.5 py-1 text-[10px] font-bold text-purple-300 backdrop-blur-md">
                    {item.status || 'Ongoing'}
                  </div>

                  <div className="absolute bottom-3 left-3 flex items-center gap-1 text-xs font-semibold text-yellow-400">
                    <Star size={13} fill="currentColor" />
                    {item.rating}
                  </div>
                </div>

                <div className="mt-3">
                  <h2 className="truncate text-sm font-bold text-white transition group-hover:text-purple-400 sm:text-base">
                    {item.title}
                  </h2>

                  <p className="mt-1 text-xs text-gray-500">
                    {item.chapter || `${item.chapters} Chapters`}
                  </p>

                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[11px] text-gray-400">
                      {item.genre}
                    </span>
                    <ChevronRight
                      size={15}
                      className="text-gray-600 transition group-hover:translate-x-1 group-hover:text-purple-400"
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-20 text-center">
            <BookOpen className="mx-auto mb-5 text-gray-600" size={40} />

            <h2 className="text-xl font-bold">No manga found</h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              We couldn't find any manga in this genre yet.
            </p>

            <Link
              to="/"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold transition hover:bg-purple-500"
            >
              Explore all manga
              <ChevronRight size={16} />
            </Link>
          </div>
        )}
      </section>
    </main>
  )
}
