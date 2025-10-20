"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, TrendingUp, FileText, Book } from "lucide-react";
import IncomeReport from "@/components/reports/IncomeReport";
import AccountingReport from "@/components/reports/AccountingReport";
import AuxiliaryBookReport from "@/components/reports/AuxiliaryBookReport";

export default function ReportesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Verificar permisos
  useEffect(() => {
    if (!isLoading && user) {
      if (user.role.name !== "admin") {
        router.push("/dashboard");
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2E9589]"></div>
      </div>
    );
  }

  if (!user || user.role.name !== "admin") {
    return null;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Reportería
        </h2>
        <p className="text-gray-600">
          Análisis y reportes financieros del sistema
        </p>
      </div>

      {/* Tabs de Reportes */}
      <Card className="bg-white border-gray-200">
        <CardContent className="pt-6">
          <Tabs defaultValue="income" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="income" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Ingresos
              </TabsTrigger>
              <TabsTrigger value="accounting" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Reporte Contable
              </TabsTrigger>
              <TabsTrigger value="auxiliary" className="flex items-center gap-2">
                <Book className="h-4 w-4" />
                Libro Auxiliar
              </TabsTrigger>
            </TabsList>

            {/* Reporte de Ingresos */}
            <TabsContent value="income">
              <IncomeReport />
            </TabsContent>

            {/* Reporte Contable */}
            <TabsContent value="accounting">
              <AccountingReport />
            </TabsContent>

            {/* Libro Auxiliar */}
            <TabsContent value="auxiliary">
              <AuxiliaryBookReport />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Estilos para impresión */}
      <style jsx global>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .print\\:block {
            display: block !important;
          }
          
          @page {
            size: letter;
            margin: 1cm;
          }
        }
      `}</style>
    </div>
  );
}

