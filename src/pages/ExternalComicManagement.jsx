import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Globe,
  LoaderCircle,
  AlertCircle,
  CheckCircle,
  Save,
  X,
  Eye,
  EyeOff,
  ShieldCheck,
  Search,
  Sparkles,
  Link2,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

const emptyForm = {
  reading_type: 'link',
  title: '',
  creator_name: '',
  cover_image_url: '',
  source_url: '',
  embed_url: '',
  description: '',
  genres: '',
  permission_confirmed: false,
  is_active: false,
}

const inputStyle =
  'w-full rounded-xl border border-[#c69aa1]/15 bg-[#110e10] px-4 py-3 text-sm text-[#f4e9e9] outline-none transition placeholder:text-[#89777c] focus:border-[#c58d98]'

const labelStyle =
  'mb-2 block text-sm font-semibold text-[#d9c9cc]'

function Notice({ type = 'success', children }) {
  const Icon = type === 'error' ? AlertCircle : CheckCircle

  return (
    <div
      className={`mb-5 flex items-start gap-3 rounded-xl border p-4 text-sm ${
        type === 'error'
          ? 'border-red-400/20 bg-red-400/5 text-red-300'
          : 'border-emerald-400/20 bg-emerald-400/5 text-emerald-300'
      }`}
    >
      <Icon size={19} className="mt-0.5 shrink-0" />
      <p className="break-words whitespace-pre-line">{children}</p>
    </div>
  )
}

function detectComicPlatform(value) {
  if (!value.trim()) {
    return {
      valid: false,
      provider: '',
      message: 'Paste an official comic URL to identify its platform.',
    }
  }

  try {
    const url = new URL(value.trim())

    if (url.protocol !== 'https:') {
      return {
        valid: false,
        provider: '',
        message: 'Please use a secure HTTPS link.',
      }
    }

    const host = url.hostname.toLowerCase()

    if (
      host === 'webtoons.com' ||
      host.endsWith('.webtoons.com')
    ) {
      return {
        valid: true,
        provider: 'WEBTOON',
        message:
          'WEBTOON link recognised. Add the visible comic details manually. Use an official embed only if expressly permitted.',
      }
    }

    if (
      host === 'webcomicsapp.com' ||
      host.endsWith('.webcomicsapp.com')
    ) {
      return {
        valid: true,
        provider: 'WebComics',
        message:
          'WebComics link recognised. Add the visible comic details manually. Use its official embed feature only according to its terms.',
      }
    }

    return {
      valid: true,
      provider: 'Other website',
      message:
        'Secure link recognised. Make sure it is the creator’s or publisher’s official comic page.',
    }
  } catch {
    return {
      valid: false,
      provider: '',
      message: 'Please enter a valid URL beginning with https://',
    }
  }
}

export default function ExternalComicManagement() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [comics, setComics] = useState([])
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [adminUserId, setAdminUserId] = useState('')

  const [importUrl, setImportUrl] = useState('')
  const [importMessage, setImportMessage] = useState(
    'Paste an official comic URL to identify its platform.'
  )
  const [importProvider, setImportProvider] = useState('')

  const [bulkText, setBulkText] = useState('')
  const [bulkSaving, setBulkSaving] = useState(false)
  const [bulkResult, setBulkResult] = useState('')

  useEffect(() => {
    let cancelled = false

    async function initialise() {
      setLoading(true)

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          navigate('/login', { replace: true })
          return
        }

        const { data: admin, error: adminError } = await supabase
          .from('admin_users')
          .select('user_id')
          .eq('user_id', user.id)
          .maybeSingle()

        if (adminError) throw adminError

        if (!admin) {
          navigate('/', { replace: true })
          return
        }

        if (cancelled) return

        setAdminUserId(user.id)
        await loadComics(cancelled)
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Could not verify administrator access.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    initialise()

    return () => {
      cancelled = true
    }
  }, [navigate])

  async function loadComics(cancelled = false) {
    const { data, error: fetchError } = await supabase
      .from('external_comics')
      .select('*')
      .order('created_at', { ascending: false })

    if (cancelled) return

    if (fetchError) throw fetchError

    setComics(data || [])
  }

  function handleImportUrlChange(value) {
    setImportUrl(value)

    const result = detectComicPlatform(value)

    setImportProvider(result.provider)
    setImportMessage(result.message)
  }

  function prepareComicImport() {
    const result = detectComicPlatform(importUrl)

    setImportProvider(result.provider)
    setImportMessage(result.message)

    if (!result.valid) {
      setError(result.message)
      return
    }

    setError('')
    setSuccess('')

    setEditingId(null)
    setForm({
      ...emptyForm,
      reading_type: 'link',
      source_url: importUrl.trim(),
    })

    setFormOpen(true)
  }

  // BULK IMPORT
  // Format:
  // Title | Creator | URL | Genres | Description

  function parseBulkRows(rawText) {
    const lines = rawText
      .split(/\r?\n/)
      .map((line, index) => ({
        line: line.trim(),
        lineNumber: index + 1,
      }))
      .filter(
        (item) =>
          item.line && !item.line.startsWith('#')
      )

    const parsed = []
    const errors = []

    lines.forEach(({ line, lineNumber }) => {
      const parts = line.split('|').map((part) => part.trim())

      if (
        parts.length < 3 ||
        !parts[0] ||
        !parts[1] ||
        !parts[2]
      ) {
        errors.push(
          `Line ${lineNumber}: use Title | Creator | HTTPS URL`
        )
        return
      }

      const [
        title,
        creator_name,
        source_url,
        genres = '',
        description = '',
      ] = parts

      try {
        const url = new URL(source_url)

        if (url.protocol !== 'https:') {
          errors.push(
            `Line ${lineNumber}: URL must begin with https://`
          )
          return
        }

        parsed.push({
          reading_type: 'link',
          title,
          creator_name,
          cover_image_url: null,
          source_url: url.toString(),
          embed_url: null,
          description,
          genres: genres
            .split(',')
            .map((genre) => genre.trim())
            .filter(Boolean),
          permission_confirmed: false,
          is_active: false,
          created_by: adminUserId,
          updated_at: new Date().toISOString(),
        })
      } catch {
        errors.push(`Line ${lineNumber}: invalid URL`)
      }
    })

    return { parsed, errors }
  }

  async function handleBulkImport() {
    setBulkResult('')
    setError('')
    setSuccess('')

    const { parsed, errors } = parseBulkRows(bulkText)

    if (errors.length) {
      setError(
        `Please fix these rows before importing:\n${errors.join('\n')}`
      )
      return
    }

    if (!parsed.length) {
      setError('Paste at least one complete comic row first.')
      return
    }

    const existingUrls = new Set(
      comics.map((comic) =>
        (comic.source_url || '')
          .replace(/\/$/, '')
          .toLowerCase()
      )
    )

    const seenUrls = new Set()
    const newRows = []
    let duplicateCount = 0

    parsed.forEach((row) => {
      const key = row.source_url
        .replace(/\/$/, '')
        .toLowerCase()

      if (existingUrls.has(key) || seenUrls.has(key)) {
        duplicateCount += 1
      } else {
        seenUrls.add(key)
        newRows.push(row)
      }
    })

    if (!newRows.length) {
      setError(
        'Every URL in this batch is already in your external library.'
      )
      return
    }

    setBulkSaving(true)

    try {
      const { error: insertError } = await supabase
        .from('external_comics')
        .insert(newRows)

      if (insertError) throw insertError

      setBulkText('')

      setBulkResult(
        `Added ${newRows.length} comic${newRows.length === 1 ? '' : 's'} as inactive entries. ${
          duplicateCount
            ? `${duplicateCount} duplicate URL${duplicateCount === 1 ? '' : 's'} skipped.`
            : ''
        } Add permitted cover images if needed, review each entry, then activate it.`
      )

      await loadComics()
    } catch (err) {
      setError(err.message || 'Could not import this batch.')
    } finally {
      setBulkSaving(false)
    }
  }

  function openAddForm() {
    setEditingId(null)
    setForm({ ...emptyForm })
    setError('')
    setSuccess('')
    setFormOpen(true)
  }

  function openEditForm(comic) {
    setEditingId(comic.id)

    setForm({
      reading_type:
        comic.reading_type || (comic.embed_url ? 'embed' : 'link'),
      title: comic.title || '',
      creator_name: comic.creator_name || '',
      cover_image_url: comic.cover_image_url || '',
      source_url: comic.source_url || '',
      embed_url: comic.embed_url || '',
      description: comic.description || '',
      genres: Array.isArray(comic.genres)
        ? comic.genres.join(', ')
        : '',
      permission_confirmed: Boolean(comic.permission_confirmed),
      is_active: Boolean(comic.is_active),
    })

    setError('')
    setSuccess('')
    setFormOpen(true)
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target

    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  function validateForm() {
    if (
      !form.title.trim() ||
      !form.creator_name.trim() ||
      !form.source_url.trim()
    ) {
      return 'Please complete the title, creator and official source URL.'
    }

    if (form.reading_type === 'embed' && !form.embed_url.trim()) {
      return 'Please enter the official embed URL for this comic.'
    }

    try {
      const source = new URL(form.source_url.trim())

      if (source.protocol !== 'https:') {
        return 'The official source URL must use HTTPS.'
      }

      if (form.reading_type === 'embed') {
        const embed = new URL(form.embed_url.trim())

        if (embed.protocol !== 'https:') {
          return 'The official embed URL must use HTTPS.'
        }
      }

      if (
        form.cover_image_url.trim() &&
        new URL(form.cover_image_url.trim()).protocol !== 'https:'
      ) {
        return 'The cover image URL must use HTTPS.'
      }
    } catch {
      return 'Please enter valid URLs, including https://'
    }

    if (
      form.is_active &&
      form.reading_type === 'embed' &&
      !form.permission_confirmed
    ) {
      return 'Confirm that you have permission to embed this comic before activating it.'
    }

    return ''
  }

  async function handleSave(event) {
    event.preventDefault()

    const validationError = validateForm()

    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const comicData = {
        reading_type: form.reading_type,
        title: form.title.trim(),
        creator_name: form.creator_name.trim(),
        cover_image_url: form.cover_image_url.trim() || null,
        source_url: form.source_url.trim(),
        embed_url:
          form.reading_type === 'embed'
            ? form.embed_url.trim()
            : null,
        description: form.description.trim(),
        genres: form.genres
          .split(',')
          .map((genre) => genre.trim())
          .filter(Boolean),
        permission_confirmed:
          form.reading_type === 'embed' &&
          form.permission_confirmed,
        is_active:
          form.reading_type === 'link'
            ? form.is_active
            : form.permission_confirmed && form.is_active,
        updated_at: new Date().toISOString(),
      }

      let result

      if (editingId) {
        result = await supabase
          .from('external_comics')
          .update(comicData)
          .eq('id', editingId)
      } else {
        result = await supabase
          .from('external_comics')
          .insert({
            ...comicData,
            created_by: adminUserId,
          })
      }

      if (result.error) throw result.error

      setFormOpen(false)
      setEditingId(null)
      setForm({ ...emptyForm })

      setSuccess(
        editingId
          ? 'External comic updated successfully.'
          : 'External comic added successfully.'
      )

      await loadComics()
    } catch (err) {
      setError(err.message || 'Could not save external comic.')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(comic) {
    const nextActive = !comic.is_active

    const readingType =
      comic.reading_type || (comic.embed_url ? 'embed' : 'link')

    if (
      nextActive &&
      readingType === 'embed' &&
      !comic.permission_confirmed
    ) {
      setError(
        'This comic cannot be activated until embedding permission is confirmed.'
      )
      return
    }

    setError('')
    setSuccess('')

    const { error: updateError } = await supabase
      .from('external_comics')
      .update({
        is_active: nextActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', comic.id)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setSuccess(
      nextActive
        ? `${comic.title} is now active.`
        : `${comic.title} has been deactivated.`
    )

    try {
      await loadComics()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(comic) {
    const confirmed = window.confirm(
      `Delete "${comic.title}" from external comics? This cannot be undone.`
    )

    if (!confirmed) return

    setDeletingId(comic.id)
    setError('')
    setSuccess('')

    const { error: deleteError } = await supabase
      .from('external_comics')
      .delete()
      .eq('id', comic.id)

    if (deleteError) {
      setError(deleteError.message)
    } else {
      setComics((current) =>
        current.filter((item) => item.id !== comic.id)
      )
      setSuccess('External comic deleted successfully.')
    }

    setDeletingId(null)
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#110e10] text-[#f4e9e9]">
        <div className="text-center">
          <LoaderCircle
            size={32}
            className="mx-auto mb-4 animate-spin text-[#c58d98]"
          />
          <p className="text-sm text-[#ad9da1]">
            Verifying administrator access...
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#110e10] text-[#f4e9e9]">
      <header className="border-b border-[#c69aa1]/15 bg-[#151114]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <div>
            <Link
              to="/admin"
              className="mb-3 inline-flex items-center gap-2 text-sm text-[#d5a2aa] hover:text-white"
            >
              <ArrowLeft size={17} />
              Back to Admin Dashboard
            </Link>

            <h1 className="font-display text-3xl font-semibold sm:text-4xl">
              External Comic Library
            </h1>

            <p className="mt-2 text-sm text-[#89777c]">
              Manage official comic links and creator-authorised embeds.
            </p>
          </div>

          <button
            onClick={openAddForm}
            className="flex items-center gap-2 rounded-xl bg-[#c58d98] px-5 py-3 text-sm font-bold text-[#211619] transition hover:bg-[#d5a2aa]"
          >
            <Plus size={18} />
            Add External Comic
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        {error && <Notice type="error">{error}</Notice>}
        {success && <Notice>{success}</Notice>}

        {/* URL-assisted importer */}
        <section className="mb-7 rounded-2xl border border-[#c69aa1]/20 bg-[#191417] p-5 sm:p-7">
          <div className="mb-5 flex items-start gap-3">
            <div className="rounded-xl bg-[#c58d98]/10 p-3">
              <Sparkles size={23} className="text-[#d5a2aa]" />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c58d98]">
                Quick Import
              </p>
              <h2 className="mt-1 font-display text-2xl font-semibold">
                Add a comic using its URL
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#ad9da1]">
                Paste a comic's official page link. ABYSSORA will recognise
                the platform and prepare the details form for you.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Link2
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#89777c]"
              />
              <input
                type="url"
                value={importUrl}
                onChange={(event) =>
                  handleImportUrlChange(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    prepareComicImport()
                  }
                }}
                className={`${inputStyle} pl-11`}
                placeholder="Paste a WEBTOON, WebComics or other official comic URL..."
              />
            </div>

            <button
              type="button"
              onClick={prepareComicImport}
              className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#c58d98] px-6 py-3 text-sm font-bold text-[#211619] transition hover:bg-[#d5a2aa]"
            >
              <Search size={17} />
              Prepare Import
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {importProvider && (
              <span className="rounded-full border border-[#c69aa1]/25 bg-[#211a1e] px-3 py-1 text-xs font-semibold text-[#e0b7be]">
                {importProvider}
              </span>
            )}

            <p className="text-xs leading-5 text-[#ad9da1]">
              {importMessage}
            </p>
          </div>

          <div className="mt-5 rounded-xl border border-[#c69aa1]/10 bg-[#110e10] p-4">
            <p className="text-xs leading-6 text-[#ad9da1]">
              <strong className="text-[#e0b7be]">
                Privacy and permissions:
              </strong>{' '}
              This helper does not scrape websites, download chapters or
              open additional tabs. You'll enter the comic's visible
              information yourself. Use only permitted cover images and
              creator-approved embeds.
            </p>
          </div>
        </section>

        {/* BULK IMPORT */}
        <section className="mb-7 rounded-2xl border border-[#c69aa1]/20 bg-[#191417] p-5 sm:p-7">
          <div className="mb-4 flex items-start gap-3">
            <div className="rounded-xl bg-[#c58d98]/10 p-3">
              <Globe size={22} className="text-[#d5a2aa]" />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c58d98]">
                Bulk Import
              </p>

              <h2 className="mt-1 font-display text-2xl font-semibold">
                Add multiple comics together
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#ad9da1]">
                Paste one comic per line. This creates all valid entries in one
                batch instead of opening the form repeatedly.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-[#c69aa1]/15 bg-[#110e10] p-4">
            <p className="mb-2 text-xs font-semibold text-[#e0b7be]">
              Required format — use the | separator
            </p>

            <pre className="overflow-x-auto whitespace-pre-wrap text-xs leading-6 text-[#d9c9cc]">
{`Comic Title | Original Creator | https://official-comic-url
Another Title | Creator Name | https://official-comic-url | Action, Fantasy | Short description`}
            </pre>

            <p className="mt-2 text-xs leading-5 text-[#89777c]">
              Columns: Title | Creator | Source URL | Genres (optional) |
              Description (optional). Leave optional columns blank if unknown.
            </p>
          </div>

          <textarea
            value={bulkText}
            onChange={(event) => setBulkText(event.target.value)}
            rows={7}
            className={`${inputStyle} mt-4 resize-y font-mono text-xs leading-6`}
            placeholder={`Title One | Creator One | https://...
Title Two | Creator Two | https://...`}
          />

          {bulkResult && <Notice>{bulkResult}</Notice>}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-xl text-xs leading-5 text-[#89777c]">
              Bulk entries are saved as inactive external links. No chapters or
              artwork are copied. Add only official URLs and metadata you are
              allowed to use, then review and activate entries individually.
            </p>

            <button
              type="button"
              onClick={handleBulkImport}
              disabled={bulkSaving || !bulkText.trim()}
              className="flex shrink-0 items-center gap-2 rounded-xl bg-[#c58d98] px-5 py-3 text-sm font-bold text-[#211619] transition hover:bg-[#d5a2aa] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {bulkSaving ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <Plus size={17} />
              )}

              {bulkSaving ? 'Importing batch...' : 'Import All Rows'}
            </button>
          </div>
        </section>

        <div className="mb-7 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#c69aa1]/15 bg-[#191417] p-5">
            <p className="text-sm text-[#ad9da1]">Total external comics</p>
            <p className="mt-2 font-display text-4xl font-semibold">
              {comics.length}
            </p>
          </div>

          <div className="rounded-2xl border border-[#c69aa1]/15 bg-[#191417] p-5">
            <p className="text-sm text-[#ad9da1]">Active</p>
            <p className="mt-2 font-display text-4xl font-semibold text-emerald-300">
              {comics.filter((comic) => comic.is_active).length}
            </p>
          </div>

          <div className="rounded-2xl border border-[#c69aa1]/15 bg-[#191417] p-5">
            <p className="text-sm text-[#ad9da1]">Awaiting activation</p>
            <p className="mt-2 font-display text-4xl font-semibold text-amber-300">
              {comics.filter((comic) => !comic.is_active).length}
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck
              size={21}
              className="mt-0.5 shrink-0 text-amber-300"
            />

            <div>
              <h2 className="font-semibold text-amber-200">
                Permission matters
              </h2>

              <p className="mt-1 text-sm leading-6 text-[#c9b9bd]">
                Only use an official embed URL when the creator or provider
                permits external embedding. A working iframe is not proof
                of permission. Do not copy or rehost comic pages without
                separate authorisation. Use cover images only when their
                use is permitted.
              </p>
            </div>
          </div>
        </div>

        {comics.length === 0 ? (
          <div className="rounded-2xl border border-[#c69aa1]/15 bg-[#191417] px-6 py-16 text-center">
            <Globe
              size={38}
              className="mx-auto mb-4 text-[#c58d98]"
            />

            <h2 className="font-display text-2xl font-semibold">
              No external comics yet
            </h2>

            <p className="mt-2 text-sm text-[#89777c]">
              Add an official reading link or an embed that the creator
              or platform permits.
            </p>

            <button
              onClick={openAddForm}
              className="mx-auto mt-6 flex items-center gap-2 rounded-xl bg-[#c58d98] px-5 py-3 text-sm font-bold text-[#211619] hover:bg-[#d5a2aa]"
            >
              <Plus size={17} />
              Add Your First External Comic
            </button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {comics.map((comic) => {
              const readingType =
                comic.reading_type || (comic.embed_url ? 'embed' : 'link')

              return (
                <article
                  key={comic.id}
                  className="overflow-hidden rounded-2xl border border-[#c69aa1]/15 bg-[#191417]"
                >
                  <div className="relative flex h-52 items-center justify-center bg-[#211a1e]">
                    {comic.cover_image_url ? (
                      <img
                        src={comic.cover_image_url}
                        alt={`${comic.title} cover`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Globe size={48} className="text-[#c58d98]" />
                    )}

                    <span
                      className={`absolute right-3 top-3 rounded-full border px-3 py-1 text-xs font-semibold ${
                        comic.is_active
                          ? 'border-emerald-400/25 bg-black/75 text-emerald-300'
                          : 'border-amber-400/25 bg-black/75 text-amber-300'
                      }`}
                    >
                      {comic.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-2xl font-semibold">
                        {comic.title}
                      </h2>

                      <span className="rounded-full border border-[#c69aa1]/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#d5a2aa]">
                        {readingType === 'link'
                          ? 'External link'
                          : 'Official embed'}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-[#ad9da1]">
                      By {comic.creator_name}
                    </p>

                    {comic.genres?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {comic.genres.map((genre) => (
                          <span
                            key={genre}
                            className="rounded-full border border-[#c69aa1]/15 px-2.5 py-1 text-xs text-[#c9b9bd]"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 flex items-center gap-2 text-xs">
                      {readingType === 'link' ? (
                        <span className="flex items-center gap-1.5 text-sky-300">
                          <ExternalLink size={14} />
                          Opens on original website
                        </span>
                      ) : comic.permission_confirmed ? (
                        <span className="flex items-center gap-1.5 text-emerald-300">
                          <ShieldCheck size={14} />
                          Embed permission confirmed
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-amber-300">
                          <AlertCircle size={14} />
                          Embed permission not confirmed
                        </span>
                      )}
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => openEditForm(comic)}
                        className="flex items-center justify-center gap-2 rounded-xl border border-[#c69aa1]/20 px-3 py-2.5 text-sm font-semibold text-[#d5a2aa] hover:bg-white/5"
                      >
                        <Pencil size={15} />
                        Edit
                      </button>

                      <button
                        onClick={() => handleToggle(comic)}
                        className="flex items-center justify-center gap-2 rounded-xl border border-[#c69aa1]/20 px-3 py-2.5 text-sm font-semibold text-[#d5a2aa] hover:bg-white/5"
                      >
                        {comic.is_active ? (
                          <>
                            <EyeOff size={15} />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <Eye size={15} />
                            Activate
                          </>
                        )}
                      </button>

                      <Link
                        to={`/external-comic/${comic.id}`}
                        className="flex items-center justify-center gap-2 rounded-xl border border-[#c69aa1]/20 px-3 py-2.5 text-sm font-semibold text-[#d5a2aa] hover:bg-white/5"
                      >
                        <ExternalLink size={15} />
                        Preview
                      </Link>

                      <button
                        onClick={() => handleDelete(comic)}
                        disabled={deletingId === comic.id}
                        className="flex items-center justify-center gap-2 rounded-xl border border-red-400/20 px-3 py-2.5 text-sm font-semibold text-red-300 hover:bg-red-400/5 disabled:opacity-50"
                      >
                        {deletingId === comic.id ? (
                          <LoaderCircle size={15} className="animate-spin" />
                        ) : (
                          <Trash2 size={15} />
                        )}
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
          <div className="mx-auto my-6 max-w-3xl overflow-hidden rounded-2xl border border-[#c69aa1]/20 bg-[#191417] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#c69aa1]/15 p-5 sm:p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c58d98]">
                  External Library
                </p>

                <h2 className="mt-1 font-display text-2xl font-semibold">
                  {editingId ? 'Edit External Comic' : 'Add External Comic'}
                </h2>
              </div>

              <button
                onClick={() => setFormOpen(false)}
                disabled={saving}
                className="rounded-lg border border-[#c69aa1]/15 p-2 text-[#ad9da1] hover:bg-white/5"
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5 p-5 sm:p-6">
              <div>
                <label className={labelStyle}>Reading Method *</label>

                <select
                  name="reading_type"
                  value={form.reading_type}
                  onChange={handleChange}
                  className={inputStyle}
                >
                  <option value="link">
                    External Link — read on original website
                  </option>

                  <option value="embed">
                    Official Embed — read inside ABYSSORA
                  </option>
                </select>

                <p className="mt-2 text-xs text-[#89777c]">
                  External Link is selected by default. Choose Official Embed
                  only when the creator or provider permits it.
                </p>
              </div>

              <div>
                <label className={labelStyle}>Comic Title *</label>

                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                  className={inputStyle}
                  placeholder="Enter the official comic title"
                />
              </div>

              <div>
                <label className={labelStyle}>Original Creator *</label>

                <input
                  name="creator_name"
                  value={form.creator_name}
                  onChange={handleChange}
                  required
                  className={inputStyle}
                  placeholder="Creator or publisher name"
                />
              </div>

              <div>
                <label className={labelStyle}>Cover Image URL</label>

                <input
                  name="cover_image_url"
                  type="url"
                  value={form.cover_image_url}
                  onChange={handleChange}
                  className={inputStyle}
                  placeholder="https://..."
                />

                <p className="mt-2 text-xs text-[#89777c]">
                  Use a cover image only if you have permission or the
                  source's terms allow its use.
                </p>
              </div>

              <div>
                <label className={labelStyle}>
                  Official Comic Source URL *
                </label>

                <input
                  name="source_url"
                  type="url"
                  value={form.source_url}
                  onChange={handleChange}
                  required
                  className={inputStyle}
                  placeholder="https://official-website.com/comic"
                />
              </div>

              {form.reading_type === 'embed' && (
                <div>
                  <label className={labelStyle}>
                    Official Embed URL *
                  </label>

                  <input
                    name="embed_url"
                    type="url"
                    value={form.embed_url}
                    onChange={handleChange}
                    required
                    className={inputStyle}
                    placeholder="https://official-provider.com/embed/..."
                  />

                  <p className="mt-2 text-xs leading-5 text-[#89777c]">
                    Use only an embed URL provided or expressly permitted by
                    the creator or platform. Never guess a URL or bypass
                    iframe restrictions.
                  </p>
                </div>
              )}

              <div>
                <label className={labelStyle}>Genres</label>

                <input
                  name="genres"
                  value={form.genres}
                  onChange={handleChange}
                  className={inputStyle}
                  placeholder="Action, Fantasy, Adventure"
                />

                <p className="mt-2 text-xs text-[#89777c]">
                  Separate genres with commas.
                </p>
              </div>

              <div>
                <label className={labelStyle}>Description</label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  className={`${inputStyle} resize-y`}
                  placeholder="A short description of the comic..."
                />
              </div>

              <div className="space-y-4 rounded-xl border border-[#c69aa1]/15 bg-[#110e10] p-4">
                {form.reading_type === 'embed' && (
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      name="permission_confirmed"
                      checked={form.permission_confirmed}
                      onChange={handleChange}
                      className="mt-1 h-4 w-4 accent-[#c58d98]"
                    />

                    <span>
                      <span className="block text-sm font-semibold text-[#f1e7e8]">
                        I have verified permission to embed this comic.
                      </span>

                      <span className="mt-1 block text-xs leading-5 text-[#89777c]">
                        Confirm only after checking the creator's or
                        provider's terms or obtaining written permission.
                      </span>
                    </span>
                  </label>
                )}

                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={form.is_active}
                    onChange={handleChange}
                    disabled={
                      form.reading_type === 'embed' &&
                      !form.permission_confirmed
                    }
                    className="mt-1 h-4 w-4 accent-[#c58d98] disabled:opacity-40"
                  />

                  <span>
                    <span className="block text-sm font-semibold text-[#f1e7e8]">
                      Make this comic publicly active.
                    </span>

                    <span className="mt-1 block text-xs text-[#89777c]">
                      External links open the original website. Embeds
                      require verified embedding permission before activation.
                    </span>
                  </span>
                </label>
              </div>

              {error && <Notice type="error">{error}</Notice>}

              <div className="flex flex-wrap justify-end gap-3 border-t border-[#c69aa1]/15 pt-5">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  disabled={saving}
                  className="rounded-xl border border-[#c69aa1]/20 px-5 py-3 text-sm font-semibold text-[#d5c5c8] hover:bg-white/5"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-[#c58d98] px-5 py-3 text-sm font-bold text-[#211619] hover:bg-[#d5a2aa] disabled:opacity-50"
                >
                  {saving ? (
                    <LoaderCircle size={17} className="animate-spin" />
                  ) : (
                    <Save size={17} />
                  )}

                  {saving ? 'Saving...' : 'Save External Comic'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}