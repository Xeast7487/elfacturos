import Nav from './Nav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Nav />
      <main className="flex-1 p-5 md:p-8 pb-24 md:pb-8 max-w-6xl">
        {children}
      </main>
    </div>
  )
}
