// Auth & Users
export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'pic' | 'finance' | 'employee'
  branch?: string
  avatar?: string
}

export interface Branch {
  id: string
  name: string
  city: string
  address: string
  pic: string
  phone: string
  status: 'active' | 'inactive'
}

// Payment Module
export type PaymentChannel = 'card' | 'ewallet' | 'bank_transfer' | 'marketplace' | 'cash'
export type SettlementStatus = 'settled' | 'pending' | 'failed' | 'disputed'
export type PaymentProvider = 'BCA' | 'Mandiri' | 'BRI' | 'BNI' | 'CIMB Niaga' | 'GoPay' | 'OVO' | 'ShopeePay' | 'DANA' | 'QRIS' | 'Shopee' | 'Cash'

export interface Transaction {
  id: string
  date: string
  branch: string
  customerName: string
  amount: number
  paymentMethod: PaymentChannel
  provider: PaymentProvider
  settlementStatus: SettlementStatus
  settlementDate: string | null
  posReference: string
  productCategory: string
  items: string[]
}

export interface ReconciliationRecord {
  id: string
  date: string
  branch: string
  posAmount: number
  bankAmount: number | null
  status: 'matched' | 'unmatched' | 'discrepancy'
  discrepancyType?: 'amount_mismatch' | 'missing_bank' | 'missing_pos' | 'duplicate' | 'timing'
  transactionId: string
  provider: PaymentProvider
  notes?: string
}

export interface SettlementRecord {
  provider: PaymentProvider
  expectedDays: string
  pendingAmount: number
  settledAmount: number
  overdueCount: number
  lastSettlement: string
}

// Sales Module
export interface SalesRecord {
  date: string
  branch: string
  revenue: number
  units: number
  transactions: number
  category: string
}

export interface Product {
  id: string
  name: string
  brand: string
  category: 'Golf Clubs' | 'Golf Bags' | 'Golf Balls' | 'Apparel' | 'Accessories' | 'Fitting Services'
  price: number
  unitsSold: number
  revenue: number
}

export interface BranchReport {
  branch: string
  status: 'synced' | 'missing'
  lastSync: string
  pic: string
  revenue: number
  target: number
  cogs: number
}

export interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  charts?: { type: string; data: unknown }[]
}

// Reimbursement Module
export type ReimbursementCategory = 'Dinner/Meals' | 'Parking' | 'Transportation' | 'Office Supplies' | 'Client Entertainment' | 'Fuel' | 'Toll' | 'Other'
export type ReimbursementStatus = 'pending_approval' | 'approved' | 'rejected' | 'paid' | 'revision'

export interface Reimbursement {
  id: string
  employeeId: string
  employeeName: string
  department: string
  branch: string
  category: ReimbursementCategory
  amount: number
  description: string
  dateExpense: string
  dateSubmitted: string
  status: ReimbursementStatus
  receiptUrl?: string
  approvalChain: ApprovalStep[]
  currentStep: number
}

export interface ApprovalStep {
  approver: string
  role: string
  status: 'pending' | 'approved' | 'rejected' | 'revision'
  date?: string
  comment?: string
}

export interface Employee {
  id: string
  name: string
  email: string
  department: string
  branch: string
  position: string
  managerId?: string
  managerName?: string
}

// Freelancer Module
export type TaxArrangement = 'gross' | 'gross_up'
export type PaymentSchedule = 'per_session' | 'weekly' | 'monthly' | 'hybrid'

export interface Freelancer {
  id: string
  name: string
  role: string
  specialty: string
  hasNPWP: boolean
  npwpNumber?: string
  taxArrangement: TaxArrangement
  paymentSchedule: PaymentSchedule
  bankName: string
  bankAccount: string
  phone: string
  email: string
  status: 'active' | 'inactive'
  totalPaidYTD: number
  lastPaymentDate: string
  /** For hybrid: the fixed monthly retainer component */
  baseRetainer?: number
}

export interface FreelancerPayment {
  id: string
  freelancerId: string
  freelancerName: string
  description: string
  serviceDate: string
  paymentDate: string
  serviceFee: number
  dpp: number
  pph21: number
  amountToFreelancer: number
  taxBorneByCompany: number
  totalCompanyCost: number
  status: 'pending' | 'approved' | 'paid'
}

// Vendor Module
export type VendorCategory = 'Inventory/Equipment' | 'Logistics' | 'Services' | 'Store Fixtures' | 'Marketing' | 'Utilities'
export type InvoiceStatus = 'received' | 'verified' | 'approved' | 'scheduled' | 'paid' | 'disputed'

export interface Vendor {
  id: string
  name: string
  category: VendorCategory
  bankName: string
  bankAccount: string
  paymentTerms: string
  totalPaidYTD: number
  outstandingBalance: number
  status: 'active' | 'inactive'
  contactPerson: string
  phone: string
  email: string
}

export interface VendorInvoice {
  id: string
  invoiceNumber: string
  vendorId: string
  vendorName: string
  amount: number
  issueDate: string
  dueDate: string
  paymentTerms: string
  status: InvoiceStatus
  poNumber?: string
  items: string[]
  approvalChain?: ApprovalStep[]
}

// Notifications
export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  read: boolean
  date: string
  module: string
}
