import type { ReactNode } from 'react'
import { Crumb } from './Crumb'

// Pola header persis Dashboard: judul + sub kiri, breadcrumb + aksi kanan.
export function PageHeader({ title, sub, crumb, actions }: {
  title: string
  sub?: ReactNode
  crumb: string
  actions?: ReactNode
}) {
  return (
    <div className="opc-pagehead">
      <div className="min-w-0">
        <h1>{title}</h1>
        {sub && <p className="opc-pagesub">{sub}</p>}
      </div>
      <div className="opc-pagehead-right">
        <Crumb page={crumb} />
        {actions}
      </div>
    </div>
  )
}
