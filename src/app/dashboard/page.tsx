export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AppLayout from '@/components/AppLayout'

function fmt(n: number) {
  return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(n)
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'paid') return <span className="badge-paid">Payée</span>
  if (status === 'sent') return <span className="badge-sent">Envoyée</span>
  return <span className="badge-draft">Brouillon</span>
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [invoicesRes, clientsRes] = await Promise.all([
    supabase.from('inv_invoices')
      .select('id, invoice_number, status, issued_date, tax_rate, client_id, inv_clients(name), inv_items(quantity, unit_price)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase.from('inv_clients').select('id', { count: 'exact' }).eq('user_id', user.id),
  ])

  const invoices = (invoicesRes.data ?? []) as any[]
  const clientCount = clientsRes.count ?? 0

  function invoiceTotal(inv: any) {
    const sub = (inv.inv_items ?? []).reduce((acc: number, item: any) => acc + item.quantity * item.unit_price, 0)
    return sub * (1 + (inv.tax_rate ?? 0) / 100)
  }

  const totalInvoiced = invoices.reduce((acc, inv) => acc + invoiceTotal(inv), 0)
  const totalPaid     = invoices.filter(i => i.status === 'paid').reduce((acc, inv) => acc + invoiceTotal(inv), 0)
  const totalPending  = invoices.filter(i => i.status === 'sent').reduce((acc, inv) => acc + invoiceTotal(inv), 0)
  const recent = invoices.slice(0, 8)

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Tableau de bord</h1>
          <Link href="/factures/new" className="btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nouvelle facture
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total facturé', value: fmt(totalInvoiced), color: 'text-white' },
            { label: 'En attente', value: fmt(totalPending), color: 'text-yellow-400' },
            { label: 'Reçu', value: fmt(totalPaid), color: 'text-green-400' },
            { label: 'Clients', value: String(clientCount), color: 'text-indigo-400' },
          ].map(stat => (
            <div key={stat.label} className="card p-4">
              <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Recent invoices */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
            <h2 className="font-semibold text-white">Factures récentes</h2>
            <Link href="/factures" className="text-xs text-indigo-400 hover:text-indigo-300">Voir tout →</Link>
          </div>
          {recent.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p className="text-sm">Aucune facture pour l'instant.</p>
              <Link href="/factures/new" className="btn-primary mt-4 inline-flex">Créer une facture</Link>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {recent.map((inv: any) => (
                <Link
                  key={inv.id}
                  href={`/factures/${inv.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-white/3 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <StatusBadge status={inv.status} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">{inv.invoice_number}</p>
                      <p className="text-xs text-slate-500 truncate">{inv.inv_clients?.name ?? '—'}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-sm font-bold text-white">{fmt(invoiceTotal(inv))}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(inv.issued_date).toLocaleDateString('fr-CA')}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
