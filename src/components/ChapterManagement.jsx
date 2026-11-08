
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
  Sparkles,
} from 'lucide-react'

import { supabase } from '../lib/supabase'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const MAX_IMAGE_WIDTH = 1800
const JPEG_QUALITY = 0.84

const panel =
  'rounded-2xl border border-[#dcafb9]/15 bg-[#191417]'

const inputStyle =
  'w-full rounded-xl border border-[#dcafb9]/15 bg-[#110e10] px-4 py-3 text-sm text-[#f4e9e9] outline-none placeholder:text-[#89777c] focus:border-[#c58d98] focus:ring-1 focus:ring-[#c58d98]/20'

const labelStyle =
  'mb-2 block text-sm font-semibold text-[#d8c6ca]'

const buttonPrimary =
  'flex items-center justify-center gap-2 rounded-xl bg-[#c58d98] px-5 py-3.5 text-sm font-bold text-[#211619] transition hover:bg-[#d5a2aa] disabled:cursor-not-allowed disabled:opacity-50'

function Notice({ type = 'error', children }) {
  const isError = type === 'error'

  return (
    <div
      className={`mb-5 flex items-start gap-3 rounded-xl border p-4 text-sm ${
        isError
          ? 'border-[#d78383]/20 bg-[#d78383]/10 text-[#e6a2a2]'
          : 'border-[#8caf9a]/20 bg-[#8caf9a]/10 text-[#a8c9b2]'
      }`}
    >
      {isError ? (
        <AlertCircle size={18} className="mt-0.5 shrink-0" />
      ) : (
        <CheckCircle size={18} className="mt-0.5 shrink-0" />
      )}

      <span className="break-words">{children}</span>
    </div>
  )
}

function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

// Load an image using the browser's image decoder.
async function decodeImage(file) {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file)
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new window.Image()

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)

      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
        image,
        close() {},
      })
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error(`Could not read ${file.name}.`))
    }

    image.src = objectUrl
  })
}

// Convert an image to an optimized JPG in the browser.
async function compressImage(file) {
  let decodedImage

  try {
    decodedImage = await decodeImage(file)

    const originalWidth = decodedImage.width
    const originalHeight = decodedImage.height

    if (!originalWidth || !originalHeight) {
      throw new Error(`Invalid image dimensions: ${file.name}`)
    }

    // Do not enlarge images. Only resize when they exceed the limit.
    const scale = Math.min(
      1,
      MAX_IMAGE_WIDTH / originalWidth
    )

    const width = Math.max(
      1,
      Math.round(originalWidth * scale)
    )

    const height = Math.max(
      1,
      Math.round(originalHeight * scale)
    )

    const canvas = document.createElement('canvas')

    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d', {
      alpha: false,
    })

    if (!context) {
      throw new Error('Your browser could not prepare the image.')
    }

    // White background prevents transparent images from turning black.
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, width, height)

    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'

    context.drawImage(
      decodedImage,
      0,
      0,
      width,
      height
    )

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) {
            resolve(result)
          } else {
            reject(
              new Error(`Could not compress ${file.name}.`)
            )
          }
        },
        'image/jpeg',
        JPEG_QUALITY
      )
    })

    // Keep the original if JPG conversion would increase its size.
    if (blob.size >= file.size) {
      return file
    }

    const originalName = file.name.replace(/\.[^/.]+$/, '')
    const optimizedName = `${originalName}.jpg`

    return new File(
      [blob],
      optimizedName,
      {
        type: 'image/jpeg',
        lastModified: Date.now(),
      }
    )
  } finally {
    if (decodedImage?.close) {
      decodedImage.close()
    }
  }
}

export default function ChapterManagement({ comics = [] }) {
  const [selectedComicId, setSelectedComicId] = useState('')
  const [chapters, setChapters] = useState([])
  const [loadingChapters, setLoadingChapters] = useState(false)

  const [chapterNumber, setChapterNumber] = useState('1')
  const [chapterTitle, setChapterTitle] = useState('')
  const [selectedFiles, setSelectedFiles] = useState([])
  const [publishImmediately, setPublishImmediately] = useState(true)

  const [saving, setSaving] = useState(false)
  const [processingFiles, setProcessingFiles] = useState(false)
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

  // Select and optimize chapter images.
  const handleFileSelection = async (event) => {
    const files = Array.from(event.target.files || [])

    event.target.value = ''

    if (files.length === 0) return

    const supportedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ]

    const invalidFile = files.find(
      (file) => !supportedTypes.includes(file.type)
    )

    if (invalidFile) {
      setError(
        `${invalidFile.name} is not supported. Please select JPG, PNG or WEBP images.`
      )
      return
    }

    const oversizedFile = files.find(
      (file) => file.size > MAX_FILE_SIZE
    )

    if (oversizedFile) {
      setError(
        `${oversizedFile.name} is larger than 10 MB.`
      )
      return
    }

    setProcessingFiles(true)
    setError('')
    setSuccess('')

    try {
      const optimizedFiles = []

      for (const file of files) {
        const optimizedFile = await compressImage(file)
        optimizedFiles.push(optimizedFile)
      }

      const totalOriginalSize = files.reduce(
        (total, file) => total + file.size,
        0
      )

      const totalOptimizedSize = optimizedFiles.reduce(
        (total, file) => total + file.size,
        0
      )

      setSelectedFiles((current) => [
        ...current,
        ...optimizedFiles,
      ])

      if (totalOptimizedSize < totalOriginalSize) {
        const savedPercentage = Math.round(
          (1 - totalOptimizedSize / totalOriginalSize) * 100
        )

        setSuccess(
          `${optimizedFiles.length} page image(s) optimized. Saved approximately ${savedPercentage}% of the original file size.`
        )
      } else {
        setSuccess(
          `${optimizedFiles.length} page image(s) processed and ready for upload.`
        )
      }
    } catch (err) {
      setError(
        err.message || 'Could not optimize the selected images.'
      )
    } finally {
      setProcessingFiles(false)
    }
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
      file.type === 'image/jpeg'
        ? 'jpg'
        : file.name.split('.').pop()?.toLowerCase() || 'jpg'

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

    if (processingFiles) {
      setError('Please wait until image optimization finishes.')
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

  const totalSelectedSize = selectedFiles.reduce(
    (total, file) => total + file.size,
    0
  )

  return (
    <section className="mt-12">
      {/* Section heading */}
      <div className="mb-7">
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-[#c58d98]">
          <BookOpen size={16} />
          Chapter Control
        </div>

        <h2 className="font-display text-3xl font-semibold tracking-wide text-[#f4e9e9]">
          Chapter Management
        </h2>

        <p className="mt-2 max-w-2xl text-sm text-[#a9959a]">
          Upload chapter pages, arrange their reading order, and publish chapters.
        </p>
      </div>

      {error && <Notice type="error">{error}</Notice>}

      {success && <Notice type="success">{success}</Notice>}

      {comics.length === 0 ? (
        <div className={`${panel} p-8 text-center`}>
          <BookOpen
            size={32}
            className="mx-auto mb-3 text-[#c58d98]"
          />
          <p className="font-semibold text-[#f4e9e9]">
            No comics available
          </p>
          <p className="mt-2 text-sm text-[#89777c]">
            Add a comic before creating its chapters.
          </p>
        </div>
      ) : (
        <>
          {/* Comic selector */}
          <div className={`${panel} mb-6 p-5 sm:p-6`}>
            <label className={labelStyle}>
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
              className={inputStyle}
            >
              {comics.map((comic) => (
                <option key={comic.id} value={comic.id}>
                  {comic.title}
                </option>
              ))}
            </select>

            {selectedComic && (
              <p className="mt-3 text-xs text-[#89777c]">
                Current comic:{' '}
                <span className="font-semibold text-[#cba6ad]">
                  {selectedComic.title}
                </span>
              </p>
            )}
          </div>

          {/* Create chapter form */}
          <form
            onSubmit={handleCreateChapter}
            className={`${panel} mb-8 space-y-6 border-[#c58d98]/20 p-5 sm:p-7`}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#c58d98]/20 bg-[#c58d98]/10 text-[#c58d98]">
                <Plus size={20} />
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#f4e9e9]">
                  Create New Chapter
                </h3>
                <p className="mt-1 text-xs text-[#89777c]">
                  Upload the chapter pages in reading order.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelStyle}>
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
                  className={inputStyle}
                />
              </div>

              <div>
                <label className={labelStyle}>
                  Chapter Title
                </label>

                <input
                  type="text"
                  value={chapterTitle}
                  onChange={(event) =>
                    setChapterTitle(event.target.value)
                  }
                  placeholder="Optional chapter title"
                  className={inputStyle}
                />
              </div>
            </div>

            {/* Image upload */}
            <div>
              <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#d8c6ca]">
                <Image size={17} className="text-[#c58d98]" />
                Chapter Page Images *
              </label>

              <label
                className={`group flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#c58d98]/25 bg-[#c58d98]/[0.035] px-5 py-9 text-center transition ${
                  processingFiles || saving
                    ? 'cursor-not-allowed opacity-50'
                    : 'cursor-pointer hover:border-[#c58d98]/60 hover:bg-[#c58d98]/[0.08]'
                }`}
              >
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-[#c58d98]/20 bg-[#c58d98]/10 text-[#c58d98] transition group-hover:scale-105">
                  {processingFiles ? (
                    <LoaderCircle size={25} className="animate-spin" />
                  ) : (
                    <Upload size={25} />
                  )}
                </div>

                <span className="text-sm font-bold text-[#eee1e3]">
                  {processingFiles
                    ? 'Optimizing your images...'
                    : 'Click to select chapter page images'}
                </span>

                <span className="mt-2 text-xs text-[#89777c]">
                  Select multiple images · JPG, PNG or WEBP · Maximum 10 MB each
                </span>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleFileSelection}
                  disabled={processingFiles || saving}
                  className="hidden"
                />
              </label>

              <div className="mt-3 flex items-start gap-2 rounded-xl border border-[#c58d98]/15 bg-[#c58d98]/[0.045] p-3">
                <Sparkles
                  size={16}
                  className="mt-0.5 shrink-0 text-[#d5a2aa]"
                />

                <p className="text-xs leading-relaxed text-[#b9a8ac]">
                  ABYSSORA automatically optimizes images in your browser
                  before uploading. JPG quality is balanced for clear
                  manga text and reduced storage usage. Original files
                  are kept when compression would increase their size.
                </p>
              </div>
            </div>

            {/* Selected images */}
            {selectedFiles.length > 0 && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold text-[#eee1e3]">
                    Selected Pages ({selectedFiles.length})
                  </p>

                  <p className="text-xs text-[#89777c]">
                    Use arrows to arrange reading order.
                  </p>
                </div>

                <div className="rounded-xl border border-[#8caf9a]/15 bg-[#8caf9a]/[0.045] p-3">
                  <p className="text-xs font-semibold text-[#a8c9b2]">
                    <CheckCircle
                      size={14}
                      className="mr-1 inline"
                    />
                    Images ready for upload
                  </p>
                  <p className="mt-1 text-xs text-[#a9959a]">
                    Total optimized size: {formatFileSize(totalSelectedSize)}
                  </p>
                </div>

                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${file.size}-${index}`}
                      className="flex items-center gap-3 rounded-xl border border-[#dcafb9]/10 bg-[#110e10] p-3"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#c58d98]/20 bg-[#c58d98]/10 text-sm font-black text-[#d5a2aa]">
                        {index + 1}
                      </div>

                      <FileImage
                        size={20}
                        className="shrink-0 text-[#a9959a]"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#eee1e3]">
                          {file.name}
                        </p>
                        <p className="text-xs text-[#89777c]">
                          {formatFileSize(file.size)}
                          {file.type === 'image/jpeg' ? ' · JPG' : ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveFile(index, -1)}
                          disabled={index === 0 || saving}
                          className="rounded-lg p-2 text-[#a9959a] hover:bg-[#c58d98]/10 hover:text-[#e5c0c6] disabled:opacity-30"
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
                          className="rounded-lg p-2 text-[#a9959a] hover:bg-[#c58d98]/10 hover:text-[#e5c0c6] disabled:opacity-30"
                          aria-label="Move page down"
                        >
                          <ChevronDown size={17} />
                        </button>

                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          disabled={saving}
                          className="rounded-lg p-2 text-[#d78383] hover:bg-[#d78383]/10 disabled:opacity-30"
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

            {/* Publish option */}
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#dcafb9]/10 bg-[#110e10] p-4 transition hover:border-[#c58d98]/25">
              <input
                type="checkbox"
                checked={publishImmediately}
                onChange={(event) =>
                  setPublishImmediately(event.target.checked)
                }
                className="h-4 w-4 accent-[#c58d98]"
              />

              <span>
                <span className="block text-sm font-semibold text-[#eee1e3]">
                  Publish immediately
                </span>
                <span className="mt-1 block text-xs text-[#89777c]">
                  Uncheck to save this chapter as a draft.
                </span>
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={
                saving ||
                processingFiles ||
                selectedFiles.length === 0
              }
              className={buttonPrimary + ' w-full'}
            >
              {processingFiles ? (
                <>
                  <LoaderCircle size={18} className="animate-spin" />
                  Optimizing images...
                </>
              ) : saving ? (
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
              <p className="text-center text-xs text-[#89777c]">
                Please keep this page open until the upload finishes.
              </p>
            )}
          </form>

          {/* Existing chapters */}
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-[#f4e9e9]">
                  Existing Chapters
                </h3>
                <p className="mt-1 text-xs text-[#89777c]">
                  Manage published chapters and saved drafts.
                </p>
              </div>

              <button
                type="button"
                onClick={loadChapters}
                disabled={loadingChapters}
                className="rounded-lg border border-[#dcafb9]/15 px-3 py-2 text-xs font-semibold text-[#cba6ad] transition hover:border-[#c58d98]/40 hover:bg-[#c58d98]/10 disabled:opacity-50"
              >
                {loadingChapters ? 'Refreshing...' : 'Refresh Chapters'}
              </button>
            </div>

            {loadingChapters ? (
              <div className={`${panel} p-8 text-center`}>
                <LoaderCircle
                  size={27}
                  className="mx-auto animate-spin text-[#c58d98]"
                />
                <p className="mt-3 text-sm text-[#89777c]">
                  Loading chapters...
                </p>
              </div>
            ) : chapters.length === 0 ? (
              <div className={`${panel} p-8 text-center`}>
                <BookOpen
                  size={30}
                  className="mx-auto mb-3 text-[#c58d98]"
                />
                <p className="font-semibold text-[#f4e9e9]">
                  No chapters yet
                </p>
                <p className="mt-2 text-sm text-[#89777c]">
                  Create the first chapter using the form above.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {chapters.map((chapter) => (
                  <article
                    key={chapter.id}
                    className={`${panel} p-4 sm:p-5`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-[#f4e9e9]">
                            Chapter {chapter.chapter_number}
                          </h4>

                          {chapter.is_published ? (
                            <span className="rounded-full border border-[#8caf9a]/20 bg-[#8caf9a]/10 px-2.5 py-1 text-[10px] font-bold text-[#a8c9b2]">
                              Published
                            </span>
                          ) : (
                            <span className="rounded-full border border-[#d4ae7d]/20 bg-[#d4ae7d]/10 px-2.5 py-1 text-[10px] font-bold text-[#dfbd91]">
                              Draft
                            </span>
                          )}
                        </div>

                        {chapter.title && (
                          <p className="mt-1 text-sm text-[#b9a8ac]">
                            {chapter.title}
                          </p>
                        )}

                        <p className="mt-2 text-xs text-[#89777c]">
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
                          className="flex items-center gap-2 rounded-lg border border-[#c58d98]/20 bg-[#c58d98]/[0.06] px-3 py-2 text-xs font-semibold text-[#d5a2aa] transition hover:bg-[#c58d98]/15 disabled:opacity-50"
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
                          className="flex items-center gap-2 rounded-lg border border-[#d78383]/20 bg-[#d78383]/[0.06] px-3 py-2 text-xs font-semibold text-[#e6a2a2] transition hover:bg-[#d78383]/15 disabled:opacity-50"
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

                    {/* Chapter page previews */}
                    {chapter.pages?.length > 0 && (
                      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                        {chapter.pages.map((page, index) => (
                          <div
                            key={`${chapter.id}-${index}`}
                            className="relative h-24 w-16 shrink-0 overflow-hidden rounded-lg border border-[#dcafb9]/15 bg-[#110e10]"
                          >
                            <img
                              src={page}
                              alt={`Chapter ${chapter.chapter_number}, page ${index + 1}`}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                            <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1.5 py-0.5 text-[9px] font-bold text-white">
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
