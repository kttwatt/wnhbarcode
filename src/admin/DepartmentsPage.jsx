import { useEffect, useState } from 'react'
import { supabase, USE_LOCAL } from '../lib/supabaseClient'

const LS_KEY = 'wnh-departments'

export default function DepartmentsPage() {
  const [items, setItems] = useState([])
  const [name, setName] = useState('')
  const [code, setCode] = useState('')

  useEffect(() => {
    let mounted = true
    const load = async () => {
      if (!USE_LOCAL && supabase) {
        const { data, error } = await supabase.from('departments').select('*')
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
    const obj = { id: crypto.randomUUID(), name, code }
    setItems((s) => [obj, ...s])
    if (!USE_LOCAL && supabase) {
      await supabase.from('departments').insert([{ name, code }])
    } else {
      localStorage.setItem(LS_KEY, JSON.stringify([obj, ...items]))
    }
    setName(''); setCode('')
  }

  function remove(id) {
    setItems((s) => s.filter((x) => x.id !== id))
    if (!USE_LOCAL && supabase) {
      supabase.from('departments').delete().eq('id', id)
    } else {
      localStorage.setItem(LS_KEY, JSON.stringify(items.filter((x) => x.id !== id)))
    }
  }

  return (
    <div>
      <h3 className="text-lg font-medium mb-3">Departments</h3>
      <div className="mb-3 flex gap-2">
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="border px-2 py-1" />
        <input placeholder="Code" value={code} onChange={(e) => setCode(e.target.value)} className="border px-2 py-1" />
        <button onClick={add} className="px-3 py-1 bg-green-600 text-white rounded">Add</button>
      </div>
      <div className="space-y-2">
        {items.map((d) => (
          <div key={d.id} className="flex items-center justify-between p-2 border rounded bg-white">
            <div>{d.name} · {d.code}</div>
            <button onClick={() => remove(d.id)} className="px-2 py-1 bg-red-500 text-white rounded">Delete</button>
          </div>
        ))}
      </div>
    </div>
  )
}
