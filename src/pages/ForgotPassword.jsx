
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, BookOpen } from 'lucide-react'
import { supabase } from '../lib/supabase'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleReset = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setSuccess(true)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#09090e] px-5 py-12 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#111119] p-8">
        <Link to="/login" className="mb-8 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white">
          <ArrowLeft size={16} />
          Back to login
        </Link>

        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-purple-600">
            <BookOpen size={27} />
          </div>
          <h1 className="text-3xl font-black">Reset password</h1>
          <p className="mt-2 text-sm text-gray-400">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        {success ? (
          <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-5 text-center text-sm text-green-300">
            If an account exists for that email, a password reset link has been sent. Check your inbox.
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm text-gray-300">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-white/10 bg-[#09090e] px-4 py-3 outline-none focus:border-purple-500"
              />
            </div>

            {error && <p role="alert" className="text-sm text-red-300">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-purple-600 py-3.5 font-bold hover:bg-purple-500 disabled:opacity-60"
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}

export default ForgotPassword
