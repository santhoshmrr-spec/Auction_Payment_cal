import { Lot, LotCalculation, Config, Summary, LotBreakdown } from "@/types/calculator";

export function calculateLot(lot: Lot, config: Config): LotCalculation {
  const materialValue = lot.quantity * lot.bidValue;
  const penalty = (materialValue * lot.penaltyPercent) / 100;
  
  // If GST on RCM basis is enabled, GST is treated as zero
  const effectiveGstPercent = config.gstOnRcm === 1 ? 0 : lot.gstPercent;
  const gst = (materialValue * effectiveGstPercent) / 100;
  const tcs = ((materialValue + gst) * lot.tcsPercent) / 100;
  
  // Security Deposit calculation (needed for total)
  let sdAmount = 0;
  if (config.securityDepositType === 'percentage') {
    sdAmount = (materialValue * lot.sdValue) / 100;
  } else if (config.securityDepositType === 'lumpsum') {
    sdAmount = lot.sdValue;
  }
  
  // Total Payment = Material Value + Penalty + GST + TCS + SD Amount
  const total = materialValue + penalty + gst + tcs + sdAmount;
  
  // EMD = Material Value × EMD% / 100
  const emd = (materialValue * config.emdPercent) / 100;
  
  
  // Service charge = service charge percent × material value × 1.18 (for GST)
  const serviceChargeWithoutGst = (materialValue * config.mstcScPercent) / 100;
  const serviceCharge = serviceChargeWithoutGst * 1.18;
  
  // TDS on service charge = 2% of service charge without GST (only if enabled)
  const tds = config.tdsOnSc === 1 ? serviceChargeWithoutGst * 0.02 : 0;
  
  // IT TDS = 0.1% of material value (only if enabled)
  const itTds = config.itTds === 1 ? materialValue * 0.001 : 0;
  
  // TCS on GST = 1% of material value (only if enabled)
  const tcsOnGst = config.tcsOnGst === 1 ? materialValue * 0.01 : 0;
  
  const sellerPayment = materialValue + gst + tcs - itTds - serviceCharge;
  const mstcSc = serviceCharge;

  return {
    ...lot,
    materialValue,
    penalty,
    gst,
    tcs,
    total,
    emd,
    serviceCharge,
    serviceChargeWithoutGst,
    tds,
    tcsOnGst,
    sellerPayment,
    itTds,
    mstcSc,
    sdAmount,
  };
}

export function calculateLotBreakdown(lot: Lot, config: Config): LotBreakdown {
  const calc = calculateLot(lot, config);
  const isTransactionFees = config.mstcPaymentType === 'transactionFees';
  
  // EMD = Material Value × EMD% / 100
  const emdAmount = (calc.materialValue * config.emdPercent) / 100;
  
  // Security Deposit Amount
  const sdAmount = calc.sdAmount;
  
  // Service charge amount = service charge percent × material value × 1.18
  const serviceChargeAmount = isTransactionFees ? 0 : calc.serviceCharge;
  
  // Transaction fees = transaction fee percent × material value × 1.18
  const transactionFeesAmount = isTransactionFees ? calc.serviceCharge : 0;
  
  // IT TDS = 0.1% of material value (only if enabled)
  const itTdsAmount = config.itTds === 1 ? calc.materialValue * 0.001 : 0;
  
  // TCS on GST = 1% of material value (only if enabled)
  const tcsOnGstAmount = config.tcsOnGst === 1 ? calc.materialValue * 0.01 : 0;
  
  // TDS on service charge = 2% of service charge without GST (only for service charge mode and if enabled)
  const tdsOnServiceCharge = (!isTransactionFees && config.tdsOnSc === 1) ? calc.serviceChargeWithoutGst * 0.02 : 0;
  
  let mstcPayment: number;
  let balancePayment: number;
  let sellerPaymentTotal: number;
  
  if (isTransactionFees) {
    // Mode 2: Transaction Fees Mode
    // MSTC Payment = Transaction Fees + IT TDS + TCS on GST
    mstcPayment = transactionFeesAmount + itTdsAmount + tcsOnGstAmount;
    // Balance Payment = Total Payment − EMD − MSTC Payment + Transaction Fees
    balancePayment = calc.total - emdAmount - mstcPayment + transactionFeesAmount;
    // Seller Payment = EMD + Balance Payment
    sellerPaymentTotal = emdAmount + balancePayment;
  } else {
    // Mode 1: Service Charge Mode
    // MSTC Payment = Service Charge + IT TDS + TCS on GST − TDS on SC
    mstcPayment = serviceChargeAmount + itTdsAmount + tcsOnGstAmount - tdsOnServiceCharge;
    // Balance Payment = Total Payment − EMD − MSTC Payment
    balancePayment = calc.total - emdAmount - mstcPayment;
    // Seller Payment = EMD + Balance Payment
    sellerPaymentTotal = emdAmount + balancePayment;
  }
  
  // Total = MSTC Payment + Seller Payment (SD is already included in Total Payment)
  const grandTotal = mstcPayment + sellerPaymentTotal;
  
  return {
    lotName: lot.name,
    sdAmount,
    emdAmount,
    balancePayment,
    tdsOnServiceCharge,
    sellerPaymentTotal,
    serviceChargeAmount,
    transactionFeesAmount,
    itTdsAmount,
    tcsOnGstAmount,
    mstcPaymentTotal: mstcPayment,
    grandTotal,
  };
}

export function calculateSummary(lots: Lot[], config: Config): Summary {
  let totalEmd = 0;
  let totalMstcSc = 0;
  let totalTcsOnGst = 0;
  let totalItTds = 0;
  let totalSellerPayment = 0;
  let totalPayment = 0;
  let totalSdAmount = 0;

  lots.forEach((lot) => {
    const calc = calculateLot(lot, config);
    totalEmd += calc.emd;
    totalMstcSc += calc.mstcSc;
    totalTcsOnGst += calc.tcsOnGst;
    totalItTds += calc.itTds;
    totalSellerPayment += calc.sellerPayment;
    totalPayment += calc.total;
    totalSdAmount += calc.sdAmount;
  });

  const totalBalance = totalPayment - totalEmd;
  const mstcPayment = totalMstcSc;
  const grandTotal = totalPayment + totalMstcSc + totalSdAmount;

  return {
    totalEmd,
    totalBalance,
    totalMstcSc,
    totalTcsOnGst,
    totalItTds,
    totalSellerPayment,
    totalPayment,
    mstcPayment,
    balanceSellerPayment: totalSellerPayment - totalEmd,
    balanceMstcSc: totalMstcSc,
    balanceTcsOnGst: totalTcsOnGst,
    balanceItTds: totalItTds,
    balanceTotal: totalBalance + totalMstcSc,
    totalSdAmount,
    grandTotal,
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);
}
