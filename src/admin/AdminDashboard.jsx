import { useState } from 'react'

export default function AdminDashboard({ onNavigate }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Admin Dashboard</h2>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => onNavigate('departments')} className="p-3 bg-white rounded shadow">Manage Departments</button>
        <button onClick={() => onNavigate('categories')} className="p-3 bg-white rounded shadow">Manage Categories</button>
        <button onClick={() => onNavigate('users')} className="p-3 bg-white rounded shadow">Manage Users</button>
        <button onClick={() => onNavigate('barcodes')} className="p-3 bg-white rounded shadow">Barcode Registry</button>
      </div>
    </div>
  )
}
