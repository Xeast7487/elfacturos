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
      .select('id, invoice_number, status, issued_date, tax_rate, inv_clients(name), inv_items(quantity, unit_price)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase.from('inv_clients').select('id', { count: 'exact' }).eq('user_id', user.id),
  ])

  const invoices    = (invoicesRes.data ?? []) as any[]
  const clientCount = clientsRes.count ?? 0

  function invoiceTotal(inv: any) {
    const sub = (inv.inv_items ?? []).reduce((acc: number, item: any) => acc + item.quantity * item.unit_price, 0)
    return sub * (1 + (inv.tax_rate ?? 0) / 100)
  }

  const totalInvoiced = invoices.reduce((acc, inv) => acc + invoiceTotal(inv), 0)
  const totalPaid     = invoices.filter(i => i.status === 'paid').reduce((acc, inv) => acc + invoiceTotal(inv), 0)
  const totalPending  = invoices.filter(i => i.status === 'sent').reduce((acc, inv) => acc + invoiceTotal(inv), 0)
  const countSent     = invoices.filter(i => i.status === 'sent').length
  const countPaid     = invoices.filter(i => i.status === 'paid').length
  const recent        = invoices.slice(0, 8)

  return (
    <AppLayout>
      <div className="page-header">
        <h1 className="page-title">Tableau de bord</h1>
        <Link href="/factures/new" className="btn-primary">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nouvelle facture
        </Link>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <p className="stat-label">Total facturé</p>
          <p className="stat-value" style={{ color: '#fff' }}>{fmt(totalInvoiced)}</p>
          <p className="stat-sub">{invoices.length} facture{invoices.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">En attente</p>
          <p className="stat-value" style={{ color: '#f97316' }}>{fmt(totalPending)}</p>
          <p className="stat-sub">{countSent} envoyée{countSent !== 1 ? 's' : ''}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Reçu</p>
          <p className="stat-value" style={{ color: '#a3e635' }}>{fmt(totalPaid)}</p>
          <p className="stat-sub">{countPaid} payée{countPaid !== 1 ? 's' : ''}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Clients</p>
          <p className="stat-value" style={{ color: '#fff' }}>{clientCount}</p>
          <p className="stat-sub">actifs</p>
        </div>
      </div>

      {/* Recent invoices */}
      <div className="card">
        <div className="section-head">
          <span className="section-label">Factures récentes</span>
          <Link href="/factures" className="section-link">Voir tout →</Link>
        </div>

        {recent.length === 0 ? (
          <div className="empty-state">
            <p>Aucune facture pour l'instant.</p>
            <Link href="/factures/new" className="btn-primary">Créer une facture</Link>
          </div>
        ) : (
          <div>
            {recent.map((inv: any) => (
              <Link key={inv.id} href={`/factures/${inv.id}`} className="list-row">
                <div className="list-row-left">
                  <StatusBadge status={inv.status} />
                  <div>
                    <p className="row-title">{inv.invoice_number}</p>
                    <p className="row-sub">{inv.inv_clients?.name ?? '—'}</p>
                  </div>
                </div>
                <div className="list-row-right">
                  <p className="row-amount">{fmt(invoiceTotal(inv))}</p>
                  <p className="row-date">{new Date(inv.issued_date).toLocaleDateString('fr-CA')}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
