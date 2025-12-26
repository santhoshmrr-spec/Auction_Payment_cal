import { Lot, Config, LotBreakdown } from "@/types/calculator";
import { calculateLotBreakdown, formatCurrency } from "@/lib/calculations";
import { Receipt } from "lucide-react";

interface BreakdownTableProps {
  lots: Lot[];
  config: Config;
}

export function BreakdownTable({ lots, config }: BreakdownTableProps) {
  const breakdowns: LotBreakdown[] = lots.map((lot) => calculateLotBreakdown(lot, config));
  const isTransactionFees = config.mstcPaymentType === 'transactionFees';
  const showSd = config.securityDepositType !== 'notApplicable';
  
  const totals = breakdowns.reduce(
    (acc, b) => ({
      sdAmount: acc.sdAmount + b.sdAmount,
      emdAmount: acc.emdAmount + b.emdAmount,
      balancePayment: acc.balancePayment + b.balancePayment,
      serviceChargeAmount: acc.serviceChargeAmount + b.serviceChargeAmount,
      transactionFeesAmount: acc.transactionFeesAmount + b.transactionFeesAmount,
      itTdsAmount: acc.itTdsAmount + b.itTdsAmount,
      tcsOnGstAmount: acc.tcsOnGstAmount + b.tcsOnGstAmount,
      grandTotal: acc.grandTotal + b.grandTotal,
    }),
    {
      sdAmount: 0,
      emdAmount: 0,
      balancePayment: 0,
      serviceChargeAmount: 0,
      transactionFeesAmount: 0,
      itTdsAmount: 0,
      tcsOnGstAmount: 0,
      grandTotal: 0,
    }
  );

  // Calculate breakup sums for merged cells
  const sellerBreakupSum = totals.sdAmount + totals.emdAmount + totals.balancePayment;
  const mstcBreakupSum = (isTransactionFees ? totals.transactionFeesAmount : totals.serviceChargeAmount) + totals.itTdsAmount + totals.tcsOnGstAmount;

  // Row definitions
  const rows = [
    ...(showSd ? [{
      label: "Non-adjustable Security Deposit (SD Amount)",
      getValue: (b: LotBreakdown) => b.sdAmount,
      getTotal: () => totals.sdAmount,
      breakupGroup: 'seller' as const,
      isFirstInGroup: true,
    }] : []),
    {
      label: "EMD",
      getValue: (b: LotBreakdown) => b.emdAmount,
      getTotal: () => totals.emdAmount,
      breakupGroup: 'seller' as const,
      isFirstInGroup: !showSd,
    },
    {
      label: "Balance Payment to Seller",
      getValue: (b: LotBreakdown) => b.balancePayment,
      getTotal: () => totals.balancePayment,
      breakupGroup: 'seller' as const,
      isFirstInGroup: false,
    },
    {
      label: isTransactionFees ? "MSTC Transaction Fees" : "MSTC Service Charge",
      getValue: (b: LotBreakdown) => isTransactionFees ? b.transactionFeesAmount : b.serviceChargeAmount,
      getTotal: () => isTransactionFees ? totals.transactionFeesAmount : totals.serviceChargeAmount,
      breakupGroup: 'mstc' as const,
      isFirstInGroup: true,
    },
    {
      label: "MSTC IT TDS",
      getValue: (b: LotBreakdown) => b.itTdsAmount,
      getTotal: () => totals.itTdsAmount,
      breakupGroup: 'mstc' as const,
      isFirstInGroup: false,
    },
    {
      label: "MSTC TCS on GST",
      getValue: (b: LotBreakdown) => b.tcsOnGstAmount,
      getTotal: () => totals.tcsOnGstAmount,
      breakupGroup: 'mstc' as const,
      isFirstInGroup: false,
    },
    {
      label: "Total Payable",
      getValue: (b: LotBreakdown) => b.grandTotal,
      getTotal: () => totals.grandTotal,
      isTotal: true,
      breakupGroup: 'total' as const,
      isFirstInGroup: true,
    },
  ];

  const sellerRowCount = showSd ? 3 : 2;
  const mstcRowCount = 3;

  return (
    <div className="bg-card rounded-lg shadow-card border border-border overflow-hidden animate-slide-up">
      <div className="flex items-center gap-3 p-6 border-b border-border">
        <div className="p-2 rounded-lg bg-primary">
          <Receipt className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Payment Breakdown</h2>
          <p className="text-sm text-muted-foreground">Detailed breakdown by lot</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="p-3 text-left font-semibold text-muted-foreground min-w-[300px]">
                Description
              </th>
              {breakdowns.map((breakdown, index) => (
                <th key={index} className="p-3 text-right font-semibold text-muted-foreground min-w-[120px]">
                  {breakdown.lotName}
                </th>
              ))}
              <th className="p-3 text-right font-semibold text-info min-w-[120px] bg-info/5">
                Total
              </th>
              <th className="p-3 text-right font-semibold text-accent min-w-[140px] bg-accent/5">
                Breakup
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr 
                key={rowIndex} 
                className={`border-b border-border hover:bg-muted/30 transition-colors ${
                  row.isTotal ? 'bg-primary/5 font-semibold' : 'even:bg-muted/20'
                }`}
              >
                <td className={`p-3 text-foreground ${row.isTotal ? 'font-bold' : ''}`}>
                  {row.label}
                </td>
                {breakdowns.map((breakdown, colIndex) => (
                  <td key={colIndex} className={`p-3 font-mono text-right ${row.isTotal ? 'font-bold text-primary' : 'text-foreground'}`}>
                    {formatCurrency(row.getValue(breakdown))}
                  </td>
                ))}
                <td className={`p-3 font-mono text-right bg-info/5 ${row.isTotal ? 'font-bold text-info' : 'text-info'}`}>
                  {formatCurrency(row.getTotal())}
                </td>
                {/* Breakup column with merged cells */}
                {row.isFirstInGroup && row.breakupGroup === 'seller' && (
                  <td 
                    rowSpan={sellerRowCount} 
                    className="p-3 font-mono text-right text-accent bg-accent/5 align-middle border-b border-border"
                  >
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-muted-foreground mb-1">Seller Payment</span>
                      <span className="font-semibold">{formatCurrency(sellerBreakupSum)}</span>
                    </div>
                  </td>
                )}
                {row.isFirstInGroup && row.breakupGroup === 'mstc' && (
                  <td 
                    rowSpan={mstcRowCount} 
                    className="p-3 font-mono text-right text-accent bg-accent/5 align-middle border-b border-border"
                  >
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-muted-foreground mb-1">MSTC Payment</span>
                      <span className="font-semibold">{formatCurrency(mstcBreakupSum)}</span>
                    </div>
                  </td>
                )}
                {row.isTotal && (
                  <td className="p-3 font-mono text-right font-bold text-accent bg-accent/5">
                    {formatCurrency(totals.grandTotal)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
