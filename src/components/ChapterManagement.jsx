
import { useEffect, useState } from 'react'
import {
  BookOpen,
  Plus,
  Upload,
  Image,
  Trash2,
  LoaderCircle,
  AlertCircle,
  CheckCircle,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  FileImage,
  X,
} from 'lucide-react'

import { supabase } from '../lib/supabase'

const MAX_FILE_SIZE = 10 * 1024 * 1024

export default function ChapterManagement({ comics = [] }) {
  const [selectedComicId, setSelectedComicId] = useState('')
  const [chapters, setChapters] = useState([])
  const [loadingChapters, setLoadingChapters] = useState(false)

  const [chapterNumber, setChapterNumber] = useState('1')
  const [chapterTitle, setChapterTitle] = useState('')
  const [selectedFiles, setSelectedFiles] = useState([])
  const [publishImmediately, setPublishImmediately] = useState(true)

  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (comics.length > 0 && !selectedComicId) {
      setSelectedComicId(String(comics[0].id))
    }
  }, [comics, selectedComicId])

  const selectedComic = comics.find(
    (comic) => String(comic.id) === selectedComicId
  )

  const loadChapters = async () => {
    if (!selectedComicId) {
      setChapters([])
      return
    }

    setLoadingChapters(true)
    setError('')

    const { data, error: loadError } = await supabase
      .from('chapters')
      .select('*')
      .eq('comic_id', selectedComicId)
      .order('chapter_number', { ascending: false })

    if (loadError) {
      setError(loadError.message)
    } else {
      setChapters(data || [])
    }

    setLoadingChapters(false)
  }

  useEffect(() => {
    loadChapters()
  }, [selectedComicId])

  // Notify users who bookmarked this comic.
  const notifyReadersAboutChapter = async (number, title) => {
    const { data, error: notificationError } = await supabase.rpc(
      'admin_notify_new_chapter',
      {
        p_comic_id: selectedComicId,
        p_comic_title: selectedComic?.title || 'A comic',
        p_chapter_number: number,
        p_chapter_title: title || '',
      }
    )

    if (notificationError) {
      throw notificationError
    }

    return Number(data || 0)
  }

  const handleFileSelection = (event) => {
    const files = Array.from(event.target.files || [])

    if (files.length === 0) return

    const invalidFile = files.find(
      (file) => !file.type.startsWith('image/')
    )

    if (invalidFile) {
      setError(`${invalidFile.name} is not a valid image.`)
      event.target.value = ''
      return
    }

    const oversizedFile = files.find(
      (file) => file.size > MAX_FILE_SIZE
    )

    if (oversizedFile) {
      setError(`${oversizedFile.name} is larger than 10 MB.`)
      event.target.value = ''
      return
    }

    setError('')
    setSuccess('')

    setSelectedFiles((current) => [
      ...current,
      ...files,
    ])

    event.target.value = ''
  }

  const moveFile = (index, direction) => {
    setSelectedFiles((current) => {
      const updated = [...current]
      const targetIndex = index + direction

      if (targetIndex < 0 || targetIndex >= updated.length) {
        return current
      }

      ;[updated[index], updated[targetIndex]] = [
        updated[targetIndex],
        updated[index],
      ]

      return updated
    })
  }

  const removeFile = (index) => {
    setSelectedFiles((current) =>
      current.filter((_, fileIndex) => fileIndex !== index)
    )
  }

  const uploadChapterPage = async (file, index) => {
    const extension =
      file.name.split('.').pop()?.toLowerCase() || 'jpg'

    const safeComicId = selectedComicId.replace(
      /[^a-zA-Z0-9_-]/g,
      '-'
    )

    const filePath = `${safeComicId}/${chapterNumber}/${Date.now()}-${index}-${crypto.randomUUID()}.${extension}`

    const { error: uploadError } = await supabase.storage
      .from('chapter-pages')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      })

    if (uploadError) throw uploadError

    const { data } = supabase.storage
      .from('chapter-pages')
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  const handleCreateChapter = async (event) => {
    event.preventDefault()

    if (!selectedComicId) {
      setError('Please select a comic first.')
      return
    }

    const number = Number(chapterNumber)

    if (!Number.isInteger(number) || number < 1) {
      setError('Enter a valid chapter number greater than zero.')
      return
    }

    if (selectedFiles.length === 0) {
      setError('Please select at least one chapter page image.')
      return
    }

    if (
      chapters.some(
        (chapter) => chapter.chapter_number === number
      )
    ) {
      setError(`Chapter ${number} already exists for this comic.`)
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const uploadedPages = []

      for (let index = 0; index < selectedFiles.length; index += 1) {
        const imageUrl = await uploadChapterPage(
          selectedFiles[index],
          index + 1
        )

        uploadedPages.push(imageUrl)
      }

      const { error: insertError } = await supabase
        .from('chapters')
        .insert({
          comic_id: selectedComicId,
          chapter_number: number,
          title: chapterTitle.trim(),
          pages: uploadedPages,
          is_published: publishImmediately,
          updated_at: new Date().toISOString(),
        })

      if (insertError) throw insertError

      const currentChapterCount = Number(selectedComic?.chapters || 0)
      const newChapterCount = Math.max(currentChapterCount, number)

      const { error: comicUpdateError } = await supabase
        .from('comics')
        .update({
          chapters: newChapterCount,
          chapter: `Chapter ${newChapterCount}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedComicId)

      let successMessage = comicUpdateError
        ? 'Chapter saved, but the comic chapter count could not be updated. Refresh the dashboard and check the comic.'
        : `Chapter ${number} created successfully!`

      if (comicUpdateError) {
        console.error(
          'Chapter saved, but comic chapter count could not be updated:',
          comicUpdateError
        )
      }

      // Send notifications only when the new chapter is published.
      if (publishImmediately) {
        try {
          const notifiedCount = await notifyReadersAboutChapter(
            number,
            chapterTitle.trim()
          )

          successMessage += ` Notified ${notifiedCount} users who bookmarked this comic.`
        } catch (notificationError) {
          console.error(
            'Chapter notification error:',
            notificationError
          )

          successMessage += ` However, notifications could not be sent: ${notificationError.message}`
        }
      }

      setSuccess(successMessage)

      setChapterNumber(String(number + 1))
      setChapterTitle('')
      setSelectedFiles([])

      await loadChapters()
    } catch (err) {
      setError(err.message || 'Could not create chapter.')
    } finally {
      setSaving(false)
    }
  }

  const togglePublish = async (chapter) => {
    setUpdatingId(chapter.id)
    setError('')
    setSuccess('')

    const { error: updateError } = await supabase
      .from('chapters')
      .update({
        is_published: !chapter.is_published,
        updated_at: new Date().toISOString(),
      })
      .eq('id', chapter.id)

    if (updateError) {
      setError(updateError.message)
    } else {
      setChapters((current) =>
        current.map((item) =>
          item.id === chapter.id
            ? { ...item, is_published: !chapter.is_published }
            : item
        )
      )

      if (!chapter.is_published) {
        // This was a draft, and it has just been published.
        try {
          const notifiedCount = await notifyReadersAboutChapter(
            chapter.chapter_number,
            chapter.title
          )

          setSuccess(
            `Chapter ${chapter.chapter_number} published! Notified ${notifiedCount} users who bookmarked this comic.`
          )
        } catch (notificationError) {
          console.error(
            'Chapter notification error:',
            notificationError
          )

          setSuccess(
            `Chapter ${chapter.chapter_number} published, but notifications could not be sent: ${notificationError.message}`
          )
        }
      } else {
        setSuccess(
          `Chapter ${chapter.chapter_number} moved to drafts.`
        )
      }
    }

    setUpdatingId(null)
  }

  const getStoragePath = (publicUrl) => {
    try {
      const url = new URL(publicUrl)
      const marker = '/storage/v1/object/public/chapter-pages/'
      const markerIndex = url.pathname.indexOf(marker)

      if (markerIndex === -1) return null

      return decodeURIComponent(
        url.pathname.slice(markerIndex + marker.length)
      )
    } catch {
      return null
    }
  }

  const handleDeleteChapter = async (chapter) => {
    const confirmed = window.confirm(
      `Delete Chapter ${chapter.chapter_number}? Its uploaded page images will also be deleted.`
    )

    if (!confirmed) return

    setDeletingId(chapter.id)
    setError('')
    setSuccess('')

    try {
      const paths = (chapter.pages || [])
        .map(getStoragePath)
        .filter(Boolean)

      if (paths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('chapter-pages')
          .remove(paths)

        if (storageError) throw storageError
      }

      const { error: deleteError } = await supabase
        .from('chapters')
        .delete()
        .eq('id', chapter.id)

      if (deleteError) throw deleteError

      setChapters((current) =>
        current.filter((item) => item.id !== chapter.id)
      )

      setSuccess(
        `Chapter ${chapter.chapter_number} deleted successfully.`
      )
    } catch (err) {
      setError(err.message || 'Could not delete chapter.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className="mt-12">
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-purple-400">
          <BookOpen size={16} />
          Chapter Control
        </div>

        <h2 className="text-2xl font-black">
          Chapter Management
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          Upload chapter pages, arrange their reading order, and publish chapters.
        </p>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span className="break-words">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          <CheckCircle size={18} className="mt-0.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {comics.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#11111a] p-8 text-center">
          <BookOpen
            size={32}
            className="mx-auto mb-3 text-purple-400"
          />
          <p className="font-semibold">No comics available</p>
          <p className="mt-2 text-sm text-gray-500">
            Add a comic before creating its chapters.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-6 rounded-2xl border border-white/10 bg-[#11111a] p-5">
            <label className="mb-2 block text-sm font-semibold text-gray-300">
              Select Comic
            </label>

            <select
              value={selectedComicId}
              onChange={(event) => {
                setSelectedComicId(event.target.value)
                setSelectedFiles([])
                setError('')
                setSuccess('')
              }}
              className="w-full rounded-xl border border-white/10 bg-[#09090e] px-4 py-3 text-sm text-white outline-none focus:border-purple-500"
            >
              {comics.map((comic) => (
                <option key={comic.id} value={comic.id}>
                  {comic.title}
                </option>
              ))}
            </select>

            {selectedComic && (
              <p className="mt-3 text-xs text-gray-500">
                Current comic: {selectedComic.title}
              </p>
            )}
          </div>

          <form
            onSubmit={handleCreateChapter}
            className="mb-8 space-y-5 rounded-2xl border border-purple-500/20 bg-[#11111a] p-5 sm:p-6"
          >
            <div>
              <h3 className="text-lg font-bold">
                <Plus className="mr-2 inline text-purple-400" size={19} />
                Create New Chapter
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Upload the chapter pages in reading order.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-300">
                  Chapter Number *
                </label>

                <input
                  type="number"
                  min="1"
                  required
                  value={chapterNumber}
                  onChange={(event) =>
                    setChapterNumber(event.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#09090e] px-4 py-3 text-sm outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-300">
                  Chapter Title
                </label>

                <input
                  type="text"
                  value={chapterTitle}
                  onChange={(event) =>
                    setChapterTitle(event.target.value)
                  }
                  placeholder="Optional chapter title"
                  className="w-full rounded-xl border border-white/10 bg-[#09090e] px-4 py-3 text-sm outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-300">
                <Image size={17} />
                Chapter Page Images *
              </label>

              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-purple-500/30 bg-purple-500/5 px-5 py-8 text-center transition hover:border-purple-400 hover:bg-purple-500/10">
                <div className="mb-3 rounded-full bg-purple-500/15 p-3 text-purple-300">
                  <Upload size={24} />
                </div>

                <span className="text-sm font-bold text-gray-200">
                  Click to select chapter page images
                </span>

                <span className="mt-2 text-xs text-gray-500">
                  Select multiple images · PNG, JPG or WEBP · Maximum 10 MB each
                </span>

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelection}
                  className="hidden"
                />
              </label>
            </div>

            {selectedFiles.length > 0 && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold text-gray-200">
                    Selected Pages ({selectedFiles.length})
                  </p>
                  <p className="text-xs text-gray-500">
                    Use arrows to arrange reading order.
                  </p>
                </div>

                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${file.size}-${index}`}
                      className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#09090e] p-3"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-sm font-black text-purple-300">
                        {index + 1}
                      </div>

                      <FileImage
                        size={20}
                        className="shrink-0 text-gray-400"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-200">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveFile(index, -1)}
                          disabled={index === 0 || saving}
                          className="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white disabled:opacity-30"
                          aria-label="Move page up"
                        >
                          <ChevronUp size={17} />
                        </button>

                        <button
                          type="button"
                          onClick={() => moveFile(index, 1)}
                          disabled={
                            index === selectedFiles.length - 1 || saving
                          }
                          className="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white disabled:opacity-30"
                          aria-label="Move page down"
                        >
                          <ChevronDown size={17} />
                        </button>

                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          disabled={saving}
                          className="rounded-lg p-2 text-red-400 hover:bg-red-500/10 disabled:opacity-30"
                          aria-label="Remove page"
                        >
                          <X size={17} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-[#09090e] p-4">
              <input
                type="checkbox"
                checked={publishImmediately}
                onChange={(event) =>
                  setPublishImmediately(event.target.checked)
                }
                className="h-4 w-4 accent-purple-500"
              />
              <span>
                <span className="block text-sm font-semibold text-gray-200">
                  Publish immediately
                </span>
                <span className="mt-1 block text-xs text-gray-500">
                  Uncheck to save this chapter as a draft.
                </span>
              </span>
            </label>

            <button
              type="submit"
              disabled={saving || selectedFiles.length === 0}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3.5 text-sm font-bold transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <LoaderCircle size={18} className="animate-spin" />
                  Uploading pages and saving chapter...
                </>
              ) : (
                <>
                  <Upload size={18} />
                  Upload and Create Chapter
                </>
              )}
            </button>

            {saving && (
              <p className="text-center text-xs text-gray-500">
                Please keep this page open until the upload finishes.
              </p>
            )}
          </form>

          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-bold">
                Existing Chapters
              </h3>

              <button
                type="button"
                onClick={loadChapters}
                disabled={loadingChapters}
                className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-gray-300 hover:bg-white/5 disabled:opacity-50"
              >
                {loadingChapters ? 'Refreshing...' : 'Refresh Chapters'}
              </button>
            </div>

            {loadingChapters ? (
              <div className="rounded-2xl border border-white/10 bg-[#11111a] p-8 text-center">
                <LoaderCircle
                  size={27}
                  className="mx-auto animate-spin text-purple-400"
                />
                <p className="mt-3 text-sm text-gray-500">
                  Loading chapters...
                </p>
              </div>
            ) : chapters.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-[#11111a] p-8 text-center">
                <BookOpen
                  size={30}
                  className="mx-auto mb-3 text-purple-400"
                />
                <p className="font-semibold">No chapters yet</p>
                <p className="mt-2 text-sm text-gray-500">
                  Create the first chapter using the form above.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {chapters.map((chapter) => (
                  <article
                    key={chapter.id}
                    className="rounded-2xl border border-white/10 bg-[#11111a] p-4 sm:p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold">
                            Chapter {chapter.chapter_number}
                          </h4>

                          {chapter.is_published ? (
                            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-300">
                              Published
                            </span>
                          ) : (
                            <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold text-amber-300">
                              Draft
                            </span>
                          )}
                        </div>

                        {chapter.title && (
                          <p className="mt-1 text-sm text-gray-400">
                            {chapter.title}
                          </p>
                        )}

                        <p className="mt-2 text-xs text-gray-500">
                          {chapter.pages?.length || 0} page images
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => togglePublish(chapter)}
                          disabled={
                            updatingId === chapter.id ||
                            deletingId === chapter.id
                          }
                          className="flex items-center gap-2 rounded-lg border border-purple-500/20 bg-purple-500/5 px-3 py-2 text-xs font-semibold text-purple-300 hover:bg-purple-500/10 disabled:opacity-50"
                        >
                          {updatingId === chapter.id ? (
                            <LoaderCircle
                              size={15}
                              className="animate-spin"
                            />
                          ) : chapter.is_published ? (
                            <EyeOff size={15} />
                          ) : (
                            <Eye size={15} />
                          )}

                          {chapter.is_published ? 'Unpublish' : 'Publish'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteChapter(chapter)}
                          disabled={
                            deletingId === chapter.id ||
                            updatingId === chapter.id
                          }
                          className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                        >
                          {deletingId === chapter.id ? (
                            <LoaderCircle
                              size={15}
                              className="animate-spin"
                            />
                          ) : (
                            <Trash2 size={15} />
                          )}
                          Delete
                        </button>
                      </div>
                    </div>

                    {chapter.pages?.length > 0 && (
                      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                        {chapter.pages.map((page, index) => (
                          <div
                            key={`${chapter.id}-${index}`}
                            className="relative h-24 w-16 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black"
                          >
                            <img
                              src={page}
                              alt={`Chapter ${chapter.chapter_number}, page ${index + 1}`}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                            <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1.5 py-0.5 text-[9px] font-bold">
                              {index + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  )
}
