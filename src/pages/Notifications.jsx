
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
  Sparkles,
  Clock,
  LoaderCircle,
  Inbox,
} from 'lucide-react'

import { supabase } from '../lib/supabase'

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [user, setUser] = useState(null)

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
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)

    if (error) {
      console.error('Mark as read error:', error)
      return
    }

    setNotifications((previous) =>
      previous.map((notification) =>
        notification.id === notificationId
          ? { ...notification, is_read: true }
          : notification
      )
    )
  }

  async function markAllAsRead() {
    if (!user) return

    const unreadIds = notifications
      .filter((notification) => !notification.is_read)
      .map((notification) => notification.id)

    if (unreadIds.length === 0) return

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', unreadIds)
      .eq('user_id', user.id)

    if (error) {
      setError(error.message)
      return
    }

    setNotifications((previous) =>
      previous.map((notification) => ({
        ...notification,
        is_read: true,
      }))
    )
  }

  async function deleteNotification(notificationId) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)

    if (error) {
      setError(error.message)
      return
    }

    setNotifications((previous) =>
      previous.filter((notification) => notification.id !== notificationId)
    )
  }

  function getNotificationIcon(type) {
    switch (type) {
      case 'chapter':
        return <BookOpen size={20} />

      case 'comic':
        return <Sparkles size={20} />

      case 'announcement':
        return <Megaphone size={20} />

      default:
        return <Bell size={20} />
    }
  }

  function formatDate(date) {
    const notificationDate = new Date(date)

    return notificationDate.toLocaleString([], {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08080d] text-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-violet-300">
          <LoaderCircle className="animate-spin" size={24} />
          <span>Loading notifications...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#08080d] text-white flex items-center justify-center px-5">
        <div className="text-center">
          <Bell size={42} className="mx-auto mb-4 text-violet-400" />
          <h1 className="text-2xl font-bold mb-3">
            Sign in to view notifications
          </h1>
          <p className="text-gray-400 mb-6">
            Your ABYSSORA updates will appear here.
          </p>
          <Link
            to="/login"
            className="inline-block rounded-xl bg-violet-600 px-6 py-3 font-semibold hover:bg-violet-500 transition"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#08080d] text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-8"
        >
          <ArrowLeft size={18} />
          Back to Home
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-xl bg-violet-500/10 text-violet-400">
                <Bell size={25} />
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold">
                Notifications
              </h1>
            </div>

            <p className="text-gray-400">
              Stay updated with everything happening on ABYSSORA.
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition"
            >
              <CheckCheck size={17} />
              Mark all as read
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
          <p className="text-sm text-gray-400">
            {notifications.length} notifications
          </p>

          {unreadCount > 0 && (
            <span className="rounded-full bg-violet-500/15 px-3 py-1 text-xs font-semibold text-violet-300">
              {unreadCount} unread
            </span>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-16 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-violet-500/10 text-violet-400">
              <Inbox size={30} />
            </div>

            <h2 className="text-xl font-semibold mb-2">
              You're all caught up!
            </h2>

            <p className="text-gray-400 text-sm">
              New chapter releases and ABYSSORA updates will appear here.
            </p>

            <Link
              to="/"
              className="inline-block mt-6 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold hover:bg-violet-500 transition"
            >
              Explore Comics
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`group flex gap-4 rounded-2xl border p-4 sm:p-5 transition ${
                  notification.is_read
                    ? 'border-white/[0.07] bg-white/[0.02]'
                    : 'border-violet-500/20 bg-violet-500/[0.06]'
                }`}
              >
                <div
                  className={`mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                    notification.is_read
                      ? 'bg-white/5 text-gray-400'
                      : 'bg-violet-500/15 text-violet-300'
                  }`}
                >
                  {getNotificationIcon(notification.type)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white">
                      {notification.title}
                    </h3>

                    {!notification.is_read && (
                      <span className="h-2 w-2 rounded-full bg-violet-400" />
                    )}
                  </div>

                  <p className="text-sm leading-relaxed text-gray-400">
                    {notification.message}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                    <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
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
                        className="text-xs font-semibold text-violet-400 hover:text-violet-300 transition"
                      >
                        View update →
                      </Link>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-center gap-2">
                  {!notification.is_read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      title="Mark as read"
                      className="rounded-lg p-2 text-gray-500 hover:bg-violet-500/10 hover:text-violet-300 transition"
                    >
                      <Check size={17} />
                    </button>
                  )}

                  <button
                    onClick={() => deleteNotification(notification.id)}
                    title="Delete notification"
                    className="rounded-lg p-2 text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
