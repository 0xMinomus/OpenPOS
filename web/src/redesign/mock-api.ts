// Mock API sandbox /demo. Nama fungsi + bentuk return SAMA PERSIS
// dengan lib/api.ts agar salinan halaman cloud jalan tanpa ubah selain
// import. Data hidup di memori (fixtures.ts) sehingga checkout, CRUD,
// refund, dan baca notif terasa interaktif. Reset via resetSandbox().
import type {
  ActivityItem, Category, DashboardAdmin, DashboardCashier, Movement,
  NotifCategory, Notification, Page, PayMethod, Product, ProductFilter, ReportBundle,
  Role, StoreHours, StoreSettings, Trx, TrxItem, User,
} from '../lib/api'

export { ApiError, fetchAll, getCachedAccounts, hasToken, setCachedAccounts } from '../lib/api'
export type {
  ActivityItem, Category, DashboardAdmin, DashboardCashier, Movement,
  NotifCategory, Notification, Page, PayMethod, Product, ProductFilter, ReportBundle,
  Role, StoreHours, StoreSettings, Trx, TrxItem, User,
}

import { ApiError } from '../lib/api'
import { buildDB, type SandboxDB } from './fixtures'

let db: SandboxDB = buildDB()

// Kembalikan data awal (dipakai tombol reset di splash sandbox).
export function resetSandbox() {
  db = buildDB()
}

const wait = (ms = 120) => new Promise<void>((r) => setTimeout(r, ms))

function localDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function paginate<T>(items: T[], page = 1, limit = 20): Page<T> {
  const p = Math.max(1, page)
  const l = Math.max(1, limit)
  return { items: items.slice((p - 1) * l, p * l), total: items.length, page: p, limit: l }
}

function authed(): User {
  return db.users[0]
}

// ── dashboard & laporan ────────────────────────────────────────────

// date = hari lokal 'YYYY-MM-DD' (default hari ini). KPI/metode/top/transaksi
// terbaru dihitung untuk hari itu; sales7 = 7 hari berjalan berakhir di hari
// itu. Divergensi sandbox vs lib/api: param date (kontrak live:
// docs/API-CONTRACT-DASHBOARD-DATE.md).
export async function apiGetDashboard(date?: string): Promise<DashboardAdmin | DashboardCashier> {
  await wait()
  const ref = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : localDay(new Date())
  const base = new Date(`${ref}T12:00:00`)
  const done = db.trx.filter((t) => t.status === 'completed')
  const t0 = done.filter((t) => localDay(new Date(t.created_at)) === ref)
  const sales7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base)
    d.setDate(base.getDate() - (6 - i))
    const key = localDay(d)
    return {
      date: key,
      omzet: done.filter((t) => localDay(new Date(t.created_at)) === key).reduce((n, t) => n + t.total, 0),
    }
  })
  const byMethod = new Map<string, number>()
  for (const t of t0) byMethod.set(t.method, (byMethod.get(t.method) ?? 0) + t.total)
  const top = new Map<string, { name: string; qty: number; revenue: number }>()
  for (const t of t0) {
    for (const it of t.items) {
      const cur = top.get(it.product_id) ?? { name: it.name, qty: 0, revenue: 0 }
      cur.qty += it.qty
      cur.revenue += it.qty * it.price
      top.set(it.product_id, cur)
    }
  }
  const recent = [...db.trx]
    .filter((t) => localDay(new Date(t.created_at)) === ref)
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
    .slice(0, 5)
    .map((t) => ({ id: t.id, cashier_name: t.cashier_name, total: t.total, status: t.status, time: t.created_at }))
  return {
    role: 'admin',
    today: {
      omzet: t0.reduce((n, t) => n + t.total, 0),
      trx_count: t0.length,
      items_sold: t0.reduce((n, t) => n + t.items.reduce((m, i) => m + i.qty, 0), 0),
      low_stock: db.products.filter((p) => p.active && p.stock <= 3).length,
    },
    sales7,
    methods: [...byMethod].map(([method, total]) => ({ method, total })),
    top_products: [...top]
      .map(([product_id, v]) => ({ product_id, ...v }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5),
    recent,
  }
}

// date = jangkar hari lokal 'YYYY-MM-DD' (opsional). Bila diisi, period
// 'today' = hari itu 00:00–23:59 (data terakhir jam 23.59) dan 'yesterday' =
// H-1-nya; period lain mengabaikan date. Kontrak live:
// docs/API-CONTRACT-DASHBOARD-DATE.md §Laporan & Karyawan.
export async function apiGetReport(period = 'all', date?: string): Promise<ReportBundle> {
  await wait()
  const anchor = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T12:00:00`) : new Date()
  const now = new Date()
  const start = new Date(now)
  let end: Date | null = null
  if (period === 'today' || period === 'yesterday') {
    start.setTime(anchor.getTime())
    if (period === 'yesterday') start.setDate(start.getDate() - 1)
    start.setHours(0, 0, 0, 0)
    // Batas atas hari itu 23:59 — transaksi setelahnya tak ikut.
    end = new Date(start)
    end.setHours(23, 59, 59, 999)
  }
  else if (period === 'week') start.setDate(start.getDate() - 7)
  else if (period === 'month') start.setMonth(start.getMonth() - 1)
  else start.setFullYear(2000)
  const inRange = db.trx.filter((t) => {
    const c = new Date(t.created_at)
    return c >= start && (end === null || c <= end)
  })
  const done = inRange.filter((t) => t.status === 'completed')
  const omzet = done.reduce((n, t) => n + t.total, 0)
  const byMethod = new Map<string, number>()
  for (const t of done) byMethod.set(t.method, (byMethod.get(t.method) ?? 0) + t.total)
  const byStatus = new Map<string, number>()
  for (const t of inRange) byStatus.set(t.status, (byStatus.get(t.status) ?? 0) + 1)
  const prod = new Map<string, { name: string; sku: string; qty: number; revenue: number; profit: number }>()
  for (const t of done) {
    for (const it of t.items) {
      const p = db.products.find((x) => x.id === it.product_id)
      const cur = prod.get(it.product_id) ?? { name: it.name, sku: p?.sku ?? '-', qty: 0, revenue: 0, profit: 0 }
      cur.qty += it.qty
      cur.revenue += it.qty * it.price
      cur.profit += it.qty * (it.price - it.buy_price)
      prod.set(it.product_id, cur)
    }
  }
  return {
    period,
    summary: {
      omzet,
      trx_count: done.length,
      items_sold: done.reduce((n, t) => n + t.items.reduce((m, i) => m + i.qty, 0), 0),
      gross_profit: [...prod.values()].reduce((n, p) => n + p.profit, 0),
    },
    by_method: [...byMethod].map(([method, total]) => ({ method, total })),
    by_status: [...byStatus].map(([status, count]) => ({ status, count })),
    products: [...prod].map(([product_id, v]) => ({ product_id, ...v })),
    transactions: inRange.map((t) => ({
      date: localDay(new Date(t.created_at)),
      id: t.id,
      cashier: t.cashier_name,
      method: t.method,
      total: t.total,
      hpp: t.items.reduce((n, i) => n + i.qty * i.buy_price, 0),
      profit: t.total - t.tax - t.items.reduce((n, i) => n + i.qty * i.buy_price, 0),
      status: t.status,
    })),
    stock: db.products.map((p) => ({
      name: p.name, sku: p.sku, stock: p.stock, buy_price: p.buy_price,
      sell_price: p.sell_price, stock_value: p.stock * p.buy_price,
    })),
  }
}

// ── transaksi ──────────────────────────────────────────────────────

export async function apiListTransactions(f: { q?: string; method?: string; date?: string; page?: number; limit?: number } = {}) {
  await wait()
  let items = [...db.trx].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
  if (f.q) {
    const q = f.q.toLowerCase()
    items = items.filter((t) => t.id.toLowerCase().includes(q) || t.cashier_name.toLowerCase().includes(q))
  }
  if (f.method) items = items.filter((t) => t.method === f.method)
  if (f.date) items = items.filter((t) => localDay(new Date(t.created_at)) === f.date)
  return paginate(items, f.page, f.limit)
}

export async function apiCheckout(body: {
  items: { productId: string; qty: number }[]
  discount?: number
  method: string
  paid?: number
  customer?: string
}) {
  await wait(200)
  const discount = body.discount ?? 0
  if (body.items.length === 0) throw new ApiError(400, 'Keranjang kosong.')
  const lines = body.items.map((it) => {
    const p = db.products.find((x) => x.id === it.productId)
    if (!p || !p.active) throw new ApiError(400, 'Ada produk yang tidak aktif.')
    if (it.qty <= 0 || p.stock < it.qty) throw new ApiError(409, 'Stok tidak cukup untuk menyelesaikan transaksi.')
    return { p, qty: it.qty }
  })
  const subtotal = lines.reduce((n, l) => n + l.qty * l.p.sell_price, 0)
  if (discount > subtotal) throw new ApiError(400, 'Diskon melebihi subtotal.')
  const s = db.settings
  const tax = s.taxEnabled ? Math.round(((subtotal - discount) * s.taxPct) / 100) : 0
  const total = subtotal - discount + tax
  if (body.method === 'Cash' && (body.paid ?? 0) < total) {
    throw new ApiError(400, 'Jumlah bayar kurang dari total.')
  }
  const seq = db.seq++
  const now = new Date().toISOString()
  for (const l of lines) {
    l.p.stock -= l.qty
    db.movements.unshift({
      id: `m-${Date.now()}-${l.p.id}`, product_id: l.p.id, product_name: l.p.name,
      type: 'sale', qty: -l.qty, reason: `Penjualan #TRX-${String(seq).padStart(5, '0')}`,
      actor: authed().name, created_at: now,
    })
    if (l.p.stock <= 3) {
      db.notifs.unshift({
        id: `n-${Date.now()}-${l.p.id}`,
        title: l.p.stock === 0 ? 'Stok Habis' : 'Stok Menipis',
        message: `${l.p.name} tersisa ${l.p.stock} unit.`,
        type: l.p.stock === 0 ? 'out_of_stock' : 'low_stock',
        category: 'stok', read: false, created_at: now,
        reference_type: 'product', reference_id: l.p.id,
      })
    }
  }
  const paid = body.method === 'Cash' ? (body.paid ?? total) : total
  const trx: Trx = {
    id: String(seq), seq, cashier_name: authed().name,
    items: lines.map((l) => ({
      product_id: l.p.id, name: l.p.name, buy_price: l.p.buy_price, price: l.p.sell_price, qty: l.qty,
    })),
    subtotal, discount, tax, total, method: body.method, paid,
    change: paid - total, status: 'completed', customer: body.customer ?? '', created_at: now,
  }
  db.trx.unshift(trx)
  return trx
}

export async function apiRefundTransaction(id: string, items: { productId: string; qty: number }[], reason: string) {
  await wait(200)
  const t = db.trx.find((x) => x.id === id)
  if (!t) throw new ApiError(404, 'Transaksi tidak ditemukan.')
  if (t.status !== 'completed') throw new ApiError(409, 'Transaksi ini tidak dapat direfund.')
  if (!reason.trim()) throw new ApiError(400, 'alasan refund wajib diisi')
  for (const it of items) {
    const line = t.items.find((x) => x.product_id === it.productId)
    if (!line || it.qty > line.qty) throw new ApiError(400, 'Qty refund melebihi jumlah terjual.')
    const p = db.products.find((x) => x.id === it.productId)
    if (p) p.stock += it.qty
    db.movements.unshift({
      id: `m-${Date.now()}-${it.productId}`, product_id: it.productId,
      product_name: line?.name ?? null, type: 'refund', qty: it.qty,
      reason, actor: authed().name, created_at: new Date().toISOString(),
    })
  }
  const fully = items.every((it) => {
    const line = t.items.find((x) => x.product_id === it.productId)
    return line && it.qty >= line.qty
  }) && items.length === t.items.length
  if (fully) t.status = 'refunded'
  return t
}

// ── katalog & stok ─────────────────────────────────────────────────

export async function apiListCategories() {
  await wait()
  return [...db.categories]
}

export async function apiCreateCategory(name: string) {
  await wait()
  if (db.categories.some((c) => c.name.toLowerCase() === name.trim().toLowerCase())) {
    throw new ApiError(409, 'Kategori dengan nama itu sudah ada.')
  }
  const c: Category = { id: `c-${Date.now().toString(36)}`, name: name.trim(), active: true, created_at: new Date().toISOString() }
  db.categories.push(c)
  return { category: c }
}

export async function apiDeleteCategory(id: string) {
  await wait()
  const used = db.products.some((p) => p.category_id === id)
  if (used) {
    const c = db.categories.find((x) => x.id === id)
    if (c) c.active = false
    return { soft_deleted: true }
  }
  db.categories = db.categories.filter((c) => c.id !== id)
  return { soft_deleted: false }
}

export async function apiListProducts(f: ProductFilter = {}) {
  await wait()
  let items = [...db.products]
  if (f.q) {
    const q = f.q.toLowerCase()
    items = items.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
  }
  if (f.categoryId) items = items.filter((p) => p.category_id === f.categoryId)
  if (f.active !== undefined) items = items.filter((p) => p.active === f.active)
  return paginate(items, f.page, f.limit)
}

export async function apiCreateProduct(body: {
  name: string; sku: string; barcode?: string; categoryId?: string | null
  buyPrice?: number; sellPrice: number; stock?: number; unit?: string
}) {
  await wait(200)
  if (db.products.some((p) => p.sku && body.sku && p.sku.toLowerCase() === body.sku.toLowerCase())) {
    throw new ApiError(409, 'SKU sudah digunakan di toko ini.')
  }
  const cat = db.categories.find((c) => c.id === body.categoryId) ?? null
  const p: Product = {
    id: `p-${Date.now().toString(36)}`, name: body.name, sku: body.sku, barcode: body.barcode ?? '',
    category_id: cat?.id ?? null, category_name: cat?.name ?? null,
    buy_price: body.buyPrice ?? 0, sell_price: body.sellPrice, stock: body.stock ?? 0,
    unit: body.unit ?? 'pcs', active: true, created_at: new Date().toISOString(),
  }
  db.products.unshift(p)
  return p
}

export async function apiUpdateProduct(id: string, body: {
  name: string; sku: string; barcode?: string; categoryId?: string | null
  buyPrice?: number; sellPrice: number; unit?: string
}) {
  await wait(200)
  const p = db.products.find((x) => x.id === id)
  if (!p) throw new ApiError(404, 'Produk tidak ditemukan.')
  const cat = db.categories.find((c) => c.id === body.categoryId) ?? null
  Object.assign(p, {
    name: body.name, sku: body.sku, barcode: body.barcode ?? p.barcode,
    category_id: cat?.id ?? null, category_name: cat?.name ?? null,
    buy_price: body.buyPrice ?? p.buy_price, sell_price: body.sellPrice, unit: body.unit ?? p.unit,
  })
  return p
}

export async function apiSetProductActive(id: string, active: boolean) {
  await wait()
  const p = db.products.find((x) => x.id === id)
  if (p) p.active = active
  return { message: 'Status produk diperbarui.' }
}

export async function apiDeleteProduct(id: string) {
  await wait()
  db.products = db.products.filter((p) => p.id !== id)
  return { message: 'Produk berhasil dihapus.' }
}

export async function apiListMovements(f: { type?: string; productId?: string; page?: number; limit?: number } = {}) {
  await wait()
  let items = [...db.movements]
  if (f.type) items = items.filter((m) => m.type === f.type)
  if (f.productId) items = items.filter((m) => m.product_id === f.productId)
  return paginate(items, f.page, f.limit ?? 25)
}

export async function apiAdjustStock(productId: string, direction: 'plus' | 'minus', qty: number, reason: string) {
  await wait(200)
  const p = db.products.find((x) => x.id === productId)
  if (!p) throw new ApiError(404, 'Produk tidak ditemukan.')
  if (direction === 'minus' && p.stock - qty < 0) throw new ApiError(400, 'stok tidak boleh negatif')
  p.stock += direction === 'plus' ? qty : -qty
  db.movements.unshift({
    id: `m-${Date.now()}`, product_id: p.id, product_name: p.name,
    type: 'adjust', qty: direction === 'plus' ? qty : -qty,
    reason, actor: authed().name, created_at: new Date().toISOString(),
  })
  return { product: p }
}

// ── users ──────────────────────────────────────────────────────────

export async function apiListUsers() {
  await wait()
  return [...db.users]
}

export async function apiCreateUser(body: { name: string }) {
  await wait(200)
  const u: User = {
    id: `u-${Date.now().toString(36)}`, email: '', name: body.name, role: 'cashier',
    active: true, store_id: 's1', store_name: 'Toko Preview', has_passcode: false,
    created_at: new Date().toISOString(),
  }
  db.users.push(u)
  return { user: u }
}

export async function apiSetUserActive(id: string, active: boolean) {
  await wait()
  const u = db.users.find((x) => x.id === id)
  if (u) u.active = active
  return { message: active ? 'Akun diaktifkan.' : 'Akun dinonaktifkan.' }
}

export async function apiRenameUser(id: string, name: string) {
  await wait()
  const u = db.users.find((x) => x.id === id)
  if (!u) throw new ApiError(404, 'Akun tidak ditemukan di toko Anda.')
  u.name = name
  return { message: 'Nama kasir diperbarui.' }
}

export async function apiDeleteUser(id: string) {
  await wait()
  db.users = db.users.filter((u) => u.id !== id)
  return { message: 'Akun kasir berhasil dihapus.' }
}

export async function apiSetPasscode(id: string, passcode: string, role?: string) {
  await wait()
  const u = db.users.find((x) => x.id === id && (!role || x.role === role))
  if (!u) throw new ApiError(404, 'Akun tidak ditemukan di toko Anda.')
  if (passcode !== '' && !/^\d{5}$/.test(passcode)) throw new ApiError(400, 'passcode harus 5 angka')
  if (passcode === '') delete db.passcodes[id]
  else db.passcodes[id] = passcode
  u.has_passcode = passcode !== ''
  return { message: 'Passcode disimpan.' }
}

// ── settings ───────────────────────────────────────────────────────

export async function apiGetSettings() {
  await wait()
  return { ...db.settings }
}

export async function apiUpdateSettings(s: StoreSettings) {
  await wait(200)
  if (!s.storeName.trim()) throw new ApiError(400, 'nama toko wajib diisi')
  db.settings = { ...s }
  return { ...db.settings }
}

// ── notifikasi & aktivitas ─────────────────────────────────────────

export async function apiListNotifications(f: {
  unread?: boolean
  category?: NotifCategory
  status?: 'all' | 'unread' | 'read'
  page?: number
  limit?: number
} = {}) {
  await wait()
  let items = [...db.notifs].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
  const wantUnread = f.status === 'unread' ? true : f.status === 'read' ? false : f.unread
  if (wantUnread !== undefined) items = items.filter((n) => !n.read === wantUnread)
  if (f.category) items = items.filter((n) => (n.type === 'low_stock' || n.type === 'out_of_stock' ? 'stok' : n.category) === f.category)
  return paginate(items, f.page, f.limit)
}

export async function apiGetNotifUnreadCount(): Promise<number> {
  await wait()
  return db.notifs.filter((n) => !n.read).length
}

export async function apiMarkNotifRead(id: number | string) {
  await wait()
  const n = db.notifs.find((x) => String(x.id) === String(id))
  if (n) n.read = true
  return { status: 'ok' }
}

export async function apiMarkAllNotifsRead() {
  await wait()
  for (const n of db.notifs) n.read = true
  return { status: 'ok' }
}

export async function apiDeleteNotif(id: number | string) {
  await wait()
  db.notifs = db.notifs.filter((x) => String(x.id) !== String(id))
  return { status: 'ok' }
}

// Backend asli belum live — salinan halaman pakai fallback turunan.
export async function apiListActivity(_f: { page?: number; limit?: number } = {}): Promise<Page<ActivityItem> | null> {
  await wait()
  return null
}

// ── sesi & akun (sandbox: tanpa token beneran) ─────────────────────

export async function apiMe() {
  await wait()
  return { user: authed() }
}

export async function apiSwitchAccount(targetUserId: string, passcode?: string, _role?: string) {
  await wait(200)
  const u = db.users.find((x) => x.id === targetUserId)
  if (!u) throw new ApiError(404, 'Akun tidak ditemukan.')
  if (!u.active) throw new ApiError(403, 'Akun dinonaktifkan.')
  if (u.has_passcode && !passcode) throw new ApiError(401, 'passcode_required', 'PASSCODE_REQUIRED')
  if (u.has_passcode && db.passcodes[u.id] && passcode !== db.passcodes[u.id]) {
    throw new ApiError(400, 'Passcode salah. Coba lagi.', 'PASSCODE_WRONG')
  }
  if (u.has_passcode && !db.passcodes[u.id] && passcode) db.passcodes[u.id] = passcode
  return { access_token: 'mock', refresh_token: 'mock', user: u }
}

export async function apiLogout() {
  await wait()
}

export async function apiHeartbeat(): Promise<void> {
  // noop sandbox
}

export async function apiSendPasswordResetOtp(_email: string) {
  await wait()
  return { message: 'Jika email terdaftar, kode OTP telah dikirim.' }
}

export async function apiResetPassword(_email: string, _code: string, _newPassword: string) {
  await wait(200)
  return { message: 'Kata sandi berhasil diubah. Silakan masuk dengan kata sandi baru.' }
}
