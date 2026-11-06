'use client'

import { useState, useTransition } from 'react'
import { markInvoicePaidAction, markInvoiceSentAction, deleteInvoiceAction } from '@/app/actions'

export default function InvoiceActions({ invoiceId, status }: { invoiceId: string; status: string }) {
  const [pending, start] = useTransition()
  const [error, setError] = useState('')

  function markSent() {
    start(async () => {
      const r = await markInvoiceSentAction(invoiceId)
      if (r?.error) setError(r.error)
    })
  }

  function markPaid() {
    start(async () => {
      const r = await markInvoicePaidAction(invoiceId)
      if (r?.error) setError(r.error)
    })
  }

  function handleDelete() {
    if (!confirm('Supprimer cette facture ?')) return
    start(async () => { await deleteInvoiceAction(invoiceId) })
  }

  return (
    <div className="btn-row">
      {error && <p style={{ fontSize: '0.75rem', color: '#f87171' }}>{error}</p>}

      {/* PDF button */}
      <a
        href={`/api/factures/${invoiceId}/pdf`}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-secondary"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        PDF
      </a>

      {status === 'draft' && (
        <button onClick={markSent} disabled={pending} className="btn-orange">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
          Marquer envoyée
        </button>
      )}

      {(status === 'draft' || status === 'sent') && (
        <button onClick={markPaid} disabled={pending} className="btn-green">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Marquer payée
        </button>
      )}

      <button onClick={handleDelete} disabled={pending} className="btn-danger">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
        </svg>
        Supprimer
      </button>
    </div>
  )
}
