import type { Transaction, ReconciliationRecord, SettlementRecord, PaymentChannel, PaymentProvider, SettlementStatus } from '@/types'

// Deterministic seeded random number generator
function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

const rand = seededRandom(42)

// Helper: pick random item from array
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)]
}

// Helper: random integer between min and max (inclusive)
function randInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min
}

// Helper: round to nearest thousand (IDR)
function roundIDR(n: number): number {
  return Math.round(n / 1000) * 1000
}

// Helper: format date as YYYY-MM-DD
function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

// Helper: add days to a date
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return formatDate(d)
}

// --- Data pools ---

const branchNames = [
  'Topgolf Bellezza', 'Topgolf SCBD Premier', 'Topgolf Kelapa Gading',
  'Topgolf Pluit Village', 'Topgolf Cilandak', 'Topgolf Rawamangun',
  'Topgolf Pondok Indah', 'Topgolf PIK Avenue', 'Topgolf Mall of Indonesia',
  'Topgolf Plaza Indonesia', 'Topgolf Surabaya', 'Topgolf Hosel Yogyakarta',
  'Topgolf Albatross Tangerang', 'Topgolf Bandung', 'Topgolf Balikpapan',
]

// Jakarta branches have higher weight
const branchWeights: number[] = [
  12, 15, 10, 8, 8, 6, 14, 10, 7, 13, 9, 5, 7, 6, 4,
]
const totalBranchWeight = branchWeights.reduce((a, b) => a + b, 0)

function pickBranch(): string {
  let r = rand() * totalBranchWeight
  for (let i = 0; i < branchNames.length; i++) {
    r -= branchWeights[i]
    if (r <= 0) return branchNames[i]
  }
  return branchNames[0]
}

const customerFirstNames = [
  'Agus', 'Bambang', 'Cahya', 'Dedi', 'Eka', 'Fitri', 'Gunawan', 'Hadi',
  'Irwan', 'Joko', 'Kartini', 'Lukman', 'Megawati', 'Novi', 'Oscar',
  'Putri', 'Rudi', 'Surya', 'Tina', 'Umar', 'Vera', 'Wawan', 'Yanti',
  'Zainal', 'Arief', 'Bayu', 'Citra', 'Dhani', 'Erwin', 'Faisal',
  'Galih', 'Herman', 'Iwan', 'Joni', 'Kurnia', 'Lina', 'Mulyadi',
  'Nanda', 'Okta', 'Pandu', 'Ratna', 'Slamet', 'Tommy', 'Utami',
]

const customerLastNames = [
  'Wijaya', 'Santoso', 'Pranoto', 'Kusuma', 'Suryadi', 'Hartono',
  'Wibowo', 'Lesmana', 'Hidayat', 'Putra', 'Siregar', 'Nasution',
  'Harahap', 'Sinaga', 'Panjaitan', 'Simanjuntak', 'Prabowo',
  'Saputra', 'Setiawan', 'Nugroho', 'Firmansyah', 'Permana',
  'Budiman', 'Halim', 'Tanuwijaya', 'Limantara', 'Soegiarto',
]

interface ProductCategoryConfig {
  name: string
  items: string[]
  minPrice: number
  maxPrice: number
}

const productCategories: ProductCategoryConfig[] = [
  {
    name: 'Golf Clubs',
    items: [
      'MAJESTY Prestigio XII Driver', 'MAJESTY Royale SP Iron Set', 'PING G430 MAX Driver',
      'PING i230 Iron Set', 'TITLEIST TSR3 Driver', 'TITLEIST T200 Iron Set',
      'BRIDGESTONE TOUR B X-CB Iron Set', 'CALLAWAY Paradym Ai Smoke Driver',
    ],
    minPrice: 5_000_000,
    maxPrice: 50_000_000,
  },
  {
    name: 'Golf Bags',
    items: [
      'TITLEIST Players 4 StaDry Stand Bag', 'PING Hoofer Lite Stand Bag',
      'MAJESTY Premium Cart Bag', 'BRIDGESTONE Tour B Cart Bag',
      'CALLAWAY Fairway C Stand Bag', 'OGIO Fuse Stand Bag',
    ],
    minPrice: 2_000_000,
    maxPrice: 15_000_000,
  },
  {
    name: 'Golf Balls',
    items: [
      'TITLEIST Pro V1 (1 dozen)', 'TITLEIST Pro V1x (1 dozen)',
      'BRIDGESTONE TOUR B X (1 dozen)', 'BRIDGESTONE TOUR B XS (1 dozen)',
      'CALLAWAY Chrome Soft X (1 dozen)', 'SRIXON Z-Star XV (1 dozen)',
    ],
    minPrice: 500_000,
    maxPrice: 2_000_000,
  },
  {
    name: 'Apparel',
    items: [
      'FOOTJOY ProDry Polo Shirt', 'FOOTJOY HydroLite Rain Jacket',
      'TITLEIST Performance Cap', 'PING SensorDry Polo',
      'ADIDAS Codechaos Golf Shoes', 'FOOTJOY Premiere Series Shoes',
      'PUMA IGNITE Fasten8 Shoes', 'UNDER ARMOUR Drive Polo',
    ],
    minPrice: 500_000,
    maxPrice: 5_000_000,
  },
  {
    name: 'Accessories',
    items: [
      'GARMIN Approach S62 GPS Watch', 'BUSHNELL Pro X3 Rangefinder',
      'TITLEIST Players Glove', 'FOOTJOY WeatherSof Glove',
      'PING Alignment Stick Set', 'SKLZ Gold Flex Trainer',
      'ARCCOS Caddie Smart Sensors', 'CALLAWAY Supersoft Practice Balls',
    ],
    minPrice: 200_000,
    maxPrice: 3_000_000,
  },
  {
    name: 'Fitting Services',
    items: [
      'Premium Club Fitting Session', 'Basic Club Fitting',
      'Driver Fitting & Analysis', 'Iron Set Fitting',
      'Putter Fitting with SAM Lab', 'Full Bag Fitting',
    ],
    minPrice: 500_000,
    maxPrice: 2_000_000,
  },
]

interface PaymentConfig {
  method: PaymentChannel
  provider: PaymentProvider
  minSettleDays: number
  maxSettleDays: number
  weight: number
}

const paymentConfigs: PaymentConfig[] = [
  { method: 'card', provider: 'BCA', minSettleDays: 1, maxSettleDays: 2, weight: 15 },
  { method: 'card', provider: 'Mandiri', minSettleDays: 1, maxSettleDays: 2, weight: 12 },
  { method: 'card', provider: 'BRI', minSettleDays: 1, maxSettleDays: 2, weight: 8 },
  { method: 'card', provider: 'BNI', minSettleDays: 1, maxSettleDays: 2, weight: 6 },
  { method: 'card', provider: 'CIMB Niaga', minSettleDays: 1, maxSettleDays: 2, weight: 4 },
  { method: 'ewallet', provider: 'GoPay', minSettleDays: 0, maxSettleDays: 1, weight: 10 },
  { method: 'ewallet', provider: 'OVO', minSettleDays: 0, maxSettleDays: 1, weight: 8 },
  { method: 'ewallet', provider: 'DANA', minSettleDays: 0, maxSettleDays: 1, weight: 5 },
  { method: 'ewallet', provider: 'QRIS', minSettleDays: 0, maxSettleDays: 1, weight: 6 },
  { method: 'marketplace', provider: 'ShopeePay', minSettleDays: 3, maxSettleDays: 5, weight: 4 },
  { method: 'marketplace', provider: 'Shopee', minSettleDays: 3, maxSettleDays: 5, weight: 3 },
  { method: 'bank_transfer', provider: 'BCA', minSettleDays: 0, maxSettleDays: 0, weight: 8 },
  { method: 'bank_transfer', provider: 'Mandiri', minSettleDays: 0, maxSettleDays: 0, weight: 5 },
  { method: 'cash', provider: 'Cash', minSettleDays: 0, maxSettleDays: 0, weight: 6 },
]

const totalPaymentWeight = paymentConfigs.reduce((a, b) => a + b.weight, 0)

function pickPayment(): PaymentConfig {
  let r = rand() * totalPaymentWeight
  for (const pc of paymentConfigs) {
    r -= pc.weight
    if (r <= 0) return pc
  }
  return paymentConfigs[0]
}

// --- Generate transactions ---

const today = new Date('2026-04-11')
const startDate = new Date(today)
startDate.setDate(startDate.getDate() - 90) // 90 days back

function generateTransaction(index: number): Transaction {
  const dayOffset = randInt(0, 89)
  const txDate = new Date(startDate)
  txDate.setDate(txDate.getDate() + dayOffset)
  const dateStr = formatDate(txDate)

  const branch = pickBranch()
  const customer = `${pick(customerFirstNames)} ${pick(customerLastNames)}`
  const category = pick(productCategories)
  const numItems = randInt(1, 3)
  const items: string[] = []
  let totalAmount = 0

  for (let i = 0; i < numItems; i++) {
    const item = pick(category.items)
    if (!items.includes(item)) items.push(item)
    totalAmount += roundIDR(randInt(category.minPrice, category.maxPrice))
  }

  const payment = pickPayment()
  const settleDays = randInt(payment.minSettleDays, payment.maxSettleDays)

  // ~5% discrepancy: settlement pending/failed/disputed
  const discrepancyRoll = rand()
  let settlementStatus: SettlementStatus
  let settlementDate: string | null

  if (discrepancyRoll < 0.02) {
    settlementStatus = 'failed'
    settlementDate = null
  } else if (discrepancyRoll < 0.035) {
    settlementStatus = 'disputed'
    settlementDate = null
  } else if (discrepancyRoll < 0.05) {
    settlementStatus = 'pending'
    settlementDate = null
  } else {
    settlementStatus = 'settled'
    settlementDate = addDays(dateStr, settleDays)
  }

  const id = `TXN${String(index + 1).padStart(5, '0')}`
  const posRef = `POS-${branch.split(' ').pop()?.substring(0, 3).toUpperCase() ?? 'XXX'}-${dateStr.replace(/-/g, '')}-${String(index + 1).padStart(4, '0')}`

  return {
    id,
    date: dateStr,
    branch,
    customerName: customer,
    amount: totalAmount,
    paymentMethod: payment.method,
    provider: payment.provider,
    settlementStatus,
    settlementDate,
    posReference: posRef,
    productCategory: category.name,
    items,
  }
}

// Generate 520 transactions
export const transactions: Transaction[] = Array.from({ length: 520 }, (_, i) => generateTransaction(i))
  .sort((a, b) => a.date.localeCompare(b.date))

// --- Generate reconciliation records ---

const reconRand = seededRandom(123)
function reconPick<T>(arr: T[]): T {
  return arr[Math.floor(reconRand() * arr.length)]
}

export const reconciliationRecords: ReconciliationRecord[] = transactions.map((tx) => {
  const roll = reconRand()
  let status: ReconciliationRecord['status']
  let discrepancyType: ReconciliationRecord['discrepancyType']
  let bankAmount: number | null = tx.amount
  let notes: string | undefined

  if (roll < 0.88) {
    // Matched
    status = 'matched'
  } else if (roll < 0.92) {
    // Amount mismatch (MDR fee differences, rounding)
    status = 'discrepancy'
    discrepancyType = 'amount_mismatch'
    const mdrDiff = Math.round(tx.amount * (reconRand() * 0.025 + 0.005))
    bankAmount = tx.amount - mdrDiff
    notes = `MDR fee difference of Rp ${mdrDiff.toLocaleString('id-ID')}`
  } else if (roll < 0.95) {
    // Missing bank record
    status = 'unmatched'
    discrepancyType = 'missing_bank'
    bankAmount = null
    notes = 'No matching bank settlement found'
  } else if (roll < 0.97) {
    // Timing difference
    status = 'discrepancy'
    discrepancyType = 'timing'
    notes = 'Settlement arrived 1-2 days later than expected'
  } else if (roll < 0.99) {
    // Duplicate
    status = 'discrepancy'
    discrepancyType = 'duplicate'
    notes = 'Possible duplicate transaction detected'
  } else {
    // Missing POS
    status = 'discrepancy'
    discrepancyType = 'missing_pos'
    bankAmount = tx.amount
    notes = 'Bank settlement received without matching POS record'
  }

  return {
    id: `REC${tx.id.replace('TXN', '')}`,
    date: tx.date,
    branch: tx.branch,
    posAmount: tx.amount,
    bankAmount,
    status,
    discrepancyType,
    transactionId: tx.id,
    provider: tx.provider,
    notes,
  }
})

// --- Generate settlement records ---

const providerList: PaymentProvider[] = ['BCA', 'Mandiri', 'BRI', 'BNI', 'CIMB Niaga', 'GoPay', 'OVO', 'ShopeePay', 'DANA', 'QRIS', 'Shopee', 'Cash']
const expectedDaysMap: Record<string, string> = {
  BCA: 'T+0 to T+2',
  Mandiri: 'T+0 to T+2',
  BRI: 'T+1 to T+2',
  BNI: 'T+1 to T+2',
  'CIMB Niaga': 'T+1 to T+2',
  GoPay: 'T+0 to T+1',
  OVO: 'T+0 to T+1',
  DANA: 'T+0 to T+1',
  QRIS: 'T+0 to T+1',
  ShopeePay: 'T+3 to T+5',
  Shopee: 'T+3 to T+5',
  Cash: 'T+0',
}

export const settlementRecords: SettlementRecord[] = providerList.map((provider) => {
  const providerTxns = transactions.filter((t) => t.provider === provider)
  const pending = providerTxns.filter((t) => t.settlementStatus === 'pending')
  const settled = providerTxns.filter((t) => t.settlementStatus === 'settled')
  const overdue = providerTxns.filter((t) => t.settlementStatus === 'failed' || t.settlementStatus === 'disputed')

  const pendingAmount = pending.reduce((sum, t) => sum + t.amount, 0)
  const settledAmount = settled.reduce((sum, t) => sum + t.amount, 0)

  const sortedSettled = settled
    .filter((t) => t.settlementDate)
    .sort((a, b) => (b.settlementDate ?? '').localeCompare(a.settlementDate ?? ''))

  return {
    provider,
    expectedDays: expectedDaysMap[provider] ?? 'T+0',
    pendingAmount,
    settledAmount,
    overdueCount: overdue.length,
    lastSettlement: sortedSettled[0]?.settlementDate ?? '-',
  }
})
