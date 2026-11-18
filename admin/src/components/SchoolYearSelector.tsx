import { useSchoolYear } from "@/contexts/SchoolYearContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap } from "lucide-react";
import { formatSchoolYear } from "@/lib/school-year";

export function SchoolYearSelector() {
  const { currentYear, setCurrentYear, years, isLoading } = useSchoolYear();

  if (isLoading) return <div className="h-9 w-44 bg-muted animate-pulse rounded-lg" />;

  return (
    <div className="flex items-center gap-2">
      <GraduationCap className="h-4 w-4 text-muted-foreground" />
      <Select value={currentYear} onValueChange={setCurrentYear}>
        <SelectTrigger className="w-[220px] h-9 text-sm font-medium bg-card border">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map(y => (
            <SelectItem key={y} value={y}>{formatSchoolYear(y)}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
