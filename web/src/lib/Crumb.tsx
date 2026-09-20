import { House } from 'lucide-react'

// Breadcrumb gaya dashboard: ikon Home, rata kanan atas.
export function Crumb({ page }: { page: string }) {
  return (
    <div className="opc-crumb-right">
      <nav className="opc-crumb" aria-label="Breadcrumb">
        <House aria-hidden="true" />
        <span>Home</span>
        <span aria-hidden="true">›</span>
        <span aria-current="page" className="text-foreground">{page}</span>
      </nav>
    </div>
  )
}
