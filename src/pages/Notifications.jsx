import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Megaphone,
  BookOpen,
  Clock,
  LoaderCircle,
  Inbox,
  Sparkles,
  ArrowUpRight,
  AlertCircle,
} from 'lucide-react'

import { supabase } from '../lib/supabase'

function Emblem({ size = 42 }) {
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

function Brand() {
  return (
    <Link to="/" className="group flex shrink-0 items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#c69aa1]/30 bg-[#211a1e] transition group-hover:border-[#c69aa1]/70">
        <Emblem size={34} />
      </div>

      <div className="leading-none">
        <div className="font-display text-[25px] font-semibold tracking-[0.15em] text-[#f1e7e8] transition group-hover:text-[#dfb9bf]">
          ABYSSORA
        </div>

        <div className="mt-1.5 font-sans text-[8px] font-semibold tracking-[0.32em] text-[#a88b91]">
          WORLDS BEYOND STORIES
        </div>
      </div>
    </Link>
  )
}

function SectionEyebrow({ children, icon: Icon }) {
  return (
    <div className="flex items-center gap-2 text-[#c99aa2]">
      {Icon && <Icon size={17} />}
      <span className="text-[10px] font-bold uppercase tracking-[0.28em]">
        {children}
      </span>
    </div>
  )
}

function getNotificationIcon(type) {
  switch (type) {
    case 'chapter':
      return BookOpen

    case 'comic':
      return Sparkles

    case 'announcement':
      return Megaphone

    default:
      return Bell
  }
}

function formatDate(date) {
  if (!date) return ''

  return new Date(date).toLocaleString([], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [user, setUser] = useState(null)
  const [processingId, setProcessingId] = useState(null)
  const [markingAll, setMarkingAll] = useState(false)

  useEffect(() => {
    loadNotifications()
  }, [])

  async function loadNotifications() {
    setLoading(true)
    setError('')

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser()

      if (authError) throw authError

      const currentUser = authData.user

      if (!currentUser) {
        setUser(null)
        setNotifications([])
        return
      }

      setUser(currentUser)

      const { data, error: notificationError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })

      if (notificationError) throw notificationError

      setNotifications(data || [])
    } catch (err) {
      console.error('Notifications error:', err)
      setError(err.message || 'Unable to load notifications.')
    } finally {
      setLoading(false)
    }
  }

  async function markAsRead(notificationId) {
    if (processingId || markingAll) return

    setProcessingId(notificationId)

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Mark as read error:', error)
      setError('Could not update this notification. Please try again.')
      setProcessingId(null)
      return
    }

    setNotifications((previous) =>
      previous.map((notification) =>
        notification.id === notificationId
          ? { ...notification, is_read: true }
          : notification
      )
    )

    setProcessingId(null)
  }

  async function markAllAsRead() {
    if (!user || markingAll || processingId) return

    const unreadIds = notifications
      .filter((notification) => !notification.is_read)
      .map((notification) => notification.id)

    if (unreadIds.length === 0) return

    setMarkingAll(true)
    setError('')

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', unreadIds)
      .eq('user_id', user.id)

    if (error) {
      setError(error.message)
      setMarkingAll(false)
      return
    }

    setNotifications((previous) =>
      previous.map((notification) => ({
        ...notification,
        is_read: true,
      }))
    )

    setMarkingAll(false)
  }

  async function deleteNotification(notificationId) {
    if (processingId || markingAll) return

    setProcessingId(notificationId)
    setError('')

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', user.id)

    if (error) {
      setError(error.message)
      setProcessingId(null)
      return
    }

    setNotifications((previous) =>
      previous.filter((notification) => notification.id !== notificationId)
    )

    setProcessingId(null)
  }

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#110e10] text-[#f4e9e9]">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#c58d98]/20 bg-[#211a1e]">
            <Emblem size={44} />
          </div>

          <LoaderCircle
            className="mx-auto mt-5 animate-spin text-[#c58d98]"
            size={25}
          />

          <p className="mt-4 text-sm text-[#a9959a]">
            Gathering your updates...
          </p>
        </div>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#110e10] px-5 text-[#f4e9e9]">
        <div className="w-full max-w-md rounded-3xl border border-[#dcb1b9]/10 bg-[#191417] px-6 py-12 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-[#c58d98]/20 bg-[#c58d98]/[0.07]">
            <Bell size={34} className="text-[#c58d98]" />
          </div>

          <h1 className="mt-7 font-display text-3xl font-semibold">
            Your updates await.
          </h1>

          <p className="mt-3 text-sm leading-7 text-[#a9959a]">
            Sign in to discover new chapters, announcements and updates from ABYSSORA.
          </p>

          <Link
            to="/login"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#c58d98] px-7 py-3 text-sm font-bold text-[#211619] transition hover:bg-[#d5a2aa]"
          >
            Sign In
            <ArrowUpRight size={16} />
          </Link>

          <Link
            to="/"
            className="mt-5 block text-xs text-[#89777c] transition hover:text-[#d5a2aa]"
          >
            Return to Home
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#110e10] text-[#f4e9e9]">

      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-[#dcb1b9]/10 bg-[#110e10]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
          <Brand />

          <Link
            to="/profile"
            className="rounded-xl border border-[#dcb1b9]/15 bg-[#191417] px-4 py-2.5 text-xs font-semibold text-[#cbb9bd] transition hover:border-[#c58d98]/50 hover:text-[#f4e9e9]"
          >
            My Profile
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-5 py-9 sm:py-12">

        {/* BACK LINK */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#89777c] transition hover:text-[#d5a2aa]"
        >
          <ArrowLeft size={15} />
          Back to Home
        </Link>

        {/* PAGE INTRO */}
        <div className="mt-9 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <SectionEyebrow icon={Bell}>
              Your updates
            </SectionEyebrow>

            <h1 className="mt-4 font-display text-5xl font-semibold tracking-tight text-[#f4e9e9] sm:text-6xl">
              Notifications<span className="text-[#c58d98]">.</span>
            </h1>

            <p className="mt-4 max-w-lg text-sm leading-7 text-[#a9959a]">
              Stay connected with new chapters, stories and everything happening across ABYSSORA.
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              disabled={markingAll || processingId !== null}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[#c58d98]/25 bg-[#c58d98]/[0.08] px-4 py-3 text-xs font-bold text-[#d9afb6] transition hover:border-[#c58d98]/50 hover:bg-[#c58d98]/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {markingAll ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <CheckCheck size={16} />
              )}
              {markingAll ? 'Updating...' : 'Mark all as read'}
            </button>
          )}
        </div>

        {/* SUMMARY */}
        <div className="mt-9 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-[#dcb1b9]/10 bg-[#191417] p-5">
            <div className="flex items-center gap-2 text-[#c58d98]">
              <Inbox size={16} />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                All updates
              </span>
            </div>

            <p className="mt-3 font-display text-4xl font-semibold">
              {notifications.length}
            </p>

            <p className="mt-1 text-[11px] text-[#89777c]">
              Total notifications
            </p>
          </div>

          <div className="rounded-2xl border border-[#c58d98]/15 bg-[#c58d98]/[0.06] p-5">
            <div className="flex items-center gap-2 text-[#d5a2aa]">
              <Bell size={16} />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Unread
              </span>
            </div>

            <p className="mt-3 font-display text-4xl font-semibold text-[#e5c4ca]">
              {unreadCount}
            </p>

            <p className="mt-1 text-[11px] text-[#a88b91]">
              Waiting for you
            </p>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mt-6 flex items-center gap-3 rounded-xl border border-[#d78383]/20 bg-[#d78383]/[0.08] px-4 py-3 text-sm text-[#e5a2a2]">
            <AlertCircle size={17} className="shrink-0" />
            {error}
          </div>
        )}

        {/* NOTIFICATION LIST HEADER */}
        <div className="mt-12 mb-5 flex items-center justify-between border-b border-[#dcb1b9]/10 pb-4">
          <div>
            <h2 className="font-display text-2xl font-semibold">
              Your updates
            </h2>
            <p className="mt-1 text-[10px] text-[#89777c]">
              The latest from your manga universe
            </p>
          </div>

          <span className="rounded-lg border border-[#dcb1b9]/10 bg-[#191417] px-3 py-2 text-[10px] font-semibold text-[#b9a8ac]">
            {notifications.length} total
          </span>
        </div>

        {/* EMPTY STATE */}
        {notifications.length === 0 ? (
          <div className="rounded-3xl border border-[#dcb1b9]/10 bg-[#191417] px-6 py-16 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-[#c58d98]/20 bg-[#c58d98]/[0.07]">
              <Inbox size={34} className="text-[#c58d98]" />
            </div>

            <h2 className="mt-7 font-display text-3xl font-semibold">
              You're all caught up.
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#a9959a]">
              Nothing new for now. New chapter releases and ABYSSORA announcements will find their way here.
            </p>

            <Link
              to="/"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#c58d98] px-6 py-3 text-sm font-bold text-[#211619] transition hover:bg-[#d5a2aa]"
            >
              Explore Comics
              <ArrowUpRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type)
              const isProcessing = processingId === notification.id

              return (
                <article
                  key={notification.id}
                  className={`group flex gap-3 rounded-2xl border p-4 transition sm:gap-4 sm:p-5 ${
                    notification.is_read
                      ? 'border-[#dcb1b9]/10 bg-[#191417] hover:border-[#dcb1b9]/20'
                      : 'border-[#c58d98]/25 bg-[#c58d98]/[0.055] hover:border-[#c58d98]/40'
                  }`}
                >
                  {/* ICON */}
                  <div
                    className={`mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      notification.is_read
                        ? 'border border-[#dcb1b9]/10 bg-[#211a1e] text-[#a9959a]'
                        : 'border border-[#c58d98]/20 bg-[#c58d98]/[0.12] text-[#d5a2aa]'
                    }`}
                  >
                    <Icon size={19} />
                  </div>

                  {/* CONTENT */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-[#f0e4e6]">
                        {notification.title}
                      </h3>

                      {!notification.is_read && (
                        <span className="h-2 w-2 rounded-full bg-[#c58d98]" />
                      )}
                    </div>

                    <p className="mt-2 text-xs leading-6 text-[#a9959a] sm:text-sm">
                      {notification.message}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3">
                      <span className="inline-flex items-center gap-1.5 text-[10px] text-[#75666a]">
                        <Clock size={13} />
                        {formatDate(notification.created_at)}
                      </span>

                      {notification.link && (
                        <Link
                          to={notification.link}
                          onClick={() => {
                            if (!notification.is_read) {
                              markAsRead(notification.id)
                            }
                          }}
                          className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#c58d98] transition hover:text-[#e0b6bd]"
                        >
                          View update
                          <ArrowUpRight size={12} />
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* ACTIONS */}
                  <div className="flex shrink-0 flex-col items-center gap-2">
                    {!notification.is_read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        disabled={isProcessing || markingAll || processingId !== null}
                        title="Mark as read"
                        className="rounded-lg border border-transparent p-2 text-[#89777c] transition hover:border-[#c58d98]/20 hover:bg-[#c58d98]/10 hover:text-[#d5a2aa] disabled:opacity-40"
                      >
                        {isProcessing ? (
                          <LoaderCircle size={16} className="animate-spin" />
                        ) : (
                          <Check size={17} />
                        )}
                      </button>
                    )}

                    <button
                      onClick={() => deleteNotification(notification.id)}
                      disabled={isProcessing || markingAll || processingId !== null}
                      title="Delete notification"
                      className="rounded-lg border border-transparent p-2 text-[#89777c] transition hover:border-[#d78383]/20 hover:bg-[#d78383]/10 hover:text-[#d78383] disabled:opacity-40"
                    >
                      {isProcessing ? (
                        <LoaderCircle size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer className="mt-16 border-t border-[#dcb1b9]/10 bg-[#0e0b0d] px-5 py-8 text-center">
        <div className="flex items-center justify-center gap-2">
          <Emblem size={22} />
          <span className="font-display text-sm font-semibold tracking-[0.2em] text-[#d9c5c9]">
            ABYSSORA
          </span>
        </div>

        <p className="mt-3 text-[10px] tracking-wider text-[#75666a]">
          © 2026 ABYSSORA · YOUR MANGA UNIVERSE
        </p>
      </footer>
    </main>
  )
}