import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight, Loader2 } from "lucide-react"

import { useAuthStore } from "@/stores/auth-store"

export function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoading, error, clearError } = useAuthStore()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await login(email, password)
    if (success) navigate("/payments")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background" style={{ padding: 16 }}>
      <div className="w-full" style={{ maxWidth: 380 }}>
        {/* Logo */}
        <div className="flex items-center justify-center" style={{ marginBottom: 32 }}>
          <div className="flex items-center" style={{ gap: 10 }}>
            <div
              className="rounded-lg flex items-center justify-center"
              style={{ height: 36, width: 36, background: 'var(--color-primary)' }}
            >
              <span className="font-bold" style={{ color: 'var(--color-gold)', fontSize: 16 }}>T</span>
            </div>
            <div>
              <span className="font-bold text-foreground" style={{ fontSize: 18, letterSpacing: '0.02em' }}>TOPGOLF</span>
              <span className="block uppercase" style={{ fontSize: 8, color: 'var(--color-gold)', letterSpacing: '0.2em', marginTop: -2 }}>Indonesia</span>
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="surface-elevated" style={{ padding: 24 }}>
          <div className="text-center" style={{ marginBottom: 20 }}>
            <h1 className="font-semibold text-foreground" style={{ fontSize: 16 }}>Welcome back</h1>
            <p className="text-muted-foreground" style={{ fontSize: 12, marginTop: 4 }}>Sign in to your workspace</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label htmlFor="login-email" className="font-medium text-foreground" style={{ fontSize: 12 }}>Email</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); clearError() }}
                placeholder="you@topgolf.co.id"
                required
                className="w-full rounded-lg border bg-background text-foreground focus:outline-none focus:ring-1"
                style={{
                  height: 40,
                  padding: '0 12px',
                  fontSize: 13,
                  borderColor: 'var(--color-border)',
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label htmlFor="login-password" className="font-medium text-foreground" style={{ fontSize: 12 }}>Password</label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); clearError() }}
                placeholder="••••••••"
                required
                className="w-full rounded-lg border bg-background text-foreground focus:outline-none focus:ring-1"
                style={{
                  height: 40,
                  padding: '0 12px',
                  fontSize: 13,
                  borderColor: 'var(--color-border)',
                }}
              />
            </div>

            {error && (
              <p
                className="text-danger rounded-lg"
                style={{
                  fontSize: 12,
                  padding: '8px 12px',
                  background: 'rgba(220, 53, 69, 0.08)',
                }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-action w-full"
              style={{ marginTop: 4 }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
