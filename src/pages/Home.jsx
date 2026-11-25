
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, Bookmark, Menu, X, ChevronRight,
  Flame, Clock3, Compass, Home as HomeIcon, Sparkles,
  ArrowUpRight, Heart, Star, BookOpen, UserRound,
  LogOut, Play, Bell, Library as LibraryIcon,
  ArrowDownUp, SlidersHorizontal, ShieldCheck, Smile,
  Palette,
} from 'lucide-react'

import { supabase } from '../lib/supabase'

const genres = [
  'All', 'Action', 'Adventure', 'Fantasy', 'Martial Arts', 'Revenge',
  'Romance', 'System / Leveling', 'Magic', 'Comedy', 'Drama', 'Horror',
  'Mystery', 'Sci-Fi', 'Slice of Life', 'Supernatural', 'Thriller',
]

const genreDiscoveries = [
  {
    name: 'Action',
    description: 'Epic battles, powerful heroes and relentless thrills.',
    icon: Flame,
    tint: 'text-[#d89b87]',
    glow: 'from-[#8c5146]/25',
  },
  {
    name: 'Fantasy',
    description: 'Explore kingdoms beyond the ordinary.',
    icon: Sparkles,
    tint: 'text-[#c6a6b9]',
    glow: 'from-[#76566e]/25',
  },
  {
    name: 'Martial Arts',
    description: 'Masterful fighters, rival schools and legendary techniques.',
    icon: Flame,
    tint: 'text-[#d8a17f]',
    glow: 'from-[#80533e]/25',
  },
  {
    name: 'Revenge',
    description: 'Unfinished scores, hard choices and stories of redemption.',
    icon: ShieldCheck,
    tint: 'text-[#c69aa1]',
    glow: 'from-[#75434e]/25',
  },
  {
    name: 'Romance',
    description: 'Heartfelt connections and unforgettable relationships.',
    icon: Heart,
    tint: 'text-[#d39da8]',
    glow: 'from-[#88515e]/25',
  },
  {
    name: 'System / Leveling',
    description: 'Quests, skill trees and heroes growing beyond their limits.',
    icon: Sparkles,
    tint: 'text-[#b6a9c7]',
    glow: 'from-[#625875]/25',
  },
  {
    name: 'Magic',
    description: 'Discover spells, secrets and mysterious powers.',
    icon: Star,
    tint: 'text-[#b6a9c7]',
    glow: 'from-[#625875]/25',
  },
  {
    name: 'Adventure',
    description: 'Uncover hidden places and unknown worlds.',
    icon: Compass,
    tint: 'text-[#a7b9a8]',
    glow: 'from-[#526b5b]/25',
  },
  {
    name: 'Comedy',
    description: 'Light-hearted moments, clever humour and joyful surprises.',
    icon: Smile,
    tint: 'text-[#e2bd8c]',
    glow: 'from-[#856b42]/25',
  },
  {
    name: 'Drama',
    description: 'Emotional journeys and unforgettable characters.',
    icon: Heart,
    tint: 'text-[#d39da8]',
    glow: 'from-[#88515e]/25',
  },
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

  const uniqueGenres = new Map()

  values.forEach((value) => {
    const genre = value.trim()
    const key = genre.toLowerCase()

    if (genre && !uniqueGenres.has(key)) {
      uniqueGenres.set(key, genre)
    }
  })

  return [...uniqueGenres.values()]
}

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

function SectionHeading({ eyebrow, title, description, icon: Icon, action }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[#c69aa1]">
          {Icon && <Icon size={14} />}
          {eyebrow}
        </div>

        <h2 className="text-2xl font-semibold tracking-tight text-[#f1e7e8] sm:text-3xl">
          {title}
        </h2>

        {description && (
          <p className="mt-2 text-sm text-[#99898e]">{description}</p>
        )}
      </div>

      {action}
    </div>
  )
}

function MangaCard({ item, index, bookmarks, toggleBookmark }) {
  const [imageFailed, setImageFailed] = useState(false)
  const isBookmarked = bookmarks.includes(item.id)

  return (
    <article className="group min-w-0">
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-[#c69aa1]/15 bg-[#211a1e] transition duration-300 group-hover:-translate-y-1 group-hover:border-[#c69aa1]/50 group-hover:shadow-xl group-hover:shadow-black/30">
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
            className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
        ) : (
          <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${item.colors}`}>
            <span className="text-6xl text-[#f1e7e8]/60">{item.symbol}</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#0c090b] via-black/5 to-black/20" />

        {index !== undefined && (
          <span className="absolute left-2 top-2 z-20 rounded-md border border-white/15 bg-black/60 px-2 py-1 text-[9px] font-bold tracking-wider text-white backdrop-blur">
            #{index + 1} TRENDING
          </span>
        )}

        {String(item.status || '').toLowerCase() === 'completed' && (
          <span className="absolute left-2 top-2 z-20 rounded-md bg-[#657e6c]/90 px-2 py-1 text-[9px] font-bold text-white">
            COMPLETED
          </span>
        )}

        <button
          onClick={() => toggleBookmark(item.id)}
          aria-label={`Bookmark ${item.title}`}
          aria-pressed={isBookmarked}
          className="absolute right-2 top-2 z-30 rounded-lg border border-white/15 bg-black/60 p-2 text-white backdrop-blur transition hover:border-[#c69aa1] hover:bg-[#75545c]"
        >
          <Bookmark
            size={15}
            fill={isBookmarked ? 'currentColor' : 'none'}
            className={isBookmarked ? 'text-[#dfb9bf]' : 'text-white'}
          />
        </button>

        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 p-3">
          <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-[#e6c99a]">
            <Star size={11} fill="currentColor" />
            {item.rating}
          </div>

          <h3 className="line-clamp-2 text-sm font-bold leading-snug text-white">
            {item.title}
          </h3>

          <p className="mt-1 text-[10px] text-white/65">{item.chapter}</p>
        </div>
      </div>

      <p className="mt-2 truncate text-xs text-[#95858a]">
        {getComicGenres(item).join(' · ') || 'Manga'}
      </p>
    </article>
  )
}

export default function Home() {
  const [manga, setManga] = useState([])
  const [loadingManga, setLoadingManga] = useState(true)
  const [mangaError, setMangaError] = useState('')

  const [search, setSearch] = useState('')
  const [activeGenre, setActiveGenre] = useState('All')
  const [sortBy, setSortBy] = useState('rating')
  const [bookmarks, setBookmarks] = useState([])
  const [readingHistory, setReadingHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [activeFeaturedIndex, setActiveFeaturedIndex] = useState(0)
  const [mobileGenresOpen, setMobileGenresOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [desktopCurrentPage, setDesktopCurrentPage] = useState(1)

  // LOAD MANGA
  useEffect(() => {
    let mounted = true

    const loadManga = async () => {
      setLoadingManga(true)
      setMangaError('')

      const { data, error } = await supabase
        .from('comics')
        .select('*')
        .order('created_at', { ascending: false })

      if (!mounted) return

      if (error) {
        console.error('Could not load comics:', error.message)
        setMangaError(error.message)
        setLoadingManga(false)
        return
      }

      const formattedManga = (data || []).map((item) => {
        const itemGenres = getComicGenres(item)

        return {
          ...item,
          coverImage: item.cover_image,
          chapters: item.chapters ?? 0,
          chapter: item.chapter || `Chapter ${item.chapters ?? 0}`,
          rating: String(item.rating ?? 0),
          genres: itemGenres,
          genre: item.genre || itemGenres[0] || '',
          colors: item.colors || 'from-[#392b31] via-[#211a1e] to-[#110e10]',
          symbol: item.symbol || '✧',
        }
      })

      setManga(formattedManga)
      setLoadingManga(false)
    }

    loadManga()

    return () => {
      mounted = false
    }
  }, [])

  // AUTHENTICATION
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
      if (mounted) setUser(session?.user ?? null)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // ADMIN PERMISSIONS
  useEffect(() => {
    let mounted = true

    const checkAdmin = async () => {
      setIsAdmin(false)

      if (!user) return

      const { data, error } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        console.error('Could not check admin permissions:', error.message)
        return
      }

      if (mounted) setIsAdmin(!!data)
    }

    checkAdmin()

    return () => {
      mounted = false
    }
  }, [user])

  // UNREAD NOTIFICATIONS
  useEffect(() => {
    let mounted = true

    const loadUnreadNotifications = async () => {
      if (!user) {
        setUnreadCount(0)
        return
      }

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (error) {
        console.error('Could not load notifications:', error.message)
        return
      }

      if (mounted) setUnreadCount(count || 0)
    }

    loadUnreadNotifications()

    return () => {
      mounted = false
    }
  }, [user])

  // BOOKMARKS
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
        setBookmarks((data || []).map((item) => item.manga_id))
      }
    }

    loadBookmarks()

    return () => {
      mounted = false
    }
  }, [user])

  // READING HISTORY
  useEffect(() => {
    let mounted = true

    const loadReadingHistory = async () => {
      if (!user || loadingManga) {
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

        if (mounted) setLoadingHistory(false)

        return
      }

      if (mounted) {
        const history = (data || [])
          .map((entry) => {
            const story = manga.find((item) => item.id === entry.manga_id)

            if (!story) return null

            return {
              ...story,
              lastReadChapter: entry.chapter_number,
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
  }, [user, manga, loadingManga])

  const username =
    user?.user_metadata?.username ||
    user?.email?.split('@')[0] ||
    'Reader'

  // LATEST FEATURED MANGA
  const featuredManga = useMemo(() => {
    return [...manga]
      .sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime()
        const dateB = new Date(b.created_at || 0).getTime()
        return dateB - dateA
      })
      .slice(0, 5)
  }, [manga])

  // Keep genre filters in sync with both the curated list and live catalog data.
  const availableGenres = useMemo(() => {
    const unique = new Map()

    ;[...genres.slice(1), ...manga.flatMap(getComicGenres)].forEach((value) => {
      const name = String(value || '').trim()
      const key = name.toLowerCase()
      if (name && !unique.has(key)) unique.set(key, name)
    })

    return ['All', ...unique.values()]
  }, [manga])

  // LOGOUT
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

  // BOOKMARK HANDLER
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

      setBookmarks((current) => current.filter((item) => item !== id))
    } else {
      const { error } = await supabase
        .from('bookmarks')
        .insert({ user_id: user.id, manga_id: id })

      if (error) {
        alert(`Could not save bookmark: ${error.message}`)
        return
      }

      setBookmarks((current) =>
        current.includes(id) ? current : [...current, id]
      )
    }
  }

  // SEARCH AND FILTER
  const filteredManga = useMemo(() => {
    const searchTerm = search.trim().toLowerCase()

    const results = manga.filter((item) => {
      const itemGenres = getComicGenres(item)
      const title = String(item.title || '')

      const matchesSearch =
        !searchTerm ||
        title.toLowerCase().includes(searchTerm) ||
        String(item.author || '').toLowerCase().includes(searchTerm) ||
        itemGenres.some((value) =>
          value.toLowerCase().includes(searchTerm)
        )

      const matchesGenre =
        activeGenre === 'All' ||
        itemGenres.some(
          (value) => value.toLowerCase() === activeGenre.toLowerCase()
        )

      return matchesSearch && matchesGenre
    })

    return [...results].sort((a, b) => {
      if (sortBy === 'rating') {
        return Number(b.rating) - Number(a.rating)
      }

      if (sortBy === 'title') {
        return String(a.title || '').localeCompare(String(b.title || ''))
      }

      if (sortBy === 'latest') {
        return (
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
        )
      }

      return 0
    })
  }, [manga, search, activeGenre, sortBy])

  const totalPages = Math.ceil(filteredManga.length / 15)
  const paginatedManga = filteredManga.slice((currentPage - 1) * 15, currentPage * 15)
  const desktopTotalPages = Math.ceil(filteredManga.length / 12)
  const desktopPaginatedManga = filteredManga.slice((desktopCurrentPage - 1) * 12, desktopCurrentPage * 12)

  useEffect(() => {
    setCurrentPage(1)
    setDesktopCurrentPage(1)
  }, [search, activeGenre, sortBy])

  const clearFilters = () => {
    setSearch('')
    setActiveGenre('All')
    setSortBy('rating')
    setCurrentPage(1)
    setDesktopCurrentPage(1)
  }

  const hasActiveFilters = search.trim() !== '' || activeGenre !== 'All'

  const scrollTo = (id) => {
    setMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#110e10] text-[#f1e7e8]">

      {/* NAVIGATION */}
      <header className="sticky top-0 z-50 border-b border-[#c69aa1]/10 bg-[#110e10]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-5 px-5 py-3.5 lg:px-10">
          <Brand />

          <nav className="hidden items-center gap-6 text-[13px] font-medium text-[#a9959b] md:flex">
            <Link to="/" className="flex items-center gap-2 text-[#f1e7e8] transition hover:text-[#dfb9bf]">
              <HomeIcon size={15} /> Home
            </Link>

            <Link to="/discover" className="flex items-center gap-2 transition hover:text-[#dfb9bf]">
              <Compass size={15} /> Discover
            </Link>

            <button onClick={() => scrollTo('trending')} className="flex items-center gap-2 transition hover:text-[#dfb9bf]">
              <Flame size={15} /> Trending
            </button>

            <button onClick={() => scrollTo('latest')} className="flex items-center gap-2 transition hover:text-[#dfb9bf]">
              <Clock3 size={15} /> Latest
            </button>

            <button onClick={() => scrollTo('explore')} className="flex items-center gap-2 transition hover:text-[#dfb9bf]">
              <BookOpen size={15} /> Explore
            </button>

            {user && (
              <Link to="/library" className="flex items-center gap-2 transition hover:text-[#dfb9bf]">
                <LibraryIcon size={15} /> My Library
              </Link>
            )}

            {isAdmin && (
              <Link to="/admin" className="flex items-center gap-2 text-[#dfb9bf] transition hover:text-white">
                <ShieldCheck size={15} /> Admin
              </Link>
            )}
          </nav>

          <div className="hidden items-center gap-2 sm:flex">
            <div className="flex items-center gap-2 rounded-xl border border-[#c69aa1]/15 bg-[#211a1e] px-3 py-2 focus-within:border-[#c69aa1]/50">
              <Search size={16} className="text-[#89777c]" />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') scrollTo('explore')
                }}
                placeholder="Search stories..."
                className="w-32 bg-transparent text-xs text-[#f1e7e8] outline-none placeholder:text-[#76676c] lg:w-40"
              />

              {search && (
                <button onClick={() => setSearch('')} aria-label="Clear search">
                  <X size={14} className="text-[#ad9da1]" />
                </button>
              )}
            </div>

            {user ? (
              <>
                <Link
                  to="/notifications"
                  title="Notifications"
                  aria-label="Notifications"
                  className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[#c69aa1]/15 transition hover:border-[#c69aa1]/50 hover:bg-[#211a1e]"
                >
                  <Bell size={17} className="text-[#c69aa1]" />

                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#b66f7b] px-1 text-[9px] font-bold text-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>

                <Link to="/library" className="flex items-center gap-2 rounded-xl border border-[#c69aa1]/25 bg-[#c69aa1]/10 px-3 py-2 text-xs font-semibold text-[#dfb9bf] transition hover:bg-[#c69aa1]/20">
                  <LibraryIcon size={15} /> Library
                </Link>

                <Link to="/profile" className="flex items-center gap-2 rounded-xl border border-[#c69aa1]/15 px-3 py-2 transition hover:border-[#c69aa1]/40">
                  <UserRound size={15} className="text-[#c69aa1]" />
                  <span className="max-w-24 truncate text-xs font-semibold">{username}</span>
                </Link>

                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex items-center gap-2 rounded-xl border border-[#c69aa1]/15 px-3 py-2 text-xs font-semibold text-[#ad9da1] transition hover:border-red-400/40 hover:text-red-300 disabled:opacity-50"
                >
                  <LogOut size={14} />
                  {loggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="rounded-xl border border-[#c69aa1]/20 px-4 py-2 text-xs font-semibold text-[#e4d5d8] transition hover:border-[#c69aa1]/60">
                  Sign in
                </Link>

                <Link to="/register" className="rounded-xl bg-[#c69aa1] px-4 py-2 text-xs font-bold text-[#211619] transition hover:bg-[#dfb9bf]">
                  Register
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-xl border border-[#c69aa1]/20 p-2 text-[#dfb9bf] transition hover:bg-[#211a1e] md:hidden"
            aria-label="Toggle navigation"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* MOBILE MENU */}
        {menuOpen && (
          <div className="border-t border-[#c69aa1]/10 bg-[#191417] p-5 md:hidden">
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-[#c69aa1]/15 bg-[#110e10] px-3 py-3">
              <Search size={17} className="text-[#89777c]" />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search stories..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-[#76676c]"
              />

              {search && (
                <button onClick={() => setSearch('')} aria-label="Clear search">
                  <X size={15} />
                </button>
              )}
            </div>

            <Link to="/discover" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 border-b border-[#c69aa1]/10 py-3 text-sm text-[#dfb9bf]">
              <Compass size={17} /> Discover all stories
            </Link>

            <button onClick={() => scrollTo('trending')} className="block w-full border-b border-[#c69aa1]/10 py-3 text-left text-sm text-[#c8b9bd]">
              Trending
            </button>

            <button onClick={() => scrollTo('latest')} className="block w-full border-b border-[#c69aa1]/10 py-3 text-left text-sm text-[#c8b9bd]">
              Latest
            </button>

            <button onClick={() => scrollTo('explore')} className="block w-full border-b border-[#c69aa1]/10 py-3 text-left text-sm text-[#c8b9bd]">
              Explore library
            </button>

            <Link to="/creator/submit" onClick={() => setMenuOpen(false)} className="mt-3 flex items-center gap-3 rounded-xl border border-[#c69aa1]/25 bg-[#c69aa1]/10 p-3 text-sm font-semibold text-[#dfb9bf]">
              <Palette size={17} /> Become a Creator
              <ArrowUpRight size={15} className="ml-auto" />
            </Link>

            {user ? (
              <div className="mt-4 space-y-3">
                <Link to="/notifications" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-xl border border-[#c69aa1]/15 p-3 text-sm text-[#dfb9bf]">
                  <Bell size={17} /> Notifications

                  {unreadCount > 0 && (
                    <span className="ml-auto rounded-full bg-[#b66f7b] px-2 py-1 text-[10px] text-white">
                      {unreadCount}
                    </span>
                  )}
                </Link>

                <Link to="/library" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-xl border border-[#c69aa1]/15 p-3 text-sm text-[#dfb9bf]">
                  <LibraryIcon size={17} /> My Library
                </Link>

                {isAdmin && (
                  <Link to="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-xl border border-[#c69aa1]/15 p-3 text-sm text-[#dfb9bf]">
                    <ShieldCheck size={17} /> Admin Dashboard
                  </Link>
                )}

                <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-xl border border-[#c69aa1]/15 p-3 text-sm text-[#c8b9bd]">
                  <UserRound size={17} /> {username}
                </Link>

                <button onClick={handleLogout} disabled={loggingOut} className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-400/20 p-3 text-sm text-red-300 disabled:opacity-50">
                  <LogOut size={16} /> {loggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Link to="/login" onClick={() => setMenuOpen(false)} className="rounded-xl border border-[#c69aa1]/20 px-4 py-3 text-center text-sm font-semibold">
                  Sign in
                </Link>

                <Link to="/register" onClick={() => setMenuOpen(false)} className="rounded-xl bg-[#c69aa1] px-4 py-3 text-center text-sm font-bold text-[#211619]">
                  Register
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      <main className="mx-auto max-w-[1440px] px-5 pb-24 lg:px-10">

        {/* LATEST MANHWA — EXPANDING GALLERY */}
        <section id="latest" className="mt-7">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#c69aa1]">
                <Sparkles size={13} />
                Discover something new
              </div>

              <h1 className="font-serif text-3xl font-medium tracking-tight text-[#f1e7e8] sm:text-4xl">
                Latest <span className="italic text-[#c69aa1]">releases.</span>
              </h1>

              <p className="mt-2 text-xs text-[#99898e] sm:text-sm">
                Fresh stories, waiting to become your next obsession.
              </p>
            </div>

            <Link
              to="/discover"
              className="mb-1 inline-flex items-center gap-2 text-xs font-semibold text-[#c69aa1] transition hover:text-[#dfb9bf]"
            >
              Explore all <ArrowUpRight size={15} />
            </Link>
          </div>

          {featuredManga.length > 0 ? (
            <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-4 md:min-h-[490px] md:overflow-visible md:pb-0">
              {featuredManga.map((item, index) => {
                const isActive = index === activeFeaturedIndex

                return (
                  <article
                    key={item.id}
                    tabIndex={0}
                    onMouseEnter={() => setActiveFeaturedIndex(index)}
                    onFocus={() => setActiveFeaturedIndex(index)}
                    onClick={() => setActiveFeaturedIndex(index)}
                    className={`group relative h-[410px] w-[78vw] shrink-0 snap-center cursor-pointer overflow-hidden rounded-2xl border bg-[#191417] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] md:h-[490px] md:w-auto md:shrink ${
                      isActive
                        ? 'border-[#c69aa1]/55 shadow-xl shadow-black/30 md:flex-[3.5]'
                        : 'border-[#c69aa1]/15 hover:border-[#c69aa1]/35 md:flex-[0.85]'
                    }`}
                  >
                    {/* COVER ART */}
                    <div className="absolute inset-0">
                      {item.coverImage ? (
                        <img
                          src={item.coverImage}
                          alt={`${item.title} cover artwork`}
                          loading="lazy"
                          className={`h-full w-full object-cover transition-all duration-1000 ${
                            isActive
                              ? 'scale-100 opacity-90'
                              : 'scale-110 opacity-55 group-hover:scale-100 group-hover:opacity-75'
                          }`}
                        />
                      ) : (
                        <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${item.colors}`}>
                          <span className="font-serif text-8xl text-[#f1e7e8]/50">
                            {item.symbol}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* DARK CINEMATIC OVERLAY */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0c090b] via-[#110e10]/35 to-[#110e10]/10" />

                    <div className={`absolute inset-0 bg-gradient-to-r from-[#110e10]/75 via-transparent to-transparent transition-opacity duration-700 ${
                      isActive ? 'opacity-100' : 'opacity-50'
                    }`} />

                    {/* TOP LABELS */}
                    <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-2">
                      <span className="rounded-full border border-[#dfb9bf]/30 bg-[#110e10]/65 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-[#dfb9bf] backdrop-blur-md">
                        {index === 0 ? 'Newest release' : `New arrival · 0${index + 1}`}
                      </span>

                      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/35 text-xs font-semibold text-white/80 backdrop-blur-md">
                        0{index + 1}
                      </span>
                    </div>

                    {/* COLLAPSED TITLE */}
                    {!isActive && (
                      <div className="absolute inset-x-0 bottom-0 p-5 transition-opacity duration-300 md:opacity-100">
                        <h3 className="line-clamp-2 text-lg font-semibold text-white md:text-xl">
                          {item.title}
                        </h3>
                        <p className="mt-1 text-[10px] text-white/65">
                          {getComicGenres(item).join(' · ') || 'Manhwa'}
                        </p>
                      </div>
                    )}

                    {/* EXPANDED CONTENT */}
                    <div className={`absolute inset-x-0 bottom-0 p-5 transition-all duration-700 sm:p-7 ${
                      isActive
                        ? 'translate-y-0 opacity-100'
                        : 'translate-y-5 opacity-0 pointer-events-none'
                    }`}>
                      <div className="max-w-xl">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-[#c69aa1]/35 bg-[#c69aa1]/15 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-[#dfb9bf] backdrop-blur-md">
                            Latest manhwa
                          </span>

                          <span className="flex items-center gap-1 text-xs font-semibold text-[#e6c99a]">
                            <Star size={12} fill="currentColor" />
                            {item.rating || 'New'}
                          </span>
                        </div>

                        <h2 className="line-clamp-2 font-serif text-3xl font-medium leading-tight text-white sm:text-4xl md:text-5xl">
                          {item.title}
                        </h2>

                        <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.17em] text-[#dfb9bf]">
                          {getComicGenres(item).join(' · ') || 'Manhwa'}
                          <span className="mx-2 text-white/40">/</span>
                          {item.chapter}
                        </p>

                        <p className="mt-3 line-clamp-2 max-w-lg text-xs leading-6 text-white/75 sm:text-sm">
                          {item.description ||
                            `Enter the world of ${item.title} and discover a new story on ABYSSORA.`}
                        </p>

                        <div className="mt-5 flex flex-wrap items-center gap-3">
                          <Link
                            to={`/manga/${item.id}`}
                            onClick={(event) => event.stopPropagation()}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#c69aa1] px-5 py-3 text-xs font-bold text-[#211619] shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-[#dfb9bf]"
                          >
                            Read story <ArrowUpRight size={15} />
                          </Link>

                          <span className="text-[10px] font-medium text-white/65">
                            Available on ABYSSORA
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* ACTIVE BORDER GLOW */}
                    <div className={`pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset transition duration-700 ${
                      isActive ? 'ring-[#dfb9bf]/25' : 'ring-white/[0.04]'
                    }`} />
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="relative flex min-h-[380px] items-center overflow-hidden rounded-2xl border border-[#c69aa1]/20 bg-[#191417] px-7 py-12 sm:px-12">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_30%,rgba(198,154,161,0.12),transparent_55%)]" />

              <div className="relative max-w-xl">
                <div className="mb-6 flex items-center gap-3">
                  <Emblem size={28} />
                  <span className="text-[9px] font-bold tracking-[0.25em] text-[#dfb9bf]">
                    WORLDS BEYOND STORIES
                  </span>
                </div>

                <h2 className="font-serif text-4xl leading-tight text-[#f1e7e8] sm:text-5xl">
                  Every story has <span className="italic text-[#c69aa1]">a universe.</span>
                </h2>

                <p className="mt-5 max-w-md text-sm leading-7 text-[#ad9da1]">
                  {loadingManga
                    ? 'Discovering the latest stories for you...'
                    : 'New worlds are waiting to be discovered. Check back soon for the latest releases.'}
                </p>

                <Link
                  to="/discover"
                  className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#c69aa1] px-5 py-3 text-sm font-bold text-[#211619] transition hover:bg-[#dfb9bf]"
                >
                  Discover stories <ArrowUpRight size={16} />
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* CONTINUE READING */}
        {user && (loadingHistory || readingHistory.length > 0) && (
          <section className="mt-14">
            <SectionHeading
              eyebrow="Pick up where you left off"
              title="Continue reading"
              description="Your reading journey, right where you left it."
              icon={BookOpen}
              action={
                <Link to="/library" className="hidden items-center gap-1 text-xs font-semibold text-[#c69aa1] transition hover:text-[#dfb9bf] sm:flex">
                  View library <ChevronRight size={15} />
                </Link>
              }
            />

            {loadingHistory ? (
              <div className="rounded-2xl border border-[#c69aa1]/10 bg-[#191417] p-8 text-center text-sm text-[#95858a]">
                Loading your reading history...
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {readingHistory.map((item) => (
                  <article key={item.id} className="flex min-w-0 gap-4 rounded-2xl border border-[#c69aa1]/12 bg-[#191417] p-4 transition hover:border-[#c69aa1]/35">
                    <Link
                      to={`/manga/${item.id}`}
                      className={`relative flex h-32 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br ${item.colors}`}
                    >
                      {item.coverImage ? (
                        <img
                          src={item.coverImage}
                          alt={`${item.title} cover`}
                          loading="lazy"
                          onError={(e) => { e.currentTarget.style.display = 'none' }}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-4xl text-white/70">{item.symbol}</span>
                      )}
                    </Link>

                    <div className="flex min-w-0 flex-1 flex-col justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#c69aa1]">
                          {getComicGenres(item).join(' · ')}
                        </p>

                        <Link to={`/manga/${item.id}`} className="mt-1 line-clamp-2 text-sm font-bold transition hover:text-[#dfb9bf]">
                          {item.title}
                        </Link>

                        <p className="mt-2 text-xs text-[#95858a]">
                          Last read: Chapter {item.lastReadChapter}
                        </p>
                      </div>

                      <Link
                        to={`/manga/${item.id}/chapter/${item.lastReadChapter}`}
                        className="mt-3 inline-flex w-fit items-center gap-2 rounded-lg bg-[#c69aa1]/15 px-3 py-2 text-xs font-bold text-[#dfb9bf] transition hover:bg-[#c69aa1]/25"
                      >
                        <Play size={12} fill="currentColor" /> Continue
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* FEATURE STRIP */}
        <section className="my-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            [Compass, 'Discover', 'New worlds'],
            [Sparkles, 'Explore', 'Every genre'],
            [Heart, 'Save', 'Your favourites'],
            [BookOpen, 'Enjoy', 'Your next read'],
          ].map(([Icon, heading, sub]) => (
            <div key={heading} className="flex items-center gap-3 rounded-xl border border-[#c69aa1]/10 bg-[#191417] p-4 transition hover:border-[#c69aa1]/30">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#c69aa1]/10 text-[#c69aa1]">
                <Icon size={18} />
              </div>

              <div>
                <p className="text-sm font-semibold text-[#e9dcde]">{heading}</p>
                <p className="mt-1 text-[11px] text-[#89777c]">{sub}</p>
              </div>
            </div>
          ))}
        </section>

        {/* GENRE DISCOVERY */}
        <section id="genres" className="mt-16 scroll-mt-28">
          <SectionHeading
            eyebrow="Find your favourite world"
            title="Explore by genre"
            description="Choose a world. Find a story worth remembering."
            icon={Sparkles}
            action={
              <button
                onClick={() => {
                  setActiveGenre('All')
                  setSearch('')
                  scrollTo('explore')
                }}
                className="flex items-center gap-1 text-xs font-semibold text-[#c69aa1] transition hover:text-[#dfb9bf]"
              >
                View all manga <ArrowUpRight size={15} />
              </button>
            }
          />

          <div className="md:hidden">
            <button
              type="button"
              onClick={() => setMobileGenresOpen((open) => !open)}
              aria-expanded={mobileGenresOpen}
              className="flex w-full items-center justify-between rounded-2xl border border-[#c69aa1]/20 bg-[#191417] px-4 py-3.5 text-left"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#c69aa1]/10 text-[#d5a2aa]">
                  <Compass size={17} />
                </span>
                <span>
                  <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-[#89777c]">Choose a genre</span>
                  <span className="mt-0.5 block text-sm font-semibold text-[#f1e7e8]">{activeGenre === 'All' ? 'All genres' : activeGenre}</span>
                </span>
              </span>
              <ChevronRight size={18} className={`text-[#c69aa1] transition-transform ${mobileGenresOpen ? 'rotate-90' : ''}`} />
            </button>

            {mobileGenresOpen && (
              <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl border border-[#c69aa1]/10 bg-[#191417] p-3">
                {availableGenres.map((genre) => (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => {
                      setActiveGenre(genre)
                      setSearch('')
                      setMobileGenresOpen(false)
                    }}
                    aria-pressed={activeGenre === genre}
                    className={`rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition ${activeGenre === genre ? 'border-[#c69aa1] bg-[#c69aa1] text-[#211619]' : 'border-[#c69aa1]/10 bg-[#110e10] text-[#b9a8ac]'}`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            )}

            {activeGenre !== 'All' && (
              <div className="mt-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#f1e7e8]">{activeGenre} stories</p>
                    <p className="mt-1 text-[10px] text-[#89777c]">Swipe to explore titles</p>
                  </div>
                  <span className="text-xs font-semibold text-[#c69aa1]">{filteredManga.length} titles</span>
                </div>
                {filteredManga.length ? (
                  <div className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {filteredManga.map((item) => (
                      <Link
                        key={item.id}
                        to={`/manga/${item.id}`}
                        className="w-[116px] shrink-0 snap-start"
                      >
                        <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-[#c69aa1]/15 bg-[#211a1e]">
                          {item.coverImage ? (
                            <img src={item.coverImage} alt={item.title} loading="lazy" className="h-full w-full object-cover" />
                          ) : (
                            <div className={`flex h-full items-center justify-center bg-gradient-to-br ${item.colors}`}>
                              <span className="text-4xl text-[#f1e7e8]/60">{item.symbol}</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                          <div className="absolute bottom-0 p-2.5">
                            <p className="line-clamp-2 text-xs font-bold leading-snug text-white">{item.title}</p>
                            <p className="mt-1 text-[9px] text-white/65">{item.chapter}</p>
                          </div>
                        </div>
                        <p className="mt-1.5 truncate text-[10px] text-[#95858a]">{item.author || activeGenre}</p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl border border-[#c69aa1]/10 bg-[#191417] p-4 text-xs text-[#99898e]">No stories in this genre yet. Check back as the collection grows.</p>
                )}
                <button
                  type="button"
                  onClick={() => scrollTo('explore')}
                  className="mt-2 text-xs font-semibold text-[#c69aa1]"
                >
                  Browse full results <ArrowUpRight size={13} className="inline" />
                </button>
              </div>
            )}
          </div>

          <div className="hidden md:grid md:grid-cols-3 xl:grid-cols-6 gap-3">
            {genreDiscoveries.map((genre) => {
              const Icon = genre.icon

              const count = manga.filter((item) =>
                getComicGenres(item).some(
                  (value) => value.toLowerCase() === genre.name.toLowerCase()
                )
              ).length

              return (
                <button
                  key={genre.name}
                  onClick={() => {
                    setActiveGenre(genre.name)
                    scrollTo('explore')
                  }}
                  className="group relative min-h-48 overflow-hidden rounded-2xl border border-[#c69aa1]/12 bg-[#191417] p-5 text-left transition duration-300 hover:-translate-y-1 hover:border-[#c69aa1]/40"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${genre.glow} to-transparent opacity-80 transition group-hover:opacity-100`} />

                  <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/[0.025] blur-2xl transition group-hover:scale-150" />

                  <div className="relative z-10 flex h-full flex-col">
                    <div className="mb-5 flex items-start justify-between">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-xl border border-[#c69aa1]/15 bg-[#110e10]/50 ${genre.tint}`}>
                        <Icon size={21} />
                      </div>

                      <ArrowUpRight size={17} className="text-[#76676c] transition group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-[#dfb9bf]" />
                    </div>

                    <h3 className="text-lg font-semibold text-[#f1e7e8]">
                      {genre.name}
                    </h3>

                    <p className="mt-2 min-h-10 text-xs leading-5 text-[#99898e]">
                      {genre.description}
                    </p>

                    <div className="mt-auto flex items-center gap-2 pt-4">
                      <span className={`text-sm font-bold ${genre.tint}`}>
                        {count}
                      </span>
                      <span className="text-[10px] text-[#817277]">
                        manga available
                      </span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        {/* TRENDING */}
        <section id="trending" className="mt-16 scroll-mt-28">
          <SectionHeading
            eyebrow="Catalog ratings"
            title="Highest rated stories"
            description="Browse titles with the strongest ratings in the ABYSSORA catalog."
            icon={Star}
          />

          {loadingManga ? (
            <p className="rounded-2xl border border-[#c69aa1]/10 bg-[#191417] p-8 text-center text-sm text-[#95858a]">
              Loading comics from ABYSSORA...
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {[...manga]
                .sort((a, b) => Number(b.rating) - Number(a.rating))
                .slice(0, 12)
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
          )}
        </section>

        {/* EXPLORE LIBRARY */}
        <section id="explore" className="mt-16 scroll-mt-28">
          <SectionHeading
            eyebrow="Find your next read"
            title="Explore the library"
            description="A universe of stories, waiting to be discovered."
            icon={Compass}
          />

          <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="flex items-center gap-3 rounded-xl border border-[#c69aa1]/15 bg-[#191417] px-4 py-3 transition focus-within:border-[#c69aa1]/50">
              <Search size={18} className="shrink-0 text-[#89777c]" />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, creator or genre..."
                className="w-full bg-transparent text-sm text-[#f1e7e8] outline-none placeholder:text-[#76676c]"
              />

              {search && (
                <button onClick={() => setSearch('')} aria-label="Clear search" className="text-[#89777c] hover:text-white">
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-[#c69aa1]/15 bg-[#191417] px-4 py-3">
              <ArrowDownUp size={16} className="shrink-0 text-[#c69aa1]" />

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort manga"
                className="w-full cursor-pointer bg-transparent text-sm text-[#c8b9bd] outline-none sm:w-40"
              >
                <option value="rating" className="bg-[#191417]">Highest rated</option>
                <option value="latest" className="bg-[#191417]">Latest</option>
                <option value="title" className="bg-[#191417]">Title: A–Z</option>
              </select>
            </div>
          </div>

          <div className="mb-6">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#89777c]">
              <SlidersHorizontal size={13} /> Filter by genre
            </div>

            <div className="flex flex-wrap gap-2">
              {availableGenres.map((genre) => (
                <button
                  key={genre}
                  onClick={() => setActiveGenre(genre)}
                  aria-pressed={activeGenre === genre}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                    activeGenre === genre
                      ? 'border-[#c69aa1] bg-[#c69aa1] text-[#211619]'
                      : 'border-[#c69aa1]/15 bg-[#191417] text-[#ad9da1] hover:border-[#c69aa1]/50 hover:text-[#f1e7e8]'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#c69aa1]/10 pb-4">
            <p className="text-xs text-[#95858a]">
              Showing{' '}
              <span className="font-bold text-[#f1e7e8]">
                {filteredManga.length}
              </span>{' '}
              of{' '}
              <span className="font-bold text-[#f1e7e8]">
                {manga.length}
              </span>{' '}
              manga
            </p>

            {hasActiveFilters && (
              <button onClick={clearFilters} className="flex items-center gap-2 text-xs font-semibold text-[#c69aa1] transition hover:text-[#dfb9bf]">
                <X size={13} /> Clear filters
              </button>
            )}
          </div>

          {loadingManga ? (
            <div className="rounded-2xl border border-[#c69aa1]/10 bg-[#191417] p-12 text-center text-sm text-[#95858a]">
              Loading your library...
            </div>
          ) : mangaError ? (
            <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-8 text-center">
              <p className="font-semibold text-red-300">
                Unable to load comics
              </p>

              <p className="mt-2 break-words text-sm text-[#ad9da1]">
                {mangaError}
              </p>
            </div>
          ) : filteredManga.length === 0 ? (
            <div className="rounded-2xl border border-[#c69aa1]/10 bg-[#191417] p-12 text-center">
              <Search size={28} className="mx-auto text-[#76676c]" />

              <p className="mt-4 font-semibold text-[#e4d5d8]">
                No stories found.
              </p>

              <p className="mt-2 text-sm text-[#89777c]">
                Try another title or genre.
              </p>

              <button onClick={clearFilters} className="mt-5 rounded-xl bg-[#c69aa1] px-5 py-2.5 text-sm font-bold text-[#211619] transition hover:bg-[#dfb9bf]">
                Clear filters
              </button>
            </div>
          ) : (
            <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 md:hidden">
              {paginatedManga.map((item) => (
                <MangaCard
                  key={item.id}
                  item={item}
                  bookmarks={bookmarks}
                  toggleBookmark={toggleBookmark}
                />
              ))}
            </div>
            <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-6 gap-4">
              {desktopPaginatedManga.map((item) => (
                <MangaCard
                  key={item.id}
                  item={item}
                  bookmarks={bookmarks}
                  toggleBookmark={toggleBookmark}
                />
              ))}
            </div>
            </>
          )}

          <div className="md:hidden">
          {!loadingManga && !mangaError && filteredManga.length > 15 && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setCurrentPage((page) => Math.max(1, page - 1))
                  scrollTo('explore')
                }}
                disabled={currentPage === 1}
                className="rounded-xl border border-[#c69aa1]/20 px-4 py-2.5 text-xs font-semibold text-[#dfb9bf] transition hover:border-[#c69aa1]/50 hover:bg-[#c69aa1]/10 disabled:cursor-not-allowed disabled:opacity-35"
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => {
                    setCurrentPage(page)
                    scrollTo('explore')
                  }}
                  aria-current={currentPage === page ? 'page' : undefined}
                  className={`h-10 min-w-10 rounded-xl border px-3 text-xs font-semibold transition ${
                    currentPage === page
                      ? 'border-[#c69aa1] bg-[#c69aa1] text-[#211619]'
                      : 'border-[#c69aa1]/20 text-[#c8b9bd] hover:border-[#c69aa1]/50 hover:bg-[#c69aa1]/10'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                onClick={() => {
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                  scrollTo('explore')
                }}
                disabled={currentPage === totalPages}
                className="rounded-xl border border-[#c69aa1]/20 px-4 py-2.5 text-xs font-semibold text-[#dfb9bf] transition hover:border-[#c69aa1]/50 hover:bg-[#c69aa1]/10 disabled:cursor-not-allowed disabled:opacity-35"
              >
                Next
              </button>
            </div>
          )}
          </div>

          <div className="hidden md:block">
          {!loadingManga && !mangaError && filteredManga.length > 12 && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setDesktopCurrentPage((page) => Math.max(1, page - 1))
                  scrollTo('explore')
                }}
                disabled={desktopCurrentPage === 1}
                className="rounded-xl border border-[#c69aa1]/20 px-4 py-2.5 text-xs font-semibold text-[#dfb9bf] transition hover:border-[#c69aa1]/50 hover:bg-[#c69aa1]/10 disabled:cursor-not-allowed disabled:opacity-35"
              >
                Previous
              </button>

              {Array.from({ length: desktopTotalPages }, (_, index) => index + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => {
                    setDesktopCurrentPage(page)
                    scrollTo('explore')
                  }}
                  aria-current={desktopCurrentPage === page ? 'page' : undefined}
                  className={`h-10 min-w-10 rounded-xl border px-3 text-xs font-semibold transition ${
                    desktopCurrentPage === page
                      ? 'border-[#c69aa1] bg-[#c69aa1] text-[#211619]'
                      : 'border-[#c69aa1]/20 text-[#c8b9bd] hover:border-[#c69aa1]/50 hover:bg-[#c69aa1]/10'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                onClick={() => {
                  setDesktopCurrentPage((page) => Math.min(desktopTotalPages, page + 1))
                  scrollTo('explore')
                }}
                disabled={desktopCurrentPage === desktopTotalPages}
                className="rounded-xl border border-[#c69aa1]/20 px-4 py-2.5 text-xs font-semibold text-[#dfb9bf] transition hover:border-[#c69aa1]/50 hover:bg-[#c69aa1]/10 disabled:cursor-not-allowed disabled:opacity-35"
              >
                Next
              </button>
            </div>
          )}


          </div>

          <p className="mt-3 text-center text-[11px] text-[#89777c] md:hidden">
            Page {currentPage} of {Math.max(totalPages, 1)} · Showing {Math.min((currentPage - 1) * 15 + 1, filteredManga.length)}–{Math.min(currentPage * 15, filteredManga.length)} of {filteredManga.length} stories
          </p>
          <p className="mt-3 hidden text-center text-[11px] text-[#89777c] md:block">
            Page {desktopCurrentPage} of {Math.max(desktopTotalPages, 1)} · Showing {Math.min((desktopCurrentPage - 1) * 12 + 1, filteredManga.length)}–{Math.min(desktopCurrentPage * 12, filteredManga.length)} of {filteredManga.length} stories
          </p>
        </section>

        {/* LATEST UPDATES */}
        <section id="latest-updates" className="mt-16 scroll-mt-28">
          <SectionHeading
            eyebrow="Freshly updated"
            title="Latest updates"
            description="The latest chapters from your library."
            icon={Clock3}
          />

          <div className="overflow-hidden rounded-2xl border border-[#c69aa1]/10 bg-[#191417]">
            {[...manga]
              .sort((a, b) => {
                const dateA = new Date(a.updated_at || a.created_at || 0).getTime()
                const dateB = new Date(b.updated_at || b.created_at || 0).getTime()
                return dateB - dateA
              })
              .slice(0, 5)
              .map((item, index, list) => (
                <Link
                  key={item.id}
                  to={`/manga/${item.id}`}
                  className={`group flex items-center gap-4 p-4 transition hover:bg-[#c69aa1]/[0.045] ${
                    index !== list.length - 1 ? 'border-b border-[#c69aa1]/10' : ''
                  }`}
                >
                  <div className={`relative flex h-16 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br ${item.colors}`}>
                    {item.coverImage ? (
                      <img
                        src={item.coverImage}
                        alt=""
                        loading="lazy"
                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xl text-white/80">{item.symbol}</span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-[#e9dcde] transition group-hover:text-[#dfb9bf]">
                      {item.title}
                    </h3>

                    <p className="mt-1 text-xs text-[#89777c]">
                      {getComicGenres(item).join(' · ') || 'Manga'}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-semibold text-[#c69aa1]">
                      {item.chapter}
                    </p>

                    <p className="mt-1 text-[9px] text-[#817277]">
                      Latest chapter
                    </p>
                  </div>

                  <ChevronRight size={16} className="shrink-0 text-[#76676c] transition group-hover:translate-x-1 group-hover:text-[#c69aa1]" />
                </Link>
              ))}

            {!loadingManga && manga.length === 0 && (
              <p className="p-8 text-center text-sm text-[#89777c]">
                No manga has been added yet.
              </p>
            )}
          </div>
        </section>

        {/* DISCOVER AND CREATOR PROGRAMME */}
        <section className="mt-20">
          <div className="mb-8 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#c69aa1]">
              More to explore
            </p>

            <h2 className="mt-3 font-serif text-3xl text-[#f1e7e8] sm:text-4xl">
              Find stories. Share stories.
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#99898e]">
              Explore new worlds or bring your own original creation to the ABYSSORA community.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Link
              to="/discover"
              className="group relative overflow-hidden rounded-3xl border border-[#c69aa1]/20 bg-[#191417] p-7 transition duration-300 hover:-translate-y-1 hover:border-[#c69aa1]/50 sm:p-9"
            >
              <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#76566e]/15 blur-3xl transition group-hover:bg-[#76566e]/25" />

              <div className="relative">
                <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#c69aa1]/20 bg-[#c69aa1]/10 text-[#dfb9bf]">
                  <Compass size={27} />
                </div>

                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#c69aa1]">
                  For every reader
                </p>

                <h3 className="mt-3 font-serif text-3xl text-[#f1e7e8]">
                  Discover your next world.
                </h3>

                <p className="mt-4 max-w-md text-sm leading-7 text-[#a9959b]">
                  Search stories, explore genres and find manga, manhwa, manhua and webcomics worth reading.
                </p>

                <span className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#c69aa1] px-5 py-3 text-sm font-bold text-[#211619] transition group-hover:bg-[#dfb9bf]">
                  Explore Discover <ArrowUpRight size={16} />
                </span>
              </div>
            </Link>

            <Link
              to="/creator/submit"
              className="group relative overflow-hidden rounded-3xl border border-[#c69aa1]/20 bg-[#191417] p-7 transition duration-300 hover:-translate-y-1 hover:border-[#c69aa1]/50 sm:p-9"
            >
              <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#88515e]/15 blur-3xl transition group-hover:bg-[#88515e]/25" />

              <div className="relative">
                <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#c69aa1]/20 bg-[#c69aa1]/10 text-[#dfb9bf]">
                  <Palette size={27} />
                </div>

                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#c69aa1]">
                  For independent creators
                </p>

                <h3 className="mt-3 font-serif text-3xl text-[#f1e7e8]">
                  Your story deserves a world.
                </h3>

                <p className="mt-4 max-w-md text-sm leading-7 text-[#a9959b]">
                  Created an original comic? Introduce your work to ABYSSORA and submit it for our team's review.
                </p>

                <span className="mt-8 inline-flex items-center gap-2 rounded-xl border border-[#c69aa1]/40 bg-[#c69aa1]/10 px-5 py-3 text-sm font-bold text-[#dfb9bf] transition group-hover:bg-[#c69aa1]/20">
                  Become a Creator <ArrowUpRight size={16} />
                </span>
              </div>
            </Link>
          </div>
        </section>

        {/* CLOSING BANNER */}
        <section className="relative mt-16 overflow-hidden rounded-2xl border border-[#c69aa1]/15 bg-[#191417] px-7 py-10 text-center md:py-14">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(198,154,161,0.09),transparent_65%)]" />

          <div className="relative">
            <div className="mb-4 flex justify-center">
              <Emblem size={45} />
            </div>

            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#c69aa1]">
              ABYSSORA
            </p>

            <h2 className="mt-3 font-serif text-3xl italic text-[#f1e7e8] sm:text-4xl">
              There is always another world.
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#99898e]">
              Your next favourite story might be one chapter away.
            </p>

            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                to="/discover"
                className="inline-flex items-center gap-2 rounded-xl bg-[#c69aa1] px-5 py-3 text-xs font-bold text-[#211619] transition hover:bg-[#dfb9bf]"
              >
                Discover stories <Compass size={15} />
              </Link>

              <Link
                to="/creator/submit"
                className="inline-flex items-center gap-2 rounded-xl border border-[#c69aa1]/30 px-5 py-3 text-xs font-bold text-[#dfb9bf] transition hover:bg-[#c69aa1]/10"
              >
                Become a Creator <Palette size={15} />
              </Link>
            </div>
          </div>
        </section>
      </main>

    </div>
  )
}
