// Dashboard — Operate surface. Compact POS overview: KPI → analytics → activity.
// Same Card/Button/Badge/Chart/Td/Th tokens as the rest of the app; no new identity.
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { BarChart3, CalendarDays, House, Package, ReceiptText, ShoppingBag, Store, TriangleAlert } from 'lucide-react'
import { apiGetDashboard, apiListTransactions, type DashboardAdmin, type Trx } from './mock-api'
import { useCache } from '../lib/cache'
import { fmtDate, fmtRp, fmtShort, fmtTime, useDB } from '../lib/store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, XAxis, YAxis } from 'recharts'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { Td, Th } from '../lib/ui'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

const salesConfig = {
  omzet: { label: 'Penjualan', color: 'var(--chart-1)' },
} as const

const payConfig = {
  Cash: { label: 'Cash', color: 'var(--chart-1)' },
  'Bank Transfer': { label: 'Bank Transfer', color: 'var(--chart-2)' },
  QRIS: { label: 'QRIS', color: 'var(--chart-3)' },
  'E-Wallet': { label: 'E-Wallet', color: 'var(--chart-4)' },
  Card: { label: 'Card', color: 'var(--chart-5)' },
} as const

function dayLabel(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (!m) return iso
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]}`
}

export default function Dashboard() {
  const db = useDB()
  const s = db.session!
  // Animasi chart hidup hanya saat mount; refresh data tak me-restartnya.
  const [animate, setAnimate] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setAnimate(false), 900)
    return () => clearTimeout(t)
  }, [])
  // Kunci sesi pemilik data: key cache memisahkan admin vs kasir.
  const sessionKey = `${s.id}:${s.role}`
  const dash = useCache(`dash:${sessionKey}`, apiGetDashboard, 'Gagal memuat dashboard.')
  const recent = useCache(`recent5:${sessionKey}`, () => apiListTransactions({ limit: 5 }))
  const data = dash.data
  const err = dash.err
  const recentTrx = recent.data ? recent.data.items : recent.err ? [] : null

  const isAdmin = s.role === 'admin'
  if (err && !data) return <p className="rounded-lg bg-sand px-3.5 py-2.5 text-[13px] text-ember">{err}</p>
  if (!data || data.role !== s.role) return <DashboardSkeleton admin={isAdmin} />

  const today = data.today
  const admin = data as DashboardAdmin
  // sales7 backend = 7 tanggal berjalan; label dari tanggal asli (bukan index).
  const sales7 = isAdmin
    ? admin.sales7.map((d) => ({ label: dayLabel(d.date), omzet: d.omzet }))
    : []
  const payData = isAdmin
    ? (Object.entries(payConfig) as [keyof typeof payConfig, (typeof payConfig)[keyof typeof payConfig]][])
        .map(([name, cfg]) => ({ name, total: admin.methods.find((m) => m.method === name)?.total ?? 0, fill: cfg.color }))
        .filter((d) => d.total > 0)
    : []
  const payTotal = payData.reduce((n, d) => n + d.total, 0)
  const topProducts = isAdmin ? admin.top_products.slice(0, 5) : []

  const kpis = [
    { label: 'Omzet Hari Ini', value: fmtRp(today.omzet), icon: ShoppingBag, href: '/redesign/laporan' },
    { label: 'Transaksi Hari Ini', value: String(today.trx_count), icon: ReceiptText, href: '/redesign/transaksi' },
    { label: 'Produk Terjual', value: String(today.items_sold), icon: Package, href: '/redesign/laporan' },
    ...(isAdmin
      ? [{
          label: 'Stok Menipis',
          value: String(admin.today.low_stock ?? 0),
          icon: TriangleAlert,
          href: '/redesign/stok',
        }]
      : []),
  ]

  if (!isAdmin) {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Halo, {s.name}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {today.trx_count > 0
                ? `${today.trx_count} transaksi hari ini dengan omzet ${fmtRp(today.omzet)}.`
                : 'Belum ada transaksi hari ini.'}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">{fmtDate(new Date().toISOString())}</p>
        </div>

        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="flex items-center gap-3">
              <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-[color-mix(in_oklch,var(--chart-omzet)_12%,transparent)]">
                <Store className="size-5 text-[var(--chart-omzet)]" />
              </div>
              <div>
                <p className="text-sm font-medium">Kasir siap</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Mulai transaksi baru untuk pelanggan.</p>
              </div>
            </div>
            <Button size="lg" render={<Link to="/redesign/pos" />}>Buka POS</Button>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-3">
          {kpis.map((k) => (
            <KpiCard key={k.label} label={k.label} value={k.value} icon={k.icon} />
          ))}
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="opc-panel-head">
              <span className="opc-panel-ico" aria-hidden="true"><ReceiptText /></span>
              <div>
                <CardTitle>Transaksi Saya</CardTitle>
                <CardDescription>Transaksi terbaru hari ini</CardDescription>
              </div>
            </div>
            <Link to="/redesign/transaksi" className="opc-btn-sm">
              Lihat semua
            </Link>
          </CardHeader>
          <CardContent>
            {recentTrx === null ? (
              <RecentSkeleton rows={3} />
            ) : recentTrx.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">Belum ada transaksi. Mulai dari POS Kasir.</p>
                <Button className="mt-4" render={<Link to="/redesign/pos" />}>Buka POS</Button>
              </div>
            ) : (
              <RecentTable items={recentTrx} showCashier={false} />
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1>Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Pantau aktivitas dan performa toko Anda hari ini</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <nav className="opc-crumb" aria-label="Breadcrumb">
            <House aria-hidden="true" />
            <span>Home</span>
            <span aria-hidden="true">›</span>
            <span aria-current="page" className="text-foreground">Dashboard</span>
          </nav>
          <span className="opc-datechip">
            <CalendarDays aria-hidden="true" />
            {fmtDate(new Date().toISOString())}
          </span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <KpiCard key={k.label} label={k.label} value={k.value} icon={k.icon} href={k.href} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <div className="opc-panel-head">
              <span className="opc-panel-ico" aria-hidden="true"><BarChart3 /></span>
              <div>
                <CardTitle>Penjualan</CardTitle>
                <CardDescription>7 hari terakhir</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={salesConfig} className="h-56 w-full [&_:focus]:outline-none">
              <BarChart data={sales7} margin={{ top: 16, right: 8, bottom: 0, left: 8 }} barCategoryGap="30%">
                <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="color-mix(in oklch, var(--foreground) 18%, transparent)" />
                <XAxis dataKey="label" interval="preserveStartEnd" minTickGap={16} tickLine={false} axisLine={false} tickMargin={10} tick={{ fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} width={44} domain={[0, 'auto']} tickFormatter={(v: number) => fmtShort(v)} tick={{ fontSize: 11 }} className="font-mono text-xs" />
                <ChartTooltip cursor={false} content={<ChartTooltipContent formatter={(v) => fmtRp(Number(v))} />} />
                <Bar dataKey="omzet" fill="var(--color-omzet)" radius={[6, 6, 0, 0]} maxBarSize={38} isAnimationActive={animate} animationDuration={650} animationEasing="ease-out">
                  <LabelList dataKey="omzet" position="top" formatter={(v) => fmtShort(Number(v))} fontSize={11} className="fill-muted-foreground" />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="opc-panel-head">
              <span className="opc-panel-ico" aria-hidden="true"><Package /></span>
              <div>
                <CardTitle>Metode Pembayaran</CardTitle>
                <CardDescription>Total pembayaran hari ini</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {payData.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">Belum ada transaksi hari ini.</p>
            ) : (
              <div className="flex flex-col items-center gap-4 min-[420px]:flex-row min-[420px]:gap-5">
                <ChartContainer config={{}} className="relative h-44 w-full max-w-48 shrink-0">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent formatter={(v) => fmtRp(Number(v))} hideLabel />} />
                    <Pie data={payData} dataKey="total" nameKey="name" innerRadius={52} outerRadius={74} paddingAngle={3} strokeWidth={0} isAnimationActive={animate} animationDuration={650} animationEasing="ease-out">
                      {payData.map((d) => (
                        <Cell key={d.name} fill={d.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                  <div className="pointer-events-none absolute inset-0 grid place-items-center">
                    <div className="text-center">
                      <p className="text-sm font-semibold tabular-nums tracking-tight">{fmtShort(payTotal)}</p>
                      <p className="text-[11px] text-muted-foreground">Total Omzet</p>
                    </div>
                  </div>
                </ChartContainer>
                <div className="w-full min-w-0 flex-1 space-y-2.5 text-[13px]">
                  {payData.map((d) => (
                    <div key={d.name} className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="size-2.5 shrink-0 rounded-full" style={{ background: d.fill }} />
                        <span className="leading-snug">{d.name}</span>
                      </span>
                      <span className="shrink-0 font-medium tabular-nums">
                        {payTotal > 0 ? Math.round((d.total / payTotal) * 100) : 0}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="opc-panel-head">
              <span className="opc-panel-ico" aria-hidden="true"><ReceiptText /></span>
              <div>
                <CardTitle>Transaksi Terbaru</CardTitle>
                <CardDescription>Transaksi terbaru hari ini</CardDescription>
              </div>
            </div>
            <Link to="/redesign/transaksi" className="opc-btn-sm">
              Lihat semua
            </Link>
          </CardHeader>
          <CardContent>
            {recentTrx === null ? (
              <RecentSkeleton rows={5} />
            ) : recentTrx.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Belum ada transaksi. Transaksi yang masuk hari ini akan muncul di sini.
              </p>
            ) : (
              <RecentTable items={recentTrx} showCashier />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="opc-panel-head">
              <span className="opc-panel-ico" aria-hidden="true"><Package /></span>
              <div>
                <CardTitle>Produk Terlaris</CardTitle>
                <CardDescription>Penjualan tertinggi hari ini</CardDescription>
              </div>
            </div>
            <Link to="/redesign/laporan" className="opc-btn-sm">
              Lihat semua
            </Link>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">Belum ada penjualan hari ini.</p>
            ) : (
              <div>
                {topProducts.map((p, i) => (
                  <div key={p.product_id} className="opc-rank">
                    <span className="opc-rank-num">{String(i + 1).padStart(2, '0')}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">{p.qty} terjual</p>
                    </div>
                    <span className="shrink-0 text-sm font-medium tabular-nums">{fmtRp(p.revenue)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {admin.today.trx_count === 0 && (
        <Empty>
          <EmptyContent>
            <EmptyTitle>Belum ada transaksi hari ini</EmptyTitle>
            <EmptyDescription>
              Buka menu POS Kasir untuk memulai transaksi pertama, atau cek produk Anda sudah siap dijual.
            </EmptyDescription>
            <Button render={<Link to="/redesign/pos" />}>Buka POS Kasir</Button>
          </EmptyContent>
        </Empty>
      )}
    </div>
  )
}

// KPI satu surface + footer "Lihat detail" menyatu (§13). Tanpa warna-warni.
function KpiCard({ label, value, icon: Icon, href }: {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  href?: string
}) {
  return (
    <Card className="opc-kpi">
      <div className="opc-kpi-body">
        <span className="opc-kpi-ico" aria-hidden="true">
          <Icon />
        </span>
        <div className="min-w-0">
          <p className="opc-kpi-val tabular-nums">{value}</p>
          <p className="opc-kpi-label">{label}</p>
        </div>
      </div>
      {href && (
        <Link to={href} className="opc-kpi-foot">
          Lihat detail <span aria-hidden="true">&nbsp;→</span>
        </Link>
      )}
    </Card>
  )
}

function RecentTable({ items, showCashier }: { items: Trx[]; showCashier: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <Th>Waktu</Th><Th>No. Invoice</Th>{showCashier && <Th>Kasir</Th>}<Th>Metode</Th><Th right>Total</Th><Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {items.map((t) => (
            <tr key={t.id}>
              <Td mono>{fmtDate(t.created_at)} {fmtTime(t.created_at)}</Td>
              <Td mono>#TRX-{String(t.id).padStart(5, '0')}</Td>
              {showCashier && <Td>{t.cashier_name}</Td>}
              <Td>{t.method}</Td>
              <Td right><span className="font-medium text-fg">{fmtRp(t.total)}</span></Td>
              <Td><TrxBadge status={t.status} /></Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DashboardSkeleton({ admin }: { admin: boolean }) {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Memuat dashboard">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-4 w-24" />
      </div>

      {!admin && (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="flex items-center gap-3">
              <Skeleton className="size-11 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <Skeleton className="h-12 w-32 rounded-full" />
          </CardContent>
        </Card>
      )}

      <div className={`grid gap-4 ${admin ? 'sm:grid-cols-2 xl:grid-cols-4' : 'sm:grid-cols-3'}`}>
        {(admin ? [0, 1, 2, 3] : [0, 1, 2]).map((i) => (
          <Card key={i}>
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="size-9 rounded-lg" />
              </div>
              <Skeleton className="h-7 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {admin && (
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-28" />
            </CardHeader>
            <CardContent>
              <div className="flex h-56 items-end gap-3" aria-hidden="true">
                {[42, 68, 52, 84, 60, 76, 48].map((h, i) => (
                  <Skeleton key={i} className="flex-1 rounded-b-none rounded-t-md" style={{ height: `${h}%` }} />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-28" />
            </CardHeader>
            <CardContent>
              <Skeleton className="mx-auto size-36 rounded-full" />
              <div className="mt-4 space-y-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-10" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {admin ? (
        <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div className="space-y-2">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-8 w-24 rounded-md" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2" aria-hidden="true">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-11 w-full rounded-md" />
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-8 w-24 rounded-md" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4" aria-hidden="true">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex items-baseline gap-3">
                    <Skeleton className="h-4 w-6" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-8 w-24 rounded-md" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-11 w-full rounded-md" />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function RecentSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-11 w-full rounded-md" />
      ))}
    </div>
  )
}

function TrxBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    completed: { label: 'Selesai', className: 'bg-[var(--t-success-bg)] text-[var(--t-sprout)]' },
    pending: { label: 'Proses', className: 'bg-muted text-muted-foreground' },
    cancelled: { label: 'Dibatalkan', className: 'bg-muted text-muted-foreground' },
    refunded: { label: 'Refund', className: 'bg-[color-mix(in_oklch,var(--chart-5)_14%,transparent)] text-[var(--chart-5)]' },
  }
  const b = map[status] ?? { label: status, className: 'bg-muted text-muted-foreground' }
  return <Badge className={b.className}>{b.label}</Badge>
}
