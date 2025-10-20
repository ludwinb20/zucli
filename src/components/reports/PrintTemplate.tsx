import React from "react";

interface PrintTemplateProps {
  children: React.ReactNode;
  title: string;
  startDate: string;
  endDate: string;
  hospitalInfo: {
    nombreComercial: string;
    razonSocial: string;
    rtn: string;
  };
}

export const PrintTemplate = React.forwardRef<HTMLDivElement, PrintTemplateProps>(
  ({ children, title, startDate, endDate, hospitalInfo }, ref) => {
    return (
      <div ref={ref} className="p-8 bg-white">
        {/* Header */}
        <div className="text-center mb-8 border-b-2 border-gray-300 pb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {hospitalInfo.nombreComercial}
          </h1>
          <p className="text-sm text-gray-600">{hospitalInfo.razonSocial}</p>
          <p className="text-sm text-gray-600">RTN: {hospitalInfo.rtn}</p>
          
          <h2 className="text-2xl font-bold text-[#2E9589] mt-6 mb-2">
            {title}
          </h2>
          <p className="text-gray-700">
            Período: {new Date(startDate).toLocaleDateString('es-HN')} - {new Date(endDate).toLocaleDateString('es-HN')}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Generado: {new Date().toLocaleDateString('es-HN')} {new Date().toLocaleTimeString('es-HN')}
          </p>
        </div>

        {/* Content */}
        {children}

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 mt-8 pt-4 border-t border-gray-300">
          <p>Este reporte fue generado electrónicamente por el sistema de gestión hospitalaria</p>
        </div>

        {/* Print Styles */}
        <style jsx global>{`
          @media print {
            @page {
              size: letter;
              margin: 1.5cm;
            }
            
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
          }
        `}</style>
      </div>
    );
  }
);

PrintTemplate.displayName = "PrintTemplate";

