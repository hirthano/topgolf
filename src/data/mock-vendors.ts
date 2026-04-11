import type { Vendor, VendorInvoice, VendorCategory, InvoiceStatus, ApprovalStep } from '@/types'

// Deterministic seeded random
function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

const rand = seededRandom(999)

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)]
}

function randInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min
}

function roundIDR(n: number): number {
  return Math.round(n / 1000) * 1000
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return formatDate(d)
}

// --- Vendor definitions ---

interface VendorDef {
  name: string
  category: VendorCategory
  paymentTerms: string
  contactPerson: string
  phone: string
  email: string
  invoiceItems: string[]
  minAmount: number
  maxAmount: number
  frequency: number // invoices per year approx
}

const vendorDefs: VendorDef[] = [
  // Golf Equipment Distributors (8)
  {
    name: 'PT MAJESTY Golf Indonesia',
    category: 'Inventory/Equipment',
    paymentTerms: 'Net 60',
    contactPerson: 'Tanaka Hiroshi',
    phone: '(021) 5050-8801',
    email: 'order@majestygolf.co.id',
    invoiceItems: ['MAJESTY Prestigio XII Driver', 'MAJESTY Royale SP Iron Set', 'MAJESTY Premium Cart Bag', 'MAJESTY Sublime 50th Driver', 'MAJESTY Premium Leather Belt'],
    minAmount: 50_000_000, maxAmount: 500_000_000, frequency: 12,
  },
  {
    name: 'PT Bridgestone Golf Indonesia',
    category: 'Inventory/Equipment',
    paymentTerms: 'Net 60',
    contactPerson: 'Satoshi Yamamoto',
    phone: '(021) 5050-8802',
    email: 'sales@bridgestonegolf.co.id',
    invoiceItems: ['BRIDGESTONE TOUR B X Golf Balls', 'BRIDGESTONE TOUR B XS Golf Balls', 'BRIDGESTONE TOUR B X-CB Iron Set', 'BRIDGESTONE TOUR B JGR Driver', 'BRIDGESTONE Tour B Cart Bag'],
    minAmount: 20_000_000, maxAmount: 200_000_000, frequency: 12,
  },
  {
    name: 'PT Ping Golf Asia',
    category: 'Inventory/Equipment',
    paymentTerms: 'Net 30',
    contactPerson: 'David Lim',
    phone: '(021) 5050-8803',
    email: 'indonesia@pinggolf.com',
    invoiceItems: ['PING G430 MAX Driver', 'PING i230 Iron Set', 'PING G430 SFT Fairway Wood', 'PING Hoofer Lite Stand Bag', 'PING SensorDry Polo', 'PING Alignment Stick Set'],
    minAmount: 30_000_000, maxAmount: 300_000_000, frequency: 12,
  },
  {
    name: 'PT Acushnet Indonesia (TITLEIST)',
    category: 'Inventory/Equipment',
    paymentTerms: 'Net 30',
    contactPerson: 'Michael Chen',
    phone: '(021) 5050-8804',
    email: 'order@titleist.co.id',
    invoiceItems: ['TITLEIST Pro V1 Golf Balls', 'TITLEIST Pro V1x Golf Balls', 'TITLEIST TSR3 Driver', 'TITLEIST T200 Iron Set', 'TITLEIST Vokey SM10 Wedge', 'TITLEIST Players 4 StaDry Stand Bag', 'SCOTTY CAMERON Special Select Putter'],
    minAmount: 40_000_000, maxAmount: 400_000_000, frequency: 12,
  },
  {
    name: 'PT FootJoy Indonesia',
    category: 'Inventory/Equipment',
    paymentTerms: 'Net 30',
    contactPerson: 'Sandra Halim',
    phone: '(021) 5050-8805',
    email: 'wholesale@footjoy.co.id',
    invoiceItems: ['FOOTJOY ProDry Polo Shirt', 'FOOTJOY HydroLite Rain Jacket', 'FOOTJOY Premiere Series Shoes', 'FOOTJOY WeatherSof Glove'],
    minAmount: 15_000_000, maxAmount: 150_000_000, frequency: 12,
  },
  {
    name: 'PT Callaway Golf Nusantara',
    category: 'Inventory/Equipment',
    paymentTerms: 'Net 30',
    contactPerson: 'Steven Liau',
    phone: '(021) 5050-8806',
    email: 'orders@callawaygolf.co.id',
    invoiceItems: ['CALLAWAY Paradym Ai Smoke Driver', 'CALLAWAY Apex Pro Iron Set', 'CALLAWAY Chrome Soft X Golf Balls', 'CALLAWAY Fairway C Stand Bag', 'ODYSSEY White Hot OG Putter'],
    minAmount: 25_000_000, maxAmount: 250_000_000, frequency: 10,
  },
  {
    name: 'PT Garmin Indonesia',
    category: 'Inventory/Equipment',
    paymentTerms: '2/10 Net 30',
    contactPerson: 'Tommy Wijaya',
    phone: '(021) 5050-8807',
    email: 'b2b@garmin.co.id',
    invoiceItems: ['GARMIN Approach S62 GPS Watch', 'GARMIN Approach Z82 Rangefinder'],
    minAmount: 20_000_000, maxAmount: 100_000_000, frequency: 6,
  },
  {
    name: 'PT Bushnell Golf Asia',
    category: 'Inventory/Equipment',
    paymentTerms: '2/10 Net 30',
    contactPerson: 'Richard Tan',
    phone: '(021) 5050-8808',
    email: 'apac@bushnellgolf.com',
    invoiceItems: ['BUSHNELL Pro X3 Rangefinder', 'BUSHNELL Tour V5 Shift'],
    minAmount: 15_000_000, maxAmount: 80_000_000, frequency: 4,
  },

  // Logistics (4)
  {
    name: 'PT JNE Express',
    category: 'Logistics',
    paymentTerms: 'Net 30',
    contactPerson: 'Agus Supriyadi',
    phone: '(021) 2927-8888',
    email: 'corporate@jne.co.id',
    invoiceItems: ['Monthly shipping services', 'Express delivery charges', 'Insurance surcharges', 'Return logistics handling'],
    minAmount: 5_000_000, maxAmount: 30_000_000, frequency: 12,
  },
  {
    name: 'PT SiCepat Ekspres',
    category: 'Logistics',
    paymentTerms: 'Net 30',
    contactPerson: 'Bambang Wicaksono',
    phone: '(021) 5020-0050',
    email: 'business@sicepat.com',
    invoiceItems: ['Same-day delivery services', 'Regular parcel shipments', 'Packaging materials', 'Warehouse to store delivery'],
    minAmount: 3_000_000, maxAmount: 20_000_000, frequency: 12,
  },
  {
    name: 'PT Lalamove Indonesia',
    category: 'Logistics',
    paymentTerms: 'Net 30',
    contactPerson: 'Cindy Anggraeni',
    phone: '(021) 3000-5500',
    email: 'corporate@lalamove.com',
    invoiceItems: ['Inter-branch delivery services', 'Urgent store-to-store transfers', 'Event equipment transport'],
    minAmount: 2_000_000, maxAmount: 15_000_000, frequency: 12,
  },
  {
    name: 'PT Wahana Prestasi Logistik',
    category: 'Logistics',
    paymentTerms: 'Net 30',
    contactPerson: 'Denny Kurniawan',
    phone: '(021) 7340-1111',
    email: 'corporate@wahana.com',
    invoiceItems: ['Warehouse logistics services', 'Monthly distribution', 'Cold storage handling'],
    minAmount: 3_000_000, maxAmount: 25_000_000, frequency: 10,
  },

  // Marketing (4)
  {
    name: 'PT Dentsu Indonesia',
    category: 'Marketing',
    paymentTerms: 'Net 60',
    contactPerson: 'Lisa Permata',
    phone: '(021) 5795-8000',
    email: 'topgolf@dentsu.co.id',
    invoiceItems: ['Digital marketing campaign Q retainer', 'Social media management', 'Google Ads management fee', 'Meta Ads management fee'],
    minAmount: 30_000_000, maxAmount: 150_000_000, frequency: 4,
  },
  {
    name: 'PT Kompas Gramedia (Advertising)',
    category: 'Marketing',
    paymentTerms: 'Net 30',
    contactPerson: 'Irene Sulistyo',
    phone: '(021) 5350-1515',
    email: 'ads@kompas.com',
    invoiceItems: ['Print advertisement - Kompas', 'Online banner - Kompas.com', 'Advertorial content package'],
    minAmount: 10_000_000, maxAmount: 80_000_000, frequency: 6,
  },
  {
    name: 'PT Bali Kreatif Digital',
    category: 'Marketing',
    paymentTerms: 'Net 30',
    contactPerson: 'Putu Angga',
    phone: '(021) 2188-7700',
    email: 'hello@balikreatif.id',
    invoiceItems: ['Website maintenance & hosting', 'UI/UX design services', 'App development sprint', 'SEO optimization package'],
    minAmount: 5_000_000, maxAmount: 50_000_000, frequency: 12,
  },
  {
    name: 'PT Printmax Indonesia',
    category: 'Marketing',
    paymentTerms: '2/10 Net 30',
    contactPerson: 'Yanto Halim',
    phone: '(021) 6583-2200',
    email: 'order@printmax.co.id',
    invoiceItems: ['Store banners & signage', 'Product brochures printing', 'Event backdrop & materials', 'Shopping bag production'],
    minAmount: 2_000_000, maxAmount: 30_000_000, frequency: 8,
  },

  // Maintenance & Facilities (4)
  {
    name: 'PT ISS Indonesia',
    category: 'Services',
    paymentTerms: 'Net 30',
    contactPerson: 'Hartono Sugianto',
    phone: '(021) 7884-5555',
    email: 'corporate@iss.co.id',
    invoiceItems: ['Monthly cleaning services - all branches', 'Deep cleaning quarterly', 'Pest control treatment', 'Window cleaning'],
    minAmount: 15_000_000, maxAmount: 50_000_000, frequency: 12,
  },
  {
    name: 'PT Trisakti Aircon Service',
    category: 'Services',
    paymentTerms: 'Net 30',
    contactPerson: 'Benny Pranoto',
    phone: '(021) 8877-4400',
    email: 'service@trisaktiaircon.co.id',
    invoiceItems: ['AC maintenance contract', 'AC unit replacement', 'Ducting cleaning service', 'Emergency repair service'],
    minAmount: 5_000_000, maxAmount: 40_000_000, frequency: 6,
  },
  {
    name: 'PT Sentra Mebel Jaya',
    category: 'Store Fixtures',
    paymentTerms: 'Net 60',
    contactPerson: 'Herman Salim',
    phone: '(021) 5466-3300',
    email: 'project@sentramebel.co.id',
    invoiceItems: ['Display rack fabrication', 'Store shelf units', 'Fitting room renovation', 'Custom display cabinet'],
    minAmount: 10_000_000, maxAmount: 100_000_000, frequency: 4,
  },
  {
    name: 'PT Security One Indonesia',
    category: 'Services',
    paymentTerms: 'Net 30',
    contactPerson: 'Agung Nugroho',
    phone: '(021) 7722-3344',
    email: 'ops@securityone.co.id',
    invoiceItems: ['Monthly security guard services', 'CCTV maintenance', 'Security system upgrade', 'Guard overtime charges'],
    minAmount: 20_000_000, maxAmount: 60_000_000, frequency: 12,
  },

  // IT & Software (4)
  {
    name: 'PT Moka Teknologi Indonesia',
    category: 'Services',
    paymentTerms: 'Net 30',
    contactPerson: 'Reza Firmansyah',
    phone: '(021) 3973-5500',
    email: 'enterprise@mokapos.com',
    invoiceItems: ['POS system monthly license (16 branches)', 'POS hardware maintenance', 'Software update & support', 'Data analytics add-on'],
    minAmount: 10_000_000, maxAmount: 40_000_000, frequency: 12,
  },
  {
    name: 'PT Telkom Indonesia',
    category: 'Utilities',
    paymentTerms: 'Net 30',
    contactPerson: 'Samsul Arifin',
    phone: '147',
    email: 'corporate@telkom.co.id',
    invoiceItems: ['Internet service - all branches', 'Dedicated line service', 'Cloud hosting', 'VPN service'],
    minAmount: 8_000_000, maxAmount: 25_000_000, frequency: 12,
  },
  {
    name: 'PT Amazon Web Services Indonesia',
    category: 'Services',
    paymentTerms: 'Net 30',
    contactPerson: 'Kevin Prasetyo',
    phone: '(021) 5098-7700',
    email: 'enterprise@aws.co.id',
    invoiceItems: ['AWS monthly cloud infrastructure', 'S3 storage charges', 'CloudFront CDN', 'RDS database service'],
    minAmount: 5_000_000, maxAmount: 20_000_000, frequency: 12,
  },
  {
    name: 'PT Accurate Solusi Integrasi',
    category: 'Services',
    paymentTerms: 'Net 30',
    contactPerson: 'Diana Halim',
    phone: '(021) 5350-6666',
    email: 'support@accurate.id',
    invoiceItems: ['Accurate Online accounting license', 'Monthly support & maintenance', 'Integration development', 'Training & onboarding'],
    minAmount: 3_000_000, maxAmount: 15_000_000, frequency: 12,
  },

  // Utilities (2)
  {
    name: 'PT PLN (Persero)',
    category: 'Utilities',
    paymentTerms: 'Net 30',
    contactPerson: 'PLN Corporate',
    phone: '123',
    email: 'corporate@pln.co.id',
    invoiceItems: ['Monthly electricity - all branches', 'Power capacity upgrade', 'Meter maintenance'],
    minAmount: 15_000_000, maxAmount: 60_000_000, frequency: 12,
  },
  {
    name: 'PT PAM Jaya',
    category: 'Utilities',
    paymentTerms: 'Net 30',
    contactPerson: 'PAM Corporate',
    phone: '(021) 2260-0000',
    email: 'layanan@pamjaya.co.id',
    invoiceItems: ['Monthly water supply - Jakarta branches', 'Water meter maintenance'],
    minAmount: 2_000_000, maxAmount: 8_000_000, frequency: 12,
  },
]

const bankNames = ['BCA', 'Mandiri', 'BRI', 'BNI', 'CIMB Niaga']

// --- Generate vendors ---

export const vendors: Vendor[] = vendorDefs.map((def, i) => {
  const bank = pick(bankNames)
  return {
    id: `VND${String(i + 1).padStart(3, '0')}`,
    name: def.name,
    category: def.category,
    bankName: bank,
    bankAccount: String(randInt(1000000000, 9999999999)),
    paymentTerms: def.paymentTerms,
    totalPaidYTD: 0, // Will be calculated
    outstandingBalance: 0, // Will be calculated
    status: rand() < 0.93 ? 'active' : 'inactive',
    contactPerson: def.contactPerson,
    phone: def.phone,
    email: def.email,
  }
})

// --- Generate invoices (300+ over 12 months) ---

const invoiceStartDate = new Date('2025-05-01')
const allInvoices: VendorInvoice[] = []
let invoiceIndex = 0

for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
  const monthDate = new Date(invoiceStartDate)
  monthDate.setMonth(monthDate.getMonth() + monthOffset)
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()

  for (let vi = 0; vi < vendorDefs.length; vi++) {
    const def = vendorDefs[vi]
    const vendor = vendors[vi]

    // Determine how many invoices this month based on frequency
    const monthlyChance = def.frequency / 12
    const numInvoices = rand() < monthlyChance ? (rand() < 0.3 ? 2 : 1) : 0

    for (let inv = 0; inv < numInvoices; inv++) {
      invoiceIndex++

      const amount = roundIDR(randInt(def.minAmount, def.maxAmount))
      const issueDay = randInt(1, 25)
      const issueDate = formatDate(new Date(year, month, issueDay))

      // Due date based on payment terms
      let dueDays = 30
      if (def.paymentTerms === 'Net 60') dueDays = 60
      else if (def.paymentTerms === '2/10 Net 30') dueDays = 30
      const dueDate = addDays(issueDate, dueDays)

      // Status depends on age
      let status: InvoiceStatus
      const today = new Date('2026-04-11')
      const issueDateObj = new Date(issueDate)
      const daysSinceIssue = Math.floor((today.getTime() - issueDateObj.getTime()) / 86400000)

      if (daysSinceIssue > dueDays + 30) {
        // Old invoices: mostly paid, some disputed
        status = rand() < 0.92 ? 'paid' : 'disputed'
      } else if (daysSinceIssue > dueDays) {
        // Past due: paid, scheduled, or disputed
        const r = rand()
        status = r < 0.6 ? 'paid' : r < 0.85 ? 'scheduled' : 'disputed'
      } else if (daysSinceIssue > 14) {
        // Mid-cycle: mix of statuses
        const r = rand()
        if (r < 0.3) status = 'paid'
        else if (r < 0.55) status = 'scheduled'
        else if (r < 0.75) status = 'approved'
        else if (r < 0.9) status = 'verified'
        else status = 'received'
      } else {
        // Recent: early pipeline
        const r = rand()
        if (r < 0.2) status = 'approved'
        else if (r < 0.5) status = 'verified'
        else status = 'received'
      }

      const numItems = randInt(1, Math.min(3, def.invoiceItems.length))
      const items: string[] = []
      for (let n = 0; n < numItems; n++) {
        const item = pick(def.invoiceItems)
        if (!items.includes(item)) items.push(item)
      }

      // PO number for equipment orders
      const poNumber = def.category === 'Inventory/Equipment'
        ? `PO-${year}${String(month + 1).padStart(2, '0')}-${String(invoiceIndex).padStart(4, '0')}`
        : undefined

      // Approval chain for larger amounts
      let approvalChain: ApprovalStep[] | undefined
      if (amount > 10_000_000) {
        approvalChain = [
          {
            approver: 'Dewi Kusuma',
            role: 'Finance Manager',
            status: ['paid', 'scheduled', 'approved'].includes(status) ? 'approved' : 'pending',
            date: ['paid', 'scheduled', 'approved'].includes(status) ? addDays(issueDate, randInt(1, 3)) : undefined,
          },
        ]
        if (amount > 50_000_000) {
          approvalChain.push({
            approver: 'Budi Santoso',
            role: 'COO',
            status: ['paid', 'scheduled'].includes(status) ? 'approved' : 'pending',
            date: ['paid', 'scheduled'].includes(status) ? addDays(issueDate, randInt(3, 5)) : undefined,
          })
        }
      }

      const invNum = `INV/${vendor.name.split(' ')[1]?.toUpperCase().substring(0, 3) ?? 'XXX'}/${year}/${String(month + 1).padStart(2, '0')}/${String(invoiceIndex).padStart(4, '0')}`

      allInvoices.push({
        id: `VINV${String(invoiceIndex).padStart(5, '0')}`,
        invoiceNumber: invNum,
        vendorId: vendor.id,
        vendorName: vendor.name,
        amount,
        issueDate,
        dueDate,
        paymentTerms: def.paymentTerms,
        status,
        poNumber,
        items,
        approvalChain,
      })
    }
  }
}

export const vendorInvoices: VendorInvoice[] = allInvoices.sort(
  (a, b) => b.issueDate.localeCompare(a.issueDate)
)

// Update vendor YTD totals from invoices
for (const vendor of vendors) {
  const myInvoices = vendorInvoices.filter((inv) => inv.vendorId === vendor.id)
  const paidInvoices = myInvoices.filter(
    (inv) => inv.status === 'paid' && inv.issueDate.startsWith('2026')
  )
  const outstandingInvoices = myInvoices.filter(
    (inv) => !['paid', 'disputed'].includes(inv.status)
  )

  vendor.totalPaidYTD = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0)
  vendor.outstandingBalance = outstandingInvoices.reduce((sum, inv) => sum + inv.amount, 0)
}
