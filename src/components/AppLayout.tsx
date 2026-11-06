import Nav from './Nav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-wrap">
      <Nav />
      <main className="app-main">
        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  )
}
