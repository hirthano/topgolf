import type { Freelancer, FreelancerPayment, TaxArrangement } from '@/types'

// Deterministic seeded random
function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

const rand = seededRandom(555)

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

// --- PPh21 rates for non-employees (Art. 17) ---
// Progressive rates on 50% of gross (DPP = 50% of bruto for non-employees)
// 0 - 60M: 5%, 60M-250M: 15%, 250M-500M: 25%, 500M-5B: 30%, >5B: 35%
// Without NPWP: 120% of normal rate

function calculatePPh21(grossFee: number, hasNPWP: boolean): { dpp: number; pph21: number } {
  const dpp = grossFee * 0.5 // 50% DPP for non-employees

  let tax = 0
  let remaining = dpp

  const brackets = [
    { limit: 60_000_000, rate: 0.05 },
    { limit: 190_000_000, rate: 0.15 }, // 250M - 60M = 190M
    { limit: 250_000_000, rate: 0.25 }, // 500M - 250M
    { limit: 4_500_000_000, rate: 0.30 },
    { limit: Infinity, rate: 0.35 },
  ]

  for (const bracket of brackets) {
    if (remaining <= 0) break
    const taxable = Math.min(remaining, bracket.limit)
    tax += taxable * bracket.rate
    remaining -= taxable
  }

  // Without NPWP: 120% surcharge
  if (!hasNPWP) {
    tax = tax * 1.2
  }

  return { dpp: Math.round(dpp), pph21: Math.round(tax) }
}

// --- Freelancer data ---

interface FreelancerDef {
  name: string
  role: string
  specialty: string
  minFee: number
  maxFee: number
  sessionsPerMonth: [number, number] // min, max sessions/month
}

const freelancerDefs: FreelancerDef[] = [
  // Golf Instructors (8)
  { name: 'Denny Kurniawan', role: 'Golf Instructor', specialty: 'Short game & putting', minFee: 800_000, maxFee: 2_000_000, sessionsPerMonth: [8, 15] },
  { name: 'Arif Rahman', role: 'Golf Instructor', specialty: 'Driver & long game', minFee: 1_000_000, maxFee: 2_000_000, sessionsPerMonth: [6, 12] },
  { name: 'Lina Harjanto', role: 'Golf Instructor', specialty: 'Beginners & ladies clinic', minFee: 500_000, maxFee: 1_500_000, sessionsPerMonth: [10, 20] },
  { name: 'Kevin Tanuwijaya', role: 'Golf Instructor', specialty: 'Junior development program', minFee: 500_000, maxFee: 1_200_000, sessionsPerMonth: [8, 16] },
  { name: 'Reza Mahendra', role: 'Golf Instructor', specialty: 'Advanced swing mechanics', minFee: 1_500_000, maxFee: 2_000_000, sessionsPerMonth: [4, 8] },
  { name: 'Wulan Sari', role: 'Golf Instructor', specialty: 'Corporate group lessons', minFee: 1_000_000, maxFee: 1_800_000, sessionsPerMonth: [6, 12] },
  { name: 'Bimo Prasetya', role: 'Golf Instructor', specialty: 'Iron play & course strategy', minFee: 800_000, maxFee: 1_500_000, sessionsPerMonth: [8, 14] },
  { name: 'Siska Permata', role: 'Golf Instructor', specialty: 'Fitness & golf conditioning', minFee: 600_000, maxFee: 1_200_000, sessionsPerMonth: [10, 18] },

  // Event Hosts (4)
  { name: 'Dimas Aditya', role: 'Event Host', specialty: 'Golf tournament MC', minFee: 2_000_000, maxFee: 5_000_000, sessionsPerMonth: [1, 4] },
  { name: 'Anisa Rahma', role: 'Event Host', specialty: 'Product launch events', minFee: 1_500_000, maxFee: 3_500_000, sessionsPerMonth: [2, 5] },
  { name: 'Hendro Wijaya', role: 'Event Host', specialty: 'Corporate events & awards', minFee: 2_500_000, maxFee: 5_000_000, sessionsPerMonth: [1, 3] },
  { name: 'Tania Olivia', role: 'Event Host', specialty: 'Brand activation & lifestyle', minFee: 1_000_000, maxFee: 3_000_000, sessionsPerMonth: [2, 5] },

  // Fitting Specialists (4)
  { name: 'Agung Prabowo', role: 'Fitting Specialist', specialty: 'MAJESTY club fitting', minFee: 800_000, maxFee: 1_500_000, sessionsPerMonth: [10, 20] },
  { name: 'Hendri Lim', role: 'Fitting Specialist', specialty: 'PING & TITLEIST fitting', minFee: 800_000, maxFee: 1_500_000, sessionsPerMonth: [8, 16] },
  { name: 'Farhan Maulana', role: 'Fitting Specialist', specialty: 'Launch monitor analysis', minFee: 600_000, maxFee: 1_200_000, sessionsPerMonth: [10, 18] },
  { name: 'Yolanda Chen', role: 'Fitting Specialist', specialty: 'Putter & wedge fitting', minFee: 600_000, maxFee: 1_000_000, sessionsPerMonth: [8, 15] },

  // Photographers (3)
  { name: 'Randy Setiawan', role: 'Photographer', specialty: 'Product photography', minFee: 2_000_000, maxFee: 5_000_000, sessionsPerMonth: [2, 5] },
  { name: 'Cindy Wijaya', role: 'Photographer', specialty: 'Event photography & video', minFee: 3_000_000, maxFee: 5_000_000, sessionsPerMonth: [1, 4] },
  { name: 'Galang Nugroho', role: 'Photographer', specialty: 'Social media content', minFee: 2_000_000, maxFee: 4_000_000, sessionsPerMonth: [3, 6] },

  // Content Creators (3)
  { name: 'Nadia Putri', role: 'Content Creator', specialty: 'Golf lifestyle content', minFee: 1_500_000, maxFee: 3_000_000, sessionsPerMonth: [3, 8] },
  { name: 'Farel Angga', role: 'Content Creator', specialty: 'YouTube golf reviews', minFee: 2_000_000, maxFee: 4_000_000, sessionsPerMonth: [2, 4] },
  { name: 'Priscilla Tan', role: 'Content Creator', specialty: 'Instagram reels & stories', minFee: 1_000_000, maxFee: 2_500_000, sessionsPerMonth: [4, 8] },

  // Promoters (3)
  { name: 'Bagus Pradipta', role: 'Promoter', specialty: 'Mall activation & demos', minFee: 500_000, maxFee: 1_000_000, sessionsPerMonth: [6, 12] },
  { name: 'Niken Larasati', role: 'Promoter', specialty: 'Brand ambassador events', minFee: 750_000, maxFee: 1_500_000, sessionsPerMonth: [4, 10] },
  { name: 'Aldi Firmansyah', role: 'Promoter', specialty: 'Golf expo & trade shows', minFee: 500_000, maxFee: 1_200_000, sessionsPerMonth: [3, 8] },
]

const bankNames = ['BCA', 'Mandiri', 'BRI', 'BNI', 'CIMB Niaga']

// Tax arrangement distribution: 40% gross+NPWP, 25% gross no NPWP, 25% gross-up+NPWP, 10% gross-up no NPWP
function pickTaxSetup(): { arrangement: TaxArrangement; hasNPWP: boolean } {
  const r = rand()
  if (r < 0.40) return { arrangement: 'gross', hasNPWP: true }
  if (r < 0.65) return { arrangement: 'gross', hasNPWP: false }
  if (r < 0.90) return { arrangement: 'gross_up', hasNPWP: true }
  return { arrangement: 'gross_up', hasNPWP: false }
}

function generateNPWP(): string {
  const parts = [
    String(randInt(10, 99)),
    String(randInt(100, 999)),
    String(randInt(100, 999)),
    String(randInt(1, 9)),
    String(randInt(100, 999)),
    String(randInt(100, 999)),
  ]
  return `${parts[0]}.${parts[1]}.${parts[2]}.${parts[3]}-${parts[4]}.${parts[5]}`
}

function generateBankAccount(): string {
  return String(randInt(1000000000, 9999999999))
}

function generatePhone(): string {
  const prefix = pick(['0812', '0813', '0815', '0821', '0822', '0856', '0857', '0858', '0878', '0877'])
  return `${prefix}-${randInt(1000, 9999)}-${randInt(1000, 9999)}`
}

// --- Generate freelancers ---

export const freelancers: Freelancer[] = freelancerDefs.map((def, i) => {
  const { arrangement, hasNPWP } = pickTaxSetup()
  const bank = pick(bankNames)
  const emailName = def.name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z.]/g, '')

  return {
    id: `FRL${String(i + 1).padStart(3, '0')}`,
    name: def.name,
    role: def.role,
    specialty: def.specialty,
    hasNPWP,
    npwpNumber: hasNPWP ? generateNPWP() : undefined,
    taxArrangement: arrangement,
    bankName: bank,
    bankAccount: generateBankAccount(),
    phone: generatePhone(),
    email: `${emailName}@gmail.com`,
    status: rand() < 0.88 ? 'active' : 'inactive',
    totalPaidYTD: 0, // Will be calculated from payments
    lastPaymentDate: '', // Will be set from payments
  }
})

// --- Generate 12 months of payments ---

const paymentStartDate = new Date('2025-05-01')

const allPayments: FreelancerPayment[] = []
let paymentIndex = 0

for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
  const monthDate = new Date(paymentStartDate)
  monthDate.setMonth(monthDate.getMonth() + monthOffset)
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()

  for (let fi = 0; fi < freelancerDefs.length; fi++) {
    const def = freelancerDefs[fi]
    const freelancer = freelancers[fi]

    // Skip inactive freelancers some months
    if (freelancer.status === 'inactive' && rand() < 0.4) continue

    const sessions = randInt(def.sessionsPerMonth[0], def.sessionsPerMonth[1])
    const feePerSession = roundIDR(randInt(def.minFee, def.maxFee))
    const serviceFee = feePerSession * sessions

    const { dpp, pph21 } = calculatePPh21(serviceFee, freelancer.hasNPWP)

    let amountToFreelancer: number
    let taxBorneByCompany: number
    let totalCompanyCost: number

    if (freelancer.taxArrangement === 'gross') {
      // Freelancer bears the tax
      amountToFreelancer = serviceFee - pph21
      taxBorneByCompany = 0
      totalCompanyCost = serviceFee
    } else {
      // Gross-up: company bears the tax
      amountToFreelancer = serviceFee
      taxBorneByCompany = pph21
      totalCompanyCost = serviceFee + pph21
    }

    // Service date: middle of the month
    const serviceDate = new Date(year, month, randInt(1, 25))
    // Payment date: end of month or early next month
    const paymentDate = new Date(year, month, randInt(25, 28))

    // Status: older payments are paid, recent ones pending/approved
    let status: FreelancerPayment['status']
    if (monthOffset < 10) {
      status = 'paid'
    } else if (monthOffset === 10) {
      status = rand() < 0.7 ? 'paid' : 'approved'
    } else {
      const r = rand()
      status = r < 0.3 ? 'paid' : r < 0.7 ? 'approved' : 'pending'
    }

    const descriptions: Record<string, string[]> = {
      'Golf Instructor': [`${sessions} private lesson sessions`, `${sessions} group class sessions`, `${sessions} coaching sessions`],
      'Event Host': [`MC for ${sessions} events`, `Hosted ${sessions} brand events`],
      'Fitting Specialist': [`${sessions} club fitting sessions`, `${sessions} fitting appointments`],
      'Photographer': [`${sessions} photo/video shoots`, `${sessions} content production days`],
      'Content Creator': [`${sessions} content pieces delivered`, `${sessions} social media packages`],
      'Promoter': [`${sessions} promotional event days`, `${sessions} activation shifts`],
    }

    paymentIndex++
    allPayments.push({
      id: `FPY${String(paymentIndex).padStart(5, '0')}`,
      freelancerId: freelancer.id,
      freelancerName: freelancer.name,
      description: pick(descriptions[def.role] ?? [`${sessions} sessions`]),
      serviceDate: formatDate(serviceDate),
      paymentDate: formatDate(paymentDate),
      serviceFee,
      dpp,
      pph21,
      amountToFreelancer,
      taxBorneByCompany,
      totalCompanyCost,
      status,
    })
  }
}

export const freelancerPayments: FreelancerPayment[] = allPayments.sort(
  (a, b) => b.paymentDate.localeCompare(a.paymentDate)
)

// Update freelancer YTD totals and last payment dates from generated payments
// (YTD = 2026)
for (const freelancer of freelancers) {
  const myPayments = freelancerPayments.filter(
    (p) => p.freelancerId === freelancer.id && p.status === 'paid' && p.paymentDate.startsWith('2026')
  )
  freelancer.totalPaidYTD = myPayments.reduce((sum, p) => sum + p.totalCompanyCost, 0)

  const allMyPaid = freelancerPayments.filter(
    (p) => p.freelancerId === freelancer.id && p.status === 'paid'
  )
  if (allMyPaid.length > 0) {
    freelancer.lastPaymentDate = allMyPaid
      .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate))[0].paymentDate
  }
}
