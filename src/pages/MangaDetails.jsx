
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
  ShieldCheck,
  ExternalLink,
  Palette,
  FileText,
} from 'lucide-react'

import { supabase } from '../lib/supabase'

const SITE_URL = 'https://abyssora-ten.vercel.app'

function Emblem({ size = 36 }) {
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

function setMeta(attribute, key, content) {
  let element = document.head.querySelector(
    `meta[${attribute}="${key}"]`
  )

  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }

  element.setAttribute('content', content)
}

function setCanonical(url) {
  let element = document.head.querySelector(
    'link[rel="canonical"]'
  )

  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', 'canonical')
    document.head.appendChild(element)
  }

  element.setAttribute('href', url)
}

// Extract creator and licence details from the existing description.
function getCredits(description, author) {
  const lines = String(description || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const findLine = (pattern) =>
    lines.find((line) => pattern.test(line))

  const creatorLine = findLine(
    /^(original artwork and story|original creator|creator|artist)\s*:/i
  )

  const translatorLine = findLine(
    /^(english translation|translation|translator)\s*:/i
  )

  const sourceLine = findLine(
    /^(original source|source|official source)\s*:/i
  )

  const licenceLine = findLine(
    /^(licensed under|licence|license)\s*:/i
  )

  const reproductionLine = findLine(
    /^(this is an unchanged reproduction|reproduction)\s*:/i
  )

  const extractValue = (line) =>
    line ? line.replace(/^[^:]+:\s*/, '').trim() : ''

  const licenceText = extractValue(licenceLine)

  const licenceUrlMatch = licenceText.match(
    /https?:\/\/\S+/i
  )

  const sourceUrlMatch = extractValue(sourceLine).match(
    /https?:\/\/\S+/i
  )

  const licenceName = licenceText
    .replace(/https?:\/\/\S+/i, '')
    .replace(/[()]/g, '')
    .trim()

  const creator = extractValue(creatorLine)

  const creditLines = [
    creatorLine,
    translatorLine,
    sourceLine,
    licenceLine,
    reproductionLine,
  ].filter(Boolean)

  const remainingDescription = lines
    .filter((line) => !creditLines.includes(line))
    .join('\n')
    .trim()

  return {
    creator: creator || author || '',
    translator: extractValue(translatorLine),
    sourceUrl: sourceUrlMatch?.[0] || '',
    licenceName,
    licenceUrl: licenceUrlMatch?.[0] || '',
    reproduction: extractValue(reproductionLine),
    hasCredits: Boolean(
      creatorLine ||
      translatorLine ||
      sourceLine ||
      licenceLine ||
      reproductionLine
    ),
    remainingDescription,
  }
}

export default function MangaDetails() {
  const { id } = useParams()

  const [story, setStory] = useState(null)
  const [chapters, setChapters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [imageFailed, setImageFailed] = useState(false)

  const [bookmarked, setBookmarked] = useState(false)
  const [bookmarkLoading, setBookmarkLoading] = useState(true)
  const [bookmarkSaving, setBookmarkSaving] = useState(false)
  const [bookmarkMessage, setBookmarkMessage] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadManga() {
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
            'from-[#392b31] via-[#211a1e] to-[#110e10]',
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
        if (!cancelled) setLoading(false)
      }
    }

    loadManga()

    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    if (!story) return

    const mangaTitle = String(story.title || 'Manga').trim()
    const pageTitle = `${mangaTitle} | Read Manga Online - ABYSSORA`

    const credits = getCredits(story.description, story.author)

    const rawDescription = String(
      credits.remainingDescription ||
        `Read ${mangaTitle} on ABYSSORA. Explore manga details, genres, and the latest published chapters.`
    ).replace(/\s+/g, ' ').trim()

    const description =
      rawDescription.length > 160
        ? `${rawDescription.slice(0, 157)}...`
        : rawDescription

    const canonicalUrl =
      `${SITE_URL}/manga/${encodeURIComponent(story.id)}`

    const coverImage = story.coverImage
      ? new URL(story.coverImage, SITE_URL).href
      : ''

    document.title = pageTitle

    setMeta('name', 'description', description)
    setMeta('name', 'robots', 'index, follow')
    setCanonical(canonicalUrl)

    setMeta('property', 'og:type', 'website')
    setMeta('property', 'og:site_name', 'ABYSSORA')
    setMeta('property', 'og:title', pageTitle)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:url', canonicalUrl)

    setMeta(
      'name',
      'twitter:card',
      coverImage ? 'summary_large_image' : 'summary'
    )
    setMeta('name', 'twitter:title', pageTitle)
    setMeta('name', 'twitter:description', description)

    if (coverImage) {
      setMeta('property', 'og:image', coverImage)
      setMeta('name', 'twitter:image', coverImage)
    } else {
      document.head
        .querySelector('meta[property="og:image"]')
        ?.remove()

      document.head
        .querySelector('meta[name="twitter:image"]')
        ?.remove()
    }
  }, [story])

  useEffect(() => {
    return () => {
      document.title = 'ABYSSORA | Read Manga Online'

      setMeta(
        'name',
        'description',
        'Discover and read manga online on ABYSSORA. Explore stories, genres, and the latest chapters.'
      )

      setCanonical(`${SITE_URL}/`)

      setMeta('property', 'og:type', 'website')
      setMeta('property', 'og:site_name', 'ABYSSORA')
      setMeta('property', 'og:title', 'ABYSSORA | Read Manga Online')
      setMeta(
        'property',
        'og:description',
        'Discover and read manga online on ABYSSORA.'
      )
      setMeta('property', 'og:url', `${SITE_URL}/`)

      setMeta('name', 'twitter:card', 'summary')
      setMeta('name', 'twitter:title', 'ABYSSORA | Read Manga Online')
      setMeta(
        'name',
        'twitter:description',
        'Discover and read manga online on ABYSSORA.'
      )

      document.head
        .querySelector('meta[property="og:image"]')
        ?.remove()

      document.head
        .querySelector('meta[name="twitter:image"]')
        ?.remove()
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function checkBookmark(user) {
      if (!user) {
        if (!cancelled) {
          setBookmarked(false)
          setBookmarkLoading(false)
        }
        return
      }

      const { data, error: bookmarkError } = await supabase
        .from('bookmarks')
        .select('manga_id')
        .eq('user_id', user.id)
        .eq('manga_id', id)
        .maybeSingle()

      if (cancelled) return

      if (bookmarkError) {
        console.error('Could not load bookmark:', bookmarkError)
        setBookmarkMessage('Could not check your saved library.')
        setBookmarked(false)
      } else {
        setBookmarked(Boolean(data))
        setBookmarkMessage('')
      }

      setBookmarkLoading(false)
    }

    async function loadBookmark() {
      setBookmarkLoading(true)

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (cancelled) return

      if (userError) {
        console.error('Could not check signed-in user:', userError)
        setBookmarkLoading(false)
        return
      }

      await checkBookmark(user)
    }

    loadBookmark()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      Promise.resolve().then(() => {
        if (!cancelled) {
          setBookmarkLoading(true)
          checkBookmark(session?.user || null)
        }
      })
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [id])

  async function toggleBookmark() {
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
        const { error: deleteError } = await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('manga_id', id)

        if (deleteError) throw deleteError

        setBookmarked(false)
        setBookmarkMessage('Removed from your library.')
      } else {
        const { error: insertError } = await supabase
          .from('bookmarks')
          .insert({
            user_id: user.id,
            manga_id: id,
          })

        if (insertError) throw insertError

        setBookmarked(true)
        setBookmarkMessage('Successfully saved to your library!')
      }
    } catch (err) {
      console.error('Bookmark error:', err)
      setBookmarkMessage(
        'Could not update your library. Please try again.'
      )
    } finally {
      setBookmarkSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#110e10] text-[#f1e7e8]">
        <div className="text-center">
          <LoaderCircle
            size={35}
            className="mx-auto animate-spin text-[#c69aa1]"
          />
          <p className="mt-4 text-sm text-[#99898e]">
            Loading manga...
          </p>
        </div>
      </main>
    )
  }

  if (error || !story) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#110e10] px-5 text-[#f1e7e8]">
        <Sparkles size={36} className="mb-5 text-[#c69aa1]" />

        <h1 className="text-3xl font-semibold">
          {error ? 'Something went wrong' : 'Story not found'}
        </h1>

        <p className="mt-3 text-center text-sm text-[#99898e]">
          {error || 'This manga does not exist in our library.'}
        </p>

        <Link
          to="/"
          className="mt-6 rounded-xl bg-[#c69aa1] px-6 py-3 font-bold text-[#211619] transition hover:bg-[#dfb9bf]"
        >
          Return home
        </Link>
      </main>
    )
  }

  const latestChapter = chapters[0]?.chapter_number || 0
  const credits = getCredits(story.description, story.author)

  return (
    <main className="min-h-screen bg-[#110e10] text-[#f1e7e8]">
      {/* NAVIGATION */}
      <header className="sticky top-0 z-40 border-b border-[#c69aa1]/10 bg-[#110e10]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5">
          <Link to="/" className="group flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#c69aa1]/25 bg-[#211a1e] transition group-hover:border-[#c69aa1]/60">
              <Emblem size={32} />
            </div>

            <div className="leading-none">
              <span className="text-lg font-black tracking-[0.18em]">
                ABYSSORA
              </span>

              <p className="mt-1 text-[8px] font-semibold tracking-[0.3em] text-[#a88b91]">
                WORLDS BEYOND STORIES
              </p>
            </div>
          </Link>

          <Link
            to="/"
            className="flex items-center gap-2 rounded-xl border border-[#c69aa1]/15 px-3 py-2 text-xs font-semibold text-[#ad9da1] transition hover:border-[#c69aa1]/40 hover:text-[#f1e7e8] sm:px-4 sm:text-sm"
          >
            <ArrowLeft size={16} />
            Back to library
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-[#c69aa1]/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_40%,rgba(156,103,116,0.16),transparent_50%),linear-gradient(115deg,#21191d_0%,#171215_55%,#110e10_100%)]" />

        <div className="absolute -right-20 top-0 h-96 w-96 rounded-full border border-[#c69aa1]/10" />

        <div className="absolute -right-8 top-10 h-72 w-72 rounded-full border border-[#c69aa1]/10" />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-12 md:grid-cols-[280px_1fr] md:py-16">
          {/* COVER */}
          <div className="group relative mx-auto aspect-[3/4] w-full max-w-[280px] overflow-hidden rounded-2xl border border-[#c69aa1]/20 bg-[#211a1e] shadow-2xl shadow-black/40">
            {!imageFailed && story.coverImage ? (
              <img
                src={story.coverImage}
                alt={`${story.title} cover`}
                onError={() => setImageFailed(true)}
                className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
              />
            ) : (
              <div
                className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${story.colors}`}
              >
                <span className="text-9xl text-[#f1e7e8]/70">
                  {story.symbol}
                </span>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

            <div className="absolute bottom-5 left-5 right-5 flex items-center gap-2">
              <Emblem size={25} />
              <p className="text-xs font-bold tracking-[0.2em] text-[#f1e7e8]">
                ABYSSORA
              </p>
            </div>
          </div>

          {/* INFORMATION */}
          <div className="flex flex-col justify-center">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-[#c69aa1]/25 bg-[#c69aa1]/10 px-3 py-1 text-xs font-bold text-[#dfb9bf]">
                {story.status}
              </span>

              {story.year && (
                <span className="text-xs text-[#89777c]">
                  {story.year}
                </span>
              )}
            </div>

            <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              {story.title}
            </h1>

            {/* STATISTICS */}
            <div className="mt-6 flex flex-wrap gap-6 text-sm text-[#ad9da1]">
              <span className="flex items-center gap-2">
                <Star
                  size={17}
                  className="fill-[#d9b47f] text-[#d9b47f]"
                />
                {story.rating}
              </span>

              <span className="flex items-center gap-2">
                <BookOpen size={17} className="text-[#c69aa1]" />
                {chapters.length} published chapters
              </span>

              {story.year && (
                <span className="flex items-center gap-2">
                  <CalendarDays size={17} className="text-[#c69aa1]" />
                  {story.year}
                </span>
              )}
            </div>

            {/* GENRES */}
            {story.genres.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {story.genres.map((genre) => (
                  <span
                    key={genre}
                    className="rounded-lg border border-[#c69aa1]/15 bg-[#211a1e] px-3 py-2 text-xs text-[#d8c9cc]"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {/* DESCRIPTION */}
            <p className="mt-7 max-w-2xl whitespace-pre-line text-sm leading-8 text-[#ad9da1]">
              {credits.remainingDescription ||
                'No description has been added for this story yet.'}
            </p>

            {/* AUTHOR */}
            <div className="mt-7 flex items-center gap-2 text-sm text-[#99898e]">
              <User size={17} className="text-[#c69aa1]" />
              Author:
              <span className="font-semibold text-[#f1e7e8]">
                {story.author}
              </span>
            </div>

            {/* ACTIONS */}
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#chapters"
                className="flex items-center gap-2 rounded-xl bg-[#c69aa1] px-6 py-3.5 text-sm font-bold text-[#211619] transition hover:-translate-y-0.5 hover:bg-[#dfb9bf]"
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
                    ? 'border-[#c69aa1]/50 bg-[#c69aa1]/15 text-[#dfb9bf]'
                    : 'border-[#c69aa1]/20 text-[#d8c9cc] hover:border-[#c69aa1]/60 hover:text-[#dfb9bf]'
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
                  <CheckCircle size={16} className="text-[#8caf9a]" />
                ) : (
                  <AlertCircle size={16} className="text-[#d9b47f]" />
                )}

                <span className="text-[#c8b9bd]">
                  {bookmarkMessage}
                </span>

                {bookmarkMessage.includes('sign in') && (
                  <Link
                    to="/login"
                    className="font-bold text-[#dfb9bf] hover:text-white"
                  >
                    Sign in
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CREATOR & LICENCE */}
      {credits.hasCredits && (
        <section className="mx-auto max-w-7xl px-5 pt-12">
          <div className="overflow-hidden rounded-2xl border border-[#c69aa1]/20 bg-gradient-to-br from-[#21191d] to-[#151114]">
            <div className="border-b border-[#c69aa1]/10 px-6 py-5 sm:px-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#c69aa1]/20 bg-[#c69aa1]/10">
                  <ShieldCheck size={21} className="text-[#dfb9bf]" />
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#c69aa1]">
                    Transparency & attribution
                  </p>
                  <h2 className="mt-1 text-xl font-semibold">
                    Creator & Licence
                  </h2>
                </div>
              </div>
            </div>

            <div className="grid gap-6 p-6 sm:grid-cols-2 sm:p-8">
              {/* CREATOR */}
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#c69aa1]/10">
                  <Palette size={19} className="text-[#dfb9bf]" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#89777c]">
                    Original creator
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#f1e7e8]">
                    {credits.creator}
                  </p>
                </div>
              </div>

              {/* TRANSLATOR */}
              {credits.translator && (
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#c69aa1]/10">
                    <User size={19} className="text-[#dfb9bf]" />
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#89777c]">
                      English translation
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[#f1e7e8]">
                      {credits.translator}
                    </p>
                  </div>
                </div>
              )}

              {/* LICENCE */}
              {credits.licenceName && (
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#c69aa1]/10">
                    <FileText size={19} className="text-[#dfb9bf]" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#89777c]">
                      Usage licence
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[#f1e7e8]">
                      {credits.licenceName}
                    </p>

                    {credits.licenceUrl && (
                      <a
                        href={credits.licenceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#dfb9bf] transition hover:text-white"
                      >
                        View licence
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* ORIGINAL SOURCE */}
              {credits.sourceUrl && (
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#c69aa1]/10">
                    <ExternalLink size={19} className="text-[#dfb9bf]" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#89777c]">
                      Original source
                    </p>
                    <a
                      href={credits.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 break-all text-sm font-semibold text-[#dfb9bf] transition hover:text-white"
                    >
                      Visit original work
                      <ExternalLink size={12} className="shrink-0" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {credits.reproduction && (
              <div className="mx-6 mb-6 rounded-xl border border-[#8caf9a]/15 bg-[#8caf9a]/[0.06] p-4 sm:mx-8">
                <div className="flex items-start gap-3">
                  <CheckCircle
                    size={17}
                    className="mt-0.5 shrink-0 text-[#8caf9a]"
                  />
                  <p className="text-xs leading-6 text-[#c8b9bd]">
                    {credits.reproduction}
                  </p>
                </div>
              </div>
            )}

            <div className="border-t border-[#c69aa1]/10 px-6 py-4 sm:px-8">
              <p className="text-[11px] leading-6 text-[#89777c]">
                ABYSSORA aims to respect original creators and display
                accurate attribution and licensing information for
                independently published works.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* CHAPTERS */}
      <section
        id="chapters"
        className="mx-auto max-w-7xl scroll-mt-24 px-5 py-12"
      >
        <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[#c69aa1]">
              Continue the journey
            </div>

            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Chapters
            </h2>

            <p className="mt-2 text-sm text-[#89777c]">
              {chapters.length} published chapters available
            </p>
          </div>

          {latestChapter > 0 && (
            <span className="rounded-lg border border-[#c69aa1]/15 bg-[#191417] px-3 py-2 text-xs text-[#ad9da1]">
              Latest: Chapter {latestChapter}
            </span>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#c69aa1]/20 bg-[#191417]">
          {chapters.length > 0 ? (
            chapters.slice(0, 5).map((chapter, index) => (
              <Link
                key={chapter.id}
                to={`/manga/${story.id}/chapter/${chapter.chapter_number}`}
                className={`group flex items-center justify-between gap-3 p-5 transition hover:bg-[#c69aa1]/[0.06] ${
                  index !== Math.min(chapters.length, 5) - 1
                    ? 'border-b border-[#c69aa1]/10'
                    : ''
                }`}
              >
                <div>
                  <p className="text-sm font-semibold text-[#e9dcde] transition group-hover:text-[#dfb9bf]">
                    Chapter {chapter.chapter_number}
                  </p>

                  <p className="mt-1 text-xs text-[#89777c]">
                    {chapter.title || 'Read chapter'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {index === 0 && (
                    <span className="rounded-full bg-[#c69aa1]/10 px-2 py-1 text-[10px] font-bold text-[#dfb9bf]">
                      LATEST
                    </span>
                  )}

                  <ChevronRight
                    size={18}
                    className="text-[#76676c] transition group-hover:translate-x-1 group-hover:text-[#c69aa1]"
                  />
                </div>
              </Link>
            ))
          ) : (
            <div className="px-5 py-12 text-center">
              <BookOpen
                size={32}
                className="mx-auto text-[#76676c]"
              />

              <p className="mt-4 font-semibold text-[#e4d5d8]">
                No published chapters yet
              </p>

              <p className="mt-2 text-sm text-[#89777c]">
                Chapters will appear here once an administrator publishes them.
              </p>
            </div>
          )}
        </div>

        {chapters.length > 5 && (
          <p className="mt-5 text-center text-xs text-[#76676c]">
            Showing the latest 5 published chapters.
          </p>
        )}
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#c69aa1]/10 bg-[#0d0a0c] px-5 py-8 text-center text-xs text-[#76676c]">
        © 2026 ABYSSORA. A universe of stories awaits.
      </footer>
    </main>
  )
}
