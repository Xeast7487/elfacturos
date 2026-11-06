'use client'

import { useState } from 'react'
import { createInvoiceAction, updateInvoiceAction } from '@/app/actions'

interface Client { id: string; name: string }
interface LineItem { description: string; quantity: number; unit_price: number }

interface Props {
  clients: Client[]
  invoice?: {
    id: string
    client_id: string | null
    issued_date: string
    due_date: string | null
    notes: string | null
    tax_rate: number
    status: string
    items: LineItem[]
  }
}

function fmt(n: number) {
  return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(n)
}

export default function InvoiceForm({ clients, invoice }: Props) {
  const isEdit = !!invoice

  const [clientId,   setClientId]   = useState(invoice?.client_id ?? '')
  const [issuedDate, setIssuedDate] = useState(invoice?.issued_date ?? new Date().toISOString().split('T')[0])
  const [dueDate,    setDueDate]    = useState(invoice?.due_date ?? '')
  const [notes,      setNotes]      = useState(invoice?.notes ?? '')
  const [taxRate,    setTaxRate]    = useState(invoice?.tax_rate ?? 0)
  const [status,     setStatus]     = useState(invoice?.status ?? 'draft')
  const [items,      setItems]      = useState<LineItem[]>(
    invoice?.items.length ? invoice.items : [{ description: '', quantity: 1, unit_price: 0 }]
  )
  const [error,      setError]      = useState('')
  const [pending,    setPending]    = useState(false)

  function addItem() {
    setItems(prev => [...prev, { description: '', quantity: 1, unit_price: 0 }])
  }

  function removeItem(i: number) {
    setItems(prev => prev.filter((_, idx) => idx !== i))
  }

  function updateItem(i: number, field: keyof LineItem, value: string) {
    setItems(prev => prev.map((item, idx) => {
      if (idx !== i) return item
      if (field === 'description') return { ...item, description: value }
      return { ...item, [field]: parseFloat(value) || 0 }
    }))
  }

  const subtotal = items.reduce((acc, item) => acc + item.quantity * item.unit_price, 0)
  const taxAmt   = subtotal * taxRate / 100
  const total    = subtotal + taxAmt

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (items.some(i => !i.description.trim())) { setError('Toutes les lignes doivent avoir une description.'); return }
    setError('')
    setPending(true)

    const fd = new FormData()
    fd.append('client_id', clientId)
    fd.append('issued_date', issuedDate)
    fd.append('due_date', dueDate)
    fd.append('notes', notes)
    fd.append('tax_rate', String(taxRate))
    fd.append('status', status)
    fd.append('items', JSON.stringify(items))

    const res = isEdit
      ? await updateInvoiceAction(invoice!.id, fd)
      : await createInvoiceAction(fd)

    if (res && 'error' in res) { setError(res.error as string); setPending(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-3xl">
      {/* Header */}
      <div className="card p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Client</label>
          <select value={clientId} onChange={e => setClientId(e.target.value)} className="input">
            <option value="">— Aucun client —</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Statut</label>
          <select value={status} onChange={e => setStatus(e.target.value)} className="input">
            <option value="draft">Brouillon</option>
            <option value="sent">Envoyée</option>
            <option value="paid">Payée</option>
          </select>
        </div>

        <div>
          <label className="label">Date d'émission *</label>
          <input type="date" value={issuedDate} onChange={e => setIssuedDate(e.target.value)} className="input" required />
        </div>

        <div>
          <label className="label">Date d'échéance</label>
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="input" />
        </div>
      </div>

      {/* Line items */}
      <div className="card p-5 space-y-3">
        <h2 className="font-semibold text-white text-sm">Lignes de service</h2>

        <div className="hidden sm:grid grid-cols-[1fr_80px_110px_36px] gap-2 text-xs text-slate-500 font-medium px-1">
          <span>Description</span>
          <span className="text-center">Qté</span>
          <span className="text-right">Prix unitaire</span>
          <span />
        </div>

        {items.map((item, i) => (
          <div key={i} className="grid grid-cols-[1fr_80px_110px_36px] gap-2 items-center">
            <input
              value={item.description}
              onChange={e => updateItem(i, 'description', e.target.value)}
              placeholder="Description du service"
              className="input text-sm"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              value={item.quantity}
              onChange={e => updateItem(i, 'quantity', e.target.value)}
              className="input text-sm text-center"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              value={item.unit_price}
              onChange={e => updateItem(i, 'unit_price', e.target.value)}
              className="input text-sm text-right"
            />
            <button
              type="button"
              onClick={() => removeItem(i)}
              disabled={items.length === 1}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-white/8 text-slate-500 hover:text-red-400 hover:border-red-500/30 transition-all disabled:opacity-30"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        ))}

        <button type="button" onClick={addItem} className="btn-secondary text-xs">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Ajouter une ligne
        </button>
      </div>

      {/* Totals + options */}
      <div className="flex flex-col sm:flex-row gap-5">
        {/* Notes */}
        <div className="flex-1 card p-5">
          <label className="label">Notes / conditions</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={4}
            className="input resize-none"
            placeholder="Merci pour votre confiance…"
          />
        </div>

        {/* Totals */}
        <div className="card p-5 w-full sm:w-72 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Sous-total</span>
            <span className="text-white font-medium">{fmt(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm gap-3">
            <label className="text-slate-400">Taxes (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={taxRate}
              onChange={e => setTaxRate(parseFloat(e.target.value) || 0)}
              className="input text-sm text-right w-24"
            />
          </div>
          {taxRate > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Taxe ({taxRate}%)</span>
              <span className="text-white">{fmt(taxAmt)}</span>
            </div>
          )}
          <div className="border-t border-white/8 pt-3 flex items-center justify-between">
            <span className="font-semibold text-white">Total</span>
            <span className="text-xl font-bold text-indigo-300">{fmt(total)}</span>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

      <div className="flex justify-end">
        <button type="submit" disabled={pending} className="btn-primary px-6 py-2.5">
          {pending ? 'Enregistrement…' : isEdit ? 'Mettre à jour' : 'Créer la facture'}
        </button>
      </div>
    </form>
  )
}
