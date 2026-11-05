
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'

function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
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

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    })

    if (error) setError(error.message)
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
            <h1 className="text-3xl font-black">Welcome back</h1>
            <p className="mt-2 text-sm text-gray-400">
              Sign in to continue your manga journey.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] py-3 font-semibold transition hover:bg-white/10"
          >
            <span className="rounded-full bg-white px-2 py-0.5 font-bold text-black">G</span>
            Continue with Google
          </button>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-gray-500">OR CONTINUE WITH EMAIL</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
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
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-purple-400 hover:text-purple-300">
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
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-purple-400 hover:text-purple-300">
              Create account
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-gray-600">
          Your next chapter starts here.
        </p>
      </div>
    </main>
  )
}

export default Login
