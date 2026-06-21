import { useEffect, useState } from 'react'
import { supabase, USE_LOCAL } from '../lib/supabaseClient'

const LS_KEY = 'wnh-categories'

export default function CategoriesPage() {
  const [items, setItems] = useState([])
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')

  useEffect(() => {
    let mounted = true
    const load = async () => {
      if (!USE_LOCAL && supabase) {
        const { data, error } = await supabase.from('categories').select('*')
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
    const obj = { id: crypto.randomUUID(), name, description: desc }
    setItems((s) => [obj, ...s])
    if (!USE_LOCAL && supabase) {
      await supabase.from('categories').insert([{ name, description: desc }])
    } else {
      localStorage.setItem(LS_KEY, JSON.stringify([obj, ...items]))
    }
    setName(''); setDesc('')
  }

  function remove(id) {
    setItems((s) => s.filter((x) => x.id !== id))
    if (!USE_LOCAL && supabase) {
      supabase.from('categories').delete().eq('id', id)
    } else {
      localStorage.setItem(LS_KEY, JSON.stringify(items.filter((x) => x.id !== id)))
    }
  }

  return (
    <div>
      <h3 className="text-lg font-medium mb-3">Categories</h3>
      <div className="mb-3 flex gap-2">
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="border px-2 py-1" />
        <input placeholder="Description" value={desc} onChange={(e) => setDesc(e.target.value)} className="border px-2 py-1" />
        <button onClick={add} className="px-3 py-1 bg-green-600 text-white rounded">Add</button>
      </div>
      <div className="space-y-2">
        {items.map((d) => (
          <div key={d.id} className="flex items-center justify-between p-2 border rounded bg-white">
            <div>{d.name}</div>
            <button onClick={() => remove(d.id)} className="px-2 py-1 bg-red-500 text-white rounded">Delete</button>
          </div>
        ))}
      </div>
    </div>
  )
}
