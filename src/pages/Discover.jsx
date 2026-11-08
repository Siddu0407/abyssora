
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  Compass,
  Sparkles,
  Flame,
  Heart,
  BookOpen,
  Clock3,
  ArrowUpRight,
  ChevronRight,
  X,
  SlidersHorizontal,
  Library,
  Home,
  Menu,
  LoaderCircle,
  AlertCircle,
} from 'lucide-react'

import { supabase } from '../lib/supabase'

const BASE_GENRES = [
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Fantasy',
  'Horror',
  'Magic',
  'Mystery',
  'Romance',
  'Sci-Fi',
  'Slice of Life',
  'Sports',
  'Supernatural',
  'Thriller',
]

function getComicGenres(item) {
  const values = []

  const addGenres = (value) => {
    if (Array.isArray(value)) {
      value.forEach(addGenres)
      return
    }

    if (typeof value === 'string') {
      values.push(...value.split(/[,;|]/))
    }
  }

  addGenres(item.genres)
  addGenres(item.genre)

  const unique = new Map()

  values.forEach((value) => {
    const genre = value.trim()
    const key = genre.toLowerCase()

    if (genre && !unique.has(key)) {
      unique.set(key, genre)
    }
  })

  return [...unique.values()]
}

function Brand() {
  return (
    <Link to="/" className="group flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#c69aa1]/30 bg-[#211a1e]">
        <img
          src="/abyssora-mark.svg"
          alt="ABYSSORA"
          className="h-9 w-9 object-contain"
        />
      </div>

      <div className="leading-none">
        <div className="font-display text-[25px] font-semibold tracking-[0.15em] text-[#f1e7e8]">
          ABYSSORA
        </div>
        <div className="mt-1.5 text-[8px] font-semibold tracking-[0.32em] text-[#a88b91]">
          WORLDS BEYOND STORIES
        </div>
      </div>
    </Link>
  )
}

function ComicCard({ comic }) {
  const [imageFailed, setImageFailed] = useState(false)

  const genres = getComicGenres(comic)

  return (
    <article className="group min-w-0">
      <Link
        to={`/manga/${comic.id}`}
        className="relative block aspect-[3/4] overflow-hidden rounded-xl border border-[#c69aa1]/15 bg-[#211a1e] transition duration-300 group-hover:-translate-y-1 group-hover:border-[#c69aa1]/50 group-hover:shadow-xl group-hover:shadow-black/30"
      >
        {comic.cover_image && !imageFailed ? (
          <img
            src={comic.cover_image}
            alt={`${comic.title} cover`}
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#49343f] via-[#211a1e] to-[#110e10]">
            <Sparkles size={38} className="text-[#c69aa1]/50" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#0c090b] via-transparent to-black/10" />

        {String(comic.status || '').toLowerCase() === 'completed' && (
          <span className="absolute left-2 top-2 rounded-md bg-[#657e6c]/90 px-2 py-1 text-[9px] font-bold text-white">
            COMPLETED
          </span>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="line-clamp-2 text-sm font-bold leading-snug text-white">
            {comic.title}
          </h3>

          <p className="mt-1 text-[10px] text-white/65">
            {comic.chapter || `Chapter ${comic.chapters ?? 0}`}
          </p>
        </div>
      </Link>

      <p className="mt-2 truncate text-xs text-[#95858a]">
        {genres.join(' · ') || 'Manga'}
      </p>

      {comic.author && (
        <p className="mt-1 truncate text-[10px] text-[#76676c]">
          By {comic.author}
        </p>
      )}
    </article>
  )
}

export default function Discover() {
  const [comics, setComics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [activeGenre, setActiveGenre] = useState('All')
  const [sortBy, setSortBy] = useState('latest')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    let mounted = true

    async function loadComics() {
      setLoading(true)
      setError('')

      const { data, error: fetchError } = await supabase
        .from('comics')
        .select('*')
        .order('created_at', { ascending: false })

      if (!mounted) return

      if (fetchError) {
        console.error('Could not load Discover comics:', fetchError.message)
        setError(fetchError.message)
        setLoading(false)
        return
      }

      setComics(data || [])
      setLoading(false)
    }

    loadComics()

    return () => {
      mounted = false
    }
  }, [])

  const availableGenres = useMemo(() => {
    const discovered = comics.flatMap(getComicGenres)

    const unique = new Map()

    ;[...BASE_GENRES, ...discovered].forEach((genre) => {
      const key = genre.toLowerCase()
      if (!unique.has(key)) unique.set(key, genre)
    })

    return [...unique.values()]
  }, [comics])

  const filteredComics = useMemo(() => {
    const term = search.trim().toLowerCase()

    const results = comics.filter((comic) => {
      const genres = getComicGenres(comic)

      const matchesSearch =
        !term ||
        String(comic.title || '').toLowerCase().includes(term) ||
        String(comic.author || '').toLowerCase().includes(term) ||
        genres.some((genre) => genre.toLowerCase().includes(term))

      const matchesGenre =
        activeGenre === 'All' ||
        genres.some(
          (genre) => genre.toLowerCase() === activeGenre.toLowerCase()
        )

      return matchesSearch && matchesGenre
    })

    return [...results].sort((a, b) => {
      if (sortBy === 'title') {
        return String(a.title || '').localeCompare(String(b.title || ''))
      }

      if (sortBy === 'rating') {
        return Number(b.rating || 0) - Number(a.rating || 0)
      }

      return (
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime()
      )
    })
  }, [comics, search, activeGenre, sortBy])

  const latestComics = useMemo(() => {
    return [...comics]
      .sort(
        (a, b) =>
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
      )
      .slice(0, 6)
  }, [comics])

  const clearFilters = () => {
    setSearch('')
    setActiveGenre('All')
    setSortBy('latest')
  }

  return (
    <div className="min-h-screen bg-[#110e10] text-[#f1e7e8]">

      {/* NAVIGATION */}
      <header className="sticky top-0 z-50 border-b border-[#c69aa1]/10 bg-[#110e10]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-5 py-3.5 lg:px-10">
          <Brand />

          <nav className="hidden items-center gap-7 text-[13px] font-medium md:flex">
            <Link to="/" className="flex items-center gap-2 text-[#a9959b] transition hover:text-[#dfb9bf]">
              <Home size={15} /> Home
            </Link>

            <Link to="/discover" className="flex items-center gap-2 text-[#f1e7e8]">
              <Compass size={15} /> Discover
            </Link>

            <Link to="/library" className="flex items-center gap-2 text-[#a9959b] transition hover:text-[#dfb9bf]">
              <Library size={15} /> My Library
            </Link>
          </nav>

          <div className="hidden items-center gap-2 sm:flex">
            <Link
              to="/login"
              className="rounded-xl border border-[#c69aa1]/20 px-4 py-2 text-xs font-semibold text-[#e4d5d8] transition hover:border-[#c69aa1]/60"
            >
              Sign in
            </Link>

            <Link
              to="/register"
              className="rounded-xl bg-[#c69aa1] px-4 py-2 text-xs font-bold text-[#211619] transition hover:bg-[#dfb9bf]"
            >
              Register
            </Link>
          </div>

          <button
            onClick={() => setMenuOpen((current) => !current)}
            className="rounded-xl border border-[#c69aa1]/20 p-2 text-[#dfb9bf] md:hidden"
            aria-label="Toggle navigation"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-[#c69aa1]/10 bg-[#191417] p-5 md:hidden">
            <div className="flex flex-col gap-4 text-sm text-[#c8b9bd]">
              <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>
              <Link to="/discover" onClick={() => setMenuOpen(false)}>Discover</Link>
              <Link to="/library" onClick={() => setMenuOpen(false)}>My Library</Link>
              <Link to="/login" onClick={() => setMenuOpen(false)}>Sign in</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)}>Register</Link>
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-[1440px] px-5 pb-24 lg:px-10">

        {/* HERO */}
        <section className="relative mt-7 overflow-hidden rounded-[26px] border border-[#c69aa1]/20 bg-[#191417] px-6 py-14 sm:px-10 md:py-20 lg:px-16">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_20%,rgba(198,154,161,0.17),transparent_50%)]" />

          <div className="relative max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#c69aa1]/30 bg-[#c69aa1]/10 px-4 py-2 text-[9px] font-bold uppercase tracking-[0.24em] text-[#dfb9bf]">
              <Sparkles size={13} />
              The world of stories awaits
            </div>

            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-[#f1e7e8] sm:text-6xl">
              Find your next
              <span className="block font-serif italic text-[#c69aa1]">
                obsession.
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-7 text-[#ad9da1] sm:text-base">
              From unforgettable adventures to heartwarming romance,
              explore stories from every genre and discover your next
              favourite world.
            </p>

            <a
              href="#explore"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#c69aa1] px-6 py-3.5 text-sm font-bold text-[#211619] transition hover:-translate-y-0.5 hover:bg-[#dfb9bf]"
            >
              Start exploring <ArrowUpRight size={16} />
            </a>
          </div>
        </section>

        {/* GENRES */}
        <section className="mt-14">
          <div className="mb-6">
            <p className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[#c69aa1]">
              <Compass size={14} /> Explore your interests
            </p>

            <h2 className="text-2xl font-semibold sm:text-3xl">
              Stories for every mood
            </h2>

            <p className="mt-2 text-sm text-[#99898e]">
              Pick a genre and discover something new.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveGenre('All')}
              className={`rounded-full border px-4 py-2.5 text-xs font-semibold transition ${
                activeGenre === 'All'
                  ? 'border-[#c69aa1] bg-[#c69aa1] text-[#211619]'
                  : 'border-[#c69aa1]/15 bg-[#191417] text-[#ad9da1] hover:border-[#c69aa1]/50 hover:text-white'
              }`}
            >
              All stories
            </button>

            {availableGenres.map((genre) => (
              <button
                key={genre}
                onClick={() => {
                  setActiveGenre(genre)
                  document.getElementById('explore')?.scrollIntoView({
                    behavior: 'smooth',
                  })
                }}
                className={`rounded-full border px-4 py-2.5 text-xs font-semibold transition ${
                  activeGenre === genre
                    ? 'border-[#c69aa1] bg-[#c69aa1] text-[#211619]'
                    : 'border-[#c69aa1]/15 bg-[#191417] text-[#ad9da1] hover:border-[#c69aa1]/50 hover:text-white'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </section>

        {/* RECENTLY ADDED */}
        <section className="mt-16">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[#c69aa1]">
                <Clock3 size={14} /> Fresh arrivals
              </p>

              <h2 className="text-2xl font-semibold sm:text-3xl">
                Recently added
              </h2>

              <p className="mt-2 text-sm text-[#99898e]">
                Discover the newest stories in ABYSSORA.
              </p>
            </div>

            <a
              href="#explore"
              className="flex items-center gap-1 text-xs font-semibold text-[#c69aa1] transition hover:text-[#dfb9bf]"
            >
              View all <ChevronRight size={15} />
            </a>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-[#c69aa1]/10 bg-[#191417] p-12 text-sm text-[#95858a]">
              <LoaderCircle size={18} className="animate-spin" />
              Discovering stories...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-8 text-center">
              <AlertCircle size={25} className="mx-auto text-red-300" />
              <p className="mt-3 font-semibold text-red-300">
                Unable to load stories
              </p>
              <p className="mt-2 break-words text-sm text-[#ad9da1]">
                {error}
              </p>
            </div>
          ) : latestComics.length === 0 ? (
            <div className="rounded-2xl border border-[#c69aa1]/10 bg-[#191417] p-10 text-center">
              <BookOpen size={30} className="mx-auto text-[#c69aa1]" />
              <p className="mt-4 font-semibold">Your next story is waiting.</p>
              <p className="mt-2 text-sm text-[#95858a]">
                New comics will appear here when they are added.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {latestComics.map((comic) => (
                <ComicCard key={comic.id} comic={comic} />
              ))}
            </div>
          )}
        </section>

        {/* EXPLORE ALL */}
        <section id="explore" className="mt-16 scroll-mt-28">
          <div className="mb-7">
            <p className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[#c69aa1]">
              <Flame size={14} /> Your next read
            </p>

            <h2 className="text-2xl font-semibold sm:text-3xl">
              Explore all stories
            </h2>

            <p className="mt-2 text-sm text-[#99898e]">
              Search by title, creator or genre.
            </p>
          </div>

          <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="flex items-center gap-3 rounded-xl border border-[#c69aa1]/15 bg-[#191417] px-4 py-3 focus-within:border-[#c69aa1]/50">
              <Search size={18} className="shrink-0 text-[#89777c]" />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search manga, author or genre..."
                className="w-full bg-transparent text-sm text-[#f1e7e8] outline-none placeholder:text-[#76676c]"
              />

              {search && (
                <button
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                >
                  <X size={16} className="text-[#89777c]" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-[#c69aa1]/15 bg-[#191417] px-4 py-3">
              <SlidersHorizontal size={16} className="text-[#c69aa1]" />

              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                aria-label="Sort stories"
                className="w-full bg-transparent text-sm text-[#c8b9bd] outline-none sm:w-40"
              >
                <option value="latest" className="bg-[#191417]">
                  Recently added
                </option>
                <option value="title" className="bg-[#191417]">
                  Title: A–Z
                </option>
                <option value="rating" className="bg-[#191417]">
                  Highest rated
                </option>
              </select>
            </div>
          </div>

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#c69aa1]/10 pb-4">
            <p className="text-xs text-[#95858a]">
              Showing{' '}
              <span className="font-bold text-white">
                {filteredComics.length}
              </span>{' '}
              of{' '}
              <span className="font-bold text-white">{comics.length}</span>{' '}
              stories
            </p>

            {(search || activeGenre !== 'All') && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 text-xs font-semibold text-[#c69aa1] hover:text-[#dfb9bf]"
              >
                <X size={13} /> Clear filters
              </button>
            )}
          </div>

          {loading ? (
            <div className="rounded-2xl border border-[#c69aa1]/10 bg-[#191417] p-12 text-center text-sm text-[#95858a]">
              Loading your library...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-8 text-center text-sm text-red-300">
              Could not load your library. Please refresh and try again.
            </div>
          ) : filteredComics.length === 0 ? (
            <div className="rounded-2xl border border-[#c69aa1]/10 bg-[#191417] p-12 text-center">
              <Search size={28} className="mx-auto text-[#76676c]" />
              <p className="mt-4 font-semibold">No stories found.</p>
              <p className="mt-2 text-sm text-[#89777c]">
                Try another search or choose a different genre.
              </p>

              <button
                onClick={clearFilters}
                className="mt-5 rounded-xl bg-[#c69aa1] px-5 py-2.5 text-sm font-bold text-[#211619]"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {filteredComics.map((comic) => (
                <ComicCard key={comic.id} comic={comic} />
              ))}
            </div>
          )}
        </section>

        {/* CLOSING BANNER */}
        <section className="relative mt-20 overflow-hidden rounded-2xl border border-[#c69aa1]/15 bg-[#191417] px-7 py-12 text-center sm:py-16">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(198,154,161,0.09),transparent_65%)]" />

          <div className="relative">
            <img
              src="/abyssora-mark.svg"
              alt=""
              className="mx-auto h-12 w-12 object-contain"
            />

            <p className="mt-4 text-[9px] font-bold uppercase tracking-[0.3em] text-[#c69aa1]">
              ABYSSORA
            </p>

            <h2 className="mt-3 font-serif text-3xl italic text-[#f1e7e8] sm:text-4xl">
              There is always another world.
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#99898e]">
              Your next favourite story might be one chapter away.
            </p>

            <Link
              to="/"
              className="mt-7 inline-flex items-center gap-2 rounded-xl border border-[#c69aa1]/30 px-5 py-3 text-xs font-bold text-[#dfb9bf] transition hover:bg-[#c69aa1]/10"
            >
              Back to home <ArrowUpRight size={15} />
            </Link>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="mt-16 border-t border-[#c69aa1]/10 bg-[#0d0a0c]">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-5 px-5 py-9 sm:flex-row lg:px-10">
          <Brand />

          <p className="text-center text-[10px] tracking-wide text-[#76676c]">
            © 2026 ABYSSORA. Built for story lovers.
          </p>
        </div>
      </footer>
    </div>
  )
}
