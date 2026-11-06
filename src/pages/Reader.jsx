
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
  LoaderCircle,
  AlertCircle,
  BookOpen,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react'

import { supabase } from '../lib/supabase'

const DEFAULT_SETTINGS = {
  width: 'normal',
  background: 'dark',
}

const WIDTH_OPTIONS = {
  narrow: '640px',
  normal: '800px',
  wide: '1100px',
}

const BACKGROUND_OPTIONS = {
  dark: {
    page: 'bg-[#09090e]',
    header: 'bg-[#09090e]/95',
    panel: 'bg-[#15131e]',
    text: 'text-white',
    secondary: 'text-gray-400',
    muted: 'text-gray-500',
    border: 'border-white/10',
  },
  black: {
    page: 'bg-black',
    header: 'bg-black/95',
    panel: 'bg-[#101010]',
    text: 'text-white',
    secondary: 'text-gray-400',
    muted: 'text-gray-500',
    border: 'border-white/10',
  },
  light: {
    page: 'bg-[#f1f0ed]',
    header: 'bg-[#f1f0ed]/95',
    panel: 'bg-white',
    text: 'text-[#191820]',
    secondary: 'text-gray-600',
    muted: 'text-gray-500',
    border: 'border-black/10',
  },
}

function getSavedSettings() {
  try {
    const saved = localStorage.getItem('abyssora-reader-settings')

    return saved
      ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
      : DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

export default function Reader() {
  const { id, chapterNumber } = useParams()
  const navigate = useNavigate()

  const chapter = Number(chapterNumber)

  const [story, setStory] = useState(null)
  const [currentChapter, setCurrentChapter] = useState(null)
  const [publishedChapters, setPublishedChapters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [readerSettings, setReaderSettings] = useState(getSavedSettings)

  const theme = BACKGROUND_OPTIONS[readerSettings.background]
    || BACKGROUND_OPTIONS.dark

  // Save reader settings on this browser.
  useEffect(() => {
    try {
      localStorage.setItem(
        'abyssora-reader-settings',
        JSON.stringify(readerSettings)
      )
    } catch (err) {
      console.error('Could not save reader settings:', err)
    }
  }, [readerSettings])

  const updateSetting = (key, value) => {
    setReaderSettings((previous) => ({
      ...previous,
      [key]: value,
    }))
  }

  // Load manga and its published chapters.
  useEffect(() => {
    let cancelled = false

    const loadReader = async () => {
      setLoading(true)
      setError('')
      setStory(null)
      setCurrentChapter(null)

      if (!Number.isInteger(chapter) || chapter < 1) {
        setLoading(false)
        return
      }

      try {
        const { data: comic, error: comicError } = await supabase
          .from('comics')
          .select('*')
          .eq('id', id)
          .maybeSingle()

        if (comicError) throw comicError

        if (!comic) {
          if (!cancelled) setStory(null)
          return
        }

        const { data: chapters, error: chaptersError } =
          await supabase
            .from('chapters')
            .select('id, chapter_number, title, pages, is_published')
            .eq('comic_id', id)
            .eq('is_published', true)
            .order('chapter_number', { ascending: true })

        if (chaptersError) throw chaptersError

        if (cancelled) return

        const selectedChapter = (chapters || []).find(
          (item) => Number(item.chapter_number) === chapter
        )

        setStory(comic)
        setPublishedChapters(chapters || [])
        setCurrentChapter(selectedChapter || null)
      } catch (err) {
        console.error('Reader loading error:', err)

        if (!cancelled) {
          setError('Unable to load this chapter. Please try again.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadReader()

    return () => {
      cancelled = true
    }
  }, [id, chapter])

  // Save reading history for signed-in users.
  useEffect(() => {
    let cancelled = false

    const saveReadingHistory = async () => {
      if (!story || !currentChapter) return

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

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
      } catch (err) {
        console.error('Could not save reading history:', err)
      }
    }

    saveReadingHistory()

    return () => {
      cancelled = true
    }
  }, [story, currentChapter, id, chapter])

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
    window.addEventListener('resize', updateProgress)
    updateProgress()

    return () => {
      window.removeEventListener('scroll', updateProgress)
      window.removeEventListener('resize', updateProgress)
    }
  }, [currentChapter, readerSettings.width])

  // Fullscreen detection.
  useEffect(() => {
    const updateFullscreen = () => {
      setFullscreen(Boolean(document.fullscreenElement))
    }

    document.addEventListener('fullscreenchange', updateFullscreen)

    return () =>
      document.removeEventListener('fullscreenchange', updateFullscreen)
  }, [])

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

  const chapterUrl = (number) =>
    `/manga/${id}/chapter/${number}`

  const currentIndex = publishedChapters.findIndex(
    (item) => Number(item.chapter_number) === chapter
  )

  const previousChapter =
    currentIndex > 0
      ? publishedChapters[currentIndex - 1]
      : null

  const nextChapter =
    currentIndex >= 0 &&
    currentIndex < publishedChapters.length - 1
      ? publishedChapters[currentIndex + 1]
      : null

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#09090e] text-white">
        <div className="text-center">
          <LoaderCircle
            size={36}
            className="mx-auto animate-spin text-purple-400"
          />
          <p className="mt-4 text-sm text-gray-400">
            Loading chapter...
          </p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#09090e] px-5 text-white">
        <AlertCircle size={40} className="text-red-400" />
        <h1 className="mt-5 text-3xl font-black">
          Something went wrong
        </h1>
        <p className="mt-3 text-center text-gray-400">{error}</p>
        <Link to="/" className="mt-6 rounded-xl bg-purple-600 px-6 py-3">
          Return to ABYSSORA
        </Link>
      </main>
    )
  }

  if (!story || !currentChapter) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#09090e] px-5 text-center text-white">
        <BookOpen size={40} className="text-purple-400" />
        <h1 className="mt-5 text-4xl font-black">
          Chapter not found
        </h1>
        <p className="mt-3 max-w-md text-gray-400">
          Chapter {chapter} is not available. It may not have been published yet.
        </p>
        {story ? (
          <Link
            to={`/manga/${id}`}
            className="mt-6 rounded-xl bg-purple-600 px-6 py-3"
          >
            Back to manga
          </Link>
        ) : (
          <Link to="/" className="mt-6 rounded-xl bg-purple-600 px-6 py-3">
            Return home
          </Link>
        )}
      </main>
    )
  }

  const pages = Array.isArray(currentChapter.pages)
    ? currentChapter.pages
    : []

  return (
    <main className={`min-h-screen ${theme.page} ${theme.text}`}>

      {/* TOP BAR */}
      <header className={`sticky top-0 z-50 border-b ${theme.border} ${theme.header} backdrop-blur-xl`}>

        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">

          <Link to="/" className="flex items-center gap-2">
            <Sparkles className="text-purple-400" size={22} />
            <span className="font-black tracking-widest">
              ABYSS<span className="text-purple-400">ORA</span>
            </span>
          </Link>

          <div className="hidden text-center sm:block">
            <p className="text-sm font-bold">{story.title}</p>
            <p className={`text-xs ${theme.muted}`}>
              Chapter {chapter}
              {currentChapter.title ? ` · ${currentChapter.title}` : ''}
            </p>
          </div>

          <div className="flex items-center gap-2">

            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`rounded-lg border ${theme.border} p-2 transition hover:border-purple-400`}
              aria-label="Reader settings"
              aria-expanded={showSettings}
            >
              <Settings size={18} />
            </button>

            <button
              onClick={toggleFullscreen}
              className={`rounded-lg border ${theme.border} p-2 transition hover:border-purple-400`}
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

        {/* READER SETTINGS */}
        {showSettings && (
          <div className={`border-t ${theme.border} px-5 py-5`}>
            <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2">

              {/* PAGE WIDTH */}
              <div>
                <p className="mb-3 text-sm font-bold">
                  Page width
                </p>

                <div className="grid grid-cols-3 gap-2">
                  {['narrow', 'normal', 'wide'].map((width) => (
                    <button
                      key={width}
                      onClick={() => updateSetting('width', width)}
                      className={`rounded-lg border px-3 py-3 text-xs font-semibold capitalize transition ${
                        readerSettings.width === width
                          ? 'border-purple-500 bg-purple-500/15 text-purple-400'
                          : `${theme.border} hover:border-purple-400`
                      }`}
                    >
                      {width}
                    </button>
                  ))}
                </div>
              </div>

              {/* BACKGROUND */}
              <div>
                <p className="mb-3 text-sm font-bold">
                  Reading background
                </p>

                <div className="grid grid-cols-3 gap-2">

                  <button
                    onClick={() => updateSetting('background', 'dark')}
                    className={`flex items-center justify-center gap-2 rounded-lg border px-2 py-3 text-xs font-semibold transition ${
                      readerSettings.background === 'dark'
                        ? 'border-purple-500 bg-purple-500/15 text-purple-400'
                        : `${theme.border} hover:border-purple-400`
                    }`}
                  >
                    <Moon size={15} />
                    Dark
                  </button>

                  <button
                    onClick={() => updateSetting('background', 'black')}
                    className={`flex items-center justify-center gap-2 rounded-lg border px-2 py-3 text-xs font-semibold transition ${
                      readerSettings.background === 'black'
                        ? 'border-purple-500 bg-purple-500/15 text-purple-400'
                        : `${theme.border} hover:border-purple-400`
                    }`}
                  >
                    <Monitor size={15} />
                    Black
                  </button>

                  <button
                    onClick={() => updateSetting('background', 'light')}
                    className={`flex items-center justify-center gap-2 rounded-lg border px-2 py-3 text-xs font-semibold transition ${
                      readerSettings.background === 'light'
                        ? 'border-purple-500 bg-purple-500/15 text-purple-400'
                        : `${theme.border} hover:border-purple-400`
                    }`}
                  >
                    <Sun size={15} />
                    Light
                  </button>

                </div>
              </div>

            </div>

            <p className={`mx-auto mt-5 max-w-4xl text-xs ${theme.muted}`}>
              Your reader preferences are saved automatically on this device.
            </p>
          </div>
        )}
      </header>

      {/* READER CONTENT */}
      <section
        className="mx-auto px-3 pb-12 transition-all duration-300"
        style={{
          maxWidth: WIDTH_OPTIONS[readerSettings.width] || WIDTH_OPTIONS.normal,
        }}
      >

        <div className="py-8 text-center">
          <Link
            to={`/manga/${id}`}
            className={`inline-flex items-center gap-2 text-sm ${theme.secondary} transition hover:text-purple-400`}
          >
            <ArrowLeft size={16} />
            Back to {story.title}
          </Link>

          <h1 className="mt-6 text-2xl font-black sm:text-3xl">
            Chapter {chapter}
          </h1>

          {currentChapter.title && (
            <p className={`mt-2 text-sm ${theme.secondary}`}>
              {currentChapter.title}
            </p>
          )}

          <p className={`mt-2 text-xs ${theme.muted}`}>
            ABYSSORA · {pages.length} pages
          </p>
        </div>

        {/* ACTUAL UPLOADED CHAPTER PAGES */}
        <div className="space-y-1">

          {pages.length > 0 ? (
            pages.map((page, index) => (
              <img
                key={`${currentChapter.id}-${index}`}
                src={page}
                alt={`${story.title} Chapter ${chapter} Page ${index + 1}`}
                loading={index < 2 ? 'eager' : 'lazy'}
                className="block h-auto w-full"
              />
            ))
          ) : (
            <div className={`rounded-2xl border ${theme.border} ${theme.panel} px-5 py-16 text-center`}>
              <AlertCircle
                size={35}
                className={`mx-auto ${theme.muted}`}
              />
              <h2 className="mt-4 text-lg font-bold">
                No pages available
              </h2>
              <p className={`mt-2 text-sm ${theme.secondary}`}>
                This chapter has been published, but it has no page images.
              </p>
            </div>
          )}

        </div>

        {/* END OF CHAPTER */}
        <div className="my-10 rounded-2xl border border-purple-500/20 bg-purple-500/[0.05] p-8 text-center">

          <Sparkles className="mx-auto text-purple-400" size={28} />

          <h2 className="mt-4 text-xl font-black">
            End of Chapter {chapter}
          </h2>

          <p className={`mt-2 text-sm ${theme.secondary}`}>
            Thanks for reading on ABYSSORA.
          </p>

        </div>

        {/* CHAPTER NAVIGATION */}
        <div className="grid grid-cols-2 gap-3">

          {previousChapter ? (
            <button
              onClick={() =>
                navigate(chapterUrl(previousChapter.chapter_number))
              }
              className={`flex items-center justify-center gap-2 rounded-xl border ${theme.border} px-4 py-4 text-sm font-semibold transition hover:border-purple-500`}
            >
              <ArrowLeft size={17} />
              Previous
            </button>
          ) : (
            <button
              disabled
              className={`rounded-xl border ${theme.border} px-4 py-4 text-sm ${theme.muted}`}
            >
              First chapter
            </button>
          )}

          {nextChapter ? (
            <button
              onClick={() =>
                navigate(chapterUrl(nextChapter.chapter_number))
              }
              className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-4 text-sm font-bold text-white transition hover:bg-purple-500"
            >
              Next chapter
              <ArrowRight size={17} />
            </button>
          ) : (
            <button
              disabled
              className={`rounded-xl border ${theme.border} px-4 py-4 text-sm ${theme.muted}`}
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
            className={`max-w-full rounded-xl border ${theme.border} ${theme.panel} px-4 py-3 text-sm ${theme.text} outline-none`}
          >
            {[...publishedChapters]
              .reverse()
              .map((item) => (
                <option
                  key={item.id}
                  value={item.chapter_number}
                >
                  Chapter {item.chapter_number}
                  {item.title ? ` - ${item.title}` : ''}
                </option>
              ))}
          </select>

          <ChevronDown size={16} className={theme.muted} />

        </div>

        <Link
          to={`/manga/${id}`}
          className={`mt-8 flex items-center justify-center gap-2 text-sm ${theme.secondary} transition hover:text-purple-400`}
        >
          <Home size={16} />
          Return to manga details
        </Link>

      </section>

      <footer className={`border-t ${theme.border} py-7 text-center text-xs ${theme.muted}`}>
        © 2026 ABYSSORA
      </footer>

    </main>
  )
}
