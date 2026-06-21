import { useEffect, useRef, useState } from 'react'
import JsBarcode from 'jsbarcode'
import CSVTool from './CSVTool'
import AdminDashboard from './admin/AdminDashboard'
import DepartmentsPage from './admin/DepartmentsPage'
import CategoriesPage from './admin/CategoriesPage'
import UsersPage from './admin/UsersPage'
import BarcodesAdminPage from './admin/BarcodesAdminPage'

const STORAGE_KEY = 'wnh-stock'

export default function App({ session, profile, onSignOut }) {
  const videoRef = useRef(null)
  const svgRef = useRef(null)
  const detectorRef = useRef(null)
  const [scanned, setScanned] = useState('')
  const [running, setRunning] = useState(false)
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    } catch (e) {
      return []
    }
  })
  const [form, setForm] = useState({ barcode: '', name: '', qty: 1, location: '', department: 'คลัง' })
  const [filterDept, setFilterDept] = useState('all')
  const [printTarget, setPrintTarget] = useState(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  useEffect(() => {
    return () => stopCamera()
  }, [])

  async function startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      if (videoRef.current) videoRef.current.srcObject = stream
      // try BarcodeDetector if available
      if (window.BarcodeDetector) {
        const formats = await window.BarcodeDetector.getSupportedFormats()
        detectorRef.current = new window.BarcodeDetector({ formats })
        setRunning(true)
        requestAnimationFrame(tick)
      } else {
        // fallback: still show video and allow manual entry
        setRunning(true)
      }
    } catch (err) {
      console.error('camera error', err)
    }
  }

  function stopCamera() {
    setRunning(false)
    const s = videoRef.current?.srcObject
    if (s && s.getTracks) s.getTracks().forEach((t) => t.stop())
    if (videoRef.current) videoRef.current.srcObject = null
  }

  async function tick() {
    if (!running || !detectorRef.current) return
    try {
      const barcodes = await detectorRef.current.detect(videoRef.current)
      if (barcodes && barcodes.length) {
        const code = barcodes[0].rawValue || barcodes[0].rawText || ''
        if (code) {
          setScanned(code)
          setForm((f) => ({ ...f, barcode: code }))
        }
      }
    } catch (e) {
      // ignore
    }
    requestAnimationFrame(tick)
  }

  const labelSource = printTarget || form

  useEffect(() => {
    if (!svgRef.current || !labelSource?.barcode) return
    try {
      JsBarcode(svgRef.current, labelSource.barcode, {
        format: 'CODE128',
        width: 2,
        height: 60,
        displayValue: true,
        fontSize: 14,
        margin: 8,
      })
    } catch (error) {
      console.warn('Barcode render failed', error)
    }
  }, [labelSource?.barcode, labelSource?.name, labelSource?.department])

  useEffect(() => {
    if (!printTarget?.barcode) return
    const handleAfterPrint = () => setPrintTarget(null)
    window.addEventListener('afterprint', handleAfterPrint)
    window.print()
    return () => window.removeEventListener('afterprint', handleAfterPrint)
  }, [printTarget])

  function printLabel(item) {
    const target = item || form
    if (!target?.barcode) return
    setPrintTarget(target)
  }

  function saveItem(e) {
    e?.preventDefault()
    const existing = items.find((it) => it.barcode === form.barcode)
    if (existing) {
      setItems((prev) => prev.map((it) => (it.barcode === form.barcode ? { ...it, ...form } : it)))
    } else {
      setItems((prev) => [{ ...form }, ...prev])
    }
    setForm({ barcode: '', name: '', qty: 1, location: '', department: 'คลัง' })
    setPrintTarget(null)
  }

  function generateBarcode() {
    const now = new Date()
    const prefix = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}` // e.g. 2606
    const key = `seq-${prefix}`
    let seq = Number(localStorage.getItem(key) || '0') + 1
    localStorage.setItem(key, String(seq))
    const seqPart = String(seq).padStart(8, '0')
    return `${prefix}${seqPart}`.slice(0, 12)
  }

  function fillAutoGen() {
    let code = generateBarcode()
    // ensure uniqueness within items
    while (items.find((it) => it.barcode === code)) {
      code = generateBarcode()
    }
    setForm((f) => ({ ...f, barcode: code }))
  }

  function handleCsvImport(rows) {
    const parsed = rows.map((r) => ({
      barcode: r.code || r.barcode || '',
      name: r.name || '',
      category: r.category || r.cat || '',
      department: r.depts || r.department || 'คลัง',
      qty: Number(r.qty) || 1,
      location: r.location || '',
    }))
    // merge
    setItems((prev) => [...parsed, ...prev])
  }

  function editItem(it) {
    setForm({ ...it })
    setPrintTarget(null)
  }

  function deleteItem(barcode) {
    setItems((prev) => prev.filter((it) => it.barcode !== barcode))
  }

  async function addToDept(barcode) {
    const item = items.find((i) => i.barcode === barcode)
    if (!item) return
    const defaultDept = profile?.dept || profile?.dept_id || ''
    const deptName = window.prompt('Department to add (code or name):', defaultDept)
    if (!deptName) return
    const current = (item.depts || item.department || '').split(',').map(s => s.trim()).filter(Boolean)
    if (current.includes(deptName)) return
    const newCsv = [...current, deptName].join(',')
    setItems((prev) => prev.map((it) => it.barcode === barcode ? { ...it, depts: newCsv } : it))
    if (import.meta.env.VITE_SUPABASE_URL) {
      const { supabase } = await import('./lib/supabaseClient')
      // find barcode row
      const { data: bdata } = await supabase.from('barcodes').select('*').eq('code', barcode).limit(1).single()
      const { data: drow } = await supabase.from('departments').select('*').or(`code.eq.${deptName},name.eq.${deptName}`).limit(1).single()
      if (bdata && drow) {
        await supabase.from('barcode_departments').insert([{ barcode_id: bdata.id, dept_id: drow.id }])
      }
    }
  }

  async function removeFromDept(barcode) {
    const item = items.find((i) => i.barcode === barcode)
    if (!item) return
    const defaultDept = profile?.dept || profile?.dept_id || ''
    const deptName = window.prompt('Department to remove (code or name):', defaultDept)
    if (!deptName) return
    const current = (item.depts || item.department || '').split(',').map(s => s.trim()).filter(Boolean)
    const updated = current.filter((d) => d !== deptName)
    const newCsv = updated.join(',')
    setItems((prev) => prev.map((it) => it.barcode === barcode ? { ...it, depts: newCsv } : it))
    if (import.meta.env.VITE_SUPABASE_URL) {
      const { supabase } = await import('./lib/supabaseClient')
      const { data: bdata } = await supabase.from('barcodes').select('*').eq('code', barcode).limit(1).single()
      const { data: drow } = await supabase.from('departments').select('*').or(`code.eq.${deptName},name.eq.${deptName}`).limit(1).single()
      if (bdata && drow) {
        await supabase.from('barcode_departments').delete().match({ barcode_id: bdata.id, dept_id: drow.id })
      }
    }
  }

  const role = profile?.role || 'dept'
  const username = profile?.username || session?.user?.email || 'guest'
  const deptId = profile?.dept_id || null
  const [adminView, setAdminView] = useState('dashboard')

  function handleNavigate(view) {
    setAdminView(view)
  }
  const [departments, setDepartments] = useState([])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      if (import.meta.env.VITE_SUPABASE_URL) {
        const { data } = await (await import('./lib/supabaseClient')).supabase.from('departments').select('*')
        if (mounted) setDepartments(data || [])
      } else {
        const d = JSON.parse(localStorage.getItem('wnh-departments') || '[]')
        if (mounted) setDepartments(d)
      }
    }
    load()
    return () => (mounted = false)
  }, [])

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <header className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-700">{profile?.dept_id ? `Dept: ${profile.dept_id}` : 'All Departments'}</div>
        <div className="flex items-center gap-4">
          <div className="text-sm">{username} · {role}</div>
          <button onClick={onSignOut} className="px-2 py-1 bg-gray-200 rounded">Logout</button>
        </div>
      </header>
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded shadow p-4">
          <h2 className="text-xl font-semibold mb-3">Scanner</h2>
          <div className="flex gap-4">
            <div className="w-1/2">
              <video ref={videoRef} autoPlay playsInline muted className="w-full rounded bg-black" />
              <div className="mt-2 flex gap-2">
                {!running ? (
                  <button onClick={startCamera} className="px-3 py-1 bg-blue-600 text-white rounded">Start Camera</button>
                ) : (
                  <button onClick={stopCamera} className="px-3 py-1 bg-red-600 text-white rounded">Stop Camera</button>
                )}
                <button onClick={() => setForm((f) => ({ ...f, barcode: scanned || '' }))} className="px-3 py-1 bg-gray-200 rounded">Use Scanned</button>
              </div>
            </div>
            <div className="w-1/2">
              <h3 className="text-sm text-gray-600">Scanned</h3>
              <div className="mt-1 p-2 bg-gray-50 rounded min-h-[64px]">{scanned || <em className="text-gray-400">No barcode yet</em>}</div>

              <form onSubmit={saveItem} className="mt-4">
                <label className="block text-sm mt-2">Barcode</label>
                <input value={form.barcode} onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))} className="w-full border rounded px-2 py-1" />
                <label className="block text-sm mt-2">Name</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full border rounded px-2 py-1" />
                <label className="block text-sm mt-2">Quantity</label>
                <input type="number" value={form.qty} onChange={(e) => setForm((f) => ({ ...f, qty: Number(e.target.value) }))} className="w-full border rounded px-2 py-1" />
                <label className="block text-sm mt-2">Location</label>
                <input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} className="w-full border rounded px-2 py-1" />
                <label className="block text-sm mt-2">Department</label>
                <select value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} className="w-full border rounded px-2 py-1">
                  <option value="คลัง">คลัง</option>
                  <option value="ANC">ANC</option>
                </select>
                <div className="mt-3 flex gap-2">
                  <button type="submit" className="px-3 py-1 bg-green-600 text-white rounded">Save</button>
                  <button type="button" onClick={() => setForm({ barcode: '', name: '', qty: 1, location: '', department: 'คลัง' })} className="px-3 py-1 bg-gray-200 rounded">Clear</button>
                </div>
              </form>
              <div className="mt-4 p-3 border rounded bg-slate-50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Label Preview</div>
                    <div className="text-xs text-gray-500">Barcode128 พร้อมพิมพ์</div>
                  </div>
                  <button type="button" onClick={() => printLabel()} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Print Label</button>
                </div>
                <div className="mt-3 print-area border rounded bg-white p-3">
                  <div className="text-center text-sm font-semibold mb-2">{labelSource.department || 'คลัง'}</div>
                  <svg ref={svgRef} className="w-full h-[120px]" />
                  <div className="mt-2 text-center text-sm">{labelSource.name || 'Unnamed item'}</div>
                  <div className="text-center text-xs text-gray-500">{labelSource.barcode || 'No barcode'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {role === 'admin' ? (
          <div className="md:col-span-1">
            <div className="bg-white rounded shadow p-4">
              {adminView === 'dashboard' && <AdminDashboard onNavigate={handleNavigate} />}
              {adminView === 'departments' && <DepartmentsPage />}
              {adminView === 'categories' && <CategoriesPage />}
              {adminView === 'users' && <UsersPage />}
              {adminView === 'barcodes' && <BarcodesAdminPage />}
              <div className="mt-4">
                <button onClick={() => setAdminView('dashboard')} className="px-3 py-1 bg-gray-200 rounded">Back</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded shadow p-4">
            <h2 className="text-xl font-semibold mb-3">Stock</h2>
            <div className="flex items-center gap-3 mb-3">
              <label className="text-sm">Filter</label>
              <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="border rounded px-2 py-1">
                <option value="all">All</option>
                <option value="คลัง">คลัง</option>
                <option value="ANC">ANC</option>
              </select>
              {role === 'admin' && <CSVTool items={items} onImport={(rows) => handleCsvImport(rows)} />}
            </div>
            {items.filter((it) => filterDept === 'all' || it.department === filterDept).length === 0 ? (
              <div className="text-gray-500">No items yet. Scan or add one.</div>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-auto">
                {items.filter((it) => filterDept === 'all' || it.department === filterDept).map((it) => (
                  <div key={it.barcode} className="flex items-center justify-between border rounded p-2">
                    <div>
                      <div className="font-medium">{it.name || <em className="text-gray-500">Unnamed</em>}</div>
                      <div className="text-sm text-gray-600">{it.barcode} · Qty: {it.qty} · {it.location} · {it.department}</div>
                    </div>
                    <div className="flex gap-2">
                      {role === 'admin' && (
                        <button onClick={() => editItem(it)} className="px-2 py-1 bg-indigo-600 text-white rounded text-sm">Edit</button>
                      )}
                      <button onClick={() => printLabel(it)} className="px-2 py-1 bg-sky-600 text-white rounded text-sm">Print</button>
                      {role === 'admin' ? (
                        <button onClick={() => deleteItem(it.barcode)} className="px-2 py-1 bg-red-500 text-white rounded text-sm">Delete</button>
                      ) : (
                        <>
                          <button onClick={() => addToDept(it.barcode)} className="px-2 py-1 bg-green-600 text-white rounded text-sm">Add to dept</button>
                          <button onClick={() => removeFromDept(it.barcode)} className="px-2 py-1 bg-yellow-600 text-white rounded text-sm">Remove from dept</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}