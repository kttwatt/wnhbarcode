import { useEffect, useState } from 'react'
import { supabase, USE_LOCAL } from './lib/supabaseClient'
import App from './App'

export default function AuthWrapper() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState(null)

  useEffect(() => {
    if (USE_LOCAL) {
      setLoading(false)
      return
    }
    const s = supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess)
    })

    return () => listener?.subscription?.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) {
      setUserProfile(null)
      return
    }
    const load = async () => {
      if (USE_LOCAL) {
        const users = JSON.parse(localStorage.getItem('wnh-users') || '[]')
        const u = users.find((x) => x.id === session.user.id || x.username === session.user.email?.split('@')[0])
        if (u) setUserProfile(u)
        return
      }
      // load user profile from `users` table if exists
      const { data, error } = await supabase.from('users').select('id, username, role, dept_id').eq('id', session.user.id).single()
      if (!error) setUserProfile(data)
    }
    load()
  }, [session])

  async function signIn({ username, password }) {
    if (USE_LOCAL) {
      // seed default users if not present
      const defaultUsers = [
        { id: 'admin', username: 'admin', password: 'admin', role: 'admin', dept_id: null },
        { id: 'warehouse', username: 'warehouse', password: '1234', role: 'dept', dept: 'คลัง' },
        { id: 'or', username: 'or', password: '1234', role: 'dept', dept: 'OR' },
        { id: 'anc', username: 'anc', password: '1234', role: 'dept', dept: 'ANC' },
      ]
      const stored = JSON.parse(localStorage.getItem('wnh-users') || '[]')
      if (stored.length === 0) localStorage.setItem('wnh-users', JSON.stringify(defaultUsers))
      const users = JSON.parse(localStorage.getItem('wnh-users') || '[]')
      const u = users.find((x) => x.username === username && x.password === password)
      if (!u) throw new Error('Invalid credentials')
      const sess = { user: { id: u.id || u.username, email: `${u.username}@local` } }
      setSession(sess)
      setUserProfile(u)
      return { data: sess }
    }
    // Supabase Auth expects an email; we'll convert username -> username@local
    const email = username.includes('@') ? username : `${username}@local`
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signOut() {
    if (USE_LOCAL) {
      setSession(null)
      setUserProfile(null)
      return
    }
    await supabase.auth.signOut()
    setSession(null)
  }

  if (loading) return <div className="p-6">Loading…</div>

  if (!session) {
    return <SignInForm onSignIn={signIn} />
  }

  return <App session={session} profile={userProfile} onSignOut={signOut} />
}

function SignInForm({ onSignIn }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)

  async function submit(e) {
    e.preventDefault()
    setError(null)
    try {
      await onSignIn({ username, password })
    } catch (err) {
      setError(err.message || String(err))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={submit} className="p-6 bg-white rounded shadow w-full max-w-sm">
        <h2 className="text-lg font-semibold mb-4">Sign in</h2>
        {error && <div className="text-red-600 mb-2">{error}</div>}
        <label className="block text-sm">Username</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full border rounded px-2 py-1 mb-2" autoFocus />
        <label className="block text-sm">Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border rounded px-2 py-1 mb-4" />
        <div className="flex justify-end">
          <button className="px-3 py-1 bg-blue-600 text-white rounded">Sign in</button>
        </div>
      </form>
    </div>
  )
}
