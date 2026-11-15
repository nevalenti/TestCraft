import { Skeleton } from "@/components/ui/skeleton/Skeleton";
import { cn } from "@/lib/cn";

interface TableSkeletonProps {
  columns: number;
  rows?: number;
  shadow?: boolean;
}

const PRIMARY_WIDTHS = ["w-48", "w-36", "w-56", "w-40", "w-44", "w-32"];
const CELL_WIDTHS = ["w-16", "w-20", "w-12", "w-24", "w-14"];

const cellWidth = (row: number, column: number) => {
  if (column === 0) return "w-6";
  if (column === 1) return PRIMARY_WIDTHS[row % PRIMARY_WIDTHS.length];
  return CELL_WIDTHS[(row + column * 2) % CELL_WIDTHS.length];
};

export const TableSkeleton = ({
  columns,
  rows = 6,
  shadow = false,
}: TableSkeletonProps) => (
  <div
    className={cn(
      "overflow-hidden rounded-xl border border-border",
      shadow && "shadow-card",
    )}
  >
    <table className="table table-sm">
      <thead>
        <tr className="border-b border-border">
          {Array.from({ length: columns }, (_, i) => (
            <th key={i}>
              <Skeleton className={cn("h-2.5", i === 0 ? "w-4" : "w-14")} />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }, (_, rowIndex) => (
          <tr key={rowIndex}>
            {Array.from({ length: columns }, (_, columnIndex) => (
              <td key={columnIndex} className="py-3">
                <Skeleton
                  className={cn(
                    "h-3.5 max-w-full",
                    cellWidth(rowIndex, columnIndex),
                  )}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
