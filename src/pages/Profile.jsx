
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Sparkles,
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
} from 'lucide-react'

import { supabase } from '../lib/supabase'

function formatComic(comic) {
  const genres = Array.isArray(comic.genres)
    ? comic.genres.join(', ')
    : comic.genres || comic.genre || 'Uncategorized'

  return {
    ...comic,
    coverImage: comic.cover_image || '',
    genre: genres,
    colors: comic.colors || 'from-purple-950 via-violet-900 to-slate-950',
    symbol: comic.symbol || '✧',
    status: comic.status || 'Ongoing',
  }
}

export default function Profile() {
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

  // Load bookmarks and reading activity from Supabase
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
        console.error('Could not load bookmarks:', bookmarkResult.error.message)
      }

      if (historyResult.error) {
        console.error('Could not load reading history:', historyResult.error.message)
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

  // Save username to Supabase authentication metadata
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

  // Remove bookmark from Supabase
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
      <div className="flex min-h-screen items-center justify-center bg-[#09090e] text-white">
        <div className="text-center">
          <LoaderCircle size={32} className="mx-auto animate-spin text-purple-400" />
          <p className="mt-4 text-sm text-gray-400">
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
    <main className="min-h-screen bg-[#09090e] px-5 py-10 text-white">
      <div className="mx-auto max-w-4xl">

        {/* HEADER */}
        <header className="mb-10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-violet-800">
              <Sparkles size={22} />
            </div>

            <span className="text-xl font-black tracking-[0.12em]">
              ABYSS<span className="text-purple-400">ORA</span>
            </span>
          </Link>

          <Link
            to="/"
            className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-300 transition hover:border-purple-500 hover:text-white"
          >
            <ArrowLeft size={16} />
            Home
          </Link>
        </header>

        {/* PROFILE CARD */}
        <section className="overflow-hidden rounded-3xl border border-purple-500/20 bg-[#111019] shadow-2xl shadow-purple-950/10">

          <div className="relative overflow-hidden border-b border-white/[0.07] bg-gradient-to-br from-[#29164b] to-[#111019] px-7 py-10">
            <div className="absolute -right-10 -top-16 h-48 w-48 rounded-full bg-purple-500/20 blur-3xl" />

            <div className="relative flex items-center gap-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-purple-300/20 bg-purple-500/20 text-purple-200">
                <UserRound size={38} />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-300">
                  Reader account
                </p>

                <h1 className="mt-2 truncate text-3xl font-black">
                  {user.user_metadata?.username || 'Your Profile'}
                </h1>

                <p className="mt-1 text-sm text-gray-400">
                  Welcome to ABYSSORA.
                </p>
              </div>
            </div>
          </div>

          <div className="p-7">
            <div className="mb-8">
              <h2 className="text-xl font-extrabold">Profile settings</h2>

              <p className="mt-2 text-sm text-gray-500">
                Manage your account information.
              </p>
            </div>

            <form onSubmit={handleSave}>
              <label className="mb-2 block text-sm font-semibold text-gray-300">
                Username
              </label>

              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 transition focus-within:border-purple-500/60">
                <UserRound size={18} className="shrink-0 text-purple-400" />

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
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-gray-600"
                />
              </div>

              <p className="mt-2 text-xs text-gray-600">
                Your username must be between 3 and 20 characters.
              </p>

              <div className="mt-7">
                <label className="mb-2 block text-sm font-semibold text-gray-300">
                  Email address
                </label>

                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <Mail size={18} className="shrink-0 text-purple-400" />

                  <span className="min-w-0 truncate text-sm text-gray-400">
                    {user.email}
                  </span>
                </div>
              </div>

              <div className="mt-7">
                <label className="mb-2 block text-sm font-semibold text-gray-300">
                  Member since
                </label>

                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <CalendarDays size={18} className="shrink-0 text-purple-400" />

                  <span className="text-sm text-gray-400">
                    {joinedDate}
                  </span>
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300"
                >
                  {error}
                </div>
              )}

              {message && (
                <div
                  role="status"
                  className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300"
                >
                  <CheckCircle size={17} />
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3.5 text-sm font-bold transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
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

        {/* READING STATISTICS */}
        <section className="mt-8 grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-purple-500/20 bg-[#111019] p-5">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Bookmark size={17} className="text-purple-400" />
              Bookmarked stories
            </div>

            <p className="mt-3 text-3xl font-black text-white">
              {bookmarks.length}
            </p>
          </div>

          <div className="rounded-2xl border border-purple-500/20 bg-[#111019] p-5">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <BookOpen size={17} className="text-purple-400" />
              Stories in progress
            </div>

            <p className="mt-3 text-3xl font-black text-white">
              {readingHistory.length}
            </p>
          </div>
        </section>

        {/* READING HISTORY */}
        <section className="mt-10">
          <div className="mb-6">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-purple-400">
              <Clock3 size={15} />
              Your activity
            </div>

            <h2 className="text-2xl font-extrabold">
              Recently Read
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Pick up where your last reading session ended.
            </p>
          </div>

          {loadingBookmarks ? (
            <div className="rounded-2xl border border-white/10 bg-[#111019] p-10 text-center">
              <LoaderCircle size={26} className="mx-auto animate-spin text-purple-400" />
              <p className="mt-3 text-sm text-gray-400">
                Loading reading activity...
              </p>
            </div>
          ) : readingHistory.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#111019] p-10 text-center">
              <BookOpen size={34} className="mx-auto text-purple-400" />

              <h3 className="mt-4 text-lg font-bold">
                No reading activity yet
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Start reading a story and your progress will appear here.
              </p>

              <Link
                to="/"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold transition hover:bg-purple-500"
              >
                Explore manga
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {readingHistory.slice(0, 5).map((item) => (
                <Link
                  key={item.id}
                  to={`/manga/${item.id}/chapter/${item.lastReadChapter}`}
                  className="flex items-center gap-4 rounded-2xl border border-white/10 bg-[#111019] p-3 transition hover:border-purple-500/40"
                >
                  <div className="h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-[#171322]">
                    {item.coverImage ? (
                      <img
                        src={item.coverImage}
                        alt={`${item.title} cover`}
                        className="h-full w-full object-cover"
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
                    <h3 className="truncate text-sm font-bold">
                      {item.title}
                    </h3>

                    <p className="mt-1 text-xs text-purple-300">
                      Chapter {item.lastReadChapter}
                    </p>

                    <p className="mt-2 text-xs text-gray-500">
                      {item.lastReadAt
                        ? new Date(item.lastReadAt).toLocaleDateString()
                        : 'Reading progress saved'}
                    </p>
                  </div>

                  <BookOpen size={18} className="shrink-0 text-purple-400" />
                </Link>
              ))}

              <Link
                to="/library"
                className="inline-flex items-center gap-2 pt-2 text-sm font-semibold text-purple-300 transition hover:text-purple-200"
              >
                View full reading history
                <ArrowLeft size={15} className="rotate-180" />
              </Link>
            </div>
          )}
        </section>

        {/* SAVED MANGA */}
        <section className="mt-12">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-purple-400">
                <Bookmark size={15} />
                Your collection
              </div>

              <h2 className="text-2xl font-extrabold">
                My Bookmarks
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                All your favourite stories in one place.
              </p>
            </div>

            <div className="rounded-xl border border-purple-500/20 bg-purple-500/10 px-4 py-2 text-sm font-bold text-purple-300">
              {bookmarks.length} Saved
            </div>
          </div>

          {loadingBookmarks ? (
            <div className="rounded-2xl border border-white/10 bg-[#111019] p-12 text-center">
              <LoaderCircle size={28} className="mx-auto animate-spin text-purple-400" />
              <p className="mt-4 text-sm text-gray-400">
                Loading your bookmarks...
              </p>
            </div>
          ) : bookmarks.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#111019] p-12 text-center">
              <BookOpen size={36} className="mx-auto text-purple-400" />

              <h3 className="mt-5 text-lg font-bold">
                Your collection is empty
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Explore ABYSSORA and bookmark stories you love.
              </p>

              <Link
                to="/"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold transition hover:bg-purple-500"
              >
                Explore manga
                <ArrowLeft size={16} className="rotate-180" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {bookmarks.map((item) => (
                <article
                  key={item.id}
                  className="group min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#111019] transition hover:-translate-y-1 hover:border-purple-500/40"
                >
                  <Link
                    to={`/manga/${item.id}`}
                    className="relative block aspect-[3/4] overflow-hidden bg-[#171322]"
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

                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  </Link>

                  <div className="p-3">
                    <Link
                      to={`/manga/${item.id}`}
                      className="block truncate text-sm font-bold transition hover:text-purple-300"
                    >
                      {item.title}
                    </Link>

                    <p className="mt-1 text-xs text-gray-500">
                      {item.genre}
                    </p>

                    <button
                      onClick={() => handleRemoveBookmark(item.id)}
                      disabled={removingId === item.id}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/20 bg-red-500/[0.06] px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/15 disabled:opacity-50"
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

        <p className="mt-10 text-center text-xs text-gray-600">
          Your journey through endless stories starts here.
        </p>

      </div>
    </main>
  )
}
