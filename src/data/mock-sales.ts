import type { SalesRecord, Product, BranchReport } from '@/types'

// Deterministic seeded random
function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

const rand = seededRandom(777)

function randInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min
}

function roundIDR(n: number): number {
  return Math.round(n / 1000) * 1000
}

// --- Branch config for volume weighting ---

interface BranchConfig {
  name: string
  baseDaily: number  // base daily revenue in IDR
  growthFactor: number // multiplier for newer/growing stores
}

const branchConfigs: BranchConfig[] = [
  { name: 'Topgolf Bellezza', baseDaily: 85_000_000, growthFactor: 1.0 },
  { name: 'Topgolf SCBD Premier', baseDaily: 120_000_000, growthFactor: 1.0 },
  { name: 'Topgolf Kelapa Gading', baseDaily: 65_000_000, growthFactor: 1.0 },
  { name: 'Topgolf Pluit Village', baseDaily: 50_000_000, growthFactor: 1.0 },
  { name: 'Topgolf Cilandak', baseDaily: 55_000_000, growthFactor: 1.0 },
  { name: 'Topgolf Rawamangun', baseDaily: 40_000_000, growthFactor: 1.05 },
  { name: 'Topgolf Pondok Indah', baseDaily: 110_000_000, growthFactor: 1.0 },
  { name: 'Topgolf PIK Avenue', baseDaily: 75_000_000, growthFactor: 1.08 },
  { name: 'Topgolf Mall of Indonesia', baseDaily: 45_000_000, growthFactor: 1.1 },
  { name: 'Topgolf Plaza Indonesia', baseDaily: 100_000_000, growthFactor: 1.0 },
  { name: 'Topgolf Surabaya', baseDaily: 55_000_000, growthFactor: 1.12 },
  { name: 'Topgolf Hosel Yogyakarta', baseDaily: 30_000_000, growthFactor: 1.15 },
  { name: 'Topgolf Albatross Tangerang', baseDaily: 45_000_000, growthFactor: 1.1 },
  { name: 'Topgolf Bandung', baseDaily: 40_000_000, growthFactor: 1.12 },
  { name: 'Topgolf Balikpapan', baseDaily: 25_000_000, growthFactor: 1.18 },
]

const categories = ['Golf Clubs', 'Golf Bags', 'Golf Balls', 'Apparel', 'Accessories', 'Fitting Services'] as const
const categoryWeights: Record<string, number> = {
  'Golf Clubs': 0.35,
  'Golf Bags': 0.12,
  'Golf Balls': 0.10,
  'Apparel': 0.20,
  'Accessories': 0.13,
  'Fitting Services': 0.10,
}

// Seasonality: month-based multiplier (1-indexed)
// Higher around Hari Raya (May~Apr), Christmas (Dec), year-end corporate
function getSeasonality(month: number): number {
  const seasonMap: Record<number, number> = {
    1: 0.85,   // Jan: post-holiday dip
    2: 0.90,   // Feb: recovery
    3: 0.95,   // Mar: Ramadan prep
    4: 1.10,   // Apr: Ramadan / pre-Lebaran gifts
    5: 1.25,   // May: Hari Raya Idul Fitri peak
    6: 1.00,   // Jun: normalize
    7: 0.95,   // Jul: slight dip
    8: 1.05,   // Aug: Independence Day promotions
    9: 0.95,   // Sep: normal
    10: 1.00,  // Oct: normal
    11: 1.10,  // Nov: year-end corporate orders start
    12: 1.20,  // Dec: Christmas + year-end peak
  }
  return seasonMap[month] ?? 1.0
}

// Day-of-week factor (0=Sun)
function getDayOfWeekFactor(dow: number): number {
  const factors = [1.3, 0.6, 0.7, 0.8, 0.85, 1.0, 1.4] // Sun, Mon..Sat
  return factors[dow]
}

// --- Generate 12 months of daily sales data ---

const salesStartDate = new Date('2025-05-01')
const salesEndDate = new Date('2026-04-10')

export const salesData: SalesRecord[] = []

const currentDate = new Date(salesStartDate)
while (currentDate <= salesEndDate) {
  const month = currentDate.getMonth() + 1
  const dow = currentDate.getDay()
  const seasonality = getSeasonality(month)
  const dowFactor = getDayOfWeekFactor(dow)
  const dateStr = currentDate.toISOString().split('T')[0]

  // Growth over time (newer stores ramp up)
  const monthsFromStart = (currentDate.getFullYear() - 2025) * 12 + (currentDate.getMonth() - 4)
  const growthMultiplier = 1 + monthsFromStart * 0.008 // ~1% monthly growth overall

  for (const branch of branchConfigs) {
    const branchGrowth = 1 + (branch.growthFactor - 1) * monthsFromStart

    for (const cat of categories) {
      const catWeight = categoryWeights[cat]
      const baseRevenue = branch.baseDaily * catWeight * seasonality * dowFactor * branchGrowth * growthMultiplier
      // Add noise: +/- 30%
      const noise = 0.7 + rand() * 0.6
      const revenue = roundIDR(baseRevenue * noise)

      // Estimate units and transactions
      let avgItemPrice: number
      switch (cat) {
        case 'Golf Clubs': avgItemPrice = 15_000_000; break
        case 'Golf Bags': avgItemPrice = 5_000_000; break
        case 'Golf Balls': avgItemPrice = 800_000; break
        case 'Apparel': avgItemPrice = 1_500_000; break
        case 'Accessories': avgItemPrice = 1_000_000; break
        case 'Fitting Services': avgItemPrice = 1_000_000; break
        default: avgItemPrice = 2_000_000
      }

      const units = Math.max(1, Math.round(revenue / avgItemPrice))
      const txns = Math.max(1, Math.round(units * (0.6 + rand() * 0.4)))

      salesData.push({
        date: dateStr,
        branch: branch.name,
        revenue,
        units,
        transactions: txns,
        category: cat,
      })
    }
  }
  currentDate.setDate(currentDate.getDate() + 1)
}

// --- Products (50 items) ---

interface ProductDef {
  name: string
  brand: string
  category: Product['category']
  price: number
}

const productDefs: ProductDef[] = [
  // Golf Clubs (15)
  { name: 'MAJESTY Prestigio XII Driver', brand: 'MAJESTY', category: 'Golf Clubs', price: 45_000_000 },
  { name: 'MAJESTY Royale SP Iron Set (5-PW)', brand: 'MAJESTY', category: 'Golf Clubs', price: 38_000_000 },
  { name: 'MAJESTY Sublime 50th Driver', brand: 'MAJESTY', category: 'Golf Clubs', price: 52_000_000 },
  { name: 'PING G430 MAX Driver', brand: 'PING', category: 'Golf Clubs', price: 9_500_000 },
  { name: 'PING i230 Iron Set (4-PW)', brand: 'PING', category: 'Golf Clubs', price: 18_500_000 },
  { name: 'PING G430 SFT Fairway Wood', brand: 'PING', category: 'Golf Clubs', price: 6_800_000 },
  { name: 'TITLEIST TSR3 Driver', brand: 'TITLEIST', category: 'Golf Clubs', price: 11_000_000 },
  { name: 'TITLEIST T200 Iron Set (5-PW)', brand: 'TITLEIST', category: 'Golf Clubs', price: 16_000_000 },
  { name: 'TITLEIST Vokey SM10 Wedge', brand: 'TITLEIST', category: 'Golf Clubs', price: 3_500_000 },
  { name: 'BRIDGESTONE TOUR B X-CB Iron Set', brand: 'BRIDGESTONE', category: 'Golf Clubs', price: 14_000_000 },
  { name: 'BRIDGESTONE TOUR B JGR Driver', brand: 'BRIDGESTONE', category: 'Golf Clubs', price: 8_500_000 },
  { name: 'CALLAWAY Paradym Ai Smoke Driver', brand: 'CALLAWAY', category: 'Golf Clubs', price: 10_500_000 },
  { name: 'CALLAWAY Apex Pro Iron Set', brand: 'CALLAWAY', category: 'Golf Clubs', price: 17_500_000 },
  { name: 'SCOTTY CAMERON Special Select Putter', brand: 'TITLEIST', category: 'Golf Clubs', price: 7_200_000 },
  { name: 'ODYSSEY White Hot OG Putter', brand: 'CALLAWAY', category: 'Golf Clubs', price: 4_800_000 },

  // Golf Bags (7)
  { name: 'TITLEIST Players 4 StaDry Stand Bag', brand: 'TITLEIST', category: 'Golf Bags', price: 4_500_000 },
  { name: 'TITLEIST Hybrid 14 Cart Bag', brand: 'TITLEIST', category: 'Golf Bags', price: 5_200_000 },
  { name: 'PING Hoofer Lite Stand Bag', brand: 'PING', category: 'Golf Bags', price: 3_800_000 },
  { name: 'MAJESTY Premium Cart Bag', brand: 'MAJESTY', category: 'Golf Bags', price: 12_500_000 },
  { name: 'BRIDGESTONE Tour B Cart Bag', brand: 'BRIDGESTONE', category: 'Golf Bags', price: 3_200_000 },
  { name: 'CALLAWAY Fairway C Stand Bag', brand: 'CALLAWAY', category: 'Golf Bags', price: 3_500_000 },
  { name: 'OGIO Fuse Stand Bag', brand: 'OGIO', category: 'Golf Bags', price: 4_000_000 },

  // Golf Balls (6)
  { name: 'TITLEIST Pro V1 (1 dozen)', brand: 'TITLEIST', category: 'Golf Balls', price: 950_000 },
  { name: 'TITLEIST Pro V1x (1 dozen)', brand: 'TITLEIST', category: 'Golf Balls', price: 950_000 },
  { name: 'BRIDGESTONE TOUR B X (1 dozen)', brand: 'BRIDGESTONE', category: 'Golf Balls', price: 850_000 },
  { name: 'BRIDGESTONE TOUR B XS (1 dozen)', brand: 'BRIDGESTONE', category: 'Golf Balls', price: 850_000 },
  { name: 'CALLAWAY Chrome Soft X (1 dozen)', brand: 'CALLAWAY', category: 'Golf Balls', price: 800_000 },
  { name: 'SRIXON Z-Star XV (1 dozen)', brand: 'SRIXON', category: 'Golf Balls', price: 750_000 },

  // Apparel (10)
  { name: 'FOOTJOY ProDry Polo Shirt', brand: 'FOOTJOY', category: 'Apparel', price: 1_200_000 },
  { name: 'FOOTJOY HydroLite Rain Jacket', brand: 'FOOTJOY', category: 'Apparel', price: 3_500_000 },
  { name: 'FOOTJOY Premiere Series Shoes', brand: 'FOOTJOY', category: 'Apparel', price: 4_200_000 },
  { name: 'FOOTJOY WeatherSof Glove', brand: 'FOOTJOY', category: 'Apparel', price: 450_000 },
  { name: 'PING SensorDry Polo', brand: 'PING', category: 'Apparel', price: 1_100_000 },
  { name: 'TITLEIST Performance Cap', brand: 'TITLEIST', category: 'Apparel', price: 550_000 },
  { name: 'ADIDAS Codechaos Golf Shoes', brand: 'ADIDAS', category: 'Apparel', price: 2_800_000 },
  { name: 'PUMA IGNITE Fasten8 Shoes', brand: 'PUMA', category: 'Apparel', price: 2_400_000 },
  { name: 'UNDER ARMOUR Drive Polo', brand: 'UNDER ARMOUR', category: 'Apparel', price: 1_500_000 },
  { name: 'MAJESTY Premium Leather Belt', brand: 'MAJESTY', category: 'Apparel', price: 1_800_000 },

  // Accessories (7)
  { name: 'GARMIN Approach S62 GPS Watch', brand: 'GARMIN', category: 'Accessories', price: 8_500_000 },
  { name: 'BUSHNELL Pro X3 Rangefinder', brand: 'BUSHNELL', category: 'Accessories', price: 7_800_000 },
  { name: 'ARCCOS Caddie Smart Sensors', brand: 'ARCCOS', category: 'Accessories', price: 4_500_000 },
  { name: 'PING Alignment Stick Set', brand: 'PING', category: 'Accessories', price: 450_000 },
  { name: 'SKLZ Gold Flex Trainer', brand: 'SKLZ', category: 'Accessories', price: 850_000 },
  { name: 'TITLEIST Players Glove', brand: 'TITLEIST', category: 'Accessories', price: 500_000 },
  { name: 'CALLAWAY Supersoft Practice Balls (50 pk)', brand: 'CALLAWAY', category: 'Accessories', price: 650_000 },

  // Fitting Services (5)
  { name: 'Premium Full Bag Fitting', brand: 'Topgolf', category: 'Fitting Services', price: 2_000_000 },
  { name: 'Driver Fitting & Launch Monitor Analysis', brand: 'Topgolf', category: 'Fitting Services', price: 1_200_000 },
  { name: 'Iron Set Fitting', brand: 'Topgolf', category: 'Fitting Services', price: 1_000_000 },
  { name: 'Putter Fitting with SAM PuttLab', brand: 'Topgolf', category: 'Fitting Services', price: 800_000 },
  { name: 'Basic Club Fitting Session', brand: 'Topgolf', category: 'Fitting Services', price: 500_000 },
]

export const products: Product[] = productDefs.map((p, i) => {
  // Generate realistic units sold based on price (cheaper = more units)
  const priceRank = p.price < 1_000_000 ? 5 : p.price < 3_000_000 ? 3 : p.price < 10_000_000 ? 1.5 : 1
  const unitsSold = randInt(Math.round(50 * priceRank), Math.round(300 * priceRank))
  return {
    id: `PROD${String(i + 1).padStart(3, '0')}`,
    name: p.name,
    brand: p.brand,
    category: p.category,
    price: p.price,
    unitsSold,
    revenue: unitsSold * p.price,
  }
})

// --- Branch reports ---

const branchPICs: Record<string, string> = {
  'Topgolf Bellezza': 'Rina Wijaya',
  'Topgolf SCBD Premier': 'Andi Pratama',
  'Topgolf Kelapa Gading': 'Siti Rahayu',
  'Topgolf Pluit Village': 'Hendra Gunawan',
  'Topgolf Cilandak': 'Maya Putri',
  'Topgolf Rawamangun': 'Rizky Firmansyah',
  'Topgolf Pondok Indah': 'Lestari Dewi',
  'Topgolf PIK Avenue': 'Ahmad Fauzi',
  'Topgolf Mall of Indonesia': 'Nurul Hidayah',
  'Topgolf Plaza Indonesia': 'Wahyu Setiawan',
  'Topgolf Surabaya': 'Dian Purnama',
  'Topgolf Hosel Yogyakarta': 'Teguh Prasetyo',
  'Topgolf Albatross Tangerang': 'Rini Susanti',
  'Topgolf Bandung': 'Eko Widodo',
  'Topgolf Balikpapan': 'Yudi Hermawan',
}

export const branchReports: BranchReport[] = branchConfigs.map((branch) => {
  // Calculate current month revenue from salesData (April 2026)
  const monthSales = salesData.filter(
    (s) => s.branch === branch.name && s.date.startsWith('2026-04')
  )
  const revenue = monthSales.reduce((sum, s) => sum + s.revenue, 0)

  // Target is baseDaily * 30 * seasonality for April
  const target = roundIDR(branch.baseDaily * 30 * getSeasonality(4))
  const cogs = roundIDR(revenue * (0.55 + rand() * 0.1)) // 55-65% COGS

  // Sync status
  const syncRoll = rand()
  const status: BranchReport['status'] = syncRoll < 0.75 ? 'synced' : syncRoll < 0.92 ? 'partial' : 'missing'

  // Last sync within last few hours for synced, longer for others
  const hoursAgo = status === 'synced' ? randInt(0, 3) : status === 'partial' ? randInt(6, 24) : randInt(24, 72)
  const lastSync = new Date('2026-04-11T10:00:00+07:00')
  lastSync.setHours(lastSync.getHours() - hoursAgo)

  return {
    branch: branch.name,
    status,
    lastSync: lastSync.toISOString(),
    pic: branchPICs[branch.name] ?? 'TBD',
    revenue,
    target,
    cogs,
  }
})
