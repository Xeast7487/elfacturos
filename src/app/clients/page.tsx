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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Clients</h1>
          <Link href="/clients/new" className="btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nouveau client
          </Link>
        </div>

        <div className="card overflow-hidden">
          {(!clients || clients.length === 0) ? (
            <div className="text-center py-16 text-slate-500">
              <svg className="mx-auto mb-3 opacity-30" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <p className="text-sm">Aucun client pour l'instant.</p>
              <Link href="/clients/new" className="btn-primary mt-4 inline-flex">Ajouter un client</Link>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {clients.map(c => (
                <Link
                  key={c.id}
                  href={`/clients/${c.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-white/3 transition-colors"
                >
                  <div>
                    <p className="font-semibold text-white">{c.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {c.email && <span className="text-xs text-slate-500">{c.email}</span>}
                      {c.phone && <span className="text-xs text-slate-500">{c.phone}</span>}
                      {c.city  && <span className="text-xs text-slate-500">{c.city}</span>}
                    </div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-600" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
