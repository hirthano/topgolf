import type { Reimbursement, ReimbursementCategory, ReimbursementStatus, ApprovalStep } from '@/types'

// Deterministic seeded random
function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

const rand = seededRandom(314)

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

// --- Data pools ---

interface EmployeeRef {
  id: string
  name: string
  department: string
  branch: string
  managerId: string
  managerName: string
}

const employeeRefs: EmployeeRef[] = [
  { id: 'EMP002', name: 'Rina Wijaya', department: 'Sales', branch: 'Topgolf Bellezza', managerId: 'EMP001', managerName: 'Budi Santoso' },
  { id: 'EMP003', name: 'Andi Pratama', department: 'Sales', branch: 'Topgolf SCBD Premier', managerId: 'EMP001', managerName: 'Budi Santoso' },
  { id: 'EMP005', name: 'Fajar Hidayat', department: 'Sales', branch: 'Topgolf Bellezza', managerId: 'EMP002', managerName: 'Rina Wijaya' },
  { id: 'EMP006', name: 'Siti Rahayu', department: 'Sales', branch: 'Topgolf Kelapa Gading', managerId: 'EMP001', managerName: 'Budi Santoso' },
  { id: 'EMP007', name: 'Hendra Gunawan', department: 'Operations', branch: 'Topgolf Pluit Village', managerId: 'EMP001', managerName: 'Budi Santoso' },
  { id: 'EMP008', name: 'Maya Putri', department: 'Marketing', branch: 'Topgolf Cilandak', managerId: 'EMP001', managerName: 'Budi Santoso' },
  { id: 'EMP009', name: 'Rizky Firmansyah', department: 'IT', branch: 'Topgolf SCBD Premier', managerId: 'EMP001', managerName: 'Budi Santoso' },
  { id: 'EMP010', name: 'Lestari Dewi', department: 'Finance', branch: 'Topgolf Pondok Indah', managerId: 'EMP004', managerName: 'Dewi Kusuma' },
  { id: 'EMP011', name: 'Ahmad Fauzi', department: 'Sales', branch: 'Topgolf PIK Avenue', managerId: 'EMP002', managerName: 'Rina Wijaya' },
  { id: 'EMP012', name: 'Nurul Hidayah', department: 'Operations', branch: 'Topgolf Mall of Indonesia', managerId: 'EMP001', managerName: 'Budi Santoso' },
  { id: 'EMP013', name: 'Dian Purnama', department: 'Sales', branch: 'Topgolf Surabaya', managerId: 'EMP001', managerName: 'Budi Santoso' },
  { id: 'EMP014', name: 'Teguh Prasetyo', department: 'Sales', branch: 'Topgolf Hosel Yogyakarta', managerId: 'EMP013', managerName: 'Dian Purnama' },
  { id: 'EMP015', name: 'Wahyu Setiawan', department: 'Marketing', branch: 'Topgolf Plaza Indonesia', managerId: 'EMP008', managerName: 'Maya Putri' },
]

interface CategoryConfig {
  category: ReimbursementCategory
  descriptions: string[]
  minAmount: number
  maxAmount: number
  weight: number
}

const categoryConfigs: CategoryConfig[] = [
  {
    category: 'Parking',
    descriptions: ['Parking fee - client meeting', 'Mall parking for store visit', 'Airport parking for vendor meeting', 'Parking at golf course for event'],
    minAmount: 20_000, maxAmount: 50_000, weight: 15,
  },
  {
    category: 'Dinner/Meals',
    descriptions: ['Lunch meeting with supplier', 'Team dinner after inventory audit', 'Working lunch with branch staff', 'Breakfast meeting - quarterly review'],
    minAmount: 100_000, maxAmount: 500_000, weight: 20,
  },
  {
    category: 'Client Entertainment',
    descriptions: ['Golf day with VIP client', 'Client appreciation dinner at Hotel Mulia', 'Product launch event entertainment', 'Corporate client golf outing'],
    minAmount: 500_000, maxAmount: 2_000_000, weight: 10,
  },
  {
    category: 'Transportation',
    descriptions: ['Grab to branch visit', 'GoRide to warehouse', 'Online taxi to vendor meeting', 'Transport to airport - business trip'],
    minAmount: 50_000, maxAmount: 300_000, weight: 15,
  },
  {
    category: 'Fuel',
    descriptions: ['Fuel for inter-branch delivery', 'Fuel - client visit trip', 'Fuel for event setup logistics', 'Fuel for weekly store rounds'],
    minAmount: 200_000, maxAmount: 500_000, weight: 10,
  },
  {
    category: 'Toll',
    descriptions: ['Toll Jakarta - Tangerang', 'Toll JORR for branch visit', 'Toll Jagorawi - Bandung trip', 'Toll Jakarta - Surabaya via Trans Java'],
    minAmount: 30_000, maxAmount: 200_000, weight: 10,
  },
  {
    category: 'Office Supplies',
    descriptions: ['Printer toner for branch', 'Stationery supplies', 'Display materials for store', 'Cleaning supplies for fitting room'],
    minAmount: 100_000, maxAmount: 1_000_000, weight: 10,
  },
  {
    category: 'Other',
    descriptions: ['Phone top-up for client calls', 'Emergency store maintenance', 'Staff training materials', 'Event decoration supplies'],
    minAmount: 50_000, maxAmount: 500_000, weight: 10,
  },
]

const totalCatWeight = categoryConfigs.reduce((a, b) => a + b.weight, 0)

function pickCategory(): CategoryConfig {
  let r = rand() * totalCatWeight
  for (const c of categoryConfigs) {
    r -= c.weight
    if (r <= 0) return c
  }
  return categoryConfigs[0]
}

// Status distribution: 40% paid, 25% approved, 20% pending, 10% rejected, 5% revision
function pickStatus(): ReimbursementStatus {
  const r = rand()
  if (r < 0.40) return 'paid'
  if (r < 0.65) return 'approved'
  if (r < 0.85) return 'pending_approval'
  if (r < 0.95) return 'rejected'
  return 'revision'
}

function buildApprovalChain(
  employee: EmployeeRef,
  amount: number,
  status: ReimbursementStatus,
  dateSubmitted: string
): { chain: ApprovalStep[]; currentStep: number } {
  const chain: ApprovalStep[] = []

  // Step 1: Direct manager
  chain.push({
    approver: employee.managerName,
    role: 'Direct Manager',
    status: 'pending',
  })

  // Step 2: Finance review (always for amounts > 500K)
  if (amount > 500_000) {
    chain.push({
      approver: 'Dewi Kusuma',
      role: 'Finance Manager',
      status: 'pending',
    })
  }

  // Step 3: COO approval for amounts > 2M
  if (amount > 2_000_000) {
    chain.push({
      approver: 'Budi Santoso',
      role: 'COO',
      status: 'pending',
    })
  }

  let currentStep = 0
  const baseDate = new Date(dateSubmitted)

  if (status === 'pending_approval') {
    // First step still pending
    currentStep = 0
  } else if (status === 'revision') {
    // First step sent back for revision
    chain[0].status = 'revision'
    chain[0].date = formatDate(new Date(baseDate.getTime() + 2 * 86400000))
    chain[0].comment = pick([
      'Receipt not clear, please resubmit',
      'Please provide more detail on business purpose',
      'Amount exceeds policy, need justification',
      'Missing supporting documents',
    ])
    currentStep = 0
  } else if (status === 'rejected') {
    chain[0].status = 'approved'
    chain[0].date = formatDate(new Date(baseDate.getTime() + 1 * 86400000))
    if (chain.length > 1) {
      chain[1].status = 'rejected'
      chain[1].date = formatDate(new Date(baseDate.getTime() + 3 * 86400000))
      chain[1].comment = pick([
        'Exceeds department budget for this quarter',
        'Not aligned with expense policy',
        'Duplicate submission detected',
        'Category not eligible for reimbursement',
      ])
      currentStep = 1
    } else {
      chain[0].status = 'rejected'
      chain[0].comment = 'Not approved per company policy'
      currentStep = 0
    }
  } else {
    // approved or paid: all steps approved
    for (let i = 0; i < chain.length; i++) {
      chain[i].status = 'approved'
      chain[i].date = formatDate(new Date(baseDate.getTime() + (i + 1) * 86400000))
    }
    currentStep = chain.length - 1
  }

  return { chain, currentStep }
}

// --- Generate 220 reimbursements over 6 months ---

const reimbStartDate = new Date('2025-10-01')

export const reimbursements: Reimbursement[] = Array.from({ length: 220 }, (_, i) => {
  const employee = pick(employeeRefs)
  const catConfig = pickCategory()
  const amount = roundIDR(randInt(catConfig.minAmount, catConfig.maxAmount))
  const description = pick(catConfig.descriptions)
  const status = pickStatus()

  // Random date within 6 months
  const dayOffset = randInt(0, 180)
  const expenseDate = new Date(reimbStartDate)
  expenseDate.setDate(expenseDate.getDate() + dayOffset)
  const dateExpense = formatDate(expenseDate)

  // Submitted 0-3 days after expense
  const submitDate = new Date(expenseDate)
  submitDate.setDate(submitDate.getDate() + randInt(0, 3))
  const dateSubmitted = formatDate(submitDate)

  const { chain, currentStep } = buildApprovalChain(employee, amount, status, dateSubmitted)

  return {
    id: `RMB${String(i + 1).padStart(4, '0')}`,
    employeeId: employee.id,
    employeeName: employee.name,
    department: employee.department,
    branch: employee.branch,
    category: catConfig.category,
    amount,
    description,
    dateExpense,
    dateSubmitted,
    status,
    receiptUrl: status !== 'pending_approval' || rand() > 0.3
      ? `https://storage.topgolf.co.id/receipts/${dateExpense.replace(/-/g, '')}/${i + 1}.jpg`
      : undefined,
    approvalChain: chain,
    currentStep,
  }
}).sort((a, b) => b.dateSubmitted.localeCompare(a.dateSubmitted))
