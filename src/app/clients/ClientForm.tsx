'use client'

import { useState } from 'react'
import { createClientAction, updateClientAction, deleteClientAction } from '@/app/actions'
import Link from 'next/link'

interface Props {
  client?: {
    id: string
    name: string
    email: string | null
    phone: string | null
    address: string | null
    city: string | null
    postal_code: string | null
    country: string | null
    notes: string | null
  }
}

export default function ClientForm({ client }: Props) {
  const [error, setError]     = useState('')
  const [pending, setPending] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const isEdit = !!client

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setPending(true)
    const fd = new FormData(e.currentTarget)
    const res = isEdit
      ? await updateClientAction(client!.id, fd)
      : await createClientAction(fd)
    if (res && 'error' in res) { setError(res.error as string); setPending(false) }
  }

  async function handleDelete() {
    if (!confirm('Supprimer ce client ? Cette action est irréversible.')) return
    setDeleting(true)
    await deleteClientAction(client!.id)
  }

  const def = client ?? {}

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href="/clients" className="text-slate-500 hover:text-slate-300">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-white">{isEdit ? client!.name : 'Nouveau client'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div>
          <label className="label">Nom *</label>
          <input name="name" defaultValue={(def as any).name ?? ''} required className="input" placeholder="Nom du client ou de l'entreprise" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Courriel</label>
            <input name="email" type="email" defaultValue={(def as any).email ?? ''} className="input" placeholder="contact@exemple.com" />
          </div>
          <div>
            <label className="label">Téléphone</label>
            <input name="phone" defaultValue={(def as any).phone ?? ''} className="input" placeholder="514 000-0000" />
          </div>
        </div>

        <div>
          <label className="label">Adresse</label>
          <input name="address" defaultValue={(def as any).address ?? ''} className="input" placeholder="123, rue Principale" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="label">Ville</label>
            <input name="city" defaultValue={(def as any).city ?? ''} className="input" placeholder="Montréal" />
          </div>
          <div>
            <label className="label">Code postal</label>
            <input name="postal_code" defaultValue={(def as any).postal_code ?? ''} className="input" placeholder="H0H 0H0" />
          </div>
        </div>

        <div>
          <label className="label">Pays</label>
          <input name="country" defaultValue={(def as any).country ?? 'Canada'} className="input" />
        </div>

        <div>
          <label className="label">Notes internes</label>
          <textarea name="notes" defaultValue={(def as any).notes ?? ''} rows={3} className="input resize-none" placeholder="Notes optionnelles…" />
        </div>

        {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex items-center gap-3 pt-2">
          {isEdit && (
            <button type="button" onClick={handleDelete} disabled={deleting} className="btn-danger">
              {deleting ? 'Suppression...' : 'Supprimer'}
            </button>
          )}
          <button type="submit" disabled={pending} className="btn-primary ml-auto">
            {pending ? 'Enregistrement...' : isEdit ? 'Enregistrer' : 'Créer le client'}
          </button>
        </div>
      </form>
    </div>
  )
}
