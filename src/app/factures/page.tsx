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
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-black tracking-tight text-white uppercase">Factures</h1>
        <Link href="/factures/new" className="btn-primary">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nouvelle facture
        </Link>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 mb-5">
        {filters.map(f => (
          <Link
            key={f.value}
            href={f.value ? `/factures?status=${f.value}` : '/factures'}
            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
              (status ?? '') === f.value
                ? 'bg-white text-black'
                : 'bg-[#1a1a1a] text-[#555] hover:text-white'
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {(!invoices || invoices.length === 0) ? (
          <div className="text-center py-16">
            <p className="text-[#333] text-sm mb-4">Aucune facture.</p>
            <Link href="/factures/new" className="btn-primary">Créer une facture</Link>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1a1a1a]">
                    {['Numéro', 'Client', 'Date', 'Échéance', 'Statut', 'Montant'].map((h, i) => (
                      <th key={h} className={`px-6 py-4 text-[0.6rem] font-bold uppercase tracking-widest text-[#444] ${i === 5 ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv: any, i: number) => (
                    <tr
                      key={inv.id}
                      className={`hover:bg-[#161616] transition-colors ${i < invoices.length - 1 ? 'border-b border-[#1a1a1a]' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <Link href={`/factures/${inv.id}`} className="text-sm font-bold text-white hover:text-[#a3e635] transition-colors">
                          {inv.invoice_number}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#888]">{(inv.inv_clients as any)?.name ?? '—'}</td>
                      <td className="px-6 py-4 text-sm text-[#555]">{new Date(inv.issued_date).toLocaleDateString('fr-CA')}</td>
                      <td className="px-6 py-4 text-sm text-[#555]">{inv.due_date ? new Date(inv.due_date).toLocaleDateString('fr-CA') : '—'}</td>
                      <td className="px-6 py-4"><StatusBadge status={inv.status} /></td>
                      <td className="px-6 py-4 text-right text-sm font-black text-white">{fmt(invoiceTotal(inv))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="sm:hidden">
              {invoices.map((inv: any, i: number) => (
                <Link
                  key={inv.id}
                  href={`/factures/${inv.id}`}
                  className={`flex items-center justify-between px-5 py-4 hover:bg-[#161616] transition-colors ${i < invoices.length - 1 ? 'border-b border-[#1a1a1a]' : ''}`}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge status={inv.status} />
                      <span className="font-bold text-white text-sm">{inv.invoice_number}</span>
                    </div>
                    <p className="text-xs text-[#444]">{(inv.inv_clients as any)?.name ?? '—'} · {new Date(inv.issued_date).toLocaleDateString('fr-CA')}</p>
                  </div>
                  <p className="font-black text-white text-sm flex-shrink-0 ml-4">{fmt(invoiceTotal(inv))}</p>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}
