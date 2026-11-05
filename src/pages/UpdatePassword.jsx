
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, BookOpen } from 'lucide-react'
import { supabase } from '../lib/supabase'

function UpdatePassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleUpdate = async (e) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Your password must contain at least 8 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Your passwords do not match.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })

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
          <h1 className="text-3xl font-black">New password</h1>
          <p className="mt-2 text-sm text-gray-400">
            Choose a new password for your account.
          </p>
        </div>

        {success ? (
          <div className="text-center">
            <p className="mb-5 text-sm text-green-300">
              Your password has been updated successfully.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full rounded-xl bg-purple-600 py-3 font-bold hover:bg-purple-500"
            >
              Go to login
            </button>
          </div>
        ) : (
          <form onSubmit={handleUpdate} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm text-gray-300">
                New password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full rounded-xl border border-white/10 bg-[#09090e] px-4 py-3 outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-300">
                Confirm new password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Enter password again"
                className="w-full rounded-xl border border-white/10 bg-[#09090e] px-4 py-3 outline-none focus:border-purple-500"
              />
            </div>

            {error && <p role="alert" className="text-sm text-red-300">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-purple-600 py-3.5 font-bold hover:bg-purple-500 disabled:opacity-60"
            >
              {loading ? 'Updating...' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}

export default UpdatePassword
