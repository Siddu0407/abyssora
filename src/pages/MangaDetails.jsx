
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Bookmark,
  Star,
  BookOpen,
  CalendarDays,
  User,
  ChevronRight,
  Sparkles,
  LoaderCircle,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'

import { supabase } from '../lib/supabase'

export default function MangaDetails() {
  const { id } = useParams()

  const [story, setStory] = useState(null)
  const [chapters, setChapters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [imageFailed, setImageFailed] = useState(false)

  const [bookmarked, setBookmarked] = useState(false)
  const [bookmarkUser, setBookmarkUser] = useState(null)
  const [bookmarkLoading, setBookmarkLoading] = useState(true)
  const [bookmarkSaving, setBookmarkSaving] = useState(false)
  const [bookmarkMessage, setBookmarkMessage] = useState('')

  // Load manga and its published chapters.
  useEffect(() => {
    let cancelled = false

    const loadManga = async () => {
      setLoading(true)
      setError('')
      setImageFailed(false)

      try {
        const { data: comic, error: comicError } = await supabase
          .from('comics')
          .select('*')
          .eq('id', id)
          .maybeSingle()

        if (comicError) throw comicError

        if (!comic) {
          if (!cancelled) {
            setStory(null)
            setChapters([])
          }
          return
        }

        const { data: chapterData, error: chapterError } =
          await supabase
            .from('chapters')
            .select('id, chapter_number, title, pages, is_published')
            .eq('comic_id', id)
            .eq('is_published', true)
            .order('chapter_number', { ascending: false })

        if (chapterError) throw chapterError

        if (cancelled) return

        setStory({
          ...comic,
          coverImage: comic.cover_image,
          genres: Array.isArray(comic.genres)
            ? comic.genres
            : comic.genre
              ? [comic.genre]
              : [],
          chapters: Number(comic.chapters) || 0,
          rating: comic.rating || 'N/A',
          year: comic.year || '',
          author: comic.author || 'Unknown',
          description: comic.description || '',
          colors:
            comic.colors ||
            'from-violet-950 via-purple-900 to-black',
          symbol: comic.symbol || '✧',
          status: comic.status || 'Ongoing',
        })

        setChapters(chapterData || [])
      } catch (err) {
        console.error('Could not load manga:', err)

        if (!cancelled) {
          setError('Could not load this manga. Please try again.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadManga()

    return () => {
      cancelled = true
    }
  }, [id])

  // Load the signed-in user's bookmark status.
  useEffect(() => {
    let cancelled = false

    const checkBookmark = async (user) => {
      if (!user) {
        if (!cancelled) {
          setBookmarkUser(null)
          setBookmarked(false)
          setBookmarkLoading(false)
        }
        return
      }

      const { data, error } = await supabase
        .from('bookmarks')
        .select('manga_id')
        .eq('user_id', user.id)
        .eq('manga_id', id)
        .maybeSingle()

      if (cancelled) return

      if (error) {
        console.error('Could not load bookmark:', error)
        setBookmarkMessage('Could not check your saved library.')
        setBookmarked(false)
      } else {
        setBookmarked(Boolean(data))
        setBookmarkMessage('')
      }

      setBookmarkUser(user)
      setBookmarkLoading(false)
    }

    const loadBookmark = async () => {
      setBookmarkLoading(true)

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (cancelled) return

      if (error) {
        console.error('Could not check signed-in user:', error)
        setBookmarkLoading(false)
        return
      }

      await checkBookmark(user)
    }

    loadBookmark()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      checkBookmark(session?.user || null)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [id])

  // Add or remove a bookmark in Supabase.
  const toggleBookmark = async () => {
    if (bookmarkSaving) return

    setBookmarkMessage('')

    try {
      setBookmarkSaving(true)

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) throw userError

      if (!user) {
        setBookmarkMessage('Please sign in to save this manga.')
        return
      }

      if (bookmarked) {
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('manga_id', id)

        if (error) throw error

        setBookmarked(false)
        setBookmarkMessage('Removed from your library.')
      } else {
        const { error } = await supabase
          .from('bookmarks')
          .insert({
            user_id: user.id,
            manga_id: id,
          })

        if (error) throw error

        setBookmarked(true)
        setBookmarkMessage('Successfully saved to your library!')
      }

      setBookmarkUser(user)
    } catch (err) {
      console.error('Bookmark error:', err)
      setBookmarkMessage('Could not update your library. Please try again.')
    } finally {
      setBookmarkSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#09090e] text-white">
        <div className="text-center">
          <LoaderCircle
            size={35}
            className="mx-auto animate-spin text-purple-400"
          />
          <p className="mt-4 text-sm text-gray-400">
            Loading manga...
          </p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#09090e] px-5 text-white">
        <h1 className="text-3xl font-black">Something went wrong</h1>
        <p className="mt-3 text-center text-gray-400">{error}</p>
        <Link to="/" className="mt-6 rounded-xl bg-purple-600 px-6 py-3">
          Return home
        </Link>
      </main>
    )
  }

  if (!story) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#09090e] px-5 text-white">
        <h1 className="text-4xl font-black">Story not found</h1>
        <p className="mt-3 text-gray-400">
          This manga does not exist in our library.
        </p>
        <Link to="/" className="mt-6 rounded-xl bg-purple-600 px-6 py-3">
          Return home
        </Link>
      </main>
    )
  }

  const latestChapter = chapters[0]?.chapter_number || 0

  return (
    <main className="min-h-screen bg-[#09090e] text-white">

      {/* NAVIGATION */}
      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#09090e]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">

          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600">
              <Sparkles size={20} />
            </div>

            <span className="font-black tracking-widest">
              ABYSS<span className="text-purple-400">ORA</span>
            </span>
          </Link>

          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-gray-400 transition hover:text-white"
          >
            <ArrowLeft size={17} />
            Back to library
          </Link>

        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-white/[0.06]">

        <div className="absolute inset-0 bg-gradient-to-br from-purple-950/50 via-[#09090e] to-[#09090e]" />

        <div className="absolute -right-20 top-0 h-96 w-96 rounded-full bg-purple-700/10 blur-[100px]" />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-12 md:grid-cols-[280px_1fr] md:py-16">

          {/* COVER */}
          <div className="group relative mx-auto aspect-[3/4] w-full max-w-[280px] overflow-hidden rounded-2xl border border-white/10 bg-[#171322] shadow-2xl shadow-purple-950/40">

            {!imageFailed && story.coverImage ? (
              <img
                src={story.coverImage}
                alt={`${story.title} cover`}
                onError={() => setImageFailed(true)}
                className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
              />
            ) : (
              <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${story.colors}`}>
                <span className="text-9xl text-white/70">
                  {story.symbol}
                </span>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            <div className="absolute bottom-5 left-5 right-5">
              <p className="text-xs font-bold tracking-[0.2em] text-purple-300">
                ABYSSORA
              </p>
            </div>

          </div>

          {/* INFORMATION */}
          <div className="flex flex-col justify-center">

            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-purple-500/15 px-3 py-1 text-xs font-bold text-purple-300">
                {story.status}
              </span>

              {story.year && (
                <span className="text-xs text-gray-500">
                  {story.year}
                </span>
              )}
            </div>

            <h1 className="text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
              {story.title}
            </h1>

            {/* STATISTICS */}
            <div className="mt-6 flex flex-wrap gap-6 text-sm text-gray-400">

              <span className="flex items-center gap-2">
                <Star size={17} className="fill-yellow-400 text-yellow-400" />
                {story.rating}
              </span>

              <span className="flex items-center gap-2">
                <BookOpen size={17} />
                {chapters.length} published chapters
              </span>

              {story.year && (
                <span className="flex items-center gap-2">
                  <CalendarDays size={17} />
                  {story.year}
                </span>
              )}

            </div>

            {/* GENRES */}
            <div className="mt-6 flex flex-wrap gap-2">
              {story.genres.map((genre) => (
                <span
                  key={genre}
                  className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-gray-300"
                >
                  {genre}
                </span>
              ))}
            </div>

            {/* DESCRIPTION */}
            <p className="mt-7 max-w-2xl text-sm leading-8 text-gray-400">
              {story.description}
            </p>

            {/* AUTHOR */}
            <div className="mt-7 flex items-center gap-2 text-sm text-gray-400">
              <User size={17} />
              Author:
              <span className="text-white">{story.author}</span>
            </div>

            {/* ACTIONS */}
            <div className="mt-8 flex flex-wrap gap-3">

              <a
                href="#chapters"
                className="flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-3.5 text-sm font-bold transition hover:-translate-y-1 hover:bg-purple-500"
              >
                <BookOpen size={18} />
                Read chapters
              </a>

              <button
                onClick={toggleBookmark}
                disabled={bookmarkLoading || bookmarkSaving}
                aria-pressed={bookmarked}
                className={`flex items-center gap-2 rounded-xl border px-5 py-3.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  bookmarked
                    ? 'border-purple-500 bg-purple-500/15 text-purple-300'
                    : 'border-white/15 hover:border-purple-400 hover:text-purple-300'
                }`}
              >
                {bookmarkSaving ? (
                  <LoaderCircle size={17} className="animate-spin" />
                ) : (
                  <Bookmark
                    size={17}
                    fill={bookmarked ? 'currentColor' : 'none'}
                  />
                )}

                {bookmarkLoading
                  ? 'Checking...'
                  : bookmarkSaving
                    ? 'Saving...'
                    : bookmarked
                      ? 'Saved to library'
                      : 'Save to library'}
              </button>

            </div>

            {/* BOOKMARK FEEDBACK */}
            {bookmarkMessage && (
              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                {bookmarkMessage.includes('Successfully') ||
                bookmarkMessage.includes('Removed') ? (
                  <CheckCircle size={16} className="text-green-400" />
                ) : (
                  <AlertCircle size={16} className="text-yellow-400" />
                )}

                <span className="text-gray-300">
                  {bookmarkMessage}
                </span>

                {bookmarkMessage.includes('sign in') && (
                  <Link
                    to="/login"
                    className="font-bold text-purple-400 hover:text-purple-300"
                  >
                    Sign in
                  </Link>
                )}
              </div>
            )}

          </div>
        </div>
      </section>

      {/* CHAPTERS */}
      <section
        id="chapters"
        className="mx-auto max-w-7xl px-5 py-12"
      >

        <div className="mb-7 flex flex-wrap items-end justify-between gap-3">

          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-purple-400">
              Continue the journey
            </div>

            <h2 className="text-2xl font-black sm:text-3xl">
              Chapters
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              {chapters.length} published chapters available
            </p>
          </div>

          {latestChapter > 0 && (
            <span className="rounded-lg border border-white/10 px-3 py-2 text-xs text-gray-400">
              Latest: Chapter {latestChapter}
            </span>
          )}

        </div>

        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">

          {chapters.length > 0 ? (
            chapters.slice(0, 5).map((chapter, index) => (
              <Link
                key={chapter.id}
                to={`/manga/${story.id}/chapter/${chapter.chapter_number}`}
                className={`group flex items-center justify-between gap-3 p-5 transition hover:bg-purple-500/[0.07] ${
                  index !== Math.min(chapters.length, 5) - 1
                    ? 'border-b border-white/[0.06]'
                    : ''
                }`}
              >

                <div>
                  <p className="text-sm font-semibold transition group-hover:text-purple-300">
                    Chapter {chapter.chapter_number}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    {chapter.title || 'Read chapter'}
                  </p>
                </div>

                <div className="flex items-center gap-3">

                  {index === 0 && (
                    <span className="rounded-full bg-purple-500/15 px-2 py-1 text-[10px] font-bold text-purple-300">
                      LATEST
                    </span>
                  )}

                  <ChevronRight
                    size={18}
                    className="text-gray-500 transition group-hover:translate-x-1 group-hover:text-purple-400"
                  />

                </div>

              </Link>
            ))
          ) : (
            <div className="px-5 py-12 text-center">
              <BookOpen size={32} className="mx-auto text-gray-600" />

              <p className="mt-4 font-semibold text-gray-300">
                No published chapters yet
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Chapters will appear here once an administrator publishes them.
              </p>
            </div>
          )}

        </div>

        {chapters.length > 5 && (
          <p className="mt-5 text-center text-xs text-gray-500">
            Showing the latest 5 published chapters.
          </p>
        )}

      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.07] px-5 py-8 text-center text-xs text-gray-600">
        © 2026 ABYSSORA. A universe of stories awaits.
      </footer>

    </main>
  )
}
