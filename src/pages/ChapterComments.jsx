
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MessageCircle,
  Send,
  Trash2,
  Pencil,
  CornerDownRight,
  LoaderCircle,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

function timeAgo(date) {
  const seconds = Math.floor(
    (Date.now() - new Date(date).getTime()) / 1000
  )

  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`

  return new Date(date).toLocaleDateString()
}

export default function ChapterComments({ chapterId, theme }) {
  const navigate = useNavigate()

  const [comments, setComments] = useState([])
  const [user, setUser] = useState(null)
  const [content, setContent] = useState('')
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyContent, setReplyContent] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  const loadComments = async () => {
    try {
      const [
        { data: commentData, error: commentError },
        { data: authData, error: authError },
      ] = await Promise.all([
        supabase
          .from('chapter_comments')
          .select(
            'id, chapter_id, user_id, parent_id, content, created_at, updated_at'
          )
          .eq('chapter_id', chapterId)
          .order('created_at', { ascending: false }),

        supabase.auth.getUser(),
      ])

      if (commentError) throw commentError
      if (authError) throw authError

      setComments(commentData || [])
      setUser(authData?.user || null)
    } catch (error) {
      console.error('Could not load comments:', error)
      setMessage('Unable to load comments.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!chapterId) return

    setLoading(true)
    setMessage('')
    loadComments()
  }, [chapterId])

  const submitComment = async (event) => {
    event.preventDefault()

    if (!user) {
      navigate('/login')
      return
    }

    const cleanContent = content.trim()

    if (!cleanContent || submitting) return

    setSubmitting(true)
    setMessage('')

    try {
      const { error } = await supabase
        .from('chapter_comments')
        .insert({
          chapter_id: chapterId,
          user_id: user.id,
          content: cleanContent,
        })

      if (error) throw error

      setContent('')
      await loadComments()
    } catch (error) {
      console.error('Comment submission error:', error)
      setMessage('Could not post your comment. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const submitReply = async (event, parentId) => {
    event.preventDefault()

    if (!user) {
      navigate('/login')
      return
    }

    const cleanContent = replyContent.trim()

    if (!cleanContent || submitting) return

    setSubmitting(true)
    setMessage('')

    try {
      const { error } = await supabase
        .from('chapter_comments')
        .insert({
          chapter_id: chapterId,
          user_id: user.id,
          parent_id: parentId,
          content: cleanContent,
        })

      if (error) throw error

      setReplyContent('')
      setReplyingTo(null)
      await loadComments()
    } catch (error) {
      console.error('Reply submission error:', error)
      setMessage('Could not post your reply. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const saveEdit = async (commentId) => {
    const cleanContent = editContent.trim()

    if (!cleanContent || submitting || !user) return

    setSubmitting(true)
    setMessage('')

    try {
      const { error } = await supabase
        .from('chapter_comments')
        .update({
          content: cleanContent,
          updated_at: new Date().toISOString(),
        })
        .eq('id', commentId)
        .eq('user_id', user.id)

      if (error) throw error

      setEditingId(null)
      setEditContent('')
      await loadComments()
    } catch (error) {
      console.error('Comment edit error:', error)
      setMessage('Could not update your comment.')
    } finally {
      setSubmitting(false)
    }
  }

  const deleteComment = async (commentId) => {
    if (!user || !window.confirm('Delete this comment?')) return

    setMessage('')

    try {
      const { error } = await supabase
        .from('chapter_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id)

      if (error) throw error

      await loadComments()
    } catch (error) {
      console.error('Comment deletion error:', error)
      setMessage('Could not delete this comment.')
    }
  }

  const roots = comments.filter((comment) => !comment.parent_id)

  const getReplies = (parentId) =>
    comments.filter((comment) => comment.parent_id === parentId)

  // IMPORTANT: This is a render function, not a nested React component.
  // Keeping the DOM elements stable prevents textareas from losing focus.
  const renderComment = (comment, isReply = false) => {
    const isOwner = user?.id === comment.user_id

    return (
      <div
        className={`rounded-xl border ${theme.border} ${
          isReply ? 'bg-black/[0.04] p-4' : `${theme.panel} p-5`
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="break-all text-xs font-semibold text-[#c69aa1]">
              Reader
            </p>

            <p className={`mt-1 text-[10px] ${theme.muted}`}>
              {timeAgo(comment.created_at)}
              {new Date(comment.updated_at).getTime() -
                new Date(comment.created_at).getTime() > 1000 &&
                ' · edited'}
            </p>
          </div>

          {isOwner && (
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditingId(comment.id)
                  setEditContent(comment.content)
                  setReplyingTo(null)
                }}
                className={`rounded-lg p-2 ${theme.secondary} transition hover:text-[#c69aa1]`}
                aria-label="Edit comment"
              >
                <Pencil size={15} />
              </button>

              <button
                type="button"
                onClick={() => deleteComment(comment.id)}
                className="rounded-lg p-2 text-red-400 transition hover:bg-red-400/10"
                aria-label="Delete comment"
              >
                <Trash2 size={15} />
              </button>
            </div>
          )}
        </div>

        {editingId === comment.id ? (
          <div className="mt-4">
            <textarea
              value={editContent}
              onChange={(event) => setEditContent(event.target.value)}
              maxLength={2000}
              rows={3}
              className={`w-full resize-y rounded-xl border ${theme.border} ${theme.panel} p-3 text-sm outline-none focus:border-[#c69aa1]`}
            />

            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className={`rounded-lg px-3 py-2 text-xs ${theme.secondary}`}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => saveEdit(comment.id)}
                disabled={submitting || !editContent.trim()}
                className="rounded-lg bg-[#c69aa1] px-4 py-2 text-xs font-bold text-[#211619] disabled:opacity-50"
              >
                Save changes
              </button>
            </div>
          </div>
        ) : (
          <p
            className={`mt-4 whitespace-pre-wrap break-words text-sm leading-7 ${theme.text}`}
          >
            {comment.content}
          </p>
        )}

        {!isReply && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => {
                if (!user) {
                  navigate('/login')
                  return
                }

                setReplyingTo(
                  replyingTo === comment.id ? null : comment.id
                )
                setReplyContent('')
                setEditingId(null)
              }}
              className={`flex items-center gap-2 text-xs font-semibold ${theme.secondary} transition hover:text-[#c69aa1]`}
            >
              <CornerDownRight size={15} />
              Reply
              {getReplies(comment.id).length > 0 &&
                ` (${getReplies(comment.id).length})`}
            </button>

            {replyingTo === comment.id && (
              <form
                onSubmit={(event) => submitReply(event, comment.id)}
                className="mt-4"
              >
                <textarea
                  value={replyContent}
                  onChange={(event) => setReplyContent(event.target.value)}
                  placeholder="Write your reply..."
                  maxLength={2000}
                  rows={2}
                  className={`w-full resize-y rounded-xl border ${theme.border} ${theme.panel} p-3 text-sm outline-none focus:border-[#c69aa1]`}
                />

                <div className="mt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className={`rounded-lg px-3 py-2 text-xs ${theme.secondary}`}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting || !replyContent.trim()}
                    className="flex items-center gap-2 rounded-lg bg-[#c69aa1] px-4 py-2 text-xs font-bold text-[#211619] disabled:opacity-50"
                  >
                    <Send size={13} />
                    Reply
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <section
      className={`my-10 rounded-2xl border ${theme.border} ${theme.panel} p-5 sm:p-7`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#c69aa1]/15 text-[#c69aa1]">
          <MessageCircle size={21} />
        </div>

        <div>
          <h2 className="text-xl font-semibold">
            Chapter Discussion
          </h2>

          <p className={`mt-1 text-xs ${theme.secondary}`}>
            {comments.length}{' '}
            {comments.length === 1 ? 'comment' : 'comments'} · Share your thoughts
          </p>
        </div>
      </div>

      <form onSubmit={submitComment} className="mt-7">
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder={
            user
              ? 'What did you think about this chapter?'
              : 'Sign in to join the discussion...'
          }
          maxLength={2000}
          rows={4}
          className={`w-full resize-y rounded-xl border ${theme.border} ${theme.page} p-4 text-sm outline-none transition focus:border-[#c69aa1]`}
        />

        <div className="mt-3 flex items-center justify-between gap-3">
          <p className={`text-[10px] ${theme.muted}`}>
            {content.length}/2000 characters
          </p>

          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className="flex items-center gap-2 rounded-xl bg-[#c69aa1] px-5 py-3 text-xs font-bold text-[#211619] transition hover:bg-[#dfb9bf] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <LoaderCircle size={15} className="animate-spin" />
            ) : (
              <Send size={15} />
            )}
            Post comment
          </button>
        </div>
      </form>

      {message && (
        <p className="mt-4 text-center text-xs text-red-400">
          {message}
        </p>
      )}

      <div className="mt-8 space-y-5">
        {loading ? (
          <div className="py-10 text-center">
            <LoaderCircle
              size={25}
              className="mx-auto animate-spin text-[#c69aa1]"
            />
            <p className={`mt-3 text-xs ${theme.secondary}`}>
              Loading discussion...
            </p>
          </div>
        ) : roots.length === 0 ? (
          <div className="py-10 text-center">
            <MessageCircle
              size={32}
              className={`mx-auto ${theme.muted}`}
            />
            <p className="mt-4 text-sm font-semibold">
              No comments yet
            </p>
            <p className={`mt-2 text-xs ${theme.secondary}`}>
              Be the first to start the discussion!
            </p>
          </div>
        ) : (
          roots.map((comment) => (
            <div key={comment.id} className="space-y-3">
              {renderComment(comment)}

              {getReplies(comment.id).length > 0 && (
                <div className="ml-4 space-y-3 border-l-2 border-[#c69aa1]/20 pl-4 sm:ml-8 sm:pl-5">
                  {getReplies(comment.id).map((reply) => (
                    <div key={reply.id}>
                      {renderComment(reply, true)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  )
}
