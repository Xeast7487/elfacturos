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

  const items = [...((inv.inv_items as any[]) ?? [])].sort((a, b) => a.position - b.position)
  const subtotal = items.reduce((acc, item) => acc + item.quantity * item.unit_price, 0)
  const taxAmt   = subtotal * (inv.tax_rate ?? 0) / 100
  const total    = subtotal + taxAmt
  const client   = inv.inv_clients as any

  return (
    <AppLayout>
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/factures" className="text-slate-500 hover:text-slate-300">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">{inv.invoice_number}</h1>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={inv.status} />
                <span className="text-xs text-slate-500">
                  Émise le {new Date(inv.issued_date).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' })}
                  {inv.due_date && ` · Échéance ${new Date(inv.due_date).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' })}`}
                </span>
              </div>
            </div>
          </div>

          <InvoiceActions invoiceId={id} status={inv.status} />
        </div>

        {/* Client + amounts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="card p-5">
            <p className="text-xs text-slate-500 font-medium mb-2">Facturer à</p>
            {client ? (
              <div>
                <p className="font-semibold text-white">{client.name}</p>
                {client.email && <p className="text-sm text-slate-400 mt-0.5">{client.email}</p>}
                {client.phone && <p className="text-sm text-slate-400">{client.phone}</p>}
                {(client.address || client.city) && (
                  <p className="text-sm text-slate-400 mt-1">
                    {[client.address, client.city, client.postal_code, client.country].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">Aucun client</p>
            )}
          </div>

          <div className="card p-5">
            <p className="text-xs text-slate-500 font-medium mb-2">Montants</p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Sous-total</span>
                <span className="text-white">{fmt(subtotal)}</span>
              </div>
              {inv.tax_rate > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Taxe ({inv.tax_rate}%)</span>
                  <span className="text-white">{fmt(taxAmt)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm border-t border-white/8 pt-1.5 mt-1.5">
                <span className="font-semibold text-white">Total</span>
                <span className="font-bold text-indigo-300 text-lg">{fmt(total)}</span>
              </div>
              {inv.paid_at && (
                <p className="text-xs text-green-400 mt-2">
                  ✓ Payée le {new Date(inv.paid_at).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Line items */}
        <div className="card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/8 bg-white/3">
            <div className="hidden sm:grid grid-cols-[1fr_80px_120px_120px] gap-2 text-xs font-semibold text-slate-400">
              <span>Description</span>
              <span className="text-center">Qté</span>
              <span className="text-right">Prix unit.</span>
              <span className="text-right">Total</span>
            </div>
          </div>
          <div className="divide-y divide-white/5">
            {items.map(item => (
              <div key={item.id} className="px-5 py-3">
                <div className="sm:grid grid-cols-[1fr_80px_120px_120px] gap-2">
                  <p className="text-sm text-white font-medium">{item.description}</p>
                  <p className="text-sm text-slate-400 text-center sm:text-center">{item.quantity}</p>
                  <p className="text-sm text-slate-400 text-right">{fmt(item.unit_price)}</p>
                  <p className="text-sm text-white font-semibold text-right">{fmt(item.quantity * item.unit_price)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {inv.notes && (
          <div className="card p-5">
            <p className="text-xs text-slate-500 font-medium mb-1">Notes</p>
            <p className="text-sm text-slate-300 whitespace-pre-line">{inv.notes}</p>
          </div>
        )}

        {/* Edit link */}
        <div className="flex justify-end">
          <Link href={`/factures/${id}/edit`} className="btn-secondary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Modifier la facture
          </Link>
        </div>
      </div>
    </AppLayout>
  )
}
