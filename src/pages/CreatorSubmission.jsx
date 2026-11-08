import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Upload,
  ImagePlus,
  FileText,
  ShieldCheck,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  X,
  Sparkles,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

const GENRES = [
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Fantasy',
  'Horror',
  'Magic',
  'Mystery',
  'Romance',
  'Sci-Fi',
  'Slice of Life',
  'Sports',
  'Supernatural',
  'Thriller',
  'Martial Arts',
  'Reincarnation',
  'Historical',
  'Psychological',
]

const MAX_FILE_SIZE = 10 * 1024 * 1024
const MAX_SAMPLE_FILES = 5

function CreatorSubmission() {
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [creatorName, setCreatorName] = useState('')
  const [comicTitle, setComicTitle] = useState('')
  const [comicFormat, setComicFormat] = useState('Manga')
  const [genres, setGenres] = useState([])
  const [synopsis, setSynopsis] = useState('')
  const [chapterCount, setChapterCount] = useState('0')
  const [officialSourceUrl, setOfficialSourceUrl] = useState('')
  const [rightsDetails, setRightsDetails] = useState('')
  const [rightsConfirmed, setRightsConfirmed] = useState(false)

  const [coverFile, setCoverFile] = useState(null)
  const [sampleFiles, setSampleFiles] = useState([])

  useEffect(() => {
    let mounted = true

    async function checkUser() {
      const { data, error: authError } = await supabase.auth.getUser()

      if (!mounted) return

      if (authError) {
        setError('We could not verify your account. Please sign in again.')
      }

      setUser(data?.user ?? null)
      setCheckingAuth(false)
    }

    checkUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null)
        setCheckingAuth(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  function toggleGenre(genre) {
    setGenres((current) =>
      current.includes(genre)
        ? current.filter((item) => item !== genre)
        : [...current, genre]
    )
  }

  function handleCoverChange(event) {
    const file = event.target.files?.[0]

    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']

    if (!allowedTypes.includes(file.type)) {
      setError('Please choose a JPG, PNG or WEBP cover image.')
      event.target.value = ''
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('Your cover image must be 10 MB or smaller.')
      event.target.value = ''
      return
    }

    setError('')
    setCoverFile(file)
  }

  function handleSampleFilesChange(event) {
    const files = Array.from(event.target.files || [])
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ]

    if (files.length > MAX_SAMPLE_FILES) {
      setError(`You can upload up to ${MAX_SAMPLE_FILES} sample files.`)
      event.target.value = ''
      return
    }

    const invalidFile = files.find(
      (file) =>
        !allowedTypes.includes(file.type) ||
        file.size > MAX_FILE_SIZE
    )

    if (invalidFile) {
      setError(
        'Sample files must be JPG, PNG, WEBP or PDF files, and each must be 10 MB or smaller.'
      )
      event.target.value = ''
      return
    }

    setError('')
    setSampleFiles(files)
  }

  function getExtension(file) {
    const extension = file.name.split('.').pop()?.toLowerCase()
    return extension || 'file'
  }

  async function uploadFile(file, path) {
    const { error: uploadError } = await supabase.storage
      .from('creator-submissions')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      })

    if (uploadError) {
      throw new Error(`Could not upload ${file.name}: ${uploadError.message}`)
    }

    return path
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!user) {
      setError('Please sign in before submitting your comic.')
      return
    }

    if (!creatorName.trim()) {
      setError('Please enter your creator name.')
      return
    }

    if (!comicTitle.trim()) {
      setError('Please enter your comic title.')
      return
    }

    if (!synopsis.trim()) {
      setError('Please provide a comic synopsis.')
      return
    }

    if (genres.length === 0) {
      setError('Please select at least one genre.')
      return
    }

    if (!coverFile) {
      setError('Please upload a cover image.')
      return
    }

    if (!rightsDetails.trim()) {
      setError(
        'Please explain your ownership or permission to publish this work.'
      )
      return
    }

    if (!rightsConfirmed) {
      setError('You must confirm your publishing rights before submitting.')
      return
    }

    if (
      officialSourceUrl.trim() &&
      !/^https?:\/\/.+/i.test(officialSourceUrl.trim())
    ) {
      setError('Please enter a valid source URL beginning with http:// or https://.')
      return
    }

    const parsedChapterCount = Number(chapterCount)

    if (
      !Number.isInteger(parsedChapterCount) ||
      parsedChapterCount < 0
    ) {
      setError('Please enter a valid chapter count.')
      return
    }

    setSubmitting(true)

    try {
      const submissionId = crypto.randomUUID()
      const basePath = `${user.id}/${submissionId}`

      const coverPath = `${basePath}/cover.${getExtension(coverFile)}`

      await uploadFile(coverFile, coverPath)

      const samplePaths = []

      for (let index = 0; index < sampleFiles.length; index += 1) {
        const file = sampleFiles[index]
        const samplePath = `${basePath}/sample-${index + 1}.${getExtension(file)}`

        await uploadFile(file, samplePath)
        samplePaths.push(samplePath)
      }

      const { error: insertError } = await supabase
        .from('creator_submissions')
        .insert({
          user_id: user.id,
          creator_name: creatorName.trim(),
          creator_email: user.email || null,
          comic_title: comicTitle.trim(),
          comic_format: comicFormat,
          genres,
          synopsis: synopsis.trim(),
          chapter_count: parsedChapterCount,
          official_source_url: officialSourceUrl.trim() || null,
          cover_file_path: coverPath,
          sample_file_paths: samplePaths,
          rights_confirmation: true,
          rights_details: rightsDetails.trim(),
          status: 'pending',
        })

      if (insertError) {
        throw insertError
      }

      setSuccess(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (submitError) {
      console.error('Creator submission error:', submitError)
      setError(
        submitError.message ||
          'Something went wrong while submitting your comic. Please try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#100d10] text-[#f5e9e6] flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#d9a0aa]">
          <LoaderCircle className="animate-spin" size={22} />
          Checking your account...
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#100d10] text-[#f5e9e6] flex items-center justify-center px-5">
        <div className="max-w-md w-full rounded-3xl border border-[#49343c] bg-[#191417] p-8 text-center">
          <ShieldCheck className="mx-auto mb-5 text-[#d99ba8]" size={42} />

          <h1 className="font-serif text-3xl mb-3">
            Sign in to become a creator
          </h1>

          <p className="text-[#b9a7ad] leading-7 mb-7">
            You need an ABYSSORA account before you can submit your comic.
          </p>

          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-full bg-[#d99ba8] px-7 py-3 font-semibold text-[#211519] hover:bg-[#e9b4bd] transition"
          >
            Sign in
          </Link>

          <p className="mt-5 text-sm text-[#a9959c]">
            New to ABYSSORA?{' '}
            <Link to="/register" className="text-[#e5aab5] underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#100d10] text-[#f5e9e6] flex items-center justify-center px-5">
        <div className="max-w-lg w-full rounded-3xl border border-[#49343c] bg-[#191417] p-9 text-center">
          <CheckCircle2
            className="mx-auto mb-5 text-[#d99ba8]"
            size={54}
          />

          <p className="text-xs uppercase tracking-[0.3em] text-[#d99ba8] mb-3">
            Submission received
          </p>

          <h1 className="font-serif text-3xl mb-4">
            Thank you, creator.
          </h1>

          <p className="text-[#b9a7ad] leading-7 mb-7">
            Your comic has been submitted successfully. It is now waiting for
            the ABYSSORA team to review its details and publishing permissions.
            It will not appear publicly unless it is approved and separately
            prepared for publication.
          </p>

          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-[#d99ba8] px-7 py-3 font-semibold text-[#211519] hover:bg-[#e9b4bd] transition"
          >
            Return to ABYSSORA
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#100d10] text-[#f5e9e6]">
      <header className="border-b border-[#30252b] bg-[#100d10]/90">
        <div className="max-w-5xl mx-auto px-5 py-5">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-[#c6aeb6] hover:text-white transition"
          >
            <ArrowLeft size={17} />
            Back to ABYSSORA
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-12">
        <div className="max-w-3xl mb-10">
          <div className="flex items-center gap-2 text-[#d99ba8] text-xs uppercase tracking-[0.28em] font-semibold mb-4">
            <Sparkles size={16} />
            Independent Creator Programme
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl mb-5">
            Bring your story to ABYSSORA.
          </h1>

          <p className="text-[#bbaab0] text-base sm:text-lg leading-8">
            Have a manga, manhwa, manhua or webcomic of your own? Tell us about
            it. We welcome original stories from independent creators across
            the world.
          </p>
        </div>

        <div className="rounded-2xl border border-[#59404a] bg-[#1b1519] p-5 sm:p-6 mb-9">
          <div className="flex items-start gap-3">
            <ShieldCheck className="text-[#e0a4b0] shrink-0 mt-1" size={23} />

            <div>
              <h2 className="font-semibold text-lg mb-2">
                Your work stays yours
              </h2>

              <p className="text-sm text-[#c1afb5] leading-7">
                You retain ownership of your comic. By submitting, you confirm
                that you own the work or have the necessary written permission
                to submit it. Your submission and uploaded files remain private
                during review. Submission does not grant ABYSSORA permission to
                publish your work automatically.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-7 rounded-xl border border-red-500/30 bg-red-950/30 p-4 flex items-start gap-3 text-red-200">
            <AlertCircle size={19} className="shrink-0 mt-0.5" />
            <p className="text-sm leading-6">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="rounded-3xl border border-[#35282e] bg-[#171216] p-5 sm:p-8">
            <div className="flex items-center gap-3 mb-7">
              <div className="rounded-xl bg-[#3a252e] p-3 text-[#e0a4b0]">
                <BookOpen size={21} />
              </div>

              <div>
                <h2 className="font-serif text-2xl">Your comic</h2>
                <p className="text-sm text-[#a9959c]">
                  Tell us about the story you have created.
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <label className="block">
                <span className="block text-sm text-[#d9c5cb] mb-2">
                  Comic title *
                </span>
                <input
                  required
                  value={comicTitle}
                  onChange={(event) => setComicTitle(event.target.value)}
                  placeholder="Enter your comic title"
                  className="w-full rounded-xl border border-[#49353e] bg-[#100d10] px-4 py-3 text-white outline-none focus:border-[#d99ba8]"
                />
              </label>

              <label className="block">
                <span className="block text-sm text-[#d9c5cb] mb-2">
                  Comic format *
                </span>
                <select
                  value={comicFormat}
                  onChange={(event) => setComicFormat(event.target.value)}
                  className="w-full rounded-xl border border-[#49353e] bg-[#100d10] px-4 py-3 text-white outline-none focus:border-[#d99ba8]"
                >
                  <option value="Manga">Manga</option>
                  <option value="Manhwa">Manhwa</option>
                  <option value="Manhua">Manhua</option>
                  <option value="Webcomic">Webcomic</option>
                </select>
              </label>
            </div>

            <div className="mt-6">
              <span className="block text-sm text-[#d9c5cb] mb-3">
                Genres * <span className="text-[#a9959c]">(select all that apply)</span>
              </span>

              <div className="flex flex-wrap gap-2">
                {GENRES.map((genre) => {
                  const selected = genres.includes(genre)

                  return (
                    <button
                      type="button"
                      key={genre}
                      onClick={() => toggleGenre(genre)}
                      className={`rounded-full border px-4 py-2 text-sm transition ${
                        selected
                          ? 'border-[#d99ba8] bg-[#d99ba8] text-[#211519]'
                          : 'border-[#49353e] bg-[#100d10] text-[#c9b7bd] hover:border-[#d99ba8]'
                      }`}
                    >
                      {genre}
                    </button>
                  )
                })}
              </div>
            </div>

            <label className="block mt-6">
              <span className="block text-sm text-[#d9c5cb] mb-2">
                Synopsis *
              </span>
              <textarea
                required
                rows={5}
                value={synopsis}
                onChange={(event) => setSynopsis(event.target.value)}
                placeholder="Introduce your story, its world, main characters and central conflict..."
                className="w-full rounded-xl border border-[#49353e] bg-[#100d10] px-4 py-3 text-white outline-none focus:border-[#d99ba8] resize-y"
              />
            </label>

            <div className="grid sm:grid-cols-2 gap-5 mt-6">
              <label className="block">
                <span className="block text-sm text-[#d9c5cb] mb-2">
                  Existing chapter count
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={chapterCount}
                  onChange={(event) => setChapterCount(event.target.value)}
                  className="w-full rounded-xl border border-[#49353e] bg-[#100d10] px-4 py-3 text-white outline-none focus:border-[#d99ba8]"
                />
              </label>

              <label className="block">
                <span className="block text-sm text-[#d9c5cb] mb-2">
                  Official source link
                </span>
                <input
                  type="url"
                  value={officialSourceUrl}
                  onChange={(event) =>
                    setOfficialSourceUrl(event.target.value)
                  }
                  placeholder="https://..."
                  className="w-full rounded-xl border border-[#49353e] bg-[#100d10] px-4 py-3 text-white outline-none focus:border-[#d99ba8]"
                />
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-[#35282e] bg-[#171216] p-5 sm:p-8">
            <div className="flex items-center gap-3 mb-7">
              <div className="rounded-xl bg-[#3a252e] p-3 text-[#e0a4b0]">
                <Upload size={21} />
              </div>

              <div>
                <h2 className="font-serif text-2xl">Artwork and samples</h2>
                <p className="text-sm text-[#a9959c]">
                  Give our review team a preview of your work.
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <span className="block text-sm text-[#d9c5cb] mb-3">
                  Comic cover *
                </span>

                <label className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#72515d] bg-[#100d10] p-5 text-center hover:border-[#e0a4b0] transition">
                  <ImagePlus className="text-[#d99ba8] mb-3" size={34} />
                  <span className="text-sm font-medium">
                    {coverFile ? coverFile.name : 'Choose cover image'}
                  </span>
                  <span className="text-xs text-[#a9959c] mt-2">
                    JPG, PNG or WEBP · Maximum 10 MB
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleCoverChange}
                    className="hidden"
                  />
                </label>

                {coverFile && (
                  <button
                    type="button"
                    onClick={() => setCoverFile(null)}
                    className="mt-3 text-xs text-[#e0a4b0] hover:text-white"
                  >
                    <X size={13} className="inline mr-1" />
                    Remove cover
                  </button>
                )}
              </div>

              <div>
                <span className="block text-sm text-[#d9c5cb] mb-3">
                  Sample pages or chapters
                </span>

                <label className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#72515d] bg-[#100d10] p-5 text-center hover:border-[#e0a4b0] transition">
                  <FileText className="text-[#d99ba8] mb-3" size={34} />
                  <span className="text-sm font-medium">
                    Choose sample files
                  </span>
                  <span className="text-xs text-[#a9959c] mt-2">
                    Up to 5 JPG, PNG, WEBP or PDF files
                  </span>
                  <span className="text-xs text-[#a9959c] mt-1">
                    Maximum 10 MB per file
                  </span>
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={handleSampleFilesChange}
                    className="hidden"
                  />
                </label>

                {sampleFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {sampleFiles.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="flex items-center gap-2 text-xs text-[#c9b7bd]"
                      >
                        <FileText size={14} className="text-[#d99ba8]" />
                        <span className="truncate">{file.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-[#35282e] bg-[#171216] p-5 sm:p-8">
            <div className="flex items-center gap-3 mb-7">
              <div className="rounded-xl bg-[#3a252e] p-3 text-[#e0a4b0]">
                <ShieldCheck size={21} />
              </div>

              <div>
                <h2 className="font-serif text-2xl">Creator and rights</h2>
                <p className="text-sm text-[#a9959c]">
                  Help us verify who created this work and who can publish it.
                </p>
              </div>
            </div>

            <label className="block mb-6">
              <span className="block text-sm text-[#d9c5cb] mb-2">
                Creator or pen name *
              </span>
              <input
                required
                value={creatorName}
                onChange={(event) => setCreatorName(event.target.value)}
                placeholder="Your creator name"
                className="w-full rounded-xl border border-[#49353e] bg-[#100d10] px-4 py-3 text-white outline-none focus:border-[#d99ba8]"
              />
            </label>

            <div className="rounded-xl border border-[#49353e] bg-[#100d10] p-4 mb-6">
              <p className="text-xs text-[#a9959c] mb-1">
                Submission account
              </p>
              <p className="text-sm text-[#e5cbd2] break-all">
                {user.email}
              </p>
            </div>

            <label className="block">
              <span className="block text-sm text-[#d9c5cb] mb-2">
                Explain your rights to this work *
              </span>
              <textarea
                required
                rows={4}
                value={rightsDetails}
                onChange={(event) => setRightsDetails(event.target.value)}
                placeholder="For example: I wrote and illustrated this comic and own the rights to submit it for publication. Or explain the written permission/licence you have, including its source."
                className="w-full rounded-xl border border-[#49353e] bg-[#100d10] px-4 py-3 text-white outline-none focus:border-[#d99ba8] resize-y"
              />
            </label>

            <label className="mt-6 flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={rightsConfirmed}
                onChange={(event) =>
                  setRightsConfirmed(event.target.checked)
                }
                className="mt-1 h-4 w-4 accent-[#d99ba8]"
              />

              <span className="text-sm text-[#c9b7bd] leading-7">
                I confirm that I own this comic or have the necessary
                permission from the relevant rights holders to submit it to
                ABYSSORA for review. I understand that submitting it does not
                automatically authorize publication, and that I may be asked
                to provide evidence of my rights or permission.
              </span>
            </label>
          </section>

          <div className="rounded-2xl border border-[#49353e] bg-[#1b1519] p-5">
            <p className="text-sm text-[#c1afb5] leading-7">
              <strong className="text-[#e5cbd2]">What happens next?</strong>
              <br />
              Your submission goes to our private review queue. Our team will
              check the comic details, sample files and rights information.
              Approval is not a guarantee of publication; any publication
              arrangement and permissions will be confirmed separately.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-3 rounded-full bg-[#d99ba8] px-7 py-4 font-semibold text-[#211519] hover:bg-[#e9b4bd] disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {submitting ? (
              <>
                <LoaderCircle className="animate-spin" size={19} />
                Submitting your comic...
              </>
            ) : (
              <>
                <Upload size={18} />
                Submit for review
              </>
            )}
          </button>

          <p className="text-center text-xs text-[#8f7d84]">
            By submitting, you agree that ABYSSORA may review the materials
            privately for the purpose of evaluating your submission.
          </p>
        </form>
      </main>
    </div>
  )
}

export default CreatorSubmission