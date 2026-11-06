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

export default async function FacturesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let query = supabase
    .from('inv_invoices')
    .select('id, invoice_number, status, issued_date, due_date, tax_rate, inv_clients(name), inv_items(quantity, unit_price)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (status && ['draft','sent','paid'].includes(status)) {
    query = query.eq('status', status)
  }

  const { data: invoices } = await query

  function invoiceTotal(inv: any) {
    const sub = (inv.inv_items ?? []).reduce((acc: number, item: any) => acc + item.quantity * item.unit_price, 0)
    return sub * (1 + (inv.tax_rate ?? 0) / 100)
  }

  const filters = [
    { label: 'Toutes',     value: '' },
    { label: 'Brouillons', value: 'draft' },
    { label: 'Envoyées',   value: 'sent' },
    { label: 'Payées',     value: 'paid' },
  ]

  return (
    <AppLayout>
      <div className="page-header">
        <h1 className="page-title">Factures</h1>
        <Link href="/factures/new" className="btn-primary">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nouvelle facture
        </Link>
      </div>

      <div className="filter-row">
        {filters.map(f => (
          <Link
            key={f.value}
            href={f.value ? `/factures?status=${f.value}` : '/factures'}
            className={`filter-pill${(status ?? '') === f.value ? ' active' : ''}`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {(!invoices || invoices.length === 0) ? (
          <div className="empty-state">
            <p>Aucune facture.</p>
            <Link href="/factures/new" className="btn-primary">Créer une facture</Link>
          </div>
        ) : (
          <table className="inv-table">
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Client</th>
                <th>Date</th>
                <th>Échéance</th>
                <th>Statut</th>
                <th className="r">Montant</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv: any) => (
                <tr key={inv.id}>
                  <td>
                    <Link href={`/factures/${inv.id}`} className="td-num">{inv.invoice_number}</Link>
                  </td>
                  <td className="td-client">{(inv.inv_clients as any)?.name ?? '—'}</td>
                  <td className="td-date">{new Date(inv.issued_date).toLocaleDateString('fr-CA')}</td>
                  <td className="td-date">{inv.due_date ? new Date(inv.due_date).toLocaleDateString('fr-CA') : '—'}</td>
                  <td><StatusBadge status={inv.status} /></td>
                  <td className="td-amount">{fmt(invoiceTotal(inv))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppLayout>
  )
}
