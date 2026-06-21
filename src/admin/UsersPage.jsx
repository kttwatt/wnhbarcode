import { useEffect, useState } from 'react'
import { supabase, USE_LOCAL } from '../lib/supabaseClient'

const LS_KEY = 'wnh-users'

export default function UsersPage() {
  const [items, setItems] = useState([])
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('1234')
  const [role, setRole] = useState('dept')
  const [dept, setDept] = useState('')

  useEffect(() => {
    let mounted = true
    const load = async () => {
        if (!USE_LOCAL && supabase) {
          const { data, error } = await supabase.from('users').select('*')
          if (!error && mounted) setItems(data || [])
        } else {
          const stored = JSON.parse(localStorage.getItem(LS_KEY) || '[]')
          if (mounted) setItems(stored)
        }
    }
    load()
    return () => (mounted = false)
  }, [])

  async function add() {
    const obj = { id: crypto.randomUUID(), username, password, role, dept_id: dept }
    setItems((s) => [obj, ...s])
    if (!USE_LOCAL && supabase) {
      await supabase.from('users').insert([{ username, password, role, dept_id: dept }])
    } else {
      localStorage.setItem(LS_KEY, JSON.stringify([obj, ...items]))
    }
    setUsername(''); setPassword('1234'); setRole('dept'); setDept('')
  }

  function remove(id) {
    setItems((s) => s.filter((x) => x.id !== id))
    if (!USE_LOCAL && supabase) {
      supabase.from('users').delete().eq('id', id)
    } else {
      localStorage.setItem(LS_KEY, JSON.stringify(items.filter((x) => x.id !== id)))
    }
  }

  return (
    <div>
      <h3 className="text-lg font-medium mb-3">Users</h3>
      <div className="mb-3 flex gap-2">
        <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="border px-2 py-1" />
        <input placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="border px-2 py-1" />
        <select value={role} onChange={(e) => setRole(e.target.value)} className="border px-2 py-1">
          <option value="admin">admin</option>
          <option value="dept">dept</option>
        </select>
        <input placeholder="Dept ID" value={dept} onChange={(e) => setDept(e.target.value)} className="border px-2 py-1" />
        <button onClick={add} className="px-3 py-1 bg-green-600 text-white rounded">Add</button>
      </div>
      <div className="space-y-2">
        {items.map((d) => (
          <div key={d.id} className="flex items-center justify-between p-2 border rounded bg-white">
            <div>{d.username} · {d.role} · {d.dept_id || d.dept}</div>
            <button onClick={() => remove(d.id)} className="px-2 py-1 bg-red-500 text-white rounded">Delete</button>
          </div>
        ))}
      </div>
    </div>
  )
}
