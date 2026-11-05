
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Bookmark,
  BookOpen,
  Clock3,
  Play,
  Trash2,
  Sparkles,
  Library as LibraryIcon,
  LoaderCircle,
} from 'lucide-react'

import { supabase } from '../lib/supabase'
import { manga } from '../data/manga'

export default function Library() {
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [bookmarks, setBookmarks] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState(null)
  const [activeTab, setActiveTab] = useState('bookmarks')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const loadLibrary = async () => {
      setLoading(true)
      setError('')

      try {
        const {
          data: { user: currentUser },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError) throw userError

        if (!currentUser) {
          navigate('/login')
          return
        }

        if (!active) return

        setUser(currentUser)

        const [bookmarkResult, historyResult] = await Promise.all([
          supabase
            .from('bookmarks')
            .select('manga_id, created_at')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false }),

          supabase
            .from('reading_history')
            .select('manga_id, chapter_number, updated_at')
            .eq('user_id', currentUser.id)
            .order('updated_at', { ascending: false }),
        ])

        if (bookmarkResult.error) throw bookmarkResult.error
        if (historyResult.error) throw historyResult.error

        if (!active) return

        const savedManga = bookmarkResult.data
          .map((item) => {
            const story = manga.find((entry) => entry.id === item.manga_id)

            return story ? { ...story, savedAt: item.created_at } : null
          })
          .filter(Boolean)

        const readingManga = historyResult.data
          .map((item) => {
            const story = manga.find((entry) => entry.id === item.manga_id)

            return story
              ? {
                  ...story,
                  lastReadChapter: item.chapter_number,
                  lastReadAt: item.updated_at,
                }
              : null
          })
          .filter(Boolean)

        setBookmarks(savedManga)
        setHistory(readingManga)
      } catch (err) {
        console.error('Could not load library:', err)

        if (active) {
          setError('Could not load your library. Please refresh and try again.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadLibrary()

    return () => {
      active = false
    }
  }, [navigate])

  const removeBookmark = async (mangaId) => {
    if (!user || removingId) return

    setRemovingId(mangaId)
    setError('')

    try {
      const { error: deleteError } = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('manga_id', mangaId)

      if (deleteError) throw deleteError

      setBookmarks((current) =>
        current.filter((story) => story.id !== mangaId)
      )
    } catch (err) {
      console.error('Could not remove bookmark:', err)
      setError('Could not remove this bookmark. Please try again.')
    } finally {
      setRemovingId(null)
    }
  }

  const formatDate = (date) => {
    if (!date) return ''

    return new Date(date).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#09090e] text-white">
        <div className="text-center">
          <LoaderCircle className="mx-auto animate-spin text-purple-400" size={34} />
          <p className="mt-4 text-sm text-gray-400">Loading your library...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#09090e] text-white">

      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#09090e]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">

          <Link to="/" className="flex items-center gap-2">
            <Sparkles className="text-purple-400" size={23} />
            <span className="text-lg font-black tracking-widest">
              ABYSS<span className="text-purple-400">ORA</span>
            </span>
          </Link>

          <Link
            to="/profile"
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-300 transition hover:border-purple-500 hover:text-white"
          >
            My Profile
          </Link>

        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10">

        {/* PAGE INTRO */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-purple-300"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        <div className="mt-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">

          <div>
            <div className="flex items-center gap-2 text-purple-400">
              <LibraryIcon size={19} />
              <span className="text-xs font-bold uppercase tracking-[0.25em]">
                Your collection
              </span>
            </div>

            <h1 className="mt-3 text-4xl font-black sm:text-5xl">
              My Library<span className="text-purple-400">.</span>
            </h1>

            <p className="mt-3 text-sm text-gray-500">
              Welcome back{user?.user_metadata?.username
                ? `, ${user.user_metadata.username}`
                : ''}. Your manga journey continues here.
            </p>
          </div>

          <div className="flex gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3">
              <p className="text-2xl font-black">{bookmarks.length}</p>
              <p className="text-xs text-gray-500">Bookmarks</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3">
              <p className="text-2xl font-black">{history.length}</p>
              <p className="text-xs text-gray-500">Reading</p>
            </div>
          </div>

        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* TABS */}
        <div className="mt-10 flex gap-3 border-b border-white/10">

          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`flex items-center gap-2 border-b-2 px-4 py-4 text-sm font-bold transition ${
              activeTab === 'bookmarks'
                ? 'border-purple-500 text-purple-300'
                : 'border-transparent text-gray-500 hover:text-white'
            }`}
          >
            <Bookmark size={17} />
            Bookmarks ({bookmarks.length})
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 border-b-2 px-4 py-4 text-sm font-bold transition ${
              activeTab === 'history'
                ? 'border-purple-500 text-purple-300'
                : 'border-transparent text-gray-500 hover:text-white'
            }`}
          >
            <Clock3 size={17} />
            Reading History ({history.length})
          </button>

        </div>

        {/* BOOKMARKS */}
        {activeTab === 'bookmarks' && (
          <section className="mt-8">

            {bookmarks.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-white/[0.02] px-5 py-16 text-center">
                <Bookmark className="mx-auto text-gray-600" size={42} />

                <h2 className="mt-5 text-xl font-bold">
                  Your library is waiting
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  Bookmark your favourite manga and they will appear here.
                </p>

                <Link
                  to="/"
                  className="mt-6 inline-flex rounded-xl bg-purple-600 px-6 py-3 text-sm font-bold transition hover:bg-purple-500"
                >
                  Explore Manga
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">

                {bookmarks.map((story) => (
                  <article
                    key={story.id}
                    className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:-translate-y-1 hover:border-purple-500/40"
                  >
                    <Link to={`/manga/${story.id}`}>
                      <div className={`relative aspect-[3/4] overflow-hidden bg-gradient-to-br ${story.colors || 'from-purple-950 to-black'}`}>

                        {story.coverImage && (
                          <img
                            src={story.coverImage}
                            alt={story.title}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                        )}

                        <div className="absolute inset-0 flex items-center justify-center">
                          {!story.coverImage && (
                            <span className="text-6xl text-white/60">
                              {story.symbol || '◇'}
                            </span>
                          )}
                        </div>

                        <span className="absolute left-3 top-3 rounded-lg bg-black/60 px-2 py-1 text-[10px] font-bold text-purple-200 backdrop-blur">
                          {story.status}
                        </span>

                      </div>
                    </Link>

                    <div className="p-3">
                      <Link to={`/manga/${story.id}`}>
                        <h3 className="truncate text-sm font-bold transition hover:text-purple-300">
                          {story.title}
                        </h3>
                      </Link>

                      <p className="mt-1 text-xs text-gray-500">
                        {story.genre} · {story.chapter}
                      </p>

                      <button
                        onClick={() => removeBookmark(story.id)}
                        disabled={removingId === story.id}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/20 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
                      >
                        {removingId === story.id ? (
                          <LoaderCircle size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                        Remove
                      </button>
                    </div>
                  </article>
                ))}

              </div>
            )}

          </section>
        )}

        {/* READING HISTORY */}
        {activeTab === 'history' && (
          <section className="mt-8">

            {history.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-white/[0.02] px-5 py-16 text-center">
                <BookOpen className="mx-auto text-gray-600" size={42} />

                <h2 className="mt-5 text-xl font-bold">
                  No reading history yet
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  Start reading a manga and your progress will appear here.
                </p>

                <Link
                  to="/"
                  className="mt-6 inline-flex rounded-xl bg-purple-600 px-6 py-3 text-sm font-bold transition hover:bg-purple-500"
                >
                  Start Reading
                </Link>
              </div>
            ) : (
              <div className="space-y-4">

                {history.map((story) => (
                  <article
                    key={story.id}
                    className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-purple-500/30 sm:flex-row sm:items-center"
                  >

                    <Link
                      to={`/manga/${story.id}`}
                      className={`flex h-28 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br ${story.colors || 'from-purple-950 to-black'} sm:w-24`}
                    >
                      {story.coverImage ? (
                        <img
                          src={story.coverImage}
                          alt={story.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-4xl text-white/60">
                          {story.symbol || '◇'}
                        </span>
                      )}
                    </Link>

                    <div className="min-w-0 flex-1">
                      <Link to={`/manga/${story.id}`}>
                        <h3 className="text-lg font-bold transition hover:text-purple-300">
                          {story.title}
                        </h3>
                      </Link>

                      <p className="mt-1 text-sm text-gray-500">
                        {story.genre}
                      </p>

                      <p className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                        <Clock3 size={14} className="text-purple-400" />
                        Last read: Chapter {story.lastReadChapter}
                      </p>

                      <p className="mt-1 text-xs text-gray-600">
                        {formatDate(story.lastReadAt)}
                      </p>
                    </div>

                    <Link
                      to={`/manga/${story.id}/chapter/${story.lastReadChapter}`}
                      className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold transition hover:bg-purple-500"
                    >
                      <Play size={16} fill="currentColor" />
                      Continue
                    </Link>

                  </article>
                ))}

              </div>
            )}

          </section>
        )}

      </div>

      <footer className="mt-16 border-t border-white/10 py-7 text-center text-xs text-gray-600">
        © 2026 ABYSSORA · Your manga universe
      </footer>

    </main>
  )
}
