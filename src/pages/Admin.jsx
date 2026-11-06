import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  ShieldCheck,
  Users,
  Bookmark,
  BookOpen,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  Home,
  AlertCircle,
  LoaderCircle,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Image,
  Library,
  Upload,
  FileImage,
  Bell,
  Send,
  Megaphone,
  CheckCircle,
} from 'lucide-react'

import { supabase } from '../lib/supabase'
import ChapterManagement from '../components/ChapterManagement'

const emptyForm = {
  title: '',
  genre: 'Action',
  chapter: 'Chapter 1',
  chapters: '1',
  status: 'Ongoing',
  rating: '0',
  author: '',
  year: String(new Date().getFullYear()),
  colors: 'from-stone-950 via-rose-950 to-neutral-950',
  symbol: '✧',
  cover_image: '',
  description: '',
}

const emptyNotification = {
  title: '',
  message: '',
  type: 'announcement',
  link: '/',
}

const panel =
  'rounded-2xl border border-[#c69aa1]/15 bg-[#191417]'

const inputStyle =
  'w-full rounded-xl border border-[#c69aa1]/15 bg-[#110e10] px-4 py-3 text-sm text-[#f4e9e9] outline-none transition placeholder:text-[#89777c] focus:border-[#c58d98]'

const labelStyle =
  'mb-2 block text-sm font-semibold text-[#d9c9cc]'

const buttonPrimary =
  'flex items-center justify-center gap-2 rounded-xl bg-[#c58d98] px-5 py-3 text-sm font-bold text-[#211619] transition hover:bg-[#d5a2aa] disabled:cursor-not-allowed disabled:opacity-50'

function Emblem({ size = 40 }) {
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

function SectionLabel({ icon: Icon, children }) {
  return (
    <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#c58d98]">
      <Icon size={16} />
      {children}
    </div>
  )
}

function Notice({ type = 'success', children }) {
  const styles =
    type === 'error'
      ? 'border-red-400/20 bg-red-400/5 text-red-300'
      : 'border-emerald-400/20 bg-emerald-400/5 text-emerald-300'

  const Icon = type === 'error' ? AlertCircle : CheckCircle

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${styles}`}
    >
      <Icon size={19} className="mt-0.5 shrink-0" />
      <p className="break-words">{children}</p>
    </div>
  )
}

export default function Admin() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [adminEmail, setAdminEmail] = useState('')
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  const [comics, setComics] = useState([])
  const [comicsLoading, setComicsLoading] = useState(false)
  const [comicsError, setComicsError] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [selectedCoverFile, setSelectedCoverFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [success, setSuccess] = useState('')

  const [notification, setNotification] = useState({
    ...emptyNotification,
  })
  const [sendingNotification, setSendingNotification] = useState(false)
  const [notificationSuccess, setNotificationSuccess] = useState('')
  const [notificationError, setNotificationError] = useState('')

  const loadComics = async () => {
    setComicsLoading(true)
    setComicsError('')

    const { data, error } = await supabase
      .from('comics')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setComicsError(error.message)
    } else {
      setComics(data || [])
    }

    setComicsLoading(false)
  }

  const loadDashboard = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    setError('')
    setSuccess('')

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

      setAdminEmail(user.email || '')

      const { data, error: statsError } = await supabase.rpc(
        'get_admin_dashboard_stats'
      )

      if (statsError) throw statsError

      setStats(data?.[0] || null)

      await loadComics()
    } catch (err) {
      setError(err.message || 'Unable to load dashboard.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  const handleSendNotification = async (event) => {
    event.preventDefault()

    if (!notification.title.trim() || !notification.message.trim()) {
      setNotificationError('Please enter both a title and a message.')
      return
    }

    setSendingNotification(true)
    setNotificationError('')
    setNotificationSuccess('')

    try {
      const { data, error } = await supabase.rpc(
        'admin_send_notification',
        {
          p_title: notification.title.trim(),
          p_message: notification.message.trim(),
          p_type: notification.type,
          p_link: notification.link.trim() || '/',
        }
      )

      if (error) throw error

      setNotificationSuccess(
        `Notification sent successfully to ${data} registered user${data === 1 ? '' : 's'}!`
      )

      setNotification({ ...emptyNotification })
    } catch (err) {
      setNotificationError(
        err.message || 'Could not send the notification.'
      )
    } finally {
      setSendingNotification(false)
    }
  }

  const openAddForm = () => {
    setEditingId(null)
    setForm({ ...emptyForm })
    setSelectedCoverFile(null)
    setSuccess('')
    setComicsError('')
    setShowForm(true)
  }

  const openEditForm = (comic) => {
    setEditingId(comic.id)

    setForm({
      title: comic.title || '',
      genre: comic.genre || 'Action',
      chapter: comic.chapter || `Chapter ${comic.chapters || 1}`,
      chapters: String(comic.chapters ?? 1),
      status: comic.status || 'Ongoing',
      rating: String(comic.rating ?? 0),
      author: comic.author || '',
      year: String(comic.year || new Date().getFullYear()),
      colors:
        comic.colors ||
        'from-stone-950 via-rose-950 to-neutral-950',
      symbol: comic.symbol || '✧',
      cover_image: comic.cover_image || '',
      description: comic.description || '',
    })

    setSelectedCoverFile(null)
    setSuccess('')
    setComicsError('')
    setShowForm(true)
  }

  const handleFormChange = (event) => {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleCoverSelection = (event) => {
    const file = event.target.files?.[0]

    if (!file) return

    if (!file.type.startsWith('image/')) {
      setComicsError('Please select a valid image file.')
      event.target.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setComicsError('Image must be smaller than 5 MB.')
      event.target.value = ''
      return
    }

    setComicsError('')
    setSelectedCoverFile(file)
  }

  const uploadCoverImage = async (file) => {
    const extension =
      file.name.split('.').pop()?.toLowerCase() || 'jpg'

    const filePath = `${Date.now()}-${crypto.randomUUID()}.${extension}`

    const { error: uploadError } = await supabase.storage
      .from('comic-covers')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      })

    if (uploadError) throw uploadError

    const { data } = supabase.storage
      .from('comic-covers')
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  const handleSaveComic = async (event) => {
    event.preventDefault()

    if (!form.title.trim() || !form.genre.trim()) {
      alert('Please enter a comic title and genre.')
      return
    }

    setSaving(true)
    setComicsError('')
    setSuccess('')

    try {
      let coverImageUrl = form.cover_image.trim() || null

      if (selectedCoverFile) {
        coverImageUrl = await uploadCoverImage(selectedCoverFile)
      }

      const comicData = {
        title: form.title.trim(),
        genre: form.genre.trim(),
        chapter: form.chapter.trim() || 'Chapter 1',
        chapters: Math.max(0, Number(form.chapters) || 0),
        status: form.status,
        rating: Number(form.rating) || 0,
        author: form.author.trim(),
        year: Number(form.year) || new Date().getFullYear(),
        colors: form.colors.trim(),
        symbol: form.symbol.trim() || '✧',
        cover_image: coverImageUrl,
        description: form.description.trim(),
        updated_at: new Date().toISOString(),
      }

      let result
      let newComicId = null

      if (editingId) {
        result = await supabase
          .from('comics')
          .update(comicData)
          .eq('id', editingId)
      } else {
        newComicId =
          `${form.title
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')}-${Date.now()}`

        result = await supabase
          .from('comics')
          .insert({
            id: newComicId,
            ...comicData,
          })
      }

      if (result.error) throw result.error

      const wasEditing = Boolean(editingId)
      let notificationMessage = ''

      if (wasEditing) {
        const { data, error: notificationError } = await supabase.rpc(
          'admin_notify_comic_update',
          {
            p_comic_id: editingId,
            p_comic_title: comicData.title,
          }
        )

        if (notificationError) {
          notificationMessage =
            ` However, update notifications could not be sent: ${notificationError.message}`
        } else {
          const notifiedCount = Number(data || 0)

          notificationMessage =
            ` Notified ${notifiedCount} user${notifiedCount === 1 ? '' : 's'} who bookmarked this comic.`
        }
      }

      if (!wasEditing && newComicId) {
        const { data, error: notificationError } = await supabase.rpc(
          'admin_notify_new_comic',
          {
            p_comic_id: newComicId,
            p_comic_title: comicData.title,
          }
        )

        if (notificationError) {
          notificationMessage =
            ` Comic saved, but automatic notifications could not be sent: ${notificationError.message}`
        } else {
          const notifiedCount = Number(data || 0)

          notificationMessage =
            ` Notified ${notifiedCount} registered user${notifiedCount === 1 ? '' : 's'}.`
        }
      }

      setShowForm(false)
      setEditingId(null)
      setForm({ ...emptyForm })
      setSelectedCoverFile(null)

      setSuccess(
        wasEditing
          ? `Comic updated successfully!${notificationMessage}`
          : `Comic added successfully!${notificationMessage}`
      )

      await loadComics()
    } catch (err) {
      setComicsError(err.message || 'Could not save comic.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteComic = async (comic) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${comic.title}"? This cannot be undone.`
    )

    if (!confirmed) return

    setDeletingId(comic.id)
    setComicsError('')
    setSuccess('')

    const { error } = await supabase
      .from('comics')
      .delete()
      .eq('id', comic.id)

    if (error) {
      setComicsError(error.message)
    } else {
      setComics((current) =>
        current.filter((item) => item.id !== comic.id)
      )
      setSuccess('Comic deleted successfully!')
    }

    setDeletingId(null)
  }

  const statCards = [
    {
      label: 'Total Users',
      value: stats?.total_users,
      icon: Users,
      description: 'Registered accounts',
    },
    {
      label: 'Total Bookmarks',
      value: stats?.total_bookmarks,
      icon: Bookmark,
      description: 'Saved comics',
    },
    {
      label: 'Reading Progress',
      value: stats?.total_reading_progress,
      icon: BookOpen,
      description: 'Saved reading records',
    },
  ]

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#110e10] text-[#f4e9e9]">
        <div className="text-center">
          <Emblem size={58} />
          <LoaderCircle
            className="mx-auto mb-4 mt-5 animate-spin text-[#c58d98]"
            size={30}
          />
          <p className="text-sm text-[#a99499]">
            Securing your admin dashboard...
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#110e10] text-[#f4e9e9]">
      {/* SIDEBAR */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-[#c69aa1]/15 bg-[#151114] p-6 md:flex">
        <Link to="/" className="mb-12 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#c69aa1]/25 bg-[#211a1e]">
            <Emblem size={34} />
          </div>

          <div className="leading-none">
            <div className="font-display text-xl font-semibold tracking-[0.13em] text-[#f1e7e8]">
              ABYSSORA
            </div>
            <div className="mt-1.5 text-[8px] font-semibold tracking-[0.25em] text-[#a88b91]">
              ADMINISTRATION
            </div>
          </div>
        </Link>

        <div className="mb-4 text-[10px] font-bold uppercase tracking-[0.25em] text-[#89777c]">
          Workspace
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-[#c69aa1]/20 bg-[#c58d98]/10 px-4 py-3 text-[#d5a2aa]">
          <LayoutDashboard size={19} />
          <span className="text-sm font-semibold">Dashboard</span>
        </div>

        <div className="mt-auto space-y-3">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-[#ad9da1] transition hover:bg-white/5 hover:text-[#f4e9e9]"
          >
            <Home size={18} />
            Back to Website
          </Link>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-[#ad9da1] transition hover:bg-red-400/10 hover:text-red-300"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <section className="md:ml-64">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#c69aa1]/15 bg-[#151114]/95 px-5 py-5 sm:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#c58d98]">
              Control Center
            </p>
            <h1 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">
              Admin Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadDashboard(true)}
              disabled={refreshing}
              className="flex items-center gap-2 rounded-xl border border-[#c69aa1]/20 px-4 py-2.5 text-sm text-[#d5c5c8] transition hover:bg-white/5 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={refreshing ? 'animate-spin' : ''}
              />
              Refresh
            </button>

            <div className="hidden items-center gap-2 rounded-xl border border-[#c69aa1]/20 bg-[#c58d98]/10 px-4 py-2.5 text-xs font-semibold text-[#d5a2aa] sm:flex">
              <ShieldCheck size={15} />
              Administrator
            </div>
          </div>
        </header>

        <div className="p-5 sm:p-8">
          {/* WELCOME */}
          <div className="relative mb-8 overflow-hidden rounded-2xl border border-[#c69aa1]/20 bg-gradient-to-br from-[#2a1e23] via-[#211a1e] to-[#151114] p-6 sm:p-8">
            <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full border border-[#c58d98]/10" />
            <div className="pointer-events-none absolute -right-5 -top-9 h-40 w-40 rounded-full border border-[#c58d98]/10" />

            <div className="relative flex items-start gap-4">
              <div className="rounded-xl border border-[#c69aa1]/20 bg-[#c58d98]/10 p-3 text-[#d5a2aa]">
                <ShieldCheck size={27} />
              </div>

              <div className="min-w-0">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#c58d98]">
                  Secure Workspace
                </p>
                <h2 className="font-display text-2xl font-semibold sm:text-3xl">
                  Welcome, Administrator
                </h2>
                <p className="mt-2 break-all text-sm text-[#ad9da1]">
                  {adminEmail}
                </p>
                <p className="mt-3 text-sm text-[#c9b9bd]">
                  You have access to the ABYSSORA administration area.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-300">
              <AlertCircle size={19} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">
                  Dashboard could not load all statistics
                </p>
                <p className="mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* STATISTICS */}
          <div className="mb-5">
            <SectionLabel icon={LayoutDashboard}>
              Overview
            </SectionLabel>
            <h2 className="font-display text-3xl font-semibold">
              Website Overview
            </h2>
            <p className="mt-1 text-sm text-[#89777c]">
              Live figures retrieved from your Supabase database.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {statCards.map((card, index) => {
              const Icon = card.icon

              return (
                <div
                  key={card.label}
                  className={`${panel} group p-6 transition hover:border-[#c69aa1]/35`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-[#ad9da1]">
                      {card.label}
                    </p>

                    <div className="rounded-xl border border-[#c69aa1]/15 bg-[#c58d98]/10 p-3 text-[#d5a2aa] transition group-hover:bg-[#c58d98]/15">
                      <Icon size={21} />
                    </div>
                  </div>

                  <p className="mt-5 font-display text-5xl font-semibold">
                    {card.value == null
                      ? '—'
                      : Number(card.value).toLocaleString()}
                  </p>

                  <p className="mt-2 text-xs text-[#89777c]">
                    {card.description}
                  </p>
                </div>
              )
            })}
          </div>

          {/* NOTIFICATIONS */}
          <section className="mt-12">
            <div className="mb-6">
              <SectionLabel icon={Bell}>
                Communication Center
              </SectionLabel>

              <h2 className="font-display text-3xl font-semibold">
                Notification Management
              </h2>

              <p className="mt-2 text-sm text-[#89777c]">
                Send announcements and updates directly to every registered ABYSSORA user.
              </p>
            </div>

            <div className={`${panel} overflow-hidden`}>
              <div className="flex items-center gap-3 border-b border-[#c69aa1]/15 bg-[#c58d98]/5 p-5 sm:p-6">
                <div className="rounded-xl border border-[#c69aa1]/20 bg-[#c58d98]/10 p-3 text-[#d5a2aa]">
                  <Megaphone size={23} />
                </div>

                <div>
                  <h3 className="font-semibold text-[#f1e7e8]">
                    Create Announcement
                  </h3>
                  <p className="mt-1 text-xs text-[#89777c]">
                    Your notification will appear in users' notification centers.
                  </p>
                </div>
              </div>

              <form
                onSubmit={handleSendNotification}
                className="space-y-5 p-5 sm:p-6"
              >
                {notificationSuccess && (
                  <Notice>{notificationSuccess}</Notice>
                )}

                {notificationError && (
                  <Notice type="error">{notificationError}</Notice>
                )}

                <div>
                  <label className={labelStyle}>
                    Notification Title *
                  </label>

                  <input
                    type="text"
                    value={notification.title}
                    onChange={(event) =>
                      setNotification((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    maxLength={120}
                    required
                    placeholder="Example: New chapter released!"
                    className={inputStyle}
                  />
                </div>

                <div>
                  <label className={labelStyle}>
                    Message *
                  </label>

                  <textarea
                    value={notification.message}
                    onChange={(event) =>
                      setNotification((current) => ({
                        ...current,
                        message: event.target.value,
                      }))
                    }
                    maxLength={1000}
                    rows={4}
                    required
                    placeholder="Write your announcement here..."
                    className={`${inputStyle} resize-y`}
                  />

                  <p className="mt-1 text-right text-xs text-[#89777c]">
                    {notification.message.length}/1000
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelStyle}>
                      Notification Type
                    </label>

                    <select
                      value={notification.type}
                      onChange={(event) =>
                        setNotification((current) => ({
                          ...current,
                          type: event.target.value,
                        }))
                      }
                      className={inputStyle}
                    >
                      <option value="announcement">Announcement</option>
                      <option value="new_comic">New Comic</option>
                      <option value="new_chapter">New Chapter</option>
                      <option value="update">Website Update</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelStyle}>
                      Destination Link
                    </label>

                    <input
                      type="text"
                      value={notification.link}
                      onChange={(event) =>
                        setNotification((current) => ({
                          ...current,
                          link: event.target.value,
                        }))
                      }
                      placeholder="/"
                      className={inputStyle}
                    />

                    <p className="mt-1 text-xs text-[#89777c]">
                      Example: / or /manga/your-comic-id
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-[#c69aa1]/20 bg-[#c58d98]/5 p-4">
                  <div className="flex items-start gap-3">
                    <Users
                      size={19}
                      className="mt-0.5 shrink-0 text-[#d5a2aa]"
                    />
                    <div>
                      <p className="text-sm font-semibold text-[#e0c1c6]">
                        Audience: All registered users
                      </p>
                      <p className="mt-1 text-xs text-[#89777c]">
                        This announcement will be sent to every account registered on ABYSSORA.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end border-t border-[#c69aa1]/15 pt-5">
                  <button
                    type="submit"
                    disabled={sendingNotification}
                    className={buttonPrimary}
                  >
                    {sendingNotification ? (
                      <LoaderCircle size={18} className="animate-spin" />
                    ) : (
                      <Send size={17} />
                    )}

                    {sendingNotification
                      ? 'Sending...'
                      : 'Send to All Users'}
                  </button>
                </div>
              </form>
            </div>
          </section>

          {/* COMIC MANAGEMENT */}
          <section className="mt-12">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <SectionLabel icon={Library}>
                  Content Control
                </SectionLabel>

                <h2 className="font-display text-3xl font-semibold">
                  Comic Management
                </h2>

                <p className="mt-2 text-sm text-[#89777c]">
                  Add, edit and manage comics in your library.
                </p>
              </div>

              <button
                onClick={openAddForm}
                className={buttonPrimary}
              >
                <Plus size={18} />
                Add New Comic
              </button>
            </div>

            {success && (
              <div className="mb-5">
                <Notice>{success}</Notice>
              </div>
            )}

            {comicsError && (
              <div className="mb-5">
                <Notice type="error">{comicsError}</Notice>
              </div>
            )}

            {comicsLoading ? (
              <div className={`${panel} p-10 text-center`}>
                <LoaderCircle
                  size={30}
                  className="mx-auto mb-3 animate-spin text-[#c58d98]"
                />
                <p className="text-sm text-[#ad9da1]">
                  Loading your comics...
                </p>
              </div>
            ) : comics.length === 0 ? (
              <div className={`${panel} p-12 text-center`}>
                <BookOpen
                  size={35}
                  className="mx-auto mb-4 text-[#c58d98]"
                />
                <h3 className="font-display text-2xl font-semibold">
                  Your library is empty
                </h3>
                <p className="mt-2 text-sm text-[#89777c]">
                  Add your first comic to get started.
                </p>
                <button
                  onClick={openAddForm}
                  className={`${buttonPrimary} mx-auto mt-5`}
                >
                  Add Your First Comic
                </button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {comics.map((comic) => (
                  <article
                    key={comic.id}
                    className={`${panel} overflow-hidden transition hover:border-[#c69aa1]/30`}
                  >
                    <div
                      className={`relative flex h-48 items-center justify-center overflow-hidden bg-gradient-to-br ${comic.colors || 'from-stone-950 via-rose-950 to-neutral-950'}`}
                    >
                      {comic.cover_image ? (
                        <img
                          src={comic.cover_image}
                          alt={`${comic.title} cover`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="font-display text-6xl text-white/70">
                          {comic.symbol || '✧'}
                        </span>
                      )}

                      <span className="absolute right-3 top-3 rounded-full border border-white/15 bg-black/70 px-3 py-1 text-[10px] font-bold text-white">
                        {comic.status || 'Ongoing'}
                      </span>
                    </div>

                    <div className="p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#c58d98]">
                        {comic.genre || 'Uncategorized'}
                      </p>

                      <h3 className="mt-2 line-clamp-2 font-display text-2xl font-semibold">
                        {comic.title}
                      </h3>

                      <p className="mt-2 line-clamp-2 text-xs text-[#89777c]">
                        {comic.description || 'No description provided.'}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-[#ad9da1]">
                        <span>{comic.chapters || 0} chapters</span>
                        <span>•</span>
                        <span>Rating: {comic.rating ?? 0}</span>
                        <span>•</span>
                        <span>{comic.year || '—'}</span>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <button
                          onClick={() => openEditForm(comic)}
                          className="flex items-center justify-center gap-2 rounded-xl border border-[#c69aa1]/25 bg-[#c58d98]/10 px-3 py-2.5 text-sm font-semibold text-[#d5a2aa] transition hover:bg-[#c58d98]/20"
                        >
                          <Pencil size={15} />
                          Edit
                        </button>

                        <button
                          onClick={() => handleDeleteComic(comic)}
                          disabled={deletingId === comic.id}
                          className="flex items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-400/5 px-3 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-400/10 disabled:opacity-50"
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
                ))}
              </div>
            )}
          </section>

          {/* ADD / EDIT FORM */}
          {showForm && (
            <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
              <div className="mx-auto my-6 max-w-3xl overflow-hidden rounded-2xl border border-[#c69aa1]/20 bg-[#191417] shadow-2xl">
                <div className="flex items-center justify-between border-b border-[#c69aa1]/15 p-5 sm:p-6">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c58d98]">
                      Comic Library
                    </p>
                    <h2 className="mt-1 font-display text-3xl font-semibold">
                      {editingId ? 'Edit Comic' : 'Add New Comic'}
                    </h2>
                  </div>

                  <button
                    onClick={() => setShowForm(false)}
                    disabled={saving}
                    className="rounded-lg border border-[#c69aa1]/15 p-2 text-[#ad9da1] transition hover:bg-white/5 hover:text-white"
                    aria-label="Close form"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form
                  onSubmit={handleSaveComic}
                  className="space-y-5 p-5 sm:p-6"
                >
                  <div>
                    <label className={labelStyle}>
                      Comic Title *
                    </label>
                    <input
                      name="title"
                      value={form.title}
                      onChange={handleFormChange}
                      required
                      placeholder="Enter comic title"
                      className={inputStyle}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelStyle}>Genre *</label>
                      <input
                        name="genre"
                        value={form.genre}
                        onChange={handleFormChange}
                        required
                        placeholder="Action, Fantasy..."
                        className={inputStyle}
                      />
                    </div>

                    <div>
                      <label className={labelStyle}>Author</label>
                      <input
                        name="author"
                        value={form.author}
                        onChange={handleFormChange}
                        placeholder="Creator name"
                        className={inputStyle}
                      />
                    </div>

                    <div>
                      <label className={labelStyle}>Latest Chapter</label>
                      <input
                        name="chapter"
                        value={form.chapter}
                        onChange={handleFormChange}
                        placeholder="Chapter 1"
                        className={inputStyle}
                      />
                    </div>

                    <div>
                      <label className={labelStyle}>Total Chapters</label>
                      <input
                        type="number"
                        min="0"
                        name="chapters"
                        value={form.chapters}
                        onChange={handleFormChange}
                        className={inputStyle}
                      />
                    </div>

                    <div>
                      <label className={labelStyle}>
                        Publication Status
                      </label>
                      <select
                        name="status"
                        value={form.status}
                        onChange={handleFormChange}
                        className={inputStyle}
                      >
                        <option value="Ongoing">Ongoing</option>
                        <option value="Completed">Completed</option>
                        <option value="Hiatus">Hiatus</option>
                      </select>
                    </div>

                    <div>
                      <label className={labelStyle}>Rating</label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        name="rating"
                        value={form.rating}
                        onChange={handleFormChange}
                        className={inputStyle}
                      />
                    </div>

                    <div>
                      <label className={labelStyle}>Release Year</label>
                      <input
                        type="number"
                        name="year"
                        value={form.year}
                        onChange={handleFormChange}
                        className={inputStyle}
                      />
                    </div>

                    <div>
                      <label className={labelStyle}>Card Symbol</label>
                      <input
                        name="symbol"
                        value={form.symbol}
                        onChange={handleFormChange}
                        placeholder="✧"
                        className={inputStyle}
                      />
                    </div>
                  </div>

                  {/* COVER IMAGE */}
                  <div>
                    <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#d9c9cc]">
                      <Image size={17} />
                      Comic Cover Image
                    </label>

                    {form.cover_image && !selectedCoverFile && (
                      <div className="mb-4 flex items-center gap-4 rounded-xl border border-[#c69aa1]/15 bg-[#110e10] p-3">
                        <img
                          src={form.cover_image}
                          alt="Current comic cover"
                          className="h-24 w-16 rounded-lg object-cover"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#f1e7e8]">
                            Current cover
                          </p>
                          <p className="mt-1 break-all text-xs text-[#89777c]">
                            Select another image below to replace it.
                          </p>
                        </div>
                      </div>
                    )}

                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#c69aa1]/30 bg-[#c58d98]/5 px-5 py-8 text-center transition hover:border-[#c58d98] hover:bg-[#c58d98]/10">
                      <div className="mb-3 rounded-full border border-[#c69aa1]/20 bg-[#c58d98]/10 p-3 text-[#d5a2aa]">
                        <Upload size={24} />
                      </div>

                      <span className="text-sm font-bold text-[#f1e7e8]">
                        {selectedCoverFile
                          ? 'Choose a different image'
                          : 'Click to upload a cover image'}
                      </span>

                      <span className="mt-2 text-xs text-[#89777c]">
                        PNG, JPG, WEBP or GIF · Maximum 5 MB
                      </span>

                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverSelection}
                        className="hidden"
                      />
                    </label>

                    {selectedCoverFile && (
                      <div className="mt-3 flex items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3">
                        <FileImage
                          size={22}
                          className="shrink-0 text-emerald-400"
                        />

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-emerald-300">
                            {selectedCoverFile.name}
                          </p>
                          <p className="text-xs text-[#89777c]">
                            {(selectedCoverFile.size / (1024 * 1024)).toFixed(2)} MB · Ready to upload
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedCoverFile(null)}
                          className="rounded-lg p-2 text-[#ad9da1] hover:bg-white/10 hover:text-white"
                          aria-label="Remove selected image"
                        >
                          <X size={17} />
                        </button>
                      </div>
                    )}

                    <p className="mt-3 text-xs text-[#89777c]">
                      Your image will be uploaded to Supabase Storage when you save the comic.
                    </p>
                  </div>

                  <div>
                    <label className={labelStyle}>
                      Card Gradient Classes
                    </label>
                    <input
                      name="colors"
                      value={form.colors}
                      onChange={handleFormChange}
                      placeholder="from-stone-950 via-rose-950 to-neutral-950"
                      className={inputStyle}
                    />
                  </div>

                  <div>
                    <label className={labelStyle}>Description</label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleFormChange}
                      rows={4}
                      placeholder="Write a short description of this comic..."
                      className={`${inputStyle} resize-y`}
                    />
                  </div>

                  <div className="flex flex-wrap justify-end gap-3 border-t border-[#c69aa1]/15 pt-5">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      disabled={saving}
                      className="rounded-xl border border-[#c69aa1]/20 px-5 py-3 text-sm font-semibold text-[#d5c5c8] transition hover:bg-white/5"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={saving}
                      className={buttonPrimary}
                    >
                      {saving ? (
                        <LoaderCircle size={17} className="animate-spin" />
                      ) : (
                        <Save size={17} />
                      )}

                      {saving
                        ? 'Saving...'
                        : editingId
                          ? 'Save Changes'
                          : 'Add Comic'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* CHAPTER MANAGEMENT */}
          <section className="mt-12">
            <SectionLabel icon={BookOpen}>
              Publishing Studio
            </SectionLabel>
            <ChapterManagement comics={comics} />
          </section>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-[#c69aa1]/15 pt-6 text-xs text-[#89777c]">
            <span className="font-display text-base tracking-[0.15em] text-[#c9b9bd]">
              ABYSSORA
            </span>
            <span>Secure admin workspace</span>
          </div>
        </div>
      </section>
    </main>
  )
}