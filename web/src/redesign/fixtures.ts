// Seed data sandbox /demo. Bentuk meniru respons backend asli
// (snake_case, pagination {items,total,page,limit}) agar salinan halaman
// cloud jalan tanpa ubah selain import. Tanggal relatif ke hari ini supaya
// chart 7 hari + KPI selalu terlihat hidup.
import type { Category, Movement, Notification, Product, StoreSettings, Trx, User } from '../lib/api'

function isoDaysAgo(days: number, h = 10, m = 30): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

function isoToday(h: number, m: number): string {
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

export interface SandboxDB {
  users: User[]
  passcodes: Record<string, string>
  categories: Category[]
  products: Product[]
  trx: Trx[]
  movements: Movement[]
  notifs: Notification[]
  settings: StoreSettings
  seq: number
}

export function buildDB(): SandboxDB {
  const users: User[] = [
    { id: 'u1', email: 'owner@tokopreview.id', name: 'Pemilik Preview', role: 'admin', active: true, store_id: 's1', store_name: 'Toko Preview', has_passcode: true, created_at: isoDaysAgo(90), online: true, last_seen_at: new Date().toISOString() },
    { id: 'u2', email: '', name: 'Andika Kasir', role: 'cashier', active: true, store_id: 's1', store_name: 'Toko Preview', has_passcode: true, created_at: isoDaysAgo(40), online: true, last_seen_at: new Date().toISOString() },
    { id: 'u3', email: '', name: 'Sari Kasir', role: 'cashier', active: true, store_id: 's1', store_name: 'Toko Preview', has_passcode: false, created_at: isoDaysAgo(12), online: false, last_seen_at: isoDaysAgo(1, 18, 5) },
    { id: 'u4', email: '', name: 'Budi (nonaktif)', role: 'cashier', active: false, store_id: 's1', store_name: 'Toko Preview', has_passcode: false, created_at: isoDaysAgo(60), online: false },
  ]
  const categories: Category[] = [
    { id: 'c1', name: 'Sembako', active: true, created_at: isoDaysAgo(90) },
    { id: 'c2', name: 'Minuman', active: true, created_at: isoDaysAgo(90) },
    { id: 'c3', name: 'Snack', active: true, created_at: isoDaysAgo(80) },
  ]
  const P = (
    id: string, name: string, cat: (typeof categories)[number] | null,
    buy: number, sell: number, stock: number, extra: Partial<Product> = {},
  ): Product => ({
    id, name, category_id: cat?.id ?? null, category_name: cat?.name ?? null,
    sku: `SKU-${id.toUpperCase()}`, barcode: '', buy_price: buy, sell_price: sell,
    stock, unit: 'pcs', active: true, created_at: isoDaysAgo(70), ...extra,
  })
  const products: Product[] = [
    P('p1', 'Beras Premium 5kg', categories[0], 62000, 68000, 24),
    P('p2', 'Minyak Goreng 2L', categories[0], 28000, 32000, 15),
    P('p3', 'Gula Pasir 1kg', categories[0], 13500, 15500, 2),
    P('p4', 'Kopi Sachet 10s', categories[1], 8500, 11000, 40),
    P('p5', 'Teh Botol 450ml', categories[1], 2800, 4000, 0),
    P('p6', 'Air Mineral 600ml', categories[1], 2200, 3000, 60),
    P('p7', 'Mie Instan Goreng', categories[2], 2500, 3200, 100),
    P('p8', 'Keripik Singkong', categories[2], 6000, 8000, 12),
    P('p9', 'Telur Ayam 1kg', categories[0], 22000, 25000, 8),
    P('p10', 'Sabun Mandi', null, 4000, 5500, 30),
  ]
  const T = (
    seq: number, cashier: string, items: Trx['items'], discount: number,
    method: string, when: string, status: Trx['status'] = 'completed', customer = '',
  ): Trx => {
    const subtotal = items.reduce((n, i) => n + i.qty * i.price, 0)
    const tax = Math.round(((subtotal - discount) * 10) / 100)
    const total = subtotal - discount + tax
    const cash = method === 'Cash'
    return {
      id: String(seq), seq, cashier_name: cashier, items, subtotal, discount, tax,
      total, method, paid: cash ? total + 5000 : total, change: cash ? 5000 : 0,
      status, customer, created_at: when,
    }
  }
  const rice = { product_id: 'p1', name: 'Beras Premium 5kg', buy_price: 62000, price: 68000, qty: 1 }
  const oil = { product_id: 'p2', name: 'Minyak Goreng 2L', buy_price: 28000, price: 32000, qty: 2 }
  const noodle = { product_id: 'p7', name: 'Mie Instan Goreng', buy_price: 2500, price: 3200, qty: 5 }
  const trx: Trx[] = [
    T(12, 'Andika Kasir', [{ ...rice, qty: 1 }, { ...oil, qty: 1 }], 0, 'QRIS', isoToday(14, 5)),
    T(11, 'Andika Kasir', [{ ...noodle, qty: 3 }], 0, 'Cash', isoToday(11, 42)),
    T(10, 'Sari Kasir', [{ ...rice, qty: 2 }], 5000, 'Cash', isoToday(9, 15), 'completed', 'Bu Ratna'),
    T(9, 'Andika Kasir', [{ ...oil, qty: 1 }], 0, 'E-Wallet', isoDaysAgo(1, 16, 20)),
    T(8, 'Sari Kasir', [{ ...noodle, qty: 10 }], 2000, 'Cash', isoDaysAgo(2, 13, 2)),
    T(7, 'Andika Kasir', [{ ...rice, qty: 1 }], 0, 'Bank Transfer', isoDaysAgo(2, 10, 55), 'refunded'),
    T(6, 'Sari Kasir', [{ ...oil, qty: 3 }], 0, 'QRIS', isoDaysAgo(4, 15, 44)),
    T(5, 'Andika Kasir', [{ ...noodle, qty: 4 }], 0, 'Cash', isoDaysAgo(5, 12, 30)),
    T(4, 'Sari Kasir', [{ ...rice, qty: 1 }, { ...noodle, qty: 2 }], 0, 'Card', isoDaysAgo(6, 17, 12)),
  ]
  const movements: Movement[] = [
    { id: 'm1', product_id: 'p5', product_name: 'Teh Botol 450ml', type: 'adjust', qty: -6, reason: 'Pecah di rak', actor: 'Pemilik Preview', created_at: isoDaysAgo(1, 9, 2) },
    { id: 'm2', product_id: 'p1', product_name: 'Beras Premium 5kg', type: 'sale', qty: -1, reason: 'Penjualan #TRX-00012', actor: 'Andika Kasir', created_at: isoToday(14, 5) },
    { id: 'm3', product_id: 'p3', product_name: 'Gula Pasir 1kg', type: 'adjust', qty: 10, reason: 'Stok opname', actor: 'Pemilik Preview', created_at: isoDaysAgo(3, 10, 0) },
    { id: 'm4', product_id: 'p7', product_name: 'Mie Instan Goreng', type: 'initial', qty: 100, reason: 'Stok awal', actor: 'Pemilik Preview', created_at: isoDaysAgo(70, 9, 0) },
  ]
  const notifs: Notification[] = [
    { id: 1, title: 'Stok Habis', message: 'Teh Botol 450ml tersisa 0 unit.', type: 'out_of_stock', category: 'stok', read: false, created_at: isoDaysAgo(1, 9, 3), reference_type: 'product', reference_id: 'p5' },
    { id: 2, title: 'Stok Menipis', message: 'Gula Pasir 1kg tersisa 2 unit.', type: 'low_stock', category: 'stok', read: false, created_at: isoDaysAgo(2, 8, 0), reference_type: 'product', reference_id: 'p3' },
    { id: 3, title: 'Transaksi Baru', message: 'Andika Kasir menyelesaikan #TRX-00012.', type: 'transaction_created', category: 'transaksi', actor_name: 'Andika Kasir', read: true, created_at: isoToday(14, 5), reference_type: 'transaction', reference_id: 12 },
  ]
  const settings: StoreSettings = {
    storeName: 'Toko Preview', address: 'Jl. Merdeka No. 1', phone: '081234567890',
    taxEnabled: true, taxPct: 10, receiptHeader: 'Terima kasih sudah berbelanja',
    receiptFooter: 'Barang yang sudah dibeli tidak dapat ditukar',
    paper: '58mm', timezone: 'Asia/Makassar',
    businessType: 'Retail', email: 'owner@tokopreview.id', city: 'Makassar',
    currency: 'IDR', receiptShowCashier: true, receiptShowMethod: true,
    receiptShowTax: true, receiptShowDiscount: true, taxName: 'PPN',
    taxInclusive: false, taxRounding: 'none',
  }
  return {
    users, passcodes: { u1: '12345', u2: '54321' },
    categories, products, trx, movements, notifs, settings, seq: 13,
  }
}
