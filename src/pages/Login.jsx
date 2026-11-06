import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowLeft, LoaderCircle } from 'lucide-react'
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

function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    navigate('/')
  }

  const handleGoogleLogin = async () => {
    setError('')
    setGoogleLoading(true)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    })

    if (error) {
      setError(error.message)
      setGoogleLoading(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#110e10] px-5 py-12 text-[#f4e9e9]">

      {/* Background atmosphere */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-[#c58d98]/[0.09] blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-[#8f5f6c]/[0.10] blur-[130px]" />

      <div className="relative w-full max-w-md">

        {/* Back navigation */}
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-[#a9959a] transition hover:text-[#e5c0c6]"
        >
          <ArrowLeft size={16} />
          Back to ABYSSORA
        </Link>

        {/* Login card */}
        <div className="rounded-3xl border border-[#dcafb9]/15 bg-[#191417]/95 p-7 shadow-2xl shadow-black/30 sm:p-9">

          {/* Brand */}
          <Link
            to="/"
            className="mb-9 flex items-center justify-center gap-3"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#c58d98]/25 bg-[#c58d98]/[0.08]">
              <Emblem size={38} />
            </div>

            <div className="leading-none">
              <div className="font-display text-2xl font-semibold tracking-[0.16em] text-[#f1e7e8]">
                ABYSSORA
              </div>
              <div className="mt-1.5 text-[8px] font-semibold tracking-[0.3em] text-[#a88b91]">
                WORLDS BEYOND STORIES
              </div>
            </div>
          </Link>

          {/* Heading */}
          <div className="mb-8 text-center">
            <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-[#c58d98]">
              Your journey continues
            </div>

            <h1 className="font-display text-4xl font-semibold tracking-wide text-[#f4e9e9]">
              Welcome back
            </h1>

            <p className="mt-2 text-sm text-[#a9959a]">
              Sign in to continue your manga journey.
            </p>
          </div>

          {/* Google login */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#dcafb9]/15 bg-[#110e10] py-3.5 text-sm font-semibold text-[#eee1e3] transition hover:border-[#c58d98]/40 hover:bg-[#c58d98]/[0.05] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {googleLoading ? (
              <LoaderCircle
                size={19}
                className="animate-spin text-[#c58d98]"
              />
            ) : (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm font-black text-[#242124]">
                G
              </span>
            )}

            {googleLoading ? 'Connecting to Google...' : 'Continue with Google'}
          </button>

          {/* Divider */}
          <div className="my-7 flex items-center gap-4">
            <div className="h-px flex-1 bg-[#dcafb9]/15" />
            <span className="text-[10px] font-semibold tracking-[0.16em] text-[#89777c]">
              OR CONTINUE WITH EMAIL
            </span>
            <div className="h-px flex-1 bg-[#dcafb9]/15" />
          </div>

          {/* Login form */}
          <form onSubmit={handleLogin} className="space-y-5">

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#d8c6ca]">
                Email address
              </label>

              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-[#dcafb9]/15 bg-[#110e10] px-4 py-3.5 text-sm text-[#f4e9e9] outline-none transition placeholder:text-[#74656a] focus:border-[#c58d98] focus:ring-1 focus:ring-[#c58d98]/20"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-semibold text-[#d8c6ca]">
                  Password
                </label>

                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-[#c58d98] transition hover:text-[#e0b1b9]"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-[#dcafb9]/15 bg-[#110e10] px-4 py-3.5 pr-12 text-sm text-[#f4e9e9] outline-none transition placeholder:text-[#74656a] focus:border-[#c58d98] focus:ring-1 focus:ring-[#c58d98]/20"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#89777c] transition hover:text-[#e5c0c6]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-[#d78383]/20 bg-[#d78383]/10 p-3 text-sm text-[#e6a2a2]"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#c58d98] py-3.5 text-sm font-bold text-[#211619] transition hover:bg-[#d5a2aa] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <LoaderCircle size={18} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Register link */}
          <p className="mt-8 text-center text-sm text-[#a9959a]">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-semibold text-[#c58d98] transition hover:text-[#e0b1b9]"
            >
              Create account
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center font-display text-lg italic tracking-wide text-[#89777c]">
          Your next chapter starts here.
        </p>
      </div>
    </main>
  )
}

export default Login