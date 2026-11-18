import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useAgendas, deriveSchoolYears } from "@/hooks/useSupabaseData";

interface SchoolYearContextType {
  currentYear: string;
  setCurrentYear: (year: string) => void;
  years: string[];
  isLoading: boolean;
}

const SchoolYearContext = createContext<SchoolYearContextType | undefined>(undefined);

export function SchoolYearProvider({ children }: { children: ReactNode }) {
  const { data: agendas, isLoading } = useAgendas();
  const years = agendas ? deriveSchoolYears(agendas) : [];
  const [currentYear, setCurrentYear] = useState<string>("");

  useEffect(() => {
    if (years.length > 0 && !currentYear) {
      setCurrentYear(years[0]); // Most recent year
    }
  }, [years, currentYear]);

  return (
    <SchoolYearContext.Provider value={{ currentYear: currentYear || years[0] || "2025-2026", setCurrentYear, years, isLoading }}>
      {children}
    </SchoolYearContext.Provider>
  );
}

export function useSchoolYear() {
  const ctx = useContext(SchoolYearContext);
  if (!ctx) throw new Error("useSchoolYear must be used within SchoolYearProvider");
  return ctx;
}
