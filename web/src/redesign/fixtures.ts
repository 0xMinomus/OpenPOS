// Seed data sandbox /demo. Bentuk meniru respons backend asli
// (snake_case, pagination {items,total,page,limit}) agar salinan halaman
// cloud jalan tanpa ubah selain import. Tanggal STATIS (jangkar tetap) agar
// data kembali ke awal tiap reload — user boleh tambah transaksi/CRUD, semua
// hilang saat refresh/keluar karena db dibangun ulang dari buildDB().
import type { Category, Movement, Notification, Product, StoreSettings, Trx, User } from '../lib/api'

// Jangkar tetap: 15 Sep 2026 12:00 lokal. "Hari ini" di demo = tanggal ini,
// bukan tanggal kalender sungguhan — data stabil lintas hari/refresh.
const ANCHOR = new Date(2026, 8, 15, 12, 0, 0, 0)

function isoAnchor(h = 10, m = 30, dayOffset = 0): string {
  const d = new Date(ANCHOR)
  d.setDate(d.getDate() + dayOffset)
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
  const ago = (days: number) => {
    const d = new Date(ANCHOR)
    d.setDate(d.getDate() - days)
    return d.toISOString()
  }
  const users: User[] = [
    { id: 'u1', email: 'owner@tokopreview.id', name: 'Pemilik Preview', role: 'admin', active: true, store_id: 's1', store_name: 'Toko Preview', has_passcode: false, created_at: ago(90), online: true, last_seen_at: new Date().toISOString() },
    { id: 'u2', email: '', name: 'Andika Kasir', role: 'cashier', active: true, store_id: 's1', store_name: 'Toko Preview', has_passcode: false, created_at: ago(40), online: true, last_seen_at: new Date().toISOString() },
    { id: 'u3', email: '', name: 'Sari Kasir', role: 'cashier', active: true, store_id: 's1', store_name: 'Toko Preview', has_passcode: false, created_at: ago(12), online: false, last_seen_at: ago(1) },
    { id: 'u4', email: '', name: 'Budi Kasir', role: 'cashier', active: true, store_id: 's1', store_name: 'Toko Preview', has_passcode: false, created_at: ago(30), online: false },
    { id: 'u5', email: '', name: 'Dedi (nonaktif)', role: 'cashier', active: false, store_id: 's1', store_name: 'Toko Preview', has_passcode: false, created_at: ago(60), online: false },
  ]
  const categories: Category[] = [
    { id: 'c1', name: 'Sembako', active: true, created_at: ago(90) },
    { id: 'c2', name: 'Minuman', active: true, created_at: ago(90) },
    { id: 'c3', name: 'Snack', active: true, created_at: ago(80) },
    { id: 'c4', name: 'Rumah Tangga', active: true, created_at: ago(75) },
    { id: 'c5', name: 'Perawatan', active: true, created_at: ago(60) },
  ]
  const P = (
    id: string, name: string, cat: (typeof categories)[number] | null,
    buy: number, sell: number, stock: number, extra: Partial<Product> = {},
  ): Product => ({
    id, name, category_id: cat?.id ?? null, category_name: cat?.name ?? null,
    sku: `SKU-${id.toUpperCase()}`, barcode: '', buy_price: buy, sell_price: sell,
    stock, unit: 'pcs', active: true, created_at: ago(70), ...extra,
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
    P('p10', 'Sabun Mandi', categories[3], 4000, 5500, 30),
    P('p11', 'Kecap Manis 600ml', categories[0], 14500, 17000, 20),
    P('p12', 'Susu UHT 1L', categories[1], 16500, 19000, 25),
    P('p13', 'Roti Tawar', categories[2], 12000, 15000, 18),
    P('p14', 'Deterjen Bubuk 800g', categories[3], 18500, 22000, 14),
    P('p15', 'Shampo Sachet', categories[4], 1500, 2500, 80),
    P('p16', 'Pasta Gigi 190g', categories[4], 13500, 16500, 22),
    P('p17', 'Tisu Wajah 250s', categories[3], 11000, 14000, 16),
    P('p18', 'Sarden Kaleng 425g', categories[0], 17500, 21000, 3),
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
  const coffee = { product_id: 'p4', name: 'Kopi Sachet 10s', buy_price: 8500, price: 11000, qty: 2 }
  const tea = { product_id: 'p5', name: 'Teh Botol 450ml', buy_price: 2800, price: 4000, qty: 6 }
  const water = { product_id: 'p6', name: 'Air Mineral 600ml', buy_price: 2200, price: 3000, qty: 4 }
  const soap = { product_id: 'p10', name: 'Sabun Mandi', buy_price: 4000, price: 5500, qty: 3 }
  const sugar = { product_id: 'p3', name: 'Gula Pasir 1kg', buy_price: 13500, price: 15500, qty: 2 }
  // 30 hari transaksi (semua metode bayar terwakili tiap pekan).
  const trx: Trx[] = [
    T(30, 'Andika Kasir', [{ ...rice, qty: 1 }, { ...oil, qty: 1 }], 0, 'QRIS', isoAnchor(14, 5)),
    T(29, 'Sari Kasir', [{ ...coffee, qty: 2 }, { ...water, qty: 2 }], 0, 'Cash', isoAnchor(13, 20)),
    T(28, 'Andika Kasir', [{ ...noodle, qty: 3 }], 0, 'E-Wallet', isoAnchor(11, 42)),
    T(27, 'Sari Kasir', [{ ...rice, qty: 2 }], 5000, 'Cash', isoAnchor(9, 15), 'completed', 'Bu Ratna'),
    T(26, 'Budi Kasir', [{ ...soap, qty: 2 }], 0, 'Bank Transfer', isoAnchor(8, 5)),
    T(25, 'Andika Kasir', [{ ...oil, qty: 1 }, { ...sugar, qty: 1 }], 0, 'E-Wallet', isoAnchor(16, 20, -1)),
    T(24, 'Sari Kasir', [{ ...tea, qty: 6 }], 2000, 'Cash', isoAnchor(12, 10, -1)),
    T(23, 'Budi Kasir', [{ ...noodle, qty: 10 }], 2000, 'Card', isoAnchor(13, 2, -2)),
    T(22, 'Andika Kasir', [{ ...rice, qty: 1 }], 0, 'Bank Transfer', isoAnchor(10, 55, -2), 'refunded'),
    T(21, 'Sari Kasir', [{ ...oil, qty: 3 }], 0, 'QRIS', isoAnchor(15, 44, -4)),
    T(20, 'Budi Kasir', [{ ...water, qty: 8 }], 0, 'Cash', isoAnchor(11, 5, -4)),
    T(19, 'Andika Kasir', [{ ...noodle, qty: 4 }], 0, 'Cash', isoAnchor(12, 30, -5)),
    T(18, 'Sari Kasir', [{ ...rice, qty: 1 }, { ...noodle, qty: 2 }], 0, 'Card', isoAnchor(17, 12, -6)),
    T(17, 'Andika Kasir', [{ ...coffee, qty: 4 }], 3000, 'QRIS', isoAnchor(10, 40, -7)),
    T(16, 'Budi Kasir', [{ ...sugar, qty: 3 }], 0, 'E-Wallet', isoAnchor(15, 25, -8)),
    T(15, 'Sari Kasir', [{ ...oil, qty: 2 }, { ...rice, qty: 1 }], 0, 'Bank Transfer', isoAnchor(9, 50, -9)),
    T(14, 'Andika Kasir', [{ ...noodle, qty: 8 }], 1000, 'Cash', isoAnchor(14, 15, -11)),
    T(13, 'Budi Kasir', [{ ...soap, qty: 5 }], 0, 'Card', isoAnchor(11, 30, -13)),
    T(12, 'Sari Kasir', [{ ...water, qty: 10 }, { ...tea, qty: 4 }], 0, 'QRIS', isoAnchor(16, 5, -15)),
    T(11, 'Andika Kasir', [{ ...rice, qty: 3 }], 10000, 'Cash', isoAnchor(10, 20, -17), 'completed', 'Pak Harto'),
    T(10, 'Budi Kasir', [{ ...coffee, qty: 6 }], 0, 'E-Wallet', isoAnchor(13, 45, -20)),
    T(9, 'Sari Kasir', [{ ...noodle, qty: 12 }], 0, 'Bank Transfer', isoAnchor(9, 10, -22)),
    T(8, 'Andika Kasir', [{ ...oil, qty: 2 }], 0, 'Cash', isoAnchor(15, 0, -24)),
    T(7, 'Budi Kasir', [{ ...rice, qty: 2 }, { ...sugar, qty: 2 }], 5000, 'Card', isoAnchor(11, 55, -26)),
    T(6, 'Sari Kasir', [{ ...soap, qty: 4 }, { ...water, qty: 6 }], 0, 'QRIS', isoAnchor(14, 35, -28)),
    T(5, 'Andika Kasir', [{ ...tea, qty: 12 }], 0, 'Cash', isoAnchor(10, 5, -29)),
  ]
  const movements: Movement[] = [
    { id: 'm1', product_id: 'p5', product_name: 'Teh Botol 450ml', type: 'adjust', qty: -6, reason: 'Pecah di rak', actor: 'Pemilik Preview', created_at: isoAnchor(9, 2, -1) },
    { id: 'm2', product_id: 'p1', product_name: 'Beras Premium 5kg', type: 'sale', qty: -1, reason: 'Penjualan #TRX-00030', actor: 'Andika Kasir', created_at: isoAnchor(14, 5) },
    { id: 'm3', product_id: 'p3', product_name: 'Gula Pasir 1kg', type: 'adjust', qty: 10, reason: 'Stok opname', actor: 'Pemilik Preview', created_at: isoAnchor(10, 0, -3) },
    { id: 'm4', product_id: 'p14', product_name: 'Deterjen Bubuk 800g', type: 'adjust', qty: 20, reason: 'Kulakan mingguan', actor: 'Pemilik Preview', created_at: isoAnchor(9, 30, -6) },
    { id: 'm5', product_id: 'p7', product_name: 'Mie Instan Goreng', type: 'sale', qty: -3, reason: 'Penjualan #TRX-00028', actor: 'Andika Kasir', created_at: isoAnchor(11, 42) },
    { id: 'm6', product_id: 'p9', product_name: 'Telur Ayam 1kg', type: 'adjust', qty: -2, reason: 'Rusak/expired', actor: 'Sari Kasir', created_at: isoAnchor(16, 15, -8) },
    { id: 'm7', product_id: 'p18', product_name: 'Sarden Kaleng 425g', type: 'adjust', qty: 24, reason: 'Stok awal', actor: 'Pemilik Preview', created_at: isoAnchor(9, 0, -25) },
  ]
  const notifs: Notification[] = [
    { id: 1, title: 'Stok Habis', message: 'Teh Botol 450ml tersisa 0 unit.', type: 'out_of_stock', category: 'stok', read: false, created_at: isoAnchor(9, 3, -1), reference_type: 'product', reference_id: 'p5' },
    { id: 2, title: 'Stok Menipis', message: 'Gula Pasir 1kg tersisa 2 unit.', type: 'low_stock', category: 'stok', read: false, created_at: isoAnchor(8, 0, -2), reference_type: 'product', reference_id: 'p3' },
    { id: 3, title: 'Stok Menipis', message: 'Sarden Kaleng 425g tersisa 3 unit.', type: 'low_stock', category: 'stok', read: false, created_at: isoAnchor(7, 30, -3), reference_type: 'product', reference_id: 'p18' },
    { id: 4, title: 'Transaksi Baru', message: 'Andika Kasir menyelesaikan #TRX-00030.', type: 'transaction_created', category: 'transaksi', actor_name: 'Andika Kasir', read: false, created_at: isoAnchor(14, 5), reference_type: 'transaction', reference_id: 30 },
    { id: 5, title: 'Transaksi Baru', message: 'Sari Kasir menyelesaikan #TRX-00029.', type: 'transaction_created', category: 'transaksi', actor_name: 'Sari Kasir', read: true, created_at: isoAnchor(13, 20), reference_type: 'transaction', reference_id: 29 },
    { id: 6, title: 'Transaksi Baru', message: 'Budi Kasir menyelesaikan #TRX-00026.', type: 'transaction_created', category: 'transaksi', actor_name: 'Budi Kasir', read: true, created_at: isoAnchor(8, 5), reference_type: 'transaction', reference_id: 26 },
    { id: 7, title: 'Pengingat Stok Opname', message: 'Jadwalkan stok opname mingguan untuk kategori Sembako.', type: 'system_info', category: 'sistem', read: false, created_at: isoAnchor(7, 0), reference_type: 'system', reference_id: 'stocktake' },
    { id: 8, title: 'Selamat Datang', message: 'Toko Preview siap dipakai. Jelajahi semua menu demo.', type: 'system_info', category: 'sistem', read: true, created_at: isoAnchor(8, 0, -6), reference_type: 'system', reference_id: 'welcome' },
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
    users, passcodes: {},
    categories, products, trx, movements, notifs, settings, seq: 31,
  }
}
