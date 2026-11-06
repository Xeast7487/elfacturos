export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import ClientForm from '../ClientForm'

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: client } = await supabase
    .from('inv_clients')
    .select('id, name, email, phone, address, city, postal_code, country, notes')
    .eq('id', id).eq('user_id', user.id)
    .single()

  if (!client) notFound()

  return (
    <AppLayout>
      <ClientForm client={client} />
    </AppLayout>
  )
}
