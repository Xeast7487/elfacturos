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
  const countSent     = invoices.filter(i => i.status === 'sent').length
  const countPaid     = invoices.filter(i => i.status === 'paid').length
  const recent        = invoices.slice(0, 8)

  const stats = [
    { label: 'Total facturé', value: fmt(totalInvoiced), sub: `${invoices.length} facture${invoices.length !== 1 ? 's' : ''}`, color: '#fff' },
    { label: 'En attente',    value: fmt(totalPending),  sub: `${countSent} envoyée${countSent !== 1 ? 's' : ''}`,             color: '#f97316' },
    { label: 'Reçu',         value: fmt(totalPaid),      sub: `${countPaid} payée${countPaid !== 1 ? 's' : ''}`,               color: '#a3e635' },
    { label: 'Clients',      value: String(clientCount), sub: 'actifs',                                                          color: '#fff' },
  ]

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-black tracking-tight text-white uppercase">Tableau de bord</h1>
        <Link href="/factures/new" className="btn-primary">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nouvelle facture
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map(stat => (
          <div key={stat.label} className="card p-5">
            <p className="text-[0.65rem] font-bold uppercase tracking-widest text-[#555] mb-3">{stat.label}</p>
            <p className="font-black text-2xl leading-none mb-1.5" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-xs text-[#444]">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Recent invoices */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a1a1a]">
          <p className="text-[0.65rem] font-bold uppercase tracking-widest text-[#555]">Factures récentes</p>
          <Link href="/factures" className="text-xs font-semibold text-[#555] hover:text-white transition-colors">
            Voir tout →
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[#333] text-sm mb-4">Aucune facture pour l'instant.</p>
            <Link href="/factures/new" className="btn-primary">Créer une facture</Link>
          </div>
        ) : (
          <div>
            {recent.map((inv: any, i: number) => (
              <Link
                key={inv.id}
                href={`/factures/${inv.id}`}
                className={`flex items-center justify-between px-6 py-4 hover:bg-[#161616] transition-colors ${i < recent.length - 1 ? 'border-b border-[#1a1a1a]' : ''}`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <StatusBadge status={inv.status} />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white">{inv.invoice_number}</p>
                    <p className="text-xs text-[#444] truncate mt-0.5">{inv.inv_clients?.name ?? '—'}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="text-sm font-black text-white">{fmt(invoiceTotal(inv))}</p>
                  <p className="text-xs text-[#444] mt-0.5">
                    {new Date(inv.issued_date).toLocaleDateString('fr-CA')}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
