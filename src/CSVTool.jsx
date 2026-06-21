import Papa from 'papaparse'

export function ExportCSV({ items }) {
  function download() {
    const csv = Papa.unparse(items.map((it) => ({ code: it.barcode, name: it.name, category: it.category || '', depts: it.department || '' })))
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'barcodes.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return <button onClick={download} className="px-3 py-1 bg-gray-800 text-white rounded text-sm">Export CSV</button>
}

export function ImportCSV({ onImport }) {
  function handleFile(e) {
    const f = e.target.files?.[0]
    if (!f) return
    Papa.parse(f, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        onImport(results.data)
      },
    })
  }

  return (
    <label className="px-3 py-1 bg-green-600 text-white rounded cursor-pointer text-sm">
      Import CSV
      <input type="file" accept="text/csv" onChange={handleFile} className="hidden" />
    </label>
  )
}

export default function CSVTool({ items, onImport }) {
  return (
    <div className="flex gap-2 items-center">
      <ImportCSV onImport={onImport} />
      <ExportCSV items={items} />
    </div>
  )
}
