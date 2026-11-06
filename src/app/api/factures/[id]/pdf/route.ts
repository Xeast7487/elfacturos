import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase-server'
import { InvoicePDF } from '@/components/InvoicePDF'
import React from 'react'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Non autorisé', { status: 401 })

  const { data: inv } = await supabase
    .from('inv_invoices')
    .select('*, inv_clients(name, email, phone, address, city, postal_code, country), inv_items(description, quantity, unit_price, position)')
    .eq('id', id).eq('user_id', user.id)
    .single()

  if (!inv) return new Response('Facture introuvable', { status: 404 })

  const items = [...((inv.inv_items as any[]) ?? [])].sort((a, b) => a.position - b.position)
  const client = inv.inv_clients as any ?? null

  const invoiceData = {
    invoice_number: inv.invoice_number,
    status:         inv.status,
    issued_date:    inv.issued_date,
    due_date:       inv.due_date,
    notes:          inv.notes,
    tax_rate:       inv.tax_rate ?? 0,
    paid_at:        inv.paid_at,
    client: client ? {
      name:        client.name,
      email:       client.email,
      phone:       client.phone,
      address:     client.address,
      city:        client.city,
      postal_code: client.postal_code,
      country:     client.country,
    } : null,
    items: items.map((i: any) => ({
      description: i.description,
      quantity:    i.quantity,
      unit_price:  i.unit_price,
    })),
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(React.createElement(InvoicePDF, { invoice: invoiceData }) as any)

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${inv.invoice_number}.pdf"`,
    },
  })
}
