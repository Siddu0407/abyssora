
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ExternalLink,
  BookOpen,
  LoaderCircle,
  AlertCircle,
  Globe,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react'

import { supabase } from '../lib/supabase'

export default function ExternalComicReader() {
  const { id } = useParams()

  const [comic, setComic] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryCount, setRetryCount] = useState(0)

  const loadComic = useCallback(async (signal) => {
    setLoading(true)
    setError('')
    setComic(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('external_comics')
        .select(`
          id,
          title,
          creator_name,
          cover_image_url,
          source_url,
          embed_url,
          description,
          genres,
          permission_confirmed,
          reading_type,
          is_active
        `)
        .eq('id', id)
        .eq('is_active', true)
        .abortSignal(signal)
        .maybeSingle()

      if (signal.aborted) return

      if (fetchError) {
        throw fetchError
      }

      if (!data) {
        setError(
          'This comic is unavailable or is no longer publicly active.'
        )
        setLoading(false)
        return
      }

      const readingType = data.reading_type || 'embed'

      if (
        readingType === 'embed' &&
        (!data.permission_confirmed || !data.embed_url)
      ) {
        setError('This comic is not currently available for embedding.')
        setLoading(false)
        return
      }

      if (readingType === 'link' && !data.source_url) {
        setError('The original comic website link is unavailable.')
        setLoading(false)
        return
      }

      setComic(data)
      setLoading(false)
    } catch (fetchError) {
      if (signal.aborted) return

      console.error('External comic loading error:', fetchError)

      setError(
        fetchError.name === 'AbortError'
          ? 'The request took too long. Please check your connection and try again.'
          : 'We could not load this comic. Please try again.'
      )

      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    const controller = new AbortController()

    const timeout = setTimeout(() => {
      controller.abort()
    }, 12000)

    loadComic(controller.signal)

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [loadComic, retryCount])

  const isExternalLink = comic?.reading_type === 'link'
  const genres = Array.isArray(comic?.genres) ? comic.genres : []

  return (
    <div className="min-h-screen bg-[#110e10] text-[#f1e7e8]">
      <header className="border-b border-white/5 bg-[#191417]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link
            to="/discover"
            className="inline-flex items-center gap-2 text-sm text-[#c9b9bd] transition hover:text-[#dfb9bf]"
          >
            <ArrowLeft size={18} />
            Back to Discover
          </Link>

          <span className="text-xs font-semibold tracking-[0.2em] text-[#c69aa1]">
            ABYSSORA
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 md:py-12">
        {loading && !comic && (
          <div className="rounded-2xl border border-white/10 bg-[#191417] p-8 md:p-12">
            <div className="flex flex-col items-center gap-4 text-center">
              <LoaderCircle
                className="animate-spin text-[#c69aa1]"
                size={34}
              />
              <h1 className="text-xl font-semibold">
                Preparing your comic
              </h1>
              <p className="text-sm text-[#ad9da1]">
                Connecting to the library...
              </p>
            </div>

            <div className="mx-auto mt-8 grid max-w-2xl gap-4 md:grid-cols-[160px_1fr]">
              <div className="aspect-[3/4] animate-pulse rounded-xl bg-[#211a1e]" />
              <div className="space-y-4 py-2">
                <div className="h-4 w-28 animate-pulse rounded bg-[#211a1e]" />
                <div className="h-8 w-3/4 animate-pulse rounded bg-[#211a1e]" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-[#211a1e]" />
                <div className="h-20 w-full animate-pulse rounded bg-[#211a1e]" />
              </div>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="mx-auto max-w-md rounded-2xl border border-[#c69aa1]/15 bg-[#191417] p-8 text-center">
            <AlertCircle
              className="mx-auto mb-4 text-[#c69aa1]"
              size={38}
            />

            <h1 className="mb-3 text-xl font-semibold">
              Unable to load comic
            </h1>

            <p className="mb-7 text-sm leading-6 text-[#ad9da1]">
              {error}
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => setRetryCount((count) => count + 1)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#c69aa1] px-5 py-3 text-sm font-semibold text-[#171113] transition hover:bg-[#dfb9bf]"
              >
                <RefreshCw size={16} />
                Try Again
              </button>

              <Link
                to="/discover"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm text-[#c9b9bd] transition hover:bg-white/5"
              >
                <ArrowLeft size={16} />
                Discover
              </Link>
            </div>
          </div>
        )}

        {comic && !loading && (
          <>
            <div className="grid gap-8 md:grid-cols-[260px_1fr]">
              <div>
                {comic.cover_image_url ? (
                  <img
                    src={comic.cover_image_url}
                    alt={`${comic.title} cover`}
                    loading="lazy"
                    className="w-full max-w-[260px] rounded-2xl border border-white/10 object-cover shadow-xl"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="flex aspect-[3/4] w-full max-w-[260px] items-center justify-center rounded-2xl border border-white/10 bg-[#211a1e]">
                    <BookOpen size={48} className="text-[#c69aa1]" />
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-center">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[#c69aa1]/25 bg-[#c69aa1]/10 px-3 py-1 text-xs font-medium text-[#dfb9bf]">
                    {isExternalLink ? 'External Link' : 'Official Embed'}
                  </span>

                  {comic.permission_confirmed && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                      <ShieldCheck size={13} />
                      Embedding permission confirmed
                    </span>
                  )}
                </div>

                <h1 className="mb-3 text-3xl font-bold tracking-tight md:text-4xl">
                  {comic.title}
                </h1>

                <p className="mb-5 text-sm text-[#c69aa1]">
                  Original creator: {comic.creator_name}
                </p>

                {comic.description && (
                  <p className="mb-6 max-w-2xl whitespace-pre-line text-sm leading-7 text-[#b9aaae]">
                    {comic.description}
                  </p>
                )}

                {genres.length > 0 && (
                  <div className="mb-7 flex flex-wrap gap-2">
                    {genres.map((genre, index) => (
                      <span
                        key={`${genre}-${index}`}
                        className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-[#c9b9bd]"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                )}

                {isExternalLink ? (
                  <div className="max-w-xl rounded-2xl border border-[#c69aa1]/20 bg-[#191417] p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <Globe size={19} className="text-[#c69aa1]" />
                      <h2 className="font-semibold">
                        Read on the original website
                      </h2>
                    </div>

                    <p className="mb-5 text-sm leading-6 text-[#ad9da1]">
                      This comic is provided by its original website.
                      You will be taken there to read it. ABYSSORA does
                      not host the comic pages.
                    </p>

                    <a
                      href={comic.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#c69aa1] px-5 py-3 text-sm font-semibold text-[#171113] transition hover:bg-[#dfb9bf]"
                    >
                      Read on Original Website
                      <ExternalLink size={17} />
                    </a>
                  </div>
                ) : (
                  <div className="text-xs text-[#8f8085]">
                    Official embedded reading experience
                  </div>
                )}
              </div>
            </div>

            {!isExternalLink && (
              <section className="mt-10 overflow-hidden rounded-2xl border border-white/10 bg-[#191417]">
                <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
                  <h2 className="font-semibold">Reading Panel</h2>
                  <span className="text-xs text-[#9f9094]">
                    Official source
                  </span>
                </div>

                <div className="bg-black">
                  <iframe
                    title={`Read ${comic.title}`}
                    src={comic.embed_url}
                    className="h-[75vh] min-h-[500px] w-full border-0"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                  />
                </div>

                <div className="border-t border-white/5 px-5 py-4">
                  <a
                    href={comic.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-[#d5a2aa] transition hover:text-[#f1cbd1]"
                  >
                    Visit original website
                    <ExternalLink size={15} />
                  </a>
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  )
}
