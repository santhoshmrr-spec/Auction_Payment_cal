import { Lot, Config } from "@/types/calculator";
import { calculateLot } from "@/lib/calculations";
import { LotInputRow } from "./LotInputRow";
import { Button } from "@/components/ui/button";
import { Plus, Package } from "lucide-react";

interface LotTableProps {
  lots: Lot[];
  config: Config;
  onUpdateLot: (id: number, field: keyof Lot, value: string | number) => void;
  onDeleteLot: (id: number) => void;
  onAddLot: () => void;
}

export function LotTable({ lots, config, onUpdateLot, onDeleteLot, onAddLot }: LotTableProps) {
  const showSdColumn = config.securityDepositType !== 'notApplicable';
  
  return (
    <div className="bg-card rounded-lg shadow-card border border-border overflow-hidden animate-slide-up">
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent">
            <Package className="h-5 w-5 text-accent-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Lot Details</h2>
            <p className="text-sm text-muted-foreground">Enter lot information for calculation</p>
          </div>
        </div>
        <Button onClick={onAddLot} className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground">
          <Plus className="h-4 w-4" />
          Add Lot
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="p-3 text-center font-semibold text-muted-foreground">Lot Name</th>
              <th className="p-3 text-center font-semibold text-muted-foreground">Qty</th>
              <th className="p-3 text-center font-semibold text-muted-foreground">Bid Value</th>
              <th className="p-3 text-center font-semibold text-muted-foreground">GST%</th>
              <th className="p-3 text-center font-semibold text-muted-foreground">TCS%</th>
              <th className="p-3 text-center font-semibold text-muted-foreground">Penalty%</th>
              {showSdColumn && (
                <th className="p-3 text-center font-semibold text-muted-foreground">
                  SD {config.securityDepositType === 'percentage' ? '%' : 'Amt'}
                </th>
              )}
              <th className="p-3 text-center font-semibold text-muted-foreground bg-muted/30">Material Value</th>
              <th className="p-3 text-center font-semibold text-muted-foreground">GST</th>
              <th className="p-3 text-center font-semibold text-muted-foreground">TCS</th>
              <th className="p-3 text-center font-semibold text-muted-foreground">Penalty</th>
              {showSdColumn && (
                <th className="p-3 text-center font-semibold text-muted-foreground">SD</th>
              )}
              <th className="p-3 text-center font-semibold text-accent">Total</th>
              <th className="p-3 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {lots.map((lot) => (
              <LotInputRow
                key={lot.id}
                lot={lot}
                calculation={calculateLot(lot, config)}
                onUpdate={onUpdateLot}
                onDelete={onDeleteLot}
                canDelete={lots.length > 1}
                isRcmEnabled={config.gstOnRcm === 1}
                securityDepositType={config.securityDepositType}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
