export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import AppLayout from '@/components/AppLayout'
import InvoiceForm from '../../InvoiceForm'

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [invRes, clientsRes] = await Promise.all([
    supabase.from('inv_invoices')
      .select('*, inv_items(description, quantity, unit_price, position)')
      .eq('id', id).eq('user_id', user.id)
      .single(),
    supabase.from('inv_clients').select('id, name').eq('user_id', user.id).order('name'),
  ])

  if (!invRes.data) notFound()
  const inv = invRes.data as any

  const sortedItems = [...(inv.inv_items ?? [])].sort((a: any, b: any) => a.position - b.position)

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href={`/factures/${id}`} className="text-slate-500 hover:text-slate-300">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-white">Modifier {inv.invoice_number}</h1>
        </div>
        <InvoiceForm
          clients={clientsRes.data ?? []}
          invoice={{
            id,
            client_id:   inv.client_id,
            issued_date: inv.issued_date,
            due_date:    inv.due_date,
            notes:       inv.notes,
            tax_rate:    inv.tax_rate ?? 0,
            status:      inv.status,
            items:       sortedItems,
          }}
        />
      </div>
    </AppLayout>
  )
}
