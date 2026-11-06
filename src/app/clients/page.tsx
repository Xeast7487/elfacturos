export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AppLayout from '@/components/AppLayout'

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: clients } = await supabase
    .from('inv_clients')
    .select('id, name, email, phone, city')
    .eq('user_id', user.id)
    .order('name')

  return (
    <AppLayout>
      <div className="page-header">
        <h1 className="page-title">Clients</h1>
        <Link href="/clients/new" className="btn-primary">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nouveau client
        </Link>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {(!clients || clients.length === 0) ? (
          <div className="empty-state">
            <p>Aucun client pour l'instant.</p>
            <Link href="/clients/new" className="btn-primary">Ajouter un client</Link>
          </div>
        ) : (
          <div>
            {clients.map(c => (
              <Link key={c.id} href={`/clients/${c.id}`} className="list-row">
                <div className="list-row-left">
                  <div className="client-avatar">{c.name.charAt(0).toUpperCase()}</div>
                  <div>
                    <p className="row-title">{c.name}</p>
                    <p className="row-sub">
                      {[c.email, c.phone, c.city].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="chevron-right" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
