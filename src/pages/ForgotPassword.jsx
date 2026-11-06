import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Mail,
  LoaderCircle,
  CheckCircle2,
  LockKeyhole,
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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#110e10] px-5 py-12 text-[#f4e9e9]">

      {/* Background atmosphere */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-[#9b626f]/10 blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-[#79515c]/10 blur-[130px]" />

      <div className="relative w-full max-w-md">

        {/* Back link */}
        <Link
          to="/login"
          className="mb-8 inline-flex items-center gap-2 text-sm text-[#a9959a] transition hover:text-[#e5c3c9]"
        >
          <ArrowLeft size={16} />
          Back to login
        </Link>

        {/* Main card */}
        <div className="rounded-3xl border border-[#c69aa1]/15 bg-[#191417]/95 p-7 shadow-2xl shadow-black/30 sm:p-9">

          {/* Brand */}
          <Link to="/" className="mb-9 flex items-center justify-center gap-3">
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
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#c69aa1]/20 bg-[#211a1e]">
              <LockKeyhole size={27} className="text-[#d5a2aa]" />
            </div>

            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.3em] text-[#c58d98]">
              Account recovery
            </p>

            <h1 className="font-display text-4xl font-semibold tracking-wide text-[#f4e9e9]">
              Reset password
            </h1>

            <p className="mt-3 text-sm leading-6 text-[#a9959a]">
              Forgot your password? No worries. We'll help you get back to your stories.
            </p>
          </div>

          {success ? (
            /* Success message */
            <div className="rounded-2xl border border-[#8caf9a]/20 bg-[#8caf9a]/[0.07] p-6 text-center">

              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#8caf9a]/25 bg-[#8caf9a]/10">
                <CheckCircle2 size={28} className="text-[#9fc5ac]" />
              </div>

              <h2 className="font-display text-2xl font-semibold text-[#c5dfcd]">
                Check your inbox
              </h2>

              <p className="mt-3 text-sm leading-7 text-[#c0b2b5]">
                If an account exists for that email, a password reset link has been sent. Check your inbox.
              </p>

              <p className="mt-3 break-all text-sm font-semibold text-[#e5c3c9]">
                {email}
              </p>

              <Link
                to="/login"
                className="mt-6 inline-flex items-center justify-center rounded-xl border border-[#c58d98]/30 bg-[#c58d98] px-7 py-3 text-sm font-bold text-[#211619] transition hover:bg-[#d5a2aa]"
              >
                Back to login
              </Link>
            </div>
          ) : (
            /* Reset form */
            <form onSubmit={handleReset} className="space-y-5">

              <div>
                <label className="mb-2 block text-xs font-semibold tracking-wide text-[#c8b7ba]">
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
                    className="w-full rounded-xl border border-[#c69aa1]/15 bg-[#110e10] py-3.5 pl-11 pr-4 text-sm text-[#f4e9e9] outline-none placeholder:text-[#75666a] transition focus:border-[#c58d98]/60 focus:ring-2 focus:ring-[#c58d98]/10"
                  />
                </div>
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-[#d78383]/20 bg-[#d78383]/[0.08] p-3 text-sm leading-6 text-[#e7a2a2]"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#c58d98] py-3.5 text-sm font-bold text-[#211619] shadow-lg shadow-[#c58d98]/10 transition hover:bg-[#d5a2aa] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <LoaderCircle size={18} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send reset link'
                )}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs tracking-wide text-[#75666a]">
          Your next chapter is waiting.
        </p>
      </div>
    </main>
  )
}

export default ForgotPassword