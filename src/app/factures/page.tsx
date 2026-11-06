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
    { label: 'Toutes', value: '' },
    { label: 'Brouillons', value: 'draft' },
    { label: 'Envoyées', value: 'sent' },
    { label: 'Payées', value: 'paid' },
  ]

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Factures</h1>
          <Link href="/factures/new" className="btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nouvelle facture
          </Link>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl w-fit">
          {filters.map(f => (
            <Link
              key={f.value}
              href={f.value ? `/factures?status=${f.value}` : '/factures'}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                (status ?? '') === f.value
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>

        <div className="card overflow-hidden">
          {(!invoices || invoices.length === 0) ? (
            <div className="text-center py-16 text-slate-500">
              <svg className="mx-auto mb-3 opacity-30" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
              <p className="text-sm">Aucune facture.</p>
              <Link href="/factures/new" className="btn-primary mt-4 inline-flex">Créer une facture</Link>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/8 bg-white/3 text-left">
                      <th className="px-5 py-3 font-semibold text-slate-400">Numéro</th>
                      <th className="px-5 py-3 font-semibold text-slate-400">Client</th>
                      <th className="px-5 py-3 font-semibold text-slate-400">Date</th>
                      <th className="px-5 py-3 font-semibold text-slate-400">Échéance</th>
                      <th className="px-5 py-3 font-semibold text-slate-400">Statut</th>
                      <th className="px-5 py-3 font-semibold text-slate-400 text-right">Montant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {invoices.map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-white/3 transition-colors">
                        <td className="px-5 py-3.5">
                          <Link href={`/factures/${inv.id}`} className="font-semibold text-white hover:text-indigo-300 transition-colors">
                            {inv.invoice_number}
                          </Link>
                        </td>
                        <td className="px-5 py-3.5 text-slate-300">{(inv.inv_clients as any)?.name ?? '—'}</td>
                        <td className="px-5 py-3.5 text-slate-400">{new Date(inv.issued_date).toLocaleDateString('fr-CA')}</td>
                        <td className="px-5 py-3.5 text-slate-400">{inv.due_date ? new Date(inv.due_date).toLocaleDateString('fr-CA') : '—'}</td>
                        <td className="px-5 py-3.5"><StatusBadge status={inv.status} /></td>
                        <td className="px-5 py-3.5 text-right font-bold text-white">{fmt(invoiceTotal(inv))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="sm:hidden divide-y divide-white/5">
                {invoices.map((inv: any) => (
                  <Link key={inv.id} href={`/factures/${inv.id}`} className="flex items-center justify-between px-5 py-4 hover:bg-white/3 transition-colors">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <StatusBadge status={inv.status} />
                        <span className="font-semibold text-white text-sm">{inv.invoice_number}</span>
                      </div>
                      <p className="text-xs text-slate-500">{(inv.inv_clients as any)?.name ?? '—'} · {new Date(inv.issued_date).toLocaleDateString('fr-CA')}</p>
                    </div>
                    <p className="font-bold text-white text-sm flex-shrink-0 ml-4">{fmt(invoiceTotal(inv))}</p>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
