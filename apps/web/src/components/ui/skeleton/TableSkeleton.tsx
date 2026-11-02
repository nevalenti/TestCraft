import { Skeleton } from "@/components/ui/skeleton/Skeleton";
import { cn } from "@/lib/cn";

interface TableSkeletonProps {
  columns: number;
  rows?: number;
  shadow?: boolean;
}

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
        <tr>
          {Array.from({ length: columns }, (_, i) => (
            <th key={i}>
              <Skeleton className="h-3 w-16" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }, (_, rowIndex) => (
          <tr key={rowIndex}>
            {Array.from({ length: columns }, (_, columnIndex) => (
              <td key={columnIndex}>
                <Skeleton
                  className={columnIndex === 0 ? "h-3.5 w-6" : "h-3.5 w-20"}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
