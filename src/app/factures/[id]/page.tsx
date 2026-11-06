export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import AppLayout from '@/components/AppLayout'
import InvoiceActions from './InvoiceActions'

function fmt(n: number) {
  return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(n)
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'paid') return <span className="badge-paid">Payée</span>
  if (status === 'sent') return <span className="badge-sent">Envoyée</span>
  return <span className="badge-draft">Brouillon</span>
}

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: inv } = await supabase
    .from('inv_invoices')
    .select('*, inv_clients(name, email, phone, address, city, postal_code, country), inv_items(id, description, quantity, unit_price, position)')
    .eq('id', id).eq('user_id', user.id)
    .single()

  if (!inv) notFound()

  const items    = [...((inv.inv_items as any[]) ?? [])].sort((a, b) => a.position - b.position)
  const subtotal = items.reduce((acc, item) => acc + item.quantity * item.unit_price, 0)
  const taxAmt   = subtotal * (inv.tax_rate ?? 0) / 100
  const total    = subtotal + taxAmt
  const client   = inv.inv_clients as any

  return (
    <AppLayout>
      <div className="detail-wrap">
        {/* Header */}
        <div className="detail-header">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <Link href="/factures" className="back-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </Link>
            <div>
              <div className="detail-title-row">
                <h1 className="detail-title">{inv.invoice_number}</h1>
                <StatusBadge status={inv.status} />
              </div>
              <p className="detail-meta">
                Émise le {new Date(inv.issued_date).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' })}
                {inv.due_date && ` · Échéance ${new Date(inv.due_date).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' })}`}
              </p>
            </div>
          </div>
          <InvoiceActions invoiceId={id} status={inv.status} />
        </div>

        {/* Client + amounts */}
        <div className="two-col" style={{ marginBottom: 12 }}>
          <div className="card card-pad">
            <p className="card-label">Facturer à</p>
            {client ? (
              <div>
                <p style={{ fontWeight: 700, color: '#fff', marginBottom: 4 }}>{client.name}</p>
                {client.email && <p style={{ fontSize: '0.875rem', color: '#555' }}>{client.email}</p>}
                {client.phone && <p style={{ fontSize: '0.875rem', color: '#555' }}>{client.phone}</p>}
                {(client.address || client.city) && (
                  <p style={{ fontSize: '0.875rem', color: '#444', marginTop: 4 }}>
                    {[client.address, client.city, client.postal_code, client.country].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
            ) : (
              <p style={{ fontSize: '0.875rem', color: '#333' }}>Aucun client</p>
            )}
          </div>

          <div className="card card-pad">
            <p className="card-label">Montants</p>
            <div className="amount-row">
              <span className="amount-label">Sous-total</span>
              <span className="amount-val">{fmt(subtotal)}</span>
            </div>
            {inv.tax_rate > 0 && (
              <div className="amount-row">
                <span className="amount-label">Taxe ({inv.tax_rate}%)</span>
                <span className="amount-val">{fmt(taxAmt)}</span>
              </div>
            )}
            <div className="amount-divider" />
            <div className="amount-row">
              <span className="amount-total-label">Total</span>
              <span className="amount-total-val">{fmt(total)}</span>
            </div>
            {inv.paid_at && (
              <p className="paid-note">✓ Payée le {new Date(inv.paid_at).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            )}
          </div>
        </div>

        {/* Line items */}
        <div className="card" style={{ marginBottom: 12, overflow: 'hidden' }}>
          <div className="items-header">
            <span className="col-label">Description</span>
            <span className="col-label r">Qté</span>
            <span className="col-label r">Prix unit.</span>
            <span className="col-label r">Total</span>
          </div>
          {items.map(item => (
            <div key={item.id} className="items-row">
              <span className="col-desc">{item.description}</span>
              <span className="col-num">{item.quantity}</span>
              <span className="col-price">{fmt(item.unit_price)}</span>
              <span className="col-total">{fmt(item.quantity * item.unit_price)}</span>
            </div>
          ))}
        </div>

        {inv.notes && (
          <div className="card card-pad" style={{ marginBottom: 12 }}>
            <p className="card-label">Notes</p>
            <p className="notes-text">{inv.notes}</p>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Link href={`/factures/${id}/edit`} className="btn-secondary">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Modifier
          </Link>
        </div>
      </div>
    </AppLayout>
  )
}
