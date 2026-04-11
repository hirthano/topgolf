export interface TaxCalculation {
  serviceFee: number
  dpp: number
  pphRate: number
  pph21: number
  amountToFreelancer: number
  taxBorneByCompany: number
  totalCompanyCost: number
}

export function calculatePPh21(
  serviceFee: number,
  hasNPWP: boolean,
  isGrossUp: boolean
): TaxCalculation {
  // DPP (Dasar Pengenaan Pajak) = 50% of gross
  const dpp = serviceFee * 0.5
  // PPh 21 rate: 2.5% with NPWP, 3% without (20% higher)
  const pphRate = hasNPWP ? 0.025 : 0.03

  if (isGrossUp) {
    // Gross-up: company absorbs tax, freelancer receives full amount
    const pph21 = dpp * pphRate
    return {
      serviceFee,
      dpp,
      pphRate,
      pph21,
      amountToFreelancer: serviceFee,
      taxBorneByCompany: pph21,
      totalCompanyCost: serviceFee + pph21,
    }
  } else {
    // Gross: tax deducted from freelancer payment
    const pph21 = dpp * pphRate
    return {
      serviceFee,
      dpp,
      pphRate,
      pph21,
      amountToFreelancer: serviceFee - pph21,
      taxBorneByCompany: 0,
      totalCompanyCost: serviceFee,
    }
  }
}
