
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  Bookmark,
  Menu,
  X,
  ChevronRight,
  Flame,
  Clock3,
  Compass,
  Home as HomeIcon,
  Sparkles,
  ArrowUpRight,
  Heart,
  Star,
  BookOpen,
  UserRound,
  LogOut,
  Play,
  Library as LibraryIcon,
  ArrowDownUp,
  SlidersHorizontal,
} from 'lucide-react'

import { manga } from '../data/manga'
import { supabase } from '../lib/supabase'

const genres = ['All', 'Action', 'Fantasy', 'Magic', 'Adventure', 'Drama']

const genreDiscoveries = [
  {
    name: 'Action',
    description: 'Epic battles, powerful heroes and nonstop thrills.',
    icon: Flame,
    gradient: 'from-red-500/25 via-orange-500/10 to-transparent',
    iconColor: 'text-orange-300',
    glow: 'group-hover:shadow-orange-950/30',
  },
  {
    name: 'Fantasy',
    description: 'Enter magical kingdoms and extraordinary worlds.',
    icon: Sparkles,
    gradient: 'from-violet-500/30 via-purple-500/10 to-transparent',
    iconColor: 'text-violet-300',
    glow: 'group-hover:shadow-purple-950/30',
  },
  {
    name: 'Magic',
    description: 'Discover spells, sorcery and mysterious powers.',
    icon: Star,
    gradient: 'from-blue-500/25 via-indigo-500/10 to-transparent',
    iconColor: 'text-blue-300',
    glow: 'group-hover:shadow-blue-950/30',
  },
  {
    name: 'Adventure',
    description: 'Uncover secrets and explore the unknown.',
    icon: Compass,
    gradient: 'from-emerald-500/25 via-teal-500/10 to-transparent',
    iconColor: 'text-emerald-300',
    glow: 'group-hover:shadow-emerald-950/30',
  },
  {
    name: 'Drama',
    description: 'Emotional journeys and unforgettable characters.',
    icon: Heart,
    gradient: 'from-pink-500/25 via-fuchsia-500/10 to-transparent',
    iconColor: 'text-pink-300',
    glow: 'group-hover:shadow-pink-950/30',
  },
]

function MangaCard({ item, index, bookmarks, toggleBookmark }) {
  const [imageFailed, setImageFailed] = useState(false)

  return (
    <article className="group min-w-0">
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-white/10 bg-[#171322] shadow-lg shadow-black/20 transition duration-300 group-hover:-translate-y-1 group-hover:border-purple-400/50 group-hover:shadow-purple-950/40">
        <Link
          to={`/manga/${item.id}`}
          className="absolute inset-0 z-10"
          aria-label={`View ${item.title}`}
        />

        {!imageFailed && item.coverImage ? (
          <img
            src={item.coverImage}
            alt={`${item.title} cover artwork`}
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-110"
          />
        ) : (
          <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${item.colors}`}>
            <span className="text-7xl text-white/70 transition duration-500 group-hover:scale-125">
              {item.symbol}
            </span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-black/20" />

        {index !== undefined && (
          <span className="absolute left-2 top-2 z-20 rounded-md border border-white/10 bg-black/60 px-2 py-1 text-[9px] font-bold tracking-wider backdrop-blur-md">
            #{index + 1} TRENDING
          </span>
        )}

        {item.status === 'Completed' && (
          <span className="absolute left-2 top-2 z-20 rounded-md bg-emerald-600/90 px-2 py-1 text-[9px] font-bold">
            COMPLETED
          </span>
        )}

        <button
          onClick={() => toggleBookmark(item.id)}
          aria-label={`Bookmark ${item.title}`}
          aria-pressed={bookmarks.includes(item.id)}
          className="absolute right-2 top-2 z-30 rounded-lg border border-white/10 bg-black/60 p-2 text-white backdrop-blur-md transition hover:bg-purple-600"
        >
          <Bookmark
            size={15}
            fill={bookmarks.includes(item.id) ? 'currentColor' : 'none'}
            className={bookmarks.includes(item.id) ? 'text-purple-300' : 'text-white'}
          />
        </button>

        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 p-3">
          <div className="mb-1 flex items-center gap-1 text-[10px] font-bold text-yellow-300">
            <Star size={12} fill="currentColor" />
            {item.rating}
          </div>

          <h3 className="line-clamp-2 text-sm font-extrabold leading-snug">
            {item.title}
          </h3>

          <p className="mt-1 text-[10px] text-gray-300">
            {item.chapter}
          </p>
        </div>
      </div>

      <p className="mt-2 text-xs text-gray-500">
        {item.genre}
      </p>
    </article>
  )
}

export default function Home() {
  const [search, setSearch] = useState('')
  const [activeGenre, setActiveGenre] = useState('All')
  const [sortBy, setSortBy] = useState('rating')
  const [bookmarks, setBookmarks] = useState([])
  const [readingHistory, setReadingHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    let mounted = true

    const getCurrentSession = async () => {
      const { data, error } = await supabase.auth.getSession()

      if (!error && mounted) {
        setUser(data.session?.user ?? null)
      }
    }

    getCurrentSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    let mounted = true

    const loadBookmarks = async () => {
      if (!user) {
        setBookmarks([])
        return
      }

      const { data, error } = await supabase
        .from('bookmarks')
        .select('manga_id')
        .eq('user_id', user.id)

      if (error) {
        console.error('Could not load bookmarks:', error.message)
        return
      }

      if (mounted) {
        setBookmarks(data.map((item) => item.manga_id))
      }
    }

    loadBookmarks()

    return () => {
      mounted = false
    }
  }, [user])

  useEffect(() => {
    let mounted = true

    const loadReadingHistory = async () => {
      if (!user) {
        setReadingHistory([])
        setLoadingHistory(false)
        return
      }

      setLoadingHistory(true)

      const { data, error } = await supabase
        .from('reading_history')
        .select('manga_id, chapter_number, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Could not load reading history:', error.message)

        if (mounted) {
          setLoadingHistory(false)
        }

        return
      }

      if (mounted) {
        const history = data
          .map((entry) => {
            const story = manga.find(
              (item) => item.id === entry.manga_id
            )

            if (!story) return null

            return {
              ...story,
              lastReadChapter: entry.chapter_number,
              lastReadAt: entry.updated_at,
            }
          })
          .filter(Boolean)

        setReadingHistory(history)
        setLoadingHistory(false)
      }
    }

    loadReadingHistory()

    return () => {
      mounted = false
    }
  }, [user])

  const handleLogout = async () => {
    setLoggingOut(true)

    const { error } = await supabase.auth.signOut()

    setLoggingOut(false)

    if (error) {
      alert(error.message)
      return
    }

    setMenuOpen(false)
    setUser(null)
  }

  const username =
    user?.user_metadata?.username ||
    user?.email?.split('@')[0] ||
    'Reader'

  const toggleBookmark = async (id) => {
    if (!user) {
      alert('Please sign in to save your favourite manga.')
      return
    }

    const alreadyBookmarked = bookmarks.includes(id)

    if (alreadyBookmarked) {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('manga_id', id)

      if (error) {
        alert(`Could not remove bookmark: ${error.message}`)
        return
      }

      setBookmarks((current) =>
        current.filter((item) => item !== id)
      )
    } else {
      const { error } = await supabase
        .from('bookmarks')
        .insert({
          user_id: user.id,
          manga_id: id,
        })

      if (error) {
        alert(`Could not save bookmark: ${error.message}`)
        return
      }

      setBookmarks((current) =>
        current.includes(id) ? current : [...current, id]
      )
    }
  }

  const filteredManga = useMemo(() => {
    const searchTerm = search.trim().toLowerCase()

    const results = manga.filter((item) => {
      const itemGenres = item.genres || [item.genre]

      const matchesSearch =
        item.title.toLowerCase().includes(searchTerm) ||
        item.genre.toLowerCase().includes(searchTerm) ||
        itemGenres.some((genre) =>
          genre.toLowerCase().includes(searchTerm)
        )

      const matchesGenre =
        activeGenre === 'All' || itemGenres.includes(activeGenre)

      return matchesSearch && matchesGenre
    })

    return [...results].sort((a, b) => {
      if (sortBy === 'rating') {
        return Number(b.rating) - Number(a.rating)
      }

      if (sortBy === 'title') {
        return a.title.localeCompare(b.title)
      }

      if (sortBy === 'latest') {
        return (
          Number(b.year) - Number(a.year) ||
          Number(b.chapters) - Number(a.chapters)
        )
      }

      return 0
    })
  }, [search, activeGenre, sortBy])

  const clearFilters = () => {
    setSearch('')
    setActiveGenre('All')
    setSortBy('rating')
  }

  const hasActiveFilters =
    search.trim() !== '' || activeGenre !== 'All'

  return (
    <div className="min-h-screen overflow-hidden bg-[#09090e] text-white">

      {/* NAVIGATION */}
      <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#09090e]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-5 px-5 py-4 lg:px-10">

          <Link to="/" className="flex shrink-0 items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-violet-800 shadow-lg shadow-purple-900/30">
              <Sparkles size={22} />
            </div>

            <span className="text-xl font-black tracking-[0.12em]">
              ABYSS<span className="text-purple-400">ORA</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-gray-400 md:flex">
            <Link to="/" className="flex items-center gap-2 text-white transition hover:text-purple-300">
              <HomeIcon size={16} />
              Home
            </Link>

            <a href="#trending" className="flex items-center gap-2 transition hover:text-purple-400">
              <Flame size={16} />
              Trending
            </a>

            <a href="#latest" className="flex items-center gap-2 transition hover:text-purple-400">
              <Clock3 size={16} />
              Latest
            </a>

            <a href="#explore" className="flex items-center gap-2 transition hover:text-purple-400">
              <Compass size={16} />
              Explore
            </a>

            {user && (
              <Link
                to="/library"
                className="flex items-center gap-2 text-purple-300 transition hover:text-purple-200"
              >
                <LibraryIcon size={16} />
                My Library
              </Link>
            )}
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 transition focus-within:border-purple-500/60">
              <Search size={17} className="text-gray-500" />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    document.getElementById('explore')?.scrollIntoView({
                      behavior: 'smooth',
                    })
                  }
                }}
                placeholder="Search stories..."
                className="w-36 bg-transparent text-sm outline-none placeholder:text-gray-600 lg:w-48"
              />

              {search && (
                <button
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                  className="text-gray-500 transition hover:text-white"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {user ? (
              <>
                <Link
                  to="/library"
                  title="Open your library"
                  className="flex items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-sm font-semibold text-purple-200 transition hover:border-purple-400 hover:bg-purple-500/20"
                >
                  <LibraryIcon size={17} />
                  Library
                </Link>

                <Link
                  to="/profile"
                  title="Open your profile"
                  className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 transition hover:border-purple-400 hover:bg-purple-500/10"
                >
                  <UserRound size={17} className="text-purple-300" />
                  <span className="max-w-28 truncate text-sm font-semibold text-purple-200">
                    {username}
                  </span>
                </Link>

                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold transition hover:border-red-500/50 hover:text-red-300 disabled:opacity-50"
                >
                  <LogOut size={16} />
                  {loggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold transition hover:border-purple-500 hover:text-purple-300"
                >
                  Sign in
                </Link>

                <Link
                  to="/register"
                  className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-bold transition hover:bg-purple-500"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-lg border border-white/10 p-2 transition hover:bg-white/10 md:hidden"
            aria-label="Toggle navigation"
          >
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>

        {/* MOBILE MENU */}
        {menuOpen && (
          <div className="border-t border-white/10 bg-[#111019] p-5 md:hidden">

            <div className="mb-4 flex items-center gap-2 rounded-xl border border-white/10 px-3 py-3">
              <Search size={18} className="text-gray-500" />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search stories..."
                className="w-full bg-transparent text-sm outline-none"
              />

              {search && (
                <button onClick={() => setSearch('')} aria-label="Clear search">
                  <X size={16} />
                </button>
              )}
            </div>

            <Link
              to="/"
              onClick={() => setMenuOpen(false)}
              className="block border-b border-white/[0.06] py-3 text-gray-300 transition hover:text-purple-300"
            >
              Home
            </Link>

            <a
              href="#trending"
              onClick={() => setMenuOpen(false)}
              className="block border-b border-white/[0.06] py-3 text-gray-300 transition hover:text-purple-300"
            >
              Trending
            </a>

            <a
              href="#latest"
              onClick={() => setMenuOpen(false)}
              className="block border-b border-white/[0.06] py-3 text-gray-300 transition hover:text-purple-300"
            >
              Latest
            </a>

            <a
              href="#explore"
              onClick={() => setMenuOpen(false)}
              className="block border-b border-white/[0.06] py-3 text-gray-300 transition hover:text-purple-300"
            >
              Explore
            </a>

            {user ? (
              <div className="mt-4">
                <Link
                  to="/library"
                  onClick={() => setMenuOpen(false)}
                  className="mb-3 flex items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-3 text-purple-200 transition hover:bg-purple-500/20"
                >
                  <LibraryIcon size={18} />
                  <span className="text-sm font-semibold">My Library</span>
                  <span className="ml-auto text-xs text-purple-400">
                    Open library
                  </span>
                </Link>

                <Link
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="mb-3 flex items-center gap-2 rounded-xl border border-white/10 px-3 py-3 text-gray-300 transition hover:border-purple-500/40 hover:text-purple-200"
                >
                  <UserRound size={18} />
                  <span className="truncate text-sm font-semibold">
                    {username}
                  </span>
                  <span className="ml-auto text-xs text-gray-500">
                    View profile
                  </span>
                </Link>

                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 px-4 py-3 text-sm font-semibold text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                >
                  <LogOut size={17} />
                  {loggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl border border-white/10 px-4 py-3 text-center text-sm font-semibold hover:border-purple-500"
                >
                  Sign in
                </Link>

                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl bg-purple-600 px-4 py-3 text-center text-sm font-bold hover:bg-purple-500"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      <main className="mx-auto max-w-[1440px] px-5 pb-20 lg:px-10">

        {/* HERO */}
        <section className="relative mt-8 overflow-hidden rounded-[28px] border border-purple-500/20 bg-gradient-to-br from-[#251345] via-[#171127] to-[#0e0d15] px-7 py-14 shadow-2xl shadow-purple-950/10 md:px-14 md:py-20">

          <div className="pointer-events-none absolute -right-20 -top-32 h-96 w-96 rounded-full bg-purple-600/20 blur-[100px]" />
          <div className="pointer-events-none absolute -bottom-40 right-1/4 h-80 w-80 rounded-full bg-fuchsia-600/10 blur-[100px]" />

          <div className="relative z-10 max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-400/30 bg-purple-400/10 px-4 py-2 text-xs font-semibold tracking-wider text-purple-300">
              <Sparkles size={14} />
              YOUR NEXT OBSESSION STARTS HERE
            </div>

            <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-6xl lg:text-7xl">
              Escape into
              <br />
              <span className="bg-gradient-to-r from-purple-300 via-fuchsia-400 to-purple-500 bg-clip-text text-transparent">
                endless stories.
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-base leading-7 text-gray-400 md:text-lg">
              Discover incredible worlds, unforgettable characters
              and stories worth staying up for.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <a
                href="#explore"
                className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-3.5 text-sm font-bold shadow-lg shadow-purple-950/30 transition hover:-translate-y-1 hover:bg-purple-500"
              >
                Explore library
                <ArrowUpRight size={17} />
              </a>

              <a
                href="#trending"
                className="rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-semibold transition hover:bg-white/10"
              >
                Discover trending
              </a>
            </div>
          </div>

          <div className="pointer-events-none absolute bottom-0 right-8 hidden h-full w-1/3 items-center justify-center md:flex">
            <div className="flex h-64 w-64 rotate-12 items-center justify-center rounded-full border border-purple-400/20 bg-purple-500/[0.06] text-8xl text-purple-300/70 shadow-2xl shadow-purple-900/20">
              ✧
            </div>
          </div>
        </section>

        {/* CONTINUE READING */}
        {user && (loadingHistory || readingHistory.length > 0) && (
          <section className="mt-12">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-purple-400">
                  <BookOpen size={15} />
                  Pick up where you left off
                </div>

                <h2 className="text-2xl font-extrabold sm:text-3xl">
                  Continue reading
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  Your latest reading progress, saved automatically.
                </p>
              </div>

              <Link
                to="/library"
                className="hidden items-center gap-2 text-sm font-semibold text-purple-300 transition hover:text-purple-200 sm:flex"
              >
                View all
                <ChevronRight size={16} />
              </Link>
            </div>

            {loadingHistory ? (
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 text-center text-sm text-gray-500">
                Loading your reading history...
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {readingHistory.map((item) => (
                  <article
                    key={item.id}
                    className="group flex min-w-0 gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 transition hover:border-purple-500/40 hover:bg-purple-500/[0.04]"
                  >
                    <Link
                      to={`/manga/${item.id}`}
                      className={`relative flex h-32 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br ${item.colors}`}
                    >
                      {item.coverImage ? (
                        <img
                          src={item.coverImage}
                          alt={`${item.title} cover`}
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-4xl text-white/70">
                          {item.symbol}
                        </span>
                      )}
                    </Link>

                    <div className="flex min-w-0 flex-1 flex-col justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                          {item.genre}
                        </p>

                        <Link
                          to={`/manga/${item.id}`}
                          className="mt-1 line-clamp-2 text-sm font-bold transition group-hover:text-purple-300"
                        >
                          {item.title}
                        </Link>

                        <p className="mt-2 text-xs text-gray-400">
                          Last read: Chapter {item.lastReadChapter}
                        </p>
                      </div>

                      <Link
                        to={`/manga/${item.id}/chapter/${item.lastReadChapter}`}
                        className="mt-3 inline-flex w-fit items-center gap-2 rounded-lg bg-purple-600 px-3 py-2 text-xs font-bold transition hover:bg-purple-500"
                      >
                        <Play size={13} fill="currentColor" />
                        Continue
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* FEATURE STRIP */}
        <section className="my-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            [Compass, 'Discover', 'New worlds'],
            [Sparkles, 'Explore', 'Every genre'],
            [Heart, 'Save', 'Your favourites'],
            [BookOpen, 'Enjoy', 'Your next read'],
          ].map(([Icon, heading, sub]) => (
            <div
              key={heading}
              className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 transition hover:border-purple-500/30 hover:bg-purple-500/[0.04]"
            >
              <Icon size={19} className="mb-3 text-purple-400" />
              <p className="font-bold text-white">{heading}</p>
              <p className="mt-1 text-xs text-gray-500">{sub}</p>
            </div>
          ))}
        </section>

        {/* GENRE DISCOVERY */}
        <section id="genres" className="mt-16 scroll-mt-28">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-purple-400">
                <Sparkles size={15} />
                Find your favourite world
              </div>

              <h2 className="text-2xl font-extrabold sm:text-3xl">
                Explore by genre
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Pick a genre and discover your next obsession.
              </p>
            </div>

            <Link
              to="/"
              onClick={() => {
                setActiveGenre('All')
                setSearch('')
              }}
              className="flex items-center gap-1 text-sm font-semibold text-purple-300 transition hover:text-purple-200"
            >
              View all manga
              <ArrowUpRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {genreDiscoveries.map((genre) => {
              const Icon = genre.icon

              const count = manga.filter((item) =>
                (item.genres || [item.genre]).some(
                  (itemGenre) =>
                    itemGenre.toLowerCase() === genre.name.toLowerCase()
                )
              ).length

              return (
                <Link
                  key={genre.name}
                  to={`/genre/${genre.name.toLowerCase()}`}
                  className={`group relative min-h-48 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111019] p-5 shadow-lg shadow-black/10 transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-2xl ${genre.glow}`}
                >
                  <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${genre.gradient} opacity-80 transition duration-300 group-hover:opacity-100`} />

                  <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/[0.03] blur-2xl transition duration-500 group-hover:scale-150" />

                  <div className="relative z-10 flex h-full flex-col">
                    <div className="mb-5 flex items-start justify-between">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-black/20 ${genre.iconColor}`}>
                        <Icon size={22} />
                      </div>

                      <ArrowUpRight
                        size={18}
                        className="text-gray-500 transition duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-white"
                      />
                    </div>

                    <h3 className="text-lg font-extrabold tracking-tight">
                      {genre.name}
                    </h3>

                    <p className="mt-2 min-h-10 text-xs leading-5 text-gray-400">
                      {genre.description}
                    </p>

                    <div className="mt-auto flex items-center gap-2 pt-4">
                      <span className={`text-sm font-bold ${genre.iconColor}`}>
                        {count}
                      </span>

                      <span className="text-[11px] text-gray-500">
                        {count === 1 ? 'manga available' : 'manga available'}
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* TRENDING */}
        <section id="trending" className="mt-14 scroll-mt-28">
          <div className="mb-7">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-purple-400">
              <Flame size={15} />
              Popular right now
            </div>

            <h2 className="text-2xl font-extrabold sm:text-3xl">
              Trending stories
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Discover stories worth adding to your reading list.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {[...manga]
              .sort((a, b) => Number(b.rating) - Number(a.rating))
              .map((item, index) => (
                <MangaCard
                  key={item.id}
                  item={item}
                  index={index}
                  bookmarks={bookmarks}
                  toggleBookmark={toggleBookmark}
                />
              ))}
          </div>
        </section>

        {/* EXPLORE */}
        <section id="explore" className="mt-16 scroll-mt-28">
          <div className="mb-7">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-purple-400">
              <Compass size={15} />
              Find your next read
            </div>

            <h2 className="text-2xl font-extrabold sm:text-3xl">
              Explore the library
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Find something that matches your mood.
            </p>
          </div>

          {/* SEARCH AND SORT */}
          <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 transition focus-within:border-purple-500/60">
              <Search size={19} className="shrink-0 text-gray-500" />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by manga title or genre..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-gray-600"
              />

              {search && (
                <button
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                  className="text-gray-500 transition hover:text-white"
                >
                  <X size={17} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <ArrowDownUp size={17} className="shrink-0 text-purple-400" />

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort manga"
                className="w-full cursor-pointer bg-transparent text-sm text-gray-300 outline-none sm:w-44"
              >
                <option value="rating" className="bg-[#171322]">
                  Highest rated
                </option>
                <option value="latest" className="bg-[#171322]">
                  Latest
                </option>
                <option value="title" className="bg-[#171322]">
                  Title: A–Z
                </option>
              </select>
            </div>
          </div>

          {/* GENRE FILTERS */}
          <div className="mb-6">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              <SlidersHorizontal size={14} />
              Filter by genre
            </div>

            <div className="flex flex-wrap gap-2">
              {genres.map((genre) => (
                genre === 'All' ? (
                  <button
                    key={genre}
                    onClick={() => setActiveGenre('All')}
                    aria-pressed={activeGenre === 'All'}
                    className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                      activeGenre === 'All'
                        ? 'border-purple-500 bg-purple-600 text-white shadow-lg shadow-purple-950/30'
                        : 'border-white/10 bg-white/[0.03] text-gray-400 hover:border-purple-400/50 hover:text-white'
                    }`}
                  >
                    All
                  </button>
                ) : (
                  <Link
                    key={genre}
                    to={`/genre/${genre.toLowerCase()}`}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-semibold text-gray-400 transition hover:border-purple-400/50 hover:bg-purple-600 hover:text-white"
                  >
                    {genre}
                  </Link>
                )
              ))}
            </div>
          </div>

          {/* RESULTS COUNT */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] pb-4">
            <p className="text-sm text-gray-400">
              Showing{' '}
              <span className="font-bold text-white">
                {filteredManga.length}
              </span>{' '}
              of{' '}
              <span className="font-bold text-white">
                {manga.length}
              </span>{' '}
              manga
            </p>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 text-xs font-semibold text-purple-300 transition hover:text-purple-200"
              >
                <X size={14} />
                Clear filters
              </button>
            )}
          </div>

          {/* SEARCH RESULTS */}
          {filteredManga.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center">
              <Search size={30} className="mx-auto text-gray-600" />

              <p className="mt-4 font-semibold text-gray-300">
                No stories found.
              </p>

              <p className="mt-2 text-sm text-gray-500">
                We couldn't find a manga matching your search. Try another title or genre.
              </p>

              <button
                onClick={clearFilters}
                className="mt-5 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold transition hover:bg-purple-500"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {filteredManga.map((item) => (
                <MangaCard
                  key={item.id}
                  item={item}
                  bookmarks={bookmarks}
                  toggleBookmark={toggleBookmark}
                />
              ))}
            </div>
          )}
        </section>

        {/* LATEST UPDATES */}
        <section id="latest" className="mt-16 scroll-mt-28">
          <div className="mb-7">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-purple-400">
              <Clock3 size={15} />
              Freshly updated
            </div>

            <h2 className="text-2xl font-extrabold sm:text-3xl">
              Latest updates
            </h2>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">
            {[...manga]
              .sort((a, b) => Number(b.chapters) - Number(a.chapters))
              .slice(0, 5)
              .map((item, index, list) => (
                <Link
                  key={item.id}
                  to={`/manga/${item.id}`}
                  className={`group flex items-center gap-4 p-4 transition hover:bg-purple-500/[0.05] ${
                    index !== list.length - 1
                      ? 'border-b border-white/[0.06]'
                      : ''
                  }`}
                >
                  <div className={`relative flex h-16 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br ${item.colors}`}>
                    <img
                      src={item.coverImage}
                      alt=""
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                      className="absolute inset-0 h-full w-full object-cover"
                    />

                    <span className="text-xl text-white/80">
                      {item.symbol}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-bold transition group-hover:text-purple-300">
                      {item.title}
                    </h3>

                    <p className="mt-1 text-xs text-gray-500">
                      {item.genre}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-semibold text-purple-300">
                      {item.chapter}
                    </p>

                    <p className="mt-1 text-[10px] text-gray-500">
                      Demo update
                    </p>
                  </div>

                  <ChevronRight size={17} className="shrink-0 text-gray-600 transition group-hover:translate-x-1 group-hover:text-purple-400" />
                </Link>
              ))}
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.07] bg-[#07070b]">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row lg:px-10">
          <div>
            <div className="text-lg font-black tracking-[0.15em]">
              ABYSS<span className="text-purple-400">ORA</span>
            </div>

            <p className="mt-1 text-xs text-gray-600">
              A universe of stories awaits.
            </p>
          </div>

          <p className="text-xs text-gray-600">
            © 2026 ABYSSORA. Built for story lovers.
          </p>
        </div>
      </footer>
    </div>
  )
}
