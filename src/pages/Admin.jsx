
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
  colors: 'from-violet-950 via-purple-800 to-slate-950',
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

  // NOTIFICATION MANAGEMENT
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

  // SEND NOTIFICATION TO ALL REGISTERED USERS
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
        'from-violet-950 via-purple-800 to-slate-950',
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

  // ADD OR EDIT A COMIC
  // NEW COMICS NOTIFY ALL USERS.
  // EDITED COMICS NOTIFY ONLY USERS WHO BOOKMARKED THEM.
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

      // EXISTING COMIC: NOTIFY ONLY ITS BOOKMARKERS
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

      // NEW COMIC: NOTIFY ALL REGISTERED USERS
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
      <main className="flex min-h-screen items-center justify-center bg-[#09090e] text-white">
        <div className="text-center">
          <LoaderCircle
            className="mx-auto mb-4 animate-spin text-purple-400"
            size={36}
          />
          <p className="text-sm text-gray-400">
            Securing your admin dashboard...
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#09090e] text-white">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-white/10 bg-[#0d0d14] p-6 md:flex md:flex-col">
        <Link to="/" className="mb-12 text-2xl font-black tracking-[0.2em]">
          ABYSS<span className="text-purple-400">ORA</span>
        </Link>

        <div className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">
          Administration
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-purple-500/20 bg-purple-500/10 px-4 py-3 text-purple-300">
          <LayoutDashboard size={19} />
          <span className="text-sm font-semibold">Dashboard</span>
        </div>

        <div className="mt-auto space-y-3">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white"
          >
            <Home size={18} />
            Back to Website
          </Link>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-gray-400 transition hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      <section className="md:ml-64">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-[#0d0d14] px-5 py-5 sm:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-400">
              Control Center
            </p>
            <h1 className="mt-1 text-2xl font-black sm:text-3xl">
              Admin Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadDashboard(true)}
              disabled={refreshing}
              className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-gray-300 transition hover:bg-white/5 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={refreshing ? 'animate-spin' : ''}
              />
              Refresh
            </button>

            <div className="hidden rounded-xl border border-purple-500/20 bg-purple-500/10 px-4 py-2.5 text-xs font-semibold text-purple-300 sm:block">
              <ShieldCheck className="mr-1 inline" size={15} />
              Administrator
            </div>
          </div>
        </header>

        <div className="p-5 sm:p-8">
          <div className="mb-8 rounded-2xl border border-purple-500/20 bg-gradient-to-r from-purple-950/60 to-[#15101f] p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-purple-500/15 p-3 text-purple-300">
                <ShieldCheck size={27} />
              </div>

              <div>
                <h2 className="text-lg font-bold">
                  Welcome, Administrator
                </h2>
                <p className="mt-1 break-all text-sm text-gray-400">
                  {adminEmail}
                </p>
                <p className="mt-3 text-sm text-gray-300">
                  You have access to the ABYSSORA administration area.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
              <AlertCircle size={19} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">
                  Dashboard could not load all statistics
                </p>
                <p className="mt-1">{error}</p>
              </div>
            </div>
          )}

          <div className="mb-5">
            <h2 className="text-xl font-bold">Website Overview</h2>
            <p className="mt-1 text-sm text-gray-500">
              Live figures retrieved from your Supabase database.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {statCards.map((card) => {
              const Icon = card.icon

              return (
                <div
                  key={card.label}
                  className="rounded-2xl border border-white/10 bg-[#11111a] p-6 transition hover:border-purple-500/30"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-400">
                      {card.label}
                    </p>
                    <div className="rounded-xl bg-purple-500/10 p-3 text-purple-300">
                      <Icon size={21} />
                    </div>
                  </div>

                  <p className="mt-5 text-4xl font-black">
                    {card.value == null
                      ? '—'
                      : Number(card.value).toLocaleString()}
                  </p>

                  <p className="mt-2 text-xs text-gray-500">
                    {card.description}
                  </p>
                </div>
              )
            })}
          </div>

          {/* NOTIFICATION MANAGEMENT */}
          <section className="mt-12">
            <div className="mb-6">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-purple-400">
                <Bell size={16} />
                Communication Center
              </div>

              <h2 className="text-2xl font-black">
                Notification Management
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Send announcements and updates directly to every registered ABYSSORA user.
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#11111a]">
              <div className="flex items-center gap-3 border-b border-white/10 bg-purple-500/5 p-5 sm:p-6">
                <div className="rounded-xl bg-purple-500/15 p-3 text-purple-300">
                  <Megaphone size={23} />
                </div>

                <div>
                  <h3 className="font-bold">Create Announcement</h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Your notification will appear in users' notification centers.
                  </p>
                </div>
              </div>

              <form
                onSubmit={handleSendNotification}
                className="space-y-5 p-5 sm:p-6"
              >
                {notificationSuccess && (
                  <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
                    <CheckCircle size={19} className="mt-0.5 shrink-0" />
                    <p>{notificationSuccess}</p>
                  </div>
                )}

                {notificationError && (
                  <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
                    <AlertCircle size={19} className="mt-0.5 shrink-0" />
                    <p>{notificationError}</p>
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-300">
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
                    className="w-full rounded-xl border border-white/10 bg-[#09090e] px-4 py-3 text-sm text-white outline-none transition focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-300">
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
                    className="w-full resize-y rounded-xl border border-white/10 bg-[#09090e] px-4 py-3 text-sm text-white outline-none transition focus:border-purple-500"
                  />

                  <p className="mt-1 text-right text-xs text-gray-600">
                    {notification.message.length}/1000
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-300">
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
                      className="w-full rounded-xl border border-white/10 bg-[#09090e] px-4 py-3 text-sm text-white outline-none transition focus:border-purple-500"
                    >
                      <option value="announcement">Announcement</option>
                      <option value="new_comic">New Comic</option>
                      <option value="new_chapter">New Chapter</option>
                      <option value="update">Website Update</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-300">
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
                      className="w-full rounded-xl border border-white/10 bg-[#09090e] px-4 py-3 text-sm text-white outline-none transition focus:border-purple-500"
                    />

                    <p className="mt-1 text-xs text-gray-600">
                      Example: / or /manga/your-comic-id
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
                  <div className="flex items-start gap-3">
                    <Users size={19} className="mt-0.5 shrink-0 text-purple-300" />
                    <div>
                      <p className="text-sm font-semibold text-purple-200">
                        Audience: All registered users
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        This announcement will be sent to every account registered on ABYSSORA.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end border-t border-white/10 pt-5">
                  <button
                    type="submit"
                    disabled={sendingNotification}
                    className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
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
          <section className="mt-10">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-purple-400">
                  <Library size={15} />
                  Content Control
                </div>

                <h2 className="text-2xl font-black">
                  Comic Management
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  Add, edit and manage comics in your library.
                </p>
              </div>

              <button
                onClick={openAddForm}
                className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold transition hover:bg-purple-500"
              >
                <Plus size={18} />
                Add New Comic
              </button>
            </div>

            {success && (
              <div className="mb-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                {success}
              </div>
            )}

            {comicsError && (
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
                <AlertCircle size={18} className="shrink-0" />
                <span className="break-words">{comicsError}</span>
              </div>
            )}

            {comicsLoading ? (
              <div className="rounded-2xl border border-white/10 bg-[#11111a] p-10 text-center">
                <LoaderCircle
                  size={30}
                  className="mx-auto mb-3 animate-spin text-purple-400"
                />
                <p className="text-sm text-gray-400">
                  Loading your comics...
                </p>
              </div>
            ) : comics.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-[#11111a] p-12 text-center">
                <BookOpen
                  size={35}
                  className="mx-auto mb-4 text-purple-400"
                />
                <h3 className="text-lg font-bold">
                  Your library is empty
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Add your first comic to get started.
                </p>
                <button
                  onClick={openAddForm}
                  className="mt-5 rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold hover:bg-purple-500"
                >
                  Add Your First Comic
                </button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {comics.map((comic) => (
                  <article
                    key={comic.id}
                    className="overflow-hidden rounded-2xl border border-white/10 bg-[#11111a]"
                  >
                    <div className={`relative flex h-48 items-center justify-center overflow-hidden bg-gradient-to-br ${comic.colors || 'from-violet-950 via-purple-800 to-slate-950'}`}>
                      {comic.cover_image ? (
                        <img
                          src={comic.cover_image}
                          alt={`${comic.title} cover`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-6xl text-white/70">
                          {comic.symbol || '✧'}
                        </span>
                      )}

                      <span className="absolute right-3 top-3 rounded-full border border-white/10 bg-black/70 px-3 py-1 text-[10px] font-bold text-white">
                        {comic.status || 'Ongoing'}
                      </span>
                    </div>

                    <div className="p-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-purple-400">
                        {comic.genre || 'Uncategorized'}
                      </p>

                      <h3 className="mt-2 line-clamp-2 text-lg font-bold">
                        {comic.title}
                      </h3>

                      <p className="mt-2 line-clamp-2 text-xs text-gray-500">
                        {comic.description || 'No description provided.'}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                        <span>{comic.chapters || 0} chapters</span>
                        <span>•</span>
                        <span>Rating: {comic.rating ?? 0}</span>
                        <span>•</span>
                        <span>{comic.year || '—'}</span>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <button
                          onClick={() => openEditForm(comic)}
                          className="flex items-center justify-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-2.5 text-sm font-semibold text-purple-300 transition hover:bg-purple-500/20"
                        >
                          <Pencil size={15} />
                          Edit
                        </button>

                        <button
                          onClick={() => handleDeleteComic(comic)}
                          disabled={deletingId === comic.id}
                          className="flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/15 disabled:opacity-50"
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
              <div className="mx-auto my-6 max-w-3xl rounded-2xl border border-white/10 bg-[#11111a] shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 p-5 sm:p-6">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-purple-400">
                      Comic Library
                    </p>
                    <h2 className="mt-1 text-xl font-black">
                      {editingId ? 'Edit Comic' : 'Add New Comic'}
                    </h2>
                  </div>

                  <button
                    onClick={() => setShowForm(false)}
                    disabled={saving}
                    className="rounded-lg border border-white/10 p-2 text-gray-400 hover:bg-white/10 hover:text-white"
                    aria-label="Close form"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSaveComic} className="space-y-5 p-5 sm:p-6">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-300">
                      Comic Title *
                    </label>
                    <input
                      name="title"
                      value={form.title}
                      onChange={handleFormChange}
                      required
                      placeholder="Enter comic title"
                      className="w-full rounded-xl border border-white/10 bg-[#09090e] px-4 py-3 text-sm outline-none transition focus:border-purple-500"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-300">
                        Genre *
                      </label>
                      <input
                        name="genre"
                        value={form.genre}
                        onChange={handleFormChange}
                        required
                        placeholder="Action, Fantasy..."
                        className="w-full rounded-xl border border-white/10 bg-[#09090e] px-4 py-3 text-sm outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-300">
                        Author
                      </label>
                      <input
                        name="author"
                        value={form.author}
                        onChange={handleFormChange}
                        placeholder="Creator name"
                        className="w-full rounded-xl border border-white/10 bg-[#09090e] px-4 py-3 text-sm outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-300">
                        Latest Chapter
                      </label>
                      <input
                        name="chapter"
                        value={form.chapter}
                        onChange={handleFormChange}
                        placeholder="Chapter 1"
                        className="w-full rounded-xl border border-white/10 bg-[#09090e] px-4 py-3 text-sm outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-300">
                        Total Chapters
                      </label>
                      <input
                        type="number"
                        min="0"
                        name="chapters"
                        value={form.chapters}
                        onChange={handleFormChange}
                        className="w-full rounded-xl border border-white/10 bg-[#09090e] px-4 py-3 text-sm outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-300">
                        Publication Status
                      </label>
                      <select
                        name="status"
                        value={form.status}
                        onChange={handleFormChange}
                        className="w-full rounded-xl border border-white/10 bg-[#09090e] px-4 py-3 text-sm outline-none focus:border-purple-500"
                      >
                        <option value="Ongoing">Ongoing</option>
                        <option value="Completed">Completed</option>
                        <option value="Hiatus">Hiatus</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-300">
                        Rating
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        name="rating"
                        value={form.rating}
                        onChange={handleFormChange}
                        className="w-full rounded-xl border border-white/10 bg-[#09090e] px-4 py-3 text-sm outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-300">
                        Release Year
                      </label>
                      <input
                        type="number"
                        name="year"
                        value={form.year}
                        onChange={handleFormChange}
                        className="w-full rounded-xl border border-white/10 bg-[#09090e] px-4 py-3 text-sm outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-300">
                        Card Symbol
                      </label>
                      <input
                        name="symbol"
                        value={form.symbol}
                        onChange={handleFormChange}
                        placeholder="✧"
                        className="w-full rounded-xl border border-white/10 bg-[#09090e] px-4 py-3 text-sm outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  {/* COVER IMAGE UPLOAD */}
                  <div>
                    <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-300">
                      <Image size={17} />
                      Comic Cover Image
                    </label>

                    {form.cover_image && !selectedCoverFile && (
                      <div className="mb-4 flex items-center gap-4 rounded-xl border border-white/10 bg-[#09090e] p-3">
                        <img
                          src={form.cover_image}
                          alt="Current comic cover"
                          className="h-24 w-16 rounded-lg object-cover"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-200">
                            Current cover
                          </p>
                          <p className="mt-1 break-all text-xs text-gray-500">
                            Select another image below to replace it.
                          </p>
                        </div>
                      </div>
                    )}

                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-purple-500/30 bg-purple-500/5 px-5 py-8 text-center transition hover:border-purple-400 hover:bg-purple-500/10">
                      <div className="mb-3 rounded-full bg-purple-500/15 p-3 text-purple-300">
                        <Upload size={24} />
                      </div>

                      <span className="text-sm font-bold text-gray-200">
                        {selectedCoverFile
                          ? 'Choose a different image'
                          : 'Click to upload a cover image'}
                      </span>

                      <span className="mt-2 text-xs text-gray-500">
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
                      <div className="mt-3 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                        <FileImage
                          size={22}
                          className="shrink-0 text-emerald-400"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-emerald-300">
                            {selectedCoverFile.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(selectedCoverFile.size / (1024 * 1024)).toFixed(2)} MB · Ready to upload
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedCoverFile(null)}
                          className="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white"
                          aria-label="Remove selected image"
                        >
                          <X size={17} />
                        </button>
                      </div>
                    )}

                    <p className="mt-3 text-xs text-gray-500">
                      Your image will be uploaded to Supabase Storage when you save the comic.
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-300">
                      Card Gradient Classes
                    </label>
                    <input
                      name="colors"
                      value={form.colors}
                      onChange={handleFormChange}
                      placeholder="from-violet-950 via-purple-800 to-slate-950"
                      className="w-full rounded-xl border border-white/10 bg-[#09090e] px-4 py-3 text-sm outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-300">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleFormChange}
                      rows={4}
                      placeholder="Write a short description of this comic..."
                      className="w-full resize-y rounded-xl border border-white/10 bg-[#09090e] px-4 py-3 text-sm outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="flex flex-wrap justify-end gap-3 border-t border-white/10 pt-5">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      disabled={saving}
                      className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-gray-300 hover:bg-white/5"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-sm font-bold transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
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
          <ChapterManagement comics={comics} />

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-gray-500">
            <span>ABYSSORA Administration</span>
            <span>Secure admin area</span>
          </div>
        </div>
      </section>
    </main>
  )
}
