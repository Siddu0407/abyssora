import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  UserRound,
  Mail,
  CalendarDays,
  ArrowLeft,
  Save,
  LoaderCircle,
  CheckCircle,
  Bookmark,
  Trash2,
  BookOpen,
  Clock3,
  Sparkles,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react'

import { supabase } from '../lib/supabase'

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

function formatComic(comic) {
  const genres = Array.isArray(comic.genres)
    ? comic.genres.join(', ')
    : comic.genres || comic.genre || 'Uncategorized'

  return {
    ...comic,
    coverImage: comic.cover_image || '',
    genre: genres,
    colors: comic.colors || 'from-[#292126] via-[#493039] to-[#171316]',
    symbol: comic.symbol || '✧',
    status: comic.status || 'Ongoing',
  }
}

const panel =
  'rounded-3xl border border-[#c69aa1]/15 bg-[#191417]'

const inputStyle =
  'w-full bg-transparent text-sm text-[#f4e9e9] outline-none placeholder:text-[#75666a]'

function SectionEyebrow({ children, icon: Icon }) {
  return (
    <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#c58d98]">
      {Icon && <Icon size={14} />}
      {children}
    </div>
  )
}

function Profile() {
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [bookmarks, setBookmarks] = useState([])
  const [readingHistory, setReadingHistory] = useState([])
  const [loadingBookmarks, setLoadingBookmarks] = useState(true)
  const [removingId, setRemovingId] = useState(null)

  // Load authenticated user
  useEffect(() => {
    let active = true

    const loadProfile = async () => {
      const { data, error } = await supabase.auth.getUser()

      if (!active) return

      if (error || !data.user) {
        navigate('/login', { replace: true })
        return
      }

      setUser(data.user)
      setUsername(data.user.user_metadata?.username || '')
      setLoading(false)
    }

    loadProfile()

    return () => {
      active = false
    }
  }, [navigate])

  // Load bookmarks and reading activity
  useEffect(() => {
    let active = true

    const loadUserActivity = async () => {
      if (!user) return

      setLoadingBookmarks(true)

      const [bookmarkResult, historyResult] = await Promise.all([
        supabase
          .from('bookmarks')
          .select('manga_id, created_at')
          .eq('user_id', user.id),

        supabase
          .from('reading_history')
          .select('manga_id, chapter_number, updated_at')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false }),
      ])

      if (!active) return

      if (bookmarkResult.error) {
        console.error(
          'Could not load bookmarks:',
          bookmarkResult.error.message
        )
      }

      if (historyResult.error) {
        console.error(
          'Could not load reading history:',
          historyResult.error.message
        )
      }

      const bookmarkRows = bookmarkResult.data || []
      const historyRows = historyResult.data || []

      const comicIds = [
        ...new Set([
          ...bookmarkRows.map((item) => item.manga_id),
          ...historyRows.map((item) => item.manga_id),
        ]),
      ]

      if (comicIds.length === 0) {
        setBookmarks([])
        setReadingHistory([])
        setLoadingBookmarks(false)
        return
      }

      const { data: comicsData, error: comicsError } = await supabase
        .from('comics')
        .select('*')
        .in('id', comicIds)

      if (!active) return

      if (comicsError) {
        console.error('Could not load comics:', comicsError.message)
        setLoadingBookmarks(false)
        return
      }

      const comicMap = new Map(
        (comicsData || []).map((comic) => [
          comic.id,
          formatComic(comic),
        ])
      )

      const savedComics = bookmarkRows
        .map((bookmark) => {
          const comic = comicMap.get(bookmark.manga_id)

          return comic
            ? { ...comic, savedAt: bookmark.created_at }
            : null
        })
        .filter(Boolean)

      const historyComics = historyRows
        .map((history) => {
          const comic = comicMap.get(history.manga_id)

          return comic
            ? {
                ...comic,
                lastReadChapter: history.chapter_number,
                lastReadAt: history.updated_at,
              }
            : null
        })
        .filter(Boolean)

      setBookmarks(savedComics)
      setReadingHistory(historyComics)
      setLoadingBookmarks(false)
    }

    loadUserActivity()

    return () => {
      active = false
    }
  }, [user])

  // Save username
  const handleSave = async (event) => {
    event.preventDefault()

    const cleanUsername = username.trim()

    if (cleanUsername.length < 3) {
      setError('Username must contain at least 3 characters.')
      setMessage('')
      return
    }

    if (cleanUsername.length > 20) {
      setError('Username cannot be longer than 20 characters.')
      setMessage('')
      return
    }

    setSaving(true)
    setError('')
    setMessage('')

    const { data, error } = await supabase.auth.updateUser({
      data: {
        username: cleanUsername,
      },
    })

    setSaving(false)

    if (error) {
      setError(error.message)
      return
    }

    setUser(data.user)
    setUsername(data.user.user_metadata?.username || cleanUsername)
    setMessage('Your profile has been updated successfully!')
  }

  // Remove bookmark
  const handleRemoveBookmark = async (mangaId) => {
    if (!user) return

    setRemovingId(mangaId)

    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', user.id)
      .eq('manga_id', mangaId)

    setRemovingId(null)

    if (error) {
      alert(`Could not remove bookmark: ${error.message}`)
      return
    }

    setBookmarks((current) =>
      current.filter((item) => item.id !== mangaId)
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#110e10] text-[#f4e9e9]">
        <div className="text-center">
          <LoaderCircle
            size={32}
            className="mx-auto animate-spin text-[#c58d98]"
          />
          <p className="mt-4 text-sm text-[#a9959a]">
            Loading your profile...
          </p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const joinedDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Unavailable'

  return (
    <main className="min-h-screen bg-[#110e10] px-4 py-8 text-[#f4e9e9] sm:px-6 sm:py-10">

      <div className="mx-auto max-w-5xl">

        {/* HEADER */}
        <header className="mb-10 flex items-center justify-between gap-4">
          <Link to="/" className="group flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#c69aa1]/30 bg-[#211a1e] transition group-hover:border-[#c69aa1]/70">
              <Emblem size={34} />
            </div>

            <div className="leading-none">
              <div className="font-display text-[23px] font-semibold tracking-[0.14em] text-[#f1e7e8]">
                ABYSSORA
              </div>
              <div className="mt-1.5 text-[8px] font-semibold tracking-[0.3em] text-[#a88b91]">
                WORLDS BEYOND STORIES
              </div>
            </div>
          </Link>

          <Link
            to="/"
            className="flex items-center gap-2 rounded-xl border border-[#c69aa1]/15 px-4 py-2.5 text-xs font-semibold text-[#c8b7ba] transition hover:border-[#c58d98]/50 hover:text-[#f4e9e9]"
          >
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">Back to home</span>
            <span className="sm:hidden">Home</span>
          </Link>
        </header>

        {/* PROFILE HERO */}
        <section className={`${panel} relative overflow-hidden`}>

          <div className="absolute inset-0 bg-gradient-to-br from-[#493039]/40 via-transparent to-transparent" />

          <div className="absolute -right-20 -top-32 h-80 w-80 rounded-full bg-[#c58d98]/[0.07] blur-[100px]" />

          <div className="relative flex flex-col gap-6 p-7 sm:flex-row sm:items-center sm:p-10">

            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl border border-[#c69aa1]/25 bg-[#c58d98]/[0.09] text-[#dfb9bf] shadow-xl shadow-black/20">
              <UserRound size={46} strokeWidth={1.4} />
            </div>

            <div className="min-w-0 flex-1">
              <SectionEyebrow icon={Sparkles}>
                Reader account
              </SectionEyebrow>

              <h1 className="truncate font-display text-4xl font-semibold tracking-wide text-[#f4e9e9] sm:text-5xl">
                {user.user_metadata?.username || 'Your Profile'}
              </h1>

              <p className="mt-2 text-sm text-[#b9a8ac]">
                Welcome to your personal corner of ABYSSORA.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#c69aa1]/20 bg-[#c58d98]/[0.07] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#d5a2aa]">
                  <ShieldCheck size={13} />
                  Member
                </span>

                <span className="text-xs text-[#89777c]">
                  Joined {joinedDate}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* READING STATISTICS */}
        <section className="mt-6 grid grid-cols-2 gap-4">

          <div className={`${panel} p-5 sm:p-6`}>
            <div className="flex items-center gap-2 text-xs font-medium text-[#a9959a]">
              <Bookmark size={16} className="text-[#d5a2aa]" />
              Bookmarked stories
            </div>

            <p className="mt-4 font-display text-4xl font-semibold text-[#f4e9e9]">
              {bookmarks.length}
            </p>

            <p className="mt-1 text-[10px] tracking-wide text-[#89777c]">
              Saved to your collection
            </p>
          </div>

          <div className={`${panel} p-5 sm:p-6`}>
            <div className="flex items-center gap-2 text-xs font-medium text-[#a9959a]">
              <BookOpen size={16} className="text-[#d5a2aa]" />
              Stories in progress
            </div>

            <p className="mt-4 font-display text-4xl font-semibold text-[#f4e9e9]">
              {readingHistory.length}
            </p>

            <p className="mt-1 text-[10px] tracking-wide text-[#89777c]">
              Reading activity recorded
            </p>
          </div>
        </section>

        {/* PROFILE SETTINGS */}
        <section className={`${panel} mt-8 overflow-hidden`}>

          <div className="border-b border-[#c69aa1]/10 px-6 py-6 sm:px-8">
            <SectionEyebrow icon={UserRound}>
              Account details
            </SectionEyebrow>

            <h2 className="font-display text-3xl font-semibold text-[#f4e9e9]">
              Profile settings
            </h2>

            <p className="mt-1 text-xs text-[#89777c]">
              Manage your personal account information.
            </p>
          </div>

          <div className="p-6 sm:p-8">
            <form onSubmit={handleSave}>

              {/* Username */}
              <div>
                <label className="mb-2 block text-xs font-semibold text-[#c8b7ba]">
                  Username
                </label>

                <div className="flex items-center gap-3 rounded-xl border border-[#c69aa1]/15 bg-[#110e10] px-4 py-3.5 transition focus-within:border-[#c58d98]/60">
                  <UserRound
                    size={18}
                    className="shrink-0 text-[#c58d98]"
                  />

                  <input
                    value={username}
                    onChange={(event) => {
                      setUsername(event.target.value)
                      setError('')
                      setMessage('')
                    }}
                    placeholder="Enter your username"
                    maxLength={20}
                    minLength={3}
                    required
                    className={inputStyle}
                  />
                </div>

                <p className="mt-2 text-[11px] text-[#89777c]">
                  Your username must be between 3 and 20 characters.
                </p>
              </div>

              {/* Email */}
              <div className="mt-7">
                <label className="mb-2 block text-xs font-semibold text-[#c8b7ba]">
                  Email address
                </label>

                <div className="flex items-center gap-3 rounded-xl border border-[#c69aa1]/10 bg-white/[0.025] px-4 py-3.5">
                  <Mail
                    size={18}
                    className="shrink-0 text-[#c58d98]"
                  />

                  <span className="min-w-0 truncate text-sm text-[#a9959a]">
                    {user.email}
                  </span>

                  <span className="ml-auto shrink-0 rounded-full border border-[#8caf9a]/20 bg-[#8caf9a]/[0.07] px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-[#9fc5ac]">
                    Account
                  </span>
                </div>
              </div>

              {/* Joined date */}
              <div className="mt-7">
                <label className="mb-2 block text-xs font-semibold text-[#c8b7ba]">
                  Member since
                </label>

                <div className="flex items-center gap-3 rounded-xl border border-[#c69aa1]/10 bg-white/[0.025] px-4 py-3.5">
                  <CalendarDays
                    size={18}
                    className="shrink-0 text-[#c58d98]"
                  />

                  <span className="text-sm text-[#a9959a]">
                    {joinedDate}
                  </span>
                </div>
              </div>

              {/* Feedback */}
              {error && (
                <div
                  role="alert"
                  className="mt-5 rounded-xl border border-[#d78383]/20 bg-[#d78383]/[0.08] p-3 text-sm text-[#e7a2a2]"
                >
                  {error}
                </div>
              )}

              {message && (
                <div
                  role="status"
                  className="mt-5 flex items-center gap-2 rounded-xl border border-[#8caf9a]/20 bg-[#8caf9a]/[0.07] p-3 text-sm text-[#a9d0b5]"
                >
                  <CheckCircle size={17} />
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-[#c58d98] px-5 py-3.5 text-sm font-bold text-[#211619] transition hover:bg-[#d5a2aa] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-48"
              >
                {saving ? (
                  <>
                    <LoaderCircle size={17} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={17} />
                    Save changes
                  </>
                )}
              </button>
            </form>
          </div>
        </section>

        {/* READING HISTORY */}
        <section className="mt-12">

          <div className="mb-6">
            <SectionEyebrow icon={Clock3}>
              Your activity
            </SectionEyebrow>

            <h2 className="font-display text-3xl font-semibold text-[#f4e9e9]">
              Recently Read
            </h2>

            <p className="mt-2 text-sm text-[#89777c]">
              Pick up where your last reading session ended.
            </p>
          </div>

          {loadingBookmarks ? (
            <div className={`${panel} p-12 text-center`}>
              <LoaderCircle
                size={28}
                className="mx-auto animate-spin text-[#c58d98]"
              />
              <p className="mt-3 text-sm text-[#a9959a]">
                Loading reading activity...
              </p>
            </div>
          ) : readingHistory.length === 0 ? (
            <div className={`${panel} p-10 text-center`}>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#c69aa1]/15 bg-[#c58d98]/[0.07]">
                <BookOpen size={30} className="text-[#d5a2aa]" />
              </div>

              <h3 className="mt-5 font-display text-2xl font-semibold">
                No reading activity yet
              </h3>

              <p className="mt-2 text-sm text-[#89777c]">
                Start reading a story and your progress will appear here.
              </p>

              <Link
                to="/"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#c58d98] px-5 py-3 text-sm font-bold text-[#211619] transition hover:bg-[#d5a2aa]"
              >
                Explore manga
                <ChevronRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {readingHistory.slice(0, 5).map((item) => (
                <Link
                  key={item.id}
                  to={`/manga/${item.id}/chapter/${item.lastReadChapter}`}
                  className="group flex items-center gap-4 rounded-2xl border border-[#c69aa1]/10 bg-[#191417] p-3 transition hover:border-[#c58d98]/40 hover:bg-[#211a1e]"
                >
                  <div className="h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-[#211a1e]">
                    {item.coverImage ? (
                      <img
                        src={item.coverImage}
                        alt={`${item.title} cover`}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${item.colors}`}>
                        <span className="text-2xl text-white/70">
                          {item.symbol}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-bold text-[#f4e9e9] transition group-hover:text-[#dfb9bf]">
                      {item.title}
                    </h3>

                    <p className="mt-1 text-xs text-[#d5a2aa]">
                      Chapter {item.lastReadChapter}
                    </p>

                    <p className="mt-2 text-[11px] text-[#89777c]">
                      {item.lastReadAt
                        ? new Date(item.lastReadAt).toLocaleDateString()
                        : 'Reading progress saved'}
                    </p>
                  </div>

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#c69aa1]/10 bg-[#211a1e] text-[#c58d98] transition group-hover:border-[#c58d98]/40">
                    <BookOpen size={17} />
                  </div>
                </Link>
              ))}

              <Link
                to="/library"
                className="inline-flex items-center gap-2 pt-3 text-xs font-semibold text-[#d5a2aa] transition hover:text-[#f1c8cf]"
              >
                View full reading history
                <ChevronRight size={15} />
              </Link>
            </div>
          )}
        </section>

        {/* BOOKMARKS */}
        <section className="mt-14">

          <div className="mb-6 flex items-end justify-between gap-3">
            <div>
              <SectionEyebrow icon={Bookmark}>
                Your collection
              </SectionEyebrow>

              <h2 className="font-display text-3xl font-semibold text-[#f4e9e9]">
                My Bookmarks
              </h2>

              <p className="mt-2 text-sm text-[#89777c]">
                All your favourite stories in one place.
              </p>
            </div>

            <div className="shrink-0 rounded-xl border border-[#c69aa1]/20 bg-[#c58d98]/[0.07] px-3 py-2 text-xs font-bold text-[#d5a2aa]">
              {bookmarks.length} Saved
            </div>
          </div>

          {loadingBookmarks ? (
            <div className={`${panel} p-12 text-center`}>
              <LoaderCircle
                size={28}
                className="mx-auto animate-spin text-[#c58d98]"
              />
              <p className="mt-4 text-sm text-[#a9959a]">
                Loading your bookmarks...
              </p>
            </div>
          ) : bookmarks.length === 0 ? (
            <div className={`${panel} p-12 text-center`}>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#c69aa1]/15 bg-[#c58d98]/[0.07]">
                <Bookmark size={30} className="text-[#d5a2aa]" />
              </div>

              <h3 className="mt-5 font-display text-2xl font-semibold">
                Your collection is empty
              </h3>

              <p className="mt-2 text-sm text-[#89777c]">
                Explore ABYSSORA and bookmark stories you love.
              </p>

              <Link
                to="/"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#c58d98] px-5 py-3 text-sm font-bold text-[#211619] transition hover:bg-[#d5a2aa]"
              >
                Explore manga
                <ChevronRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {bookmarks.map((item) => (
                <article
                  key={item.id}
                  className="group min-w-0 overflow-hidden rounded-2xl border border-[#c69aa1]/10 bg-[#191417] transition hover:-translate-y-1 hover:border-[#c58d98]/40"
                >
                  <Link
                    to={`/manga/${item.id}`}
                    className="relative block aspect-[3/4] overflow-hidden bg-[#211a1e]"
                  >
                    {item.coverImage ? (
                      <img
                        src={item.coverImage}
                        alt={`${item.title} cover`}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${item.colors}`}>
                        <span className="text-6xl text-white/70">
                          {item.symbol}
                        </span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                    <div className="absolute bottom-3 left-3 rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-white/80 backdrop-blur-sm">
                      {item.status}
                    </div>
                  </Link>

                  <div className="p-3">
                    <Link
                      to={`/manga/${item.id}`}
                      className="block truncate text-sm font-bold text-[#f4e9e9] transition hover:text-[#dfb9bf]"
                    >
                      {item.title}
                    </Link>

                    <p className="mt-1 truncate text-[10px] text-[#89777c]">
                      {item.genre}
                    </p>

                    <button
                      onClick={() => handleRemoveBookmark(item.id)}
                      disabled={removingId === item.id}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-[#d78383]/20 bg-[#d78383]/[0.05] px-3 py-2.5 text-[10px] font-semibold text-[#d99a9a] transition hover:border-[#d78383]/40 hover:bg-[#d78383]/[0.12] disabled:opacity-50"
                    >
                      {removingId === item.id ? (
                        <>
                          <LoaderCircle size={14} className="animate-spin" />
                          Removing...
                        </>
                      ) : (
                        <>
                          <Trash2 size={14} />
                          Remove bookmark
                        </>
                      )}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* FOOTER */}
        <footer className="mt-14 border-t border-[#c69aa1]/10 py-7 text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <Emblem size={23} />
            <span className="font-display text-sm font-semibold tracking-[0.18em] text-[#c8b7ba]">
              ABYSSORA
            </span>
          </div>

          <p className="text-[10px] tracking-wide text-[#75666a]">
            Your journey through endless stories starts here.
          </p>
        </footer>

      </div>
    </main>
  )
}

export default Profile