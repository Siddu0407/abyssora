
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Maximize,
  Minimize,
  Home,
  List,
  Settings,
  Sparkles,
} from 'lucide-react'

import { manga } from '../data/manga'
import { supabase } from '../lib/supabase'

export default function Reader() {
  const { id, chapterNumber } = useParams()
  const navigate = useNavigate()

  const story = manga.find((item) => item.id === id)
  const chapter = Number(chapterNumber)

  const [progress, setProgress] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // Save the current chapter to the user's reading history.
  useEffect(() => {
    let cancelled = false

    const saveReadingHistory = async () => {
      if (
        !story ||
        !Number.isInteger(chapter) ||
        chapter < 1 ||
        chapter > story.chapters
      ) {
        return
      }

      try {
        const { data: { user }, error: userError } =
          await supabase.auth.getUser()

        if (userError) throw userError

        if (!user || cancelled) return

        const { error } = await supabase
          .from('reading_history')
          .upsert(
            {
              user_id: user.id,
              manga_id: id,
              chapter_number: chapter,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: 'user_id,manga_id',
            }
          )

        if (error) throw error
      } catch (error) {
        console.error('Could not save reading history:', error)
      }
    }

    saveReadingHistory()

    return () => {
      cancelled = true
    }
  }, [id, chapter, story])

  // Reading progress indicator.
  useEffect(() => {
    const updateProgress = () => {
      const total =
        document.documentElement.scrollHeight - window.innerHeight

      const value =
        total > 0 ? (window.scrollY / total) * 100 : 0

      setProgress(Math.min(100, Math.max(0, value)))
    }

    window.addEventListener('scroll', updateProgress)
    updateProgress()

    return () => window.removeEventListener('scroll', updateProgress)
  }, [])

  // Fullscreen detection.
  useEffect(() => {
    const updateFullscreen = () => {
      setFullscreen(Boolean(document.fullscreenElement))
    }

    document.addEventListener('fullscreenchange', updateFullscreen)

    return () =>
      document.removeEventListener('fullscreenchange', updateFullscreen)
  }, [])

  if (
    !story ||
    !Number.isInteger(chapter) ||
    chapter < 1 ||
    chapter > story.chapters
  ) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#09090e] text-white">
        <h1 className="text-4xl font-black">Chapter not found</h1>
        <Link to="/" className="mt-5 text-purple-400">
          Return to ABYSSORA
        </Link>
      </main>
    )
  }

  const previousChapter = chapter - 1
  const nextChapter = chapter + 1

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch {
      alert('Fullscreen is not supported by this browser.')
    }
  }

  const panels = [
    {
      title: 'THE AWAKENING',
      subtitle: 'Every legend begins somewhere.',
      symbol: story.symbol,
      color: 'from-indigo-950 via-purple-900 to-black',
    },
    {
      title: 'A WORLD OF SHADOWS',
      subtitle: 'Something ancient is watching.',
      symbol: '✧',
      color: 'from-slate-950 via-blue-950 to-indigo-950',
    },
    {
      title: 'THE FIRST CHALLENGE',
      subtitle: 'Power comes with a price.',
      symbol: '⚔',
      color: 'from-purple-950 via-fuchsia-950 to-black',
    },
    {
      title: 'A NEW DESTINY',
      subtitle: 'The journey has only begun.',
      symbol: '◇',
      color: 'from-violet-950 via-slate-900 to-black',
    },
  ]

  const chapterUrl = (number) =>
    `/manga/${id}/chapter/${number}`

  return (
    <main className="min-h-screen bg-[#09090e] text-white">

      {/* TOP BAR */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#09090e]/95 backdrop-blur-xl">

        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">

          <Link to="/" className="flex items-center gap-2">
            <Sparkles className="text-purple-400" size={22} />
            <span className="font-black tracking-widest">
              ABYSS<span className="text-purple-400">ORA</span>
            </span>
          </Link>

          <div className="hidden text-center sm:block">
            <p className="text-sm font-bold">{story.title}</p>
            <p className="text-xs text-gray-500">
              Chapter {chapter}
            </p>
          </div>

          <div className="flex items-center gap-2">

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="rounded-lg border border-white/10 p-2 hover:bg-white/10"
              aria-label="Reader settings"
            >
              <Settings size={18} />
            </button>

            <button
              onClick={toggleFullscreen}
              className="rounded-lg border border-white/10 p-2 hover:bg-white/10"
              aria-label="Toggle fullscreen"
            >
              {fullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>

          </div>
        </div>

        {/* READING PROGRESS */}
        <div className="h-1 bg-white/5">
          <div
            className="h-full bg-purple-500 transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>

        {showSettings && (
          <div className="border-t border-white/10 px-5 py-4 text-sm text-gray-300">
            <p>Reading mode: Vertical scrolling</p>
            <p className="mt-2 text-xs text-gray-500">
              More reading settings will be added later.
            </p>
          </div>
        )}
      </header>

      {/* READER CONTENT */}
      <section className="mx-auto max-w-3xl px-3 pb-12">

        <div className="py-8 text-center">
          <Link
            to={`/manga/${id}`}
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-purple-300"
          >
            <ArrowLeft size={16} />
            Back to {story.title}
          </Link>

          <h1 className="mt-6 text-2xl font-black sm:text-3xl">
            Chapter {chapter}
          </h1>

          <p className="mt-2 text-xs text-gray-500">
            ABYSSORA · Demonstration chapter
          </p>
        </div>

        {/* DEMONSTRATION PANELS */}
        <div className="space-y-2">

          {panels.map((panel, index) => (
            <article
              key={index}
              className={`relative flex aspect-[4/5] w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br ${panel.color} text-center`}
            >

              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.18),transparent_65%)]" />

              <span className="relative text-8xl text-white/70 sm:text-9xl">
                {panel.symbol}
              </span>

              <div className="relative mt-8 px-5">
                <h2 className="text-xl font-black tracking-widest sm:text-2xl">
                  {panel.title}
                </h2>

                <p className="mt-3 text-sm text-white/60">
                  {panel.subtitle}
                </p>
              </div>

              <span className="absolute bottom-5 text-[10px] tracking-[0.3em] text-white/30">
                ABYSSORA · PANEL {index + 1}
              </span>

            </article>
          ))}

        </div>

        {/* END OF CHAPTER */}
        <div className="my-10 rounded-2xl border border-purple-500/20 bg-purple-500/[0.05] p-8 text-center">

          <Sparkles className="mx-auto text-purple-400" size={28} />

          <h2 className="mt-4 text-xl font-black">
            End of Chapter {chapter}
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Thanks for reading on ABYSSORA.
          </p>

        </div>

        {/* CHAPTER NAVIGATION */}
        <div className="grid grid-cols-2 gap-3">

          {previousChapter >= 1 ? (
            <button
              onClick={() => navigate(chapterUrl(previousChapter))}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-4 text-sm font-semibold hover:border-purple-500"
            >
              <ArrowLeft size={17} />
              Previous
            </button>
          ) : (
            <button
              disabled
              className="rounded-xl border border-white/5 px-4 py-4 text-sm text-gray-600"
            >
              First chapter
            </button>
          )}

          {nextChapter <= story.chapters ? (
            <button
              onClick={() => navigate(chapterUrl(nextChapter))}
              className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-4 text-sm font-bold hover:bg-purple-500"
            >
              Next chapter
              <ArrowRight size={17} />
            </button>
          ) : (
            <button
              disabled
              className="rounded-xl border border-white/5 px-4 py-4 text-sm text-gray-600"
            >
              Latest chapter
            </button>
          )}

        </div>

        {/* CHAPTER SELECTOR */}
        <div className="mt-5 flex items-center justify-center gap-3">

          <List size={17} className="text-purple-400" />

          <select
            value={chapter}
            onChange={(e) => navigate(chapterUrl(Number(e.target.value)))}
            className="max-w-full rounded-xl border border-white/10 bg-[#15131e] px-4 py-3 text-sm text-white outline-none"
          >
            {Array.from(
              { length: story.chapters },
              (_, index) => story.chapters - index
            ).map((number) => (
              <option key={number} value={number}>
                Chapter {number}
              </option>
            ))}
          </select>

          <ChevronDown size={16} className="text-gray-500" />

        </div>

        <Link
          to={`/manga/${id}`}
          className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-purple-300"
        >
          <Home size={16} />
          Return to manga details
        </Link>

      </section>

      <footer className="border-t border-white/10 py-7 text-center text-xs text-gray-600">
        © 2026 ABYSSORA
      </footer>

    </main>
  )
}
