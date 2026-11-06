'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// ─── Clients ──────────────────────────────────────────────────────────────────

export async function createClientAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const name   = (formData.get('name') as string).trim()
  const email  = (formData.get('email') as string | null)?.trim() || null
  const phone  = (formData.get('phone') as string | null)?.trim() || null
  const address  = (formData.get('address') as string | null)?.trim() || null
  const city     = (formData.get('city') as string | null)?.trim() || null
  const postal   = (formData.get('postal_code') as string | null)?.trim() || null
  const country  = (formData.get('country') as string | null)?.trim() || 'Canada'
  const notes    = (formData.get('notes') as string | null)?.trim() || null

  if (!name) return { error: 'Le nom est obligatoire' }

  const { data, error } = await supabase.from('inv_clients').insert({
    user_id: user.id, name, email, phone, address, city, postal_code: postal, country, notes,
  }).select('id').single()

  if (error) return { error: error.message }
  revalidatePath('/clients')
  redirect(`/clients/${data.id}`)
}

export async function updateClientAction(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const name   = (formData.get('name') as string).trim()
  const email  = (formData.get('email') as string | null)?.trim() || null
  const phone  = (formData.get('phone') as string | null)?.trim() || null
  const address  = (formData.get('address') as string | null)?.trim() || null
  const city     = (formData.get('city') as string | null)?.trim() || null
  const postal   = (formData.get('postal_code') as string | null)?.trim() || null
  const country  = (formData.get('country') as string | null)?.trim() || 'Canada'
  const notes    = (formData.get('notes') as string | null)?.trim() || null

  const { error } = await supabase.from('inv_clients')
    .update({ name, email, phone, address, city, postal_code: postal, country, notes })
    .eq('id', id).eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/clients')
  revalidatePath(`/clients/${id}`)
  return { success: true }
}

export async function deleteClientAction(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase.from('inv_clients').delete().eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/clients')
  redirect('/clients')
}

// ─── Invoices ─────────────────────────────────────────────────────────────────

export async function createInvoiceAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const clientId   = formData.get('client_id') as string | null
  const issuedDate = formData.get('issued_date') as string
  const dueDate    = (formData.get('due_date') as string | null) || null
  const notes      = (formData.get('notes') as string | null)?.trim() || null
  const taxRate    = parseFloat(formData.get('tax_rate') as string) || 0
  const status     = (formData.get('status') as string) || 'draft'

  // Parse line items from JSON
  const itemsJson = formData.get('items') as string
  let items: { description: string; quantity: number; unit_price: number }[] = []
  try { items = JSON.parse(itemsJson) } catch {}

  if (!items.length) return { error: 'Ajoutez au moins une ligne.' }

  // Get next invoice number
  const { data: numData } = await supabase.rpc('next_invoice_number', { p_user_id: user.id })
  const invoiceNumber = numData ?? `FAC-${new Date().getFullYear()}-001`

  const { data: inv, error: invErr } = await supabase.from('inv_invoices').insert({
    user_id: user.id,
    invoice_number: invoiceNumber,
    client_id: clientId || null,
    issued_date: issuedDate,
    due_date: dueDate,
    notes,
    tax_rate: taxRate,
    status,
  }).select('id').single()

  if (invErr) return { error: invErr.message }

  const { error: itemsErr } = await supabase.from('inv_items').insert(
    items.map((item, i) => ({
      invoice_id: inv.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      position: i,
    }))
  )

  if (itemsErr) return { error: itemsErr.message }

  revalidatePath('/factures')
  redirect(`/factures/${inv.id}`)
}

export async function updateInvoiceAction(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const clientId   = formData.get('client_id') as string | null
  const issuedDate = formData.get('issued_date') as string
  const dueDate    = (formData.get('due_date') as string | null) || null
  const notes      = (formData.get('notes') as string | null)?.trim() || null
  const taxRate    = parseFloat(formData.get('tax_rate') as string) || 0
  const status     = formData.get('status') as string

  const itemsJson = formData.get('items') as string
  let items: { description: string; quantity: number; unit_price: number }[] = []
  try { items = JSON.parse(itemsJson) } catch {}

  if (!items.length) return { error: 'Ajoutez au moins une ligne.' }

  const { error: invErr } = await supabase.from('inv_invoices')
    .update({ client_id: clientId || null, issued_date: issuedDate, due_date: dueDate, notes, tax_rate: taxRate, status })
    .eq('id', id).eq('user_id', user.id)

  if (invErr) return { error: invErr.message }

  // Replace all items
  await supabase.from('inv_items').delete().eq('invoice_id', id)
  await supabase.from('inv_items').insert(
    items.map((item, i) => ({
      invoice_id: id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      position: i,
    }))
  )

  revalidatePath('/factures')
  revalidatePath(`/factures/${id}`)
  return { success: true }
}

export async function markInvoicePaidAction(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase.from('inv_invoices')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', id).eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/factures')
  revalidatePath(`/factures/${id}`)
  return { success: true }
}

export async function markInvoiceSentAction(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase.from('inv_invoices')
    .update({ status: 'sent' })
    .eq('id', id).eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/factures')
  revalidatePath(`/factures/${id}`)
  return { success: true }
}

export async function deleteInvoiceAction(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase.from('inv_invoices').delete().eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/factures')
  redirect('/factures')
}
