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
      <div className="max-w-2xl space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/factures" className="w-8 h-8 rounded-lg bg-[#1a1a1a] flex items-center justify-center text-[#555] hover:text-white transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </Link>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-black text-white">{inv.invoice_number}</h1>
                <StatusBadge status={inv.status} />
              </div>
              <p className="text-xs text-[#444] mt-0.5">
                Émise le {new Date(inv.issued_date).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' })}
                {inv.due_date && ` · Échéance ${new Date(inv.due_date).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' })}`}
              </p>
            </div>
          </div>
          <InvoiceActions invoiceId={id} status={inv.status} />
        </div>

        {/* Client + amounts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="card p-5">
            <p className="label mb-3">Facturer à</p>
            {client ? (
              <div className="space-y-0.5">
                <p className="font-bold text-white">{client.name}</p>
                {client.email && <p className="text-sm text-[#555]">{client.email}</p>}
                {client.phone && <p className="text-sm text-[#555]">{client.phone}</p>}
                {(client.address || client.city) && (
                  <p className="text-sm text-[#444] mt-1">
                    {[client.address, client.city, client.postal_code, client.country].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-[#333] text-sm">Aucun client</p>
            )}
          </div>

          <div className="card p-5">
            <p className="label mb-3">Montants</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#555]">Sous-total</span>
                <span className="text-white font-semibold">{fmt(subtotal)}</span>
              </div>
              {inv.tax_rate > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#555]">Taxe ({inv.tax_rate}%)</span>
                  <span className="text-white font-semibold">{fmt(taxAmt)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-[#1a1a1a]">
                <span className="font-bold text-white text-sm">Total</span>
                <span className="font-black text-xl text-[#a3e635]">{fmt(total)}</span>
              </div>
              {inv.paid_at && (
                <p className="text-xs font-bold text-[#a3e635] mt-2">
                  ✓ Payée le {new Date(inv.paid_at).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Line items */}
        <div className="card overflow-hidden">
          <div className="grid grid-cols-[1fr_60px_100px_100px] gap-2 px-5 py-3 border-b border-[#1a1a1a]">
            {['Description', 'Qté', 'Prix unit.', 'Total'].map((h, i) => (
              <span key={h} className={`text-[0.6rem] font-bold uppercase tracking-widest text-[#444] ${i > 0 ? 'text-right' : ''}`}>{h}</span>
            ))}
          </div>
          <div>
            {items.map((item, i) => (
              <div
                key={item.id}
                className={`grid grid-cols-[1fr_60px_100px_100px] gap-2 px-5 py-3.5 ${i < items.length - 1 ? 'border-b border-[#1a1a1a]' : ''}`}
              >
                <p className="text-sm text-white font-medium">{item.description}</p>
                <p className="text-sm text-[#555] text-right">{item.quantity}</p>
                <p className="text-sm text-[#555] text-right">{fmt(item.unit_price)}</p>
                <p className="text-sm text-white font-bold text-right">{fmt(item.quantity * item.unit_price)}</p>
              </div>
            ))}
          </div>
        </div>

        {inv.notes && (
          <div className="card p-5">
            <p className="label mb-2">Notes</p>
            <p className="text-sm text-[#888] whitespace-pre-line">{inv.notes}</p>
          </div>
        )}

        {/* Edit */}
        <div className="flex justify-end">
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
