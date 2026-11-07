
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const REACTIONS = [
  { type: 'like', emoji: '❤️', label: 'Like' },
  { type: 'love', emoji: '🔥', label: 'Love' },
  { type: 'funny', emoji: '😂', label: 'Funny' },
]

export default function ChapterReactions({ chapterId, theme }) {
  const navigate = useNavigate()

  const [counts, setCounts] = useState({
    like: 0,
    love: 0,
    funny: 0,
  })

  const [userReaction, setUserReaction] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const loadReactions = async () => {
    try {
      const [
        { data: reactions, error: reactionsError },
        { data: authData, error: authError },
      ] = await Promise.all([
        supabase
          .from('chapter_reactions')
          .select('reaction, user_id')
          .eq('chapter_id', chapterId),

        supabase.auth.getUser(),
      ])

      if (reactionsError) throw reactionsError
      if (authError) throw authError

      const currentUser = authData?.user || null

      const nextCounts = {
        like: 0,
        love: 0,
        funny: 0,
      }

      let selectedReaction = null

      ;(reactions || []).forEach((item) => {
        if (nextCounts[item.reaction] !== undefined) {
          nextCounts[item.reaction] += 1
        }

        if (currentUser && item.user_id === currentUser.id) {
          selectedReaction = item.reaction
        }
      })

      setCounts(nextCounts)
      setUser(currentUser)
      setUserReaction(selectedReaction)
    } catch (error) {
      console.error('Could not load chapter reactions:', error)
      setMessage('Unable to load reactions.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!chapterId) return

    setLoading(true)
    setMessage('')
    loadReactions()
  }, [chapterId])

  const handleReaction = async (reaction) => {
    if (busy) return

    if (!user) {
      navigate('/login')
      return
    }

    setBusy(true)
    setMessage('')

    try {
      if (userReaction === reaction) {
        const { error } = await supabase
          .from('chapter_reactions')
          .delete()
          .eq('chapter_id', chapterId)
          .eq('user_id', user.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('chapter_reactions')
          .upsert(
            {
              chapter_id: chapterId,
              user_id: user.id,
              reaction,
            },
            {
              onConflict: 'chapter_id,user_id',
            }
          )

        if (error) throw error
      }

      await loadReactions()
    } catch (error) {
      console.error('Reaction update error:', error)
      setMessage('Could not save your reaction. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section
      className={`my-8 rounded-2xl border ${theme.border} ${theme.panel} p-5 sm:p-7`}
    >
      <div className="text-center">
        <h2 className="text-xl font-semibold">
          How was this chapter?
        </h2>

        <p className={`mt-2 text-sm ${theme.secondary}`}>
          Share your reaction with the ABYSSORA community.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {REACTIONS.map((item) => {
          const selected = userReaction === item.type

          return (
            <button
              key={item.type}
              type="button"
              disabled={loading || busy}
              onClick={() => handleReaction(item.type)}
              aria-pressed={selected}
              className={`flex flex-col items-center justify-center gap-2 rounded-xl border px-2 py-4 transition ${
                selected
                  ? 'border-[#c69aa1] bg-[#c69aa1]/15 text-[#c69aa1]'
                  : `${theme.border} hover:border-[#c69aa1]/60`
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <span className="text-3xl">
                {item.emoji}
              </span>

              <span className="text-xs font-semibold sm:text-sm">
                {item.label}
              </span>

              <span className="text-xs font-bold">
                {loading ? '...' : counts[item.type]}
              </span>
            </button>
          )
        })}
      </div>

      <p className={`mt-4 text-center text-xs ${theme.muted}`}>
        {user
          ? 'You can change or remove your reaction anytime.'
          : 'Sign in to react to this chapter.'}
      </p>

      {message && (
        <p className="mt-3 text-center text-xs text-red-400">
          {message}
        </p>
      )}
    </section>
  )
}
