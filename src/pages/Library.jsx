import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  Clock3,
  Play,
  Trash2,
  Library as LibraryIcon,
  LoaderCircle,
  AlertCircle,
  Sparkles,
  ArrowUpRight,
  BookmarkCheck,
  CalendarDays,
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

function formatComic(comic) {
  return {
    ...comic,
    coverImage: comic.cover_image || '',
    genre: Array.isArray(comic.genres)
      ? comic.genres.join(', ')
      : comic.genre || 'Uncategorized',
    colors: comic.colors || 'from-stone-900 via-[#38272d] to-black',
    symbol: comic.symbol || '◇',
    status: comic.status || 'Ongoing',
    chapter: comic.chapter || 'Chapter 1',
  }
}

function formatDate(date) {
  if (!date) return 'Recently'
  const value = new Date(date)
  if (Number.isNaN(value.getTime())) return 'Recently'
  return value.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getProgress(story) {
  const current = Number(story.lastReadChapter)
  const total = Number(story.chapters)
  if (!Number.isFinite(current) || !Number.isFinite(total) || total <= 0) return null
  return Math.min(100, Math.max(0, Math.round(((current + 1) / total) * 100)))
}

function SectionEyebrow({ children, icon: Icon }) {
  return (
    <div className="flex items-center gap-2 text-[#c99aa2]">
      {Icon && <Icon size={16} />}
      <span className="text-[10px] font-bold uppercase tracking-[0.28em]">
        {children}
      </span>
    </div>
  )
}

function EmptyState({ icon: Icon, title, description, buttonText }) {
  return (
    <div className="rounded-3xl border border-[#dcb1b9]/10 bg-[#191417] px-5 py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#c58d98]/20 bg-[#c58d98]/[0.07]">
        <Icon size={29} className="text-[#c58d98]" />
      </div>
      <h2 className="mt-6 font-display text-2xl font-semibold text-[#f4e9e9]">
        {title}
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#a9959a]">
        {description}
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#c58d98] px-5 py-3 text-xs font-bold text-[#211619] transition hover:bg-[#d5a2aa]"
      >
        {buttonText}
        <ArrowUpRight size={15} />
      </Link>
    </div>
  )
}

function Cover({ story, className = '' }) {
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${story.colors} ${className}`}>
      {story.coverImage ? (
        <img
          src={story.coverImage}
          alt={`${story.title} cover`}
          loading="lazy"
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <span className="font-display text-5xl text-white/60">{story.symbol}</span>
        </div>
      )}
    </div>
  )
}

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

        const bookmarkRecords = bookmarkResult.data || []
        const historyRecords = historyResult.data || []
        const comicIds = [
          ...new Set([
            ...bookmarkRecords.map((item) => item.manga_id),
            ...historyRecords.map((item) => item.manga_id),
          ]),
        ]

        let comicMap = new Map()
        if (comicIds.length > 0) {
          const { data: comics, error: comicsError } = await supabase
            .from('comics')
            .select('*')
            .in('id', comicIds)
          if (comicsError) throw comicsError
          comicMap = new Map((comics || []).map((comic) => [comic.id, formatComic(comic)]))
        }

        if (!active) return

        setBookmarks(
          bookmarkRecords
            .map((item) => {
              const comic = comicMap.get(item.manga_id)
              return comic ? { ...comic, savedAt: item.created_at } : null
            })
            .filter(Boolean)
        )
        setHistory(
          historyRecords
            .map((item) => {
              const comic = comicMap.get(item.manga_id)
              return comic
                ? {
                    ...comic,
                    lastReadChapter: item.chapter_number,
                    lastReadAt: item.updated_at,
                  }
                : null
            })
            .filter(Boolean)
        )
      } catch (err) {
        console.error('Could not load library:', err)
        if (active) setError('Could not load your library. Please refresh and try again.')
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
      setBookmarks((current) => current.filter((story) => story.id !== mangaId))
    } catch (err) {
      console.error('Could not remove bookmark:', err)
      setError('Could not remove this bookmark. Please try again.')
    } finally {
      setRemovingId(null)
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#110e10] text-[#f4e9e9]">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#c58d98]/20 bg-[#211a1e]">
            <Emblem size={44} />
          </div>
          <LoaderCircle className="mx-auto mt-5 animate-spin text-[#c58d98]" size={25} />
          <p className="mt-4 text-sm text-[#a9959a]">Opening your collection...</p>
        </div>
      </main>
    )
  }

  const featuredStory = history[0]
  const username = user?.user_metadata?.username

  return (
    <main className="min-h-screen bg-[#110e10] text-[#f4e9e9]">
      <header className="sticky top-0 z-40 border-b border-[#dcb1b9]/10 bg-[#110e10]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
          <Brand />
          <Link
            to="/profile"
            className="rounded-xl border border-[#dcb1b9]/15 bg-[#191417] px-4 py-2.5 text-xs font-semibold text-[#cbb9bd] transition hover:border-[#c58d98]/50 hover:text-[#f4e9e9]"
          >
            My Profile
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:py-11">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#89777c] transition hover:text-[#d5a2aa]"
        >
          <ArrowLeft size={15} />
          Back to Home
        </Link>

        <section className="mt-9 flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
          <div>
            <SectionEyebrow icon={LibraryIcon}>Your personal collection</SectionEyebrow>
            <h1 className="mt-4 font-display text-5xl font-semibold tracking-tight text-[#f4e9e9] sm:text-6xl">
              My Library<span className="text-[#c58d98]">.</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[#a9959a]">
              Welcome back{username ? `, ${username}` : ''}. Your next chapter is never far away.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:w-80">
            <div className="rounded-2xl border border-[#dcb1b9]/10 bg-[#191417] p-5">
              <div className="flex items-center gap-2 text-[#c58d98]">
                <BookmarkCheck size={16} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Saved</span>
              </div>
              <p className="mt-3 font-display text-4xl font-semibold text-[#f4e9e9]">{bookmarks.length}</p>
              <p className="mt-1 text-[11px] text-[#89777c]">Stories in collection</p>
            </div>
            <div className="rounded-2xl border border-[#dcb1b9]/10 bg-[#191417] p-5">
              <div className="flex items-center gap-2 text-[#c58d98]">
                <BookOpen size={16} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Reading</span>
              </div>
              <p className="mt-3 font-display text-4xl font-semibold text-[#f4e9e9]">{history.length}</p>
              <p className="mt-1 text-[11px] text-[#89777c]">Stories explored</p>
            </div>
          </div>
        </section>

        {error && (
          <div role="alert" className="mt-7 flex items-center gap-3 rounded-xl border border-[#d78383]/20 bg-[#d78383]/[0.08] px-4 py-3 text-sm text-[#e5a2a2]">
            <AlertCircle size={17} className="shrink-0" />
            {error}
          </div>
        )}

        <section className="mt-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <SectionEyebrow icon={Play}>Pick up where you left off</SectionEyebrow>
              <h2 className="mt-2 font-display text-3xl font-semibold">Continue reading</h2>
            </div>
            {history.length > 1 && (
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className="mb-1 inline-flex items-center gap-1.5 text-xs font-semibold text-[#c99aa2] transition hover:text-[#f1d5d9]"
              >
                All activity <ArrowRight size={14} />
              </button>
            )}
          </div>

          {featuredStory ? (
            <article className="group relative isolate overflow-hidden rounded-3xl border border-[#dcb1b9]/15 bg-[#191417]">
              <div className="absolute inset-0 -z-10">
                {featuredStory.coverImage && (
                  <img
                    src={featuredStory.coverImage}
                    alt=""
                    className="h-full w-full scale-110 object-cover opacity-[0.16] blur-2xl"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-[#191417] via-[#191417]/95 to-[#191417]/75" />
              </div>
              <div className="flex flex-col gap-6 p-5 sm:flex-row sm:items-center sm:gap-8 sm:p-8">
                <Link
                  to={`/manga/${featuredStory.id}`}
                  className={`relative h-52 w-36 shrink-0 self-center overflow-hidden rounded-2xl bg-gradient-to-br shadow-2xl shadow-black/40 sm:h-56 sm:w-40 sm:self-auto ${featuredStory.colors}`}
                >
                  <Cover story={featuredStory} className="h-full w-full" />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-[#c58d98]/25 bg-[#c58d98]/10 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-[#e0b6bd]">
                      Recently reading
                    </span>
                    <span className="text-[10px] text-[#89777c]">{formatDate(featuredStory.lastReadAt)}</span>
                  </div>
                  <Link to={`/manga/${featuredStory.id}`}>
                    <h3 className="mt-4 font-display text-3xl font-semibold leading-tight text-[#f4e9e9] transition hover:text-[#e0b6bd] sm:text-4xl">
                      {featuredStory.title}
                    </h3>
                  </Link>
                  <p className="mt-2 text-xs text-[#a9959a]">{featuredStory.genre}</p>
                  <p className="mt-5 flex items-center gap-2 text-sm font-medium text-[#d5a2aa]">
                    <BookOpen size={15} />
                    Last read · Chapter {featuredStory.lastReadChapter}
                  </p>
                  {getProgress(featuredStory) !== null && (
                    <div className="mt-4 max-w-sm">
                      <div className="mb-2 flex items-center justify-between text-[10px] text-[#a9959a]">
                        <span>Series progress</span>
                        <span>{getProgress(featuredStory)}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-[#c58d98]"
                          style={{ width: `${getProgress(featuredStory)}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <Link
                    to={`/manga/${featuredStory.id}/chapter/${featuredStory.lastReadChapter}`}
                    className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-[#c58d98] px-5 py-3 text-xs font-bold text-[#211619] transition hover:bg-[#d5a2aa]"
                  >
                    <Play size={14} fill="currentColor" />
                    Continue chapter
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </article>
          ) : (
            <div className="flex flex-col items-start justify-between gap-5 rounded-3xl border border-[#dcb1b9]/10 bg-[#191417] p-6 sm:flex-row sm:items-center sm:p-8">
              <div>
                <p className="font-display text-2xl font-semibold">A new world is waiting.</p>
                <p className="mt-2 max-w-lg text-sm leading-6 text-[#a9959a]">
                  Start reading any story and we’ll keep your latest chapter here for your next visit.
                </p>
              </div>
              <Link to="/" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#c58d98] px-5 py-3 text-xs font-bold text-[#211619] transition hover:bg-[#d5a2aa]">
                Explore stories <ArrowUpRight size={15} />
              </Link>
            </div>
          )}
        </section>

        {history.length > 1 && (
          <section className="mt-11">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <SectionEyebrow icon={Clock3}>Your recent activity</SectionEyebrow>
                <h2 className="mt-2 font-display text-2xl font-semibold">Recently read</h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className="text-xs font-semibold text-[#c99aa2] transition hover:text-[#f1d5d9]"
              >
                View history
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {history.slice(1, 4).map((story) => (
                <Link
                  key={story.id}
                  to={`/manga/${story.id}/chapter/${story.lastReadChapter}`}
                  className="group flex min-w-0 items-center gap-4 rounded-2xl border border-[#dcb1b9]/10 bg-[#191417] p-3 transition hover:border-[#c58d98]/35 hover:bg-[#211a1e]"
                >
                  <div className={`h-20 w-14 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br ${story.colors}`}>
                    <Cover story={story} className="h-full w-full" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-bold text-[#f1e7e8] group-hover:text-[#dfb9bf]">{story.title}</h3>
                    <p className="mt-1 text-xs text-[#c99aa2]">Chapter {story.lastReadChapter}</p>
                    <p className="mt-1 text-[10px] text-[#89777c]">{formatDate(story.lastReadAt)}</p>
                  </div>
                  <ArrowUpRight size={16} className="mr-1 shrink-0 text-[#89777c] transition group-hover:text-[#dfb9bf]" />
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#dcb1b9]/10">
            <div className="pb-5">
              <SectionEyebrow icon={LibraryIcon}>Curated by you</SectionEyebrow>
              <h2 className="mt-2 font-display text-3xl font-semibold">Your collection</h2>
              <p className="mt-1 text-xs text-[#89777c]">Every story you’ve chosen to keep close.</p>
            </div>
            <div className="flex gap-5">
              <button
                type="button"
                onClick={() => setActiveTab('bookmarks')}
                className={`flex items-center gap-2 border-b-2 px-1 pb-5 text-xs font-bold transition ${activeTab === 'bookmarks' ? 'border-[#c58d98] text-[#e0b6bd]' : 'border-transparent text-[#89777c] hover:text-[#e9dadd]'}`}
              >
                <Bookmark size={15} /> Bookmarks <span className="rounded-md bg-[#c58d98]/10 px-2 py-0.5 text-[10px]">{bookmarks.length}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 border-b-2 px-1 pb-5 text-xs font-bold transition ${activeTab === 'history' ? 'border-[#c58d98] text-[#e0b6bd]' : 'border-transparent text-[#89777c] hover:text-[#e9dadd]'}`}
              >
                <Clock3 size={15} /> History <span className="rounded-md bg-[#c58d98]/10 px-2 py-0.5 text-[10px]">{history.length}</span>
              </button>
            </div>
          </div>

          {activeTab === 'bookmarks' && (
            <div className="mt-7">
              {bookmarks.length === 0 ? (
                <EmptyState
                  icon={Bookmark}
                  title="Your collection awaits."
                  description="The stories that stay with you deserve a place here. Explore ABYSSORA and bookmark your favourites."
                  buttonText="Explore Manga"
                />
              ) : (
                <>
                  <div className="mb-5 flex items-center justify-between">
                    <p className="text-xs text-[#89777c]">Your personally curated stories</p>
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[#89777c]">{bookmarks.length} titles</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
                    {bookmarks.map((story) => (
                      <article key={story.id} className="group min-w-0 overflow-hidden rounded-2xl border border-[#dcb1b9]/10 bg-[#191417] transition duration-300 hover:-translate-y-1 hover:border-[#c58d98]/35">
                        <Link to={`/manga/${story.id}`} className={`relative block aspect-[3/4] overflow-hidden bg-gradient-to-br ${story.colors}`}>
                          <Cover story={story} className="h-full w-full" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/10" />
                          <span className="absolute left-3 top-3 rounded-lg border border-white/10 bg-black/50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[#e5c4ca] backdrop-blur-md">{story.status}</span>
                          <span className="absolute bottom-3 left-3 flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wider text-white/85">
                            <Bookmark size={11} /> Saved {formatDate(story.savedAt)}
                          </span>
                        </Link>
                        <div className="p-3.5">
                          <Link to={`/manga/${story.id}`}>
                            <h3 className="truncate text-sm font-bold text-[#f0e4e6] transition hover:text-[#d5a2aa]">{story.title}</h3>
                          </Link>
                          <p className="mt-1.5 truncate text-[10px] text-[#89777c]">{story.genre} · {story.chapter}</p>
                          <button
                            type="button"
                            onClick={() => removeBookmark(story.id)}
                            disabled={removingId === story.id || removingId !== null}
                            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-[#d78383]/20 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[#d99a9a] transition hover:border-[#d78383]/40 hover:bg-[#d78383]/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {removingId === story.id ? <LoaderCircle size={13} className="animate-spin" /> : <Trash2 size={13} />}
                            {removingId === story.id ? 'Removing...' : 'Remove bookmark'}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="mt-7">
              {history.length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title="Your story begins here."
                  description="Once you start reading a manga, your latest chapter and reading activity will be collected here."
                  buttonText="Start Reading"
                />
              ) : (
                <div className="space-y-3">
                  {history.map((story) => (
                    <article key={story.id} className="group flex flex-col gap-4 rounded-2xl border border-[#dcb1b9]/10 bg-[#191417] p-4 transition hover:border-[#c58d98]/30 sm:flex-row sm:items-center sm:gap-5">
                      <Link to={`/manga/${story.id}`} className={`relative h-36 w-full shrink-0 overflow-hidden rounded-xl bg-gradient-to-br sm:h-28 sm:w-24 ${story.colors}`}>
                        <Cover story={story} className="h-full w-full" />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link to={`/manga/${story.id}`}>
                          <h3 className="truncate text-lg font-bold text-[#f0e4e6] transition hover:text-[#d5a2aa]">{story.title}</h3>
                        </Link>
                        <p className="mt-1 truncate text-xs text-[#89777c]">{story.genre}</p>
                        <p className="mt-4 flex items-center gap-2 text-xs font-semibold text-[#cba0a7]">
                          <Clock3 size={14} /> Last read: Chapter {story.lastReadChapter}
                        </p>
                        <p className="mt-1.5 flex items-center gap-1.5 text-[10px] text-[#75666a]">
                          <CalendarDays size={12} /> {formatDate(story.lastReadAt)}
                        </p>
                      </div>
                      <Link
                        to={`/manga/${story.id}/chapter/${story.lastReadChapter}`}
                        className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#c58d98] px-5 py-3 text-xs font-bold text-[#211619] transition hover:bg-[#d5a2aa]"
                      >
                        <Play size={14} fill="currentColor" /> Continue
                      </Link>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      <footer className="mt-16 border-t border-[#dcb1b9]/10 bg-[#0e0b0d] px-5 py-8 text-center">
        <div className="flex items-center justify-center gap-2">
          <Emblem size={22} />
          <span className="font-display text-sm font-semibold tracking-[0.2em] text-[#d9c5c9]">ABYSSORA</span>
        </div>
        <p className="mt-3 text-[10px] tracking-wider text-[#75666a]">
          © 2026 ABYSSORA · YOUR MANGA UNIVERSE
        </p>
      </footer>
    </main>
  )
}
