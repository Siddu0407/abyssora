import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Eye,
  EyeOff,
  ArrowLeft,
  LoaderCircle,
  UserRound,
  Mail,
  LockKeyhole,
  CheckCircle2,
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

  const inputStyle =
    'w-full rounded-xl border border-[#c69aa1]/15 bg-[#110e10] py-3.5 pl-11 pr-4 text-sm text-[#f4e9e9] outline-none placeholder:text-[#75666a] transition focus:border-[#c58d98]/60 focus:ring-2 focus:ring-[#c58d98]/10'

  const labelStyle =
    'mb-2 block text-xs font-semibold tracking-wide text-[#c8b7ba]'

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#110e10] px-5 py-12 text-[#f4e9e9]">

      {/* Background atmosphere */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-[#9b626f]/10 blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-[#79515c]/10 blur-[130px]" />

      <div className="relative w-full max-w-md">

        {/* Back link */}
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-[#a9959a] transition hover:text-[#e5c3c9]"
        >
          <ArrowLeft size={16} />
          Back to ABYSSORA
        </Link>

        {/* Register card */}
        <div className="rounded-3xl border border-[#c69aa1]/15 bg-[#191417]/95 p-7 shadow-2xl shadow-black/30 sm:p-9">

          {/* Brand */}
          <Link to="/" className="mb-8 flex items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#c69aa1]/25 bg-[#211a1e]">
              <Emblem size={38} />
            </div>

            <div className="leading-none">
              <div className="font-display text-3xl font-semibold tracking-[0.15em] text-[#f1e7e8]">
                ABYSSORA
              </div>
              <div className="mt-1.5 text-center text-[8px] font-semibold tracking-[0.32em] text-[#a88b91]">
                WORLDS BEYOND STORIES
              </div>
            </div>
          </Link>

          {/* Heading */}
          <div className="mb-7 text-center">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.3em] text-[#c58d98]">
              Begin your journey
            </p>

            <h1 className="font-display text-4xl font-semibold tracking-wide text-[#f4e9e9]">
              Create your account
            </h1>

            <p className="mt-2 text-sm leading-6 text-[#a9959a]">
              Join ABYSSORA and discover your next favourite story.
            </p>
          </div>

          {success ? (
            /* Email confirmation success */
            <div className="rounded-2xl border border-[#8caf9a]/20 bg-[#8caf9a]/[0.07] p-6 text-center">

              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#8caf9a]/25 bg-[#8caf9a]/10">
                <CheckCircle2 size={28} className="text-[#9fc5ac]" />
              </div>

              <h2 className="font-display text-2xl font-semibold text-[#c5dfcd]">
                Check your email!
              </h2>

              <p className="mt-3 text-sm leading-7 text-[#c0b2b5]">
                We've sent a confirmation link to{' '}
                <strong className="break-all text-[#f1e7e8]">
                  {email}
                </strong>
                . Open that email and confirm your account before signing in.
              </p>

              <Link
                to="/login"
                className="mt-6 inline-flex items-center justify-center rounded-xl border border-[#c58d98]/30 bg-[#c58d98] px-7 py-3 text-sm font-bold text-[#211619] transition hover:bg-[#d5a2aa]"
              >
                Go to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">

              {/* Username */}
              <div>
                <label className={labelStyle}>
                  Username
                </label>

                <div className="relative">
                  <UserRound
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#89777c]"
                  />

                  <input
                    type="text"
                    required
                    minLength={3}
                    maxLength={24}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a username"
                    className={inputStyle}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className={labelStyle}>
                  Email address
                </label>

                <div className="relative">
                  <Mail
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#89777c]"
                  />

                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={inputStyle}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className={labelStyle}>
                  Password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#89777c]"
                  />

                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className={`${inputStyle} pr-12`}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#89777c] transition hover:text-[#e5c3c9]"
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

              {/* Confirm password */}
              <div>
                <label className={labelStyle}>
                  Confirm password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#89777c]"
                  />

                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Enter your password again"
                    className={inputStyle}
                  />
                </div>
              </div>

              {/* Error message */}
              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-[#d78383]/20 bg-[#d78383]/[0.08] p-3 text-sm leading-6 text-[#e7a2a2]"
                >
                  {error}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#c58d98] py-3.5 text-sm font-bold text-[#211619] shadow-lg shadow-[#c58d98]/10 transition hover:bg-[#d5a2aa] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <LoaderCircle size={18} className="animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>
          )}

          {/* Login link */}
          {!success && (
            <p className="mt-7 text-center text-sm text-[#a9959a]">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-[#d5a2aa] transition hover:text-[#f1c8cf]"
              >
                Sign in
              </Link>
            </p>
          )}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs tracking-wide text-[#75666a]">
          Start your manga journey with ABYSSORA.
        </p>
      </div>
    </main>
  )
}

export default Register