
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'

function Register() {
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (password.length < 8) {
      setError('Your password must contain at least 8 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Your passwords do not match.')
      return
    }

    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username.trim(),
        },
        emailRedirectTo: window.location.origin,
      },
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    if (data.session) {
      navigate('/')
    } else {
      setSuccess(true)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#09090e] px-5 py-12 text-white">
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-purple-700/20 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-violet-600/20 blur-[120px]" />

      <div className="relative w-full max-w-md">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-white">
          <ArrowLeft size={16} />
          Back to ABYSSORA
        </Link>

        <div className="rounded-3xl border border-white/10 bg-[#111119]/90 p-7 shadow-2xl shadow-purple-950/20 sm:p-9">
          <Link to="/" className="mb-8 flex items-center justify-center gap-3">
            <div className="rounded-xl bg-purple-600 p-2.5">
              <BookOpen size={25} />
            </div>
            <span className="text-2xl font-black tracking-[0.16em]">
              ABYSSORA
            </span>
          </Link>

          <div className="mb-7 text-center">
            <h1 className="text-3xl font-black">Create your account</h1>
            <p className="mt-2 text-sm text-gray-400">
              Join ABYSSORA and discover your next favourite story.
            </p>
          </div>

          {success ? (
            <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-5 text-center">
              <h2 className="text-lg font-bold text-green-300">
                Check your email!
              </h2>
              <p className="mt-2 text-sm leading-6 text-gray-300">
                We've sent a confirmation link to <strong>{email}</strong>.
                Open that email and confirm your account before signing in.
              </p>
              <Link
                to="/login"
                className="mt-5 inline-block rounded-xl bg-purple-600 px-6 py-3 font-bold hover:bg-purple-500"
              >
                Go to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Username
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={24}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  className="w-full rounded-xl border border-white/10 bg-[#09090e] px-4 py-3 outline-none transition placeholder:text-gray-600 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-white/10 bg-[#09090e] px-4 py-3 outline-none transition placeholder:text-gray-600 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full rounded-xl border border-white/10 bg-[#09090e] px-4 py-3 pr-12 outline-none transition placeholder:text-gray-600 focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Confirm password
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Enter your password again"
                  className="w-full rounded-xl border border-white/10 bg-[#09090e] px-4 py-3 outline-none transition placeholder:text-gray-600 focus:border-purple-500"
                />
              </div>

              {error && (
                <p role="alert" className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-purple-600 py-3.5 font-bold transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}

          {!success && (
            <p className="mt-7 text-center text-sm text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-purple-400 hover:text-purple-300">
                Sign in
              </Link>
            </p>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-gray-600">
          Start your manga journey with ABYSSORA.
        </p>
      </div>
    </main>
  )
}

export default Register
