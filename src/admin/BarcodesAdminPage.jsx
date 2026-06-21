import { useEffect, useState } from 'react'
import { supabase, USE_LOCAL } from '../lib/supabaseClient'

const LS_KEY = 'wnh-barcodes'
const LS_DEPTS = 'wnh-departments'

export default function BarcodesAdminPage() {
  const [items, setItems] = useState([])
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [selectedDepts, setSelectedDepts] = useState([])
  const [departments, setDepartments] = useState([])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      if (!USE_LOCAL && supabase) {
        const [{ data: bdata }, { data: ddata }] = await Promise.all([
          supabase.from('barcodes').select('*'),
          supabase.from('departments').select('*'),
        ])
        if (mounted) {
          setItems(bdata || [])
          setDepartments(ddata || [])
        }
      } else {
        const stored = JSON.parse(localStorage.getItem(LS_KEY) || '[]')
        const dstored = JSON.parse(localStorage.getItem(LS_DEPTS) || '[]')
        if (mounted) {
          setItems(stored)
          setDepartments(dstored)
        }
      }
    }
    load()
    return () => (mounted = false)
  }, [])

  async function add() {
    const deptsCsv = selectedDepts.map((d) => d.code || d.name).join(',')
    const obj = { id: crypto.randomUUID(), code, name, category, depts: deptsCsv }
    setItems((s) => [obj, ...s])
    if (!USE_LOCAL && supabase) {
      const { data: newBarcode, error } = await supabase.from('barcodes').insert([{ code, name, category }]).select().single()
      if (newBarcode && selectedDepts.length) {
        const mappings = selectedDepts.map((d) => ({ barcode_id: newBarcode.id, dept_id: d.id }))
        await supabase.from('barcode_departments').insert(mappings)
      }
    } else {
      localStorage.setItem(LS_KEY, JSON.stringify([obj, ...items]))
    }
    setCode(''); setName(''); setCategory(''); setSelectedDepts([])
  }

  async function updateDepts(item, newDepts) {
    // newDepts: array of dept objects
    const deptsCsv = newDepts.map((d) => d.code || d.name).join(',')
    setItems((s) => s.map((it) => (it.id === item.id ? { ...it, depts: deptsCsv } : it)))
    if (!USE_LOCAL && supabase) {
      // Ensure barcode exists
      const { data: barcodeRow } = await supabase.from('barcodes').select('*').eq('code', item.code).limit(1).single()
      if (!barcodeRow) return
      // delete existing mappings and re-insert
      await supabase.from('barcode_departments').delete().eq('barcode_id', barcodeRow.id)
      if (newDepts.length) {
        const mappings = newDepts.map((d) => ({ barcode_id: barcodeRow.id, dept_id: d.id }))
        await supabase.from('barcode_departments').insert(mappings)
      }
    } else {
      localStorage.setItem(LS_KEY, JSON.stringify(items.map((it) => (it.id === item.id ? { ...it, depts: deptsCsv } : it))))
    }
  }

  function remove(id) {
    setItems((s) => s.filter((x) => x.id !== id))
    if (!USE_LOCAL && supabase) {
      supabase.from('barcodes').delete().eq('id', id)
      supabase.from('barcode_departments').delete().eq('barcode_id', id)
    } else {
      localStorage.setItem(LS_KEY, JSON.stringify(items.filter((x) => x.id !== id)))
    }
  }

  return (
    <div>
      <h3 className="text-lg font-medium mb-3">Barcodes Registry</h3>
      <div className="mb-3">
        <div className="grid grid-cols-4 gap-2">
          <input placeholder="Code" value={code} onChange={(e) => setCode(e.target.value)} className="border px-2 py-1" />
          <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="border px-2 py-1" />
          <input placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} className="border px-2 py-1" />
          <div />
        </div>
        <div className="mt-2">
          <div className="text-sm mb-1">Assign to departments</div>
          <div className="flex gap-2 flex-wrap">
            {departments.map((d) => (
              <label key={d.id} className="inline-flex items-center gap-2 bg-white border rounded px-2 py-1">
                <input type="checkbox" checked={selectedDepts.some((s) => s.id === d.id)} onChange={(e) => setSelectedDepts((s) => e.target.checked ? [...s, d] : s.filter(x => x.id !== d.id))} />
                <span className="text-sm">{d.name} ({d.code})</span>
              </label>
            ))}
          </div>
        </div>
        <div className="mt-2">
          <button onClick={add} className="px-3 py-1 bg-green-600 text-white rounded">Add Barcode</button>
        </div>
      </div>
      <div className="space-y-2">
        {items.map((d) => (
          <div key={d.id} className="flex items-center justify-between p-2 border rounded bg-white">
            <div>
              <div className="font-medium">{d.code} · {d.name}</div>
              <div className="text-sm text-gray-600">{d.category} · {d.depts}</div>
            </div>
            <div className="flex gap-2">
              <DeptAssignMenu departments={departments} currentCsv={d.depts} onChange={(newList) => updateDepts(d, newList)} />
              <button onClick={() => remove(d.id)} className="px-2 py-1 bg-red-500 text-white rounded">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DeptAssignMenu({ departments, currentCsv, onChange }) {
  const current = (currentCsv || '').split(',').map((s) => s.trim()).filter(Boolean)
  const [sel, setSel] = useState(current)

  useEffect(() => setSel(current), [currentCsv])

  function toggle(code) {
    if (sel.includes(code)) setSel(sel.filter((s) => s !== code))
    else setSel([...sel, code])
  }

  function apply() {
    const list = departments.filter((d) => sel.includes(d.code || d.name))
    onChange(list)
  }

  return (
    <div className="flex items-center gap-2">
      <button onClick={() => {}} className="px-2 py-1 bg-gray-200 rounded text-sm">Manage</button>
      <div className="hidden">
        {departments.map((d) => (
          <label key={d.id}>
            <input type="checkbox" checked={sel.includes(d.code || d.name)} onChange={() => toggle(d.code || d.name)} />{d.name}
          </label>
        ))}
        <button onClick={apply}>Apply</button>
      </div>
    </div>
  )
}
