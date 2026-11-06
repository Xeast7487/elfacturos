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
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-black tracking-tight text-white uppercase">Clients</h1>
        <Link href="/clients/new" className="btn-primary">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nouveau client
        </Link>
      </div>

      <div className="card overflow-hidden">
        {(!clients || clients.length === 0) ? (
          <div className="text-center py-16">
            <p className="text-[#333] text-sm mb-4">Aucun client pour l'instant.</p>
            <Link href="/clients/new" className="btn-primary">Ajouter un client</Link>
          </div>
        ) : (
          <div>
            {clients.map((c, i) => (
              <Link
                key={c.id}
                href={`/clients/${c.id}`}
                className={`flex items-center justify-between px-6 py-4 hover:bg-[#161616] transition-colors ${i < clients.length - 1 ? 'border-b border-[#1a1a1a]' : ''}`}
              >
                <div className="flex items-center gap-4">
                  {/* Avatar initial */}
                  <div className="w-9 h-9 rounded-xl bg-[#1a1a1a] flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-[#555]">{c.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">{c.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {c.email && <span className="text-xs text-[#444]">{c.email}</span>}
                      {c.phone && <span className="text-xs text-[#444]">{c.phone}</span>}
                      {c.city  && <span className="text-xs text-[#333]">{c.city}</span>}
                    </div>
                  </div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#333]" strokeLinecap="round" strokeLinejoin="round">
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
