// ============================================
// GENERADOR DE RECIBOS PARA IMPRESORAS TÉRMICAS
// ============================================

import { PaymentWithRelations } from "@/types/payments";
import { InvoiceRange, SimpleReceiptWithRelations, LegalInvoiceWithRelations } from "@/types/invoices";

// Función helper para formatear fechas en zona horaria de Honduras
function formatDateHonduras(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString('es-HN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Tegucigalpa'
  });
}

// Función helper para formatear solo fechas (sin hora) en zona horaria de Honduras
function formatDateOnlyHonduras(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('es-HN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'America/Tegucigalpa'
  });
}

interface ReceiptPrintData {
  payment: PaymentWithRelations;
  numeroRecibo: string;
  emisorNombre: string;
  clienteNombre: string;
  detalleGenerico: boolean;
  subtotal: number;
  descuentos: number;
  isv: number;
  total: number;
}

interface InvoicePrintData {
  payment: PaymentWithRelations;
  invoiceRange: InvoiceRange;
  numeroFactura: string;
  correlativo: number;
  clienteRTN: string;
  clienteNombre: string;
  detalleGenerico: boolean;
  subtotal: number;
  descuentos: number;
  isv: number;
  total: number;
}

/**
 * Genera recibo simple (SIN RTN) para impresora térmica
 */
export function generateSimpleReceipt(data: ReceiptPrintData): string {
  const {
    payment,
    numeroRecibo,
    emisorNombre,
    clienteNombre,
    detalleGenerico,
    subtotal,
    descuentos,
    isv,
    total,
  } = data;

  const lines: string[] = [];
  const width = 48;

  const center = (text: string): string => {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return " ".repeat(padding) + text;
  };

  const twoColumns = (left: string, right: string): string => {
    const rightLength = right.length;
    const leftMaxLength = width - rightLength - 1;
    const leftTrimmed = left.length > leftMaxLength 
      ? left.substring(0, leftMaxLength - 3) + "..." 
      : left;
    const padding = width - leftTrimmed.length - rightLength;
    return leftTrimmed + " ".repeat(Math.max(1, padding)) + right;
  };

  const separator = "=".repeat(width);
  const dashed = "-".repeat(width);

  // Encabezado
  lines.push("");
  lines.push(center(emisorNombre.toUpperCase()));
  lines.push("");
  lines.push(center("RECIBO DE PAGO"));
  lines.push(separator);
  lines.push("");

  // Información del recibo
  lines.push(`No. Recibo: ${numeroRecibo}`);
  lines.push(`Fecha: ${formatDateHonduras(new Date())}`);
  lines.push("");
  lines.push(dashed);
  lines.push("");

  // Cliente
  lines.push("CLIENTE:");
  lines.push(clienteNombre);
  lines.push(`Identidad: ${payment.patient.identityNumber}`);
  lines.push("");
  lines.push(dashed);
  lines.push("");

  // Detalle
  lines.push("DETALLE:");
  lines.push("");

  if (detalleGenerico) {
    const qty = payment.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    lines.push(twoColumns("Servicios Medicos", ""));
    lines.push(twoColumns(`  ${qty} unidad(es)`, formatCurrency(total)));
  } else {
    if (payment.items && payment.items.length > 0) {
      payment.items.forEach((item) => {
        const itemName = item.nombre; // Usar snapshot
        const itemPrice = item.precioUnitario; // Usar snapshot
        const itemTotal = item.total; // Usar total precalculado

        lines.push(itemName);
        lines.push(twoColumns(
          `  ${item.quantity} x ${formatCurrency(itemPrice)}`,
          formatCurrency(itemTotal)
        ));
      });
    } else {
      // Si no hay items, mostrar solo el total
      lines.push(twoColumns("Items del pago", formatCurrency(total)));
    }
  }

  lines.push("");
  lines.push(dashed);
  lines.push("");

  // Totales
  lines.push(twoColumns("Subtotal:", formatCurrency(subtotal)));
  if (descuentos > 0) {
    lines.push(twoColumns("Descuentos:", formatCurrency(descuentos)));
  }
  lines.push(twoColumns("ISV (15%):", formatCurrency(isv)));
  lines.push("");
  lines.push(separator);
  lines.push(twoColumns("TOTAL PAGADO:", formatCurrency(total)));
  lines.push(separator);
  lines.push("");

  // Pie
  lines.push(center("¡Gracias por su visita!"));
  lines.push("");
  lines.push(center("Este recibo no es valido para"));
  lines.push(center("efectos fiscales"));
  lines.push("");
  lines.push("");

  return lines.join("\n");
}

/**
 * Genera factura legal (CON RTN) para impresora térmica
 */
export function generateLegalInvoice(data: InvoicePrintData): string {
  const {
    payment,
    invoiceRange,
    numeroFactura,
    clienteRTN,
    clienteNombre,
    detalleGenerico,
    subtotal,
    descuentos,
    isv,
    total,
  } = data;

  const lines: string[] = [];
  const width = 48; // Caracteres de ancho

  // Función helper para centrar texto
  const center = (text: string): string => {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return " ".repeat(padding) + text;
  };

  // Función helper para línea con dos columnas
  const twoColumns = (left: string, right: string): string => {
    const rightLength = right.length;
    const leftMaxLength = width - rightLength - 1;
    const leftTrimmed = left.length > leftMaxLength 
      ? left.substring(0, leftMaxLength - 3) + "..." 
      : left;
    const padding = width - leftTrimmed.length - rightLength;
    return leftTrimmed + " ".repeat(Math.max(1, padding)) + right;
  };

  // Separador
  const separator = "=".repeat(width);
  const dashed = "-".repeat(width);

  // ==========================================
  // ENCABEZADO
  // ==========================================
  lines.push("");
  lines.push(center(invoiceRange.nombreComercial.toUpperCase()));
  lines.push(center(invoiceRange.razonSocial));
  lines.push(center(`RTN: ${invoiceRange.rtn}`));
  lines.push("");
  lines.push(center("FACTURA"));
  lines.push(separator);
  lines.push("");

  // ==========================================
  // INFORMACIÓN FISCAL
  // ==========================================
  lines.push(`No. Factura: ${numeroFactura}`);
  lines.push(`CAI: ${invoiceRange.cai}`);
  lines.push(`Rango: ${invoiceRange.rangoInicio}-${invoiceRange.rangoFin}`);
  lines.push(`Fecha Limite: ${formatDateOnlyHonduras(invoiceRange.fechaLimiteEmision)}`);
  lines.push(`Fecha Emision: ${formatDateHonduras(new Date())}`);
  lines.push("");
  lines.push(dashed);
  lines.push("");

  // ==========================================
  // INFORMACIÓN DEL CLIENTE
  // ==========================================
  lines.push("CLIENTE:");
  lines.push(clienteNombre);
  if (clienteRTN) {
    lines.push(`RTN: ${clienteRTN}`);
  }
  lines.push(`Identidad: ${payment.patient.identityNumber}`);
  lines.push("");
  lines.push(dashed);
  lines.push("");

  // ==========================================
  // DETALLE DE ITEMS
  // ==========================================
  lines.push("DETALLE:");
  lines.push("");

  if (detalleGenerico) {
    // Descripción genérica
    const qty = payment.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    lines.push(twoColumns("Servicios Medicos", ""));
    lines.push(twoColumns(`  ${qty} unidad(es)`, formatCurrency(total)));
  } else {
    // Detalle específico
    if (payment.items && payment.items.length > 0) {
      payment.items.forEach((item) => {
        const itemName = item.nombre; // Usar snapshot
        const itemPrice = item.precioUnitario; // Usar snapshot
        const itemTotal = item.total; // Usar total precalculado

        lines.push(itemName);
        lines.push(twoColumns(
          `  ${item.quantity} x ${formatCurrency(itemPrice)}`,
          formatCurrency(itemTotal)
        ));
      });
    } else {
      // Si no hay items, mostrar solo el total
      lines.push(twoColumns("Items del pago", formatCurrency(total)));
    }
  }

  lines.push("");
  lines.push(dashed);
  lines.push("");

  // ==========================================
  // TOTALES
  // ==========================================
  lines.push(twoColumns("Subtotal:", formatCurrency(subtotal)));
  
  if (descuentos > 0) {
    lines.push(twoColumns("Descuentos:", formatCurrency(descuentos)));
  }
  
  lines.push(twoColumns("ISV (15%):", formatCurrency(isv)));
  lines.push("");
  lines.push(separator);
  lines.push(twoColumns("TOTAL A PAGAR:", formatCurrency(total)));
  lines.push(separator);
  lines.push("");

  // ==========================================
  // PIE DE PÁGINA
  // ==========================================
  lines.push(center("¡Gracias por su visita!"));
  lines.push("");
  lines.push(center("Original: Cliente"));
  lines.push(center("Copia: Archivo"));
  lines.push("");
  lines.push(center("**NO SE ACEPTAN DEVOLUCIONES**"));
  lines.push("");
  lines.push("");
  lines.push("");
  lines.push("");

  return lines.join("\n");
}

/**
 * Helper para formatear moneda
 */
function formatCurrency(amount: number): string {
  return `L ${amount.toFixed(2)}`;
}

/**
 * Descarga el recibo como archivo de texto
 */
export function downloadThermalReceipt(content: string, filename: string = "factura.txt") {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Envía el recibo a imprimir directamente
 * (requiere configuración adicional del navegador o plugin)
 */
export function printThermalReceipt(content: string) {
  // Crear o reutilizar iframe oculto
  let printFrame = document.getElementById('thermal-print-frame') as HTMLIFrameElement;
  
  if (!printFrame) {
    printFrame = document.createElement('iframe');
    printFrame.id = 'thermal-print-frame';
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = 'none';
    document.body.appendChild(printFrame);
  }

  const printDocument = printFrame.contentDocument || printFrame.contentWindow?.document;
  
  if (printDocument) {
    printDocument.open();
    printDocument.write(`
      <html>
        <head>
          <title></title>
          <style>
            :root {
              color-scheme: light;
            }
            @media print {
              body {
                margin: 0;
                background: white;
                display: flex;
                justify-content: flex-start;
                align-items: flex-start;
              }
              @page {
                size: 58mm auto;
                margin: 0;
              }
            }
            body {
              margin: 0;
              background: white;
              display: flex;
              justify-content: flex-start;
              align-items: flex-start;
              font-family: 'Arial', sans-serif;
              font-size: 12px;
              line-height: 1.3;
              letter-spacing: 0.2px;
            }
            .receipt-wrapper {
              width: 58mm;
              padding: 2mm 1.5mm 3mm 5mm;
              box-sizing: border-box;
            }
            .receipt {
              white-space: pre;
              font-family: inherit;
              font-size: inherit;
              line-height: inherit;
              letter-spacing: inherit;
              margin: 0;
            }
          </style>
        </head>
        <body>
          <div class="receipt-wrapper">
            <pre class="receipt">${content}</pre>
          </div>
        </body>
      </html>
    `);
    printDocument.close();

    // Esperar a que el contenido esté listo y luego imprimir
    printFrame.contentWindow?.focus();
    setTimeout(() => {
      printFrame.contentWindow?.print();
    }, 250);
  }
}

// ============================================
// FUNCIONES PARA REIMPRIMIR DESDE BD
// ============================================

/**
 * Genera recibo simple desde datos guardados en BD
 */
export function generateSimpleReceiptFromDB(receipt: SimpleReceiptWithRelations): string {
  const lines: string[] = [];
  const width = 48;

  const center = (text: string): string => {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return " ".repeat(padding) + text;
  };

  const twoColumns = (left: string, right: string): string => {
    const rightLength = right.length;
    const leftMaxLength = width - rightLength - 1;
    const leftTrimmed = left.length > leftMaxLength 
      ? left.substring(0, leftMaxLength - 3) + "..." 
      : left;
    const padding = width - leftTrimmed.length - rightLength;
    return leftTrimmed + " ".repeat(Math.max(1, padding)) + right;
  };

  const formatCurrency = (amount: number): string => {
    return `L${amount.toFixed(2)}`;
  };

  const separator = "=".repeat(width);
  const dashed = "-".repeat(width);

  // Encabezado
  lines.push("");
  lines.push(center((receipt.emisorNombre || "").toUpperCase()));
  lines.push("");
  lines.push(center("RECIBO DE PAGO"));
  lines.push(separator);
  lines.push("");

  // Información del recibo
  lines.push(`No. Recibo: ${receipt.numeroDocumento}`);
  lines.push(`Fecha: ${formatDateHonduras(receipt.fechaEmision)}`);
  lines.push("");
  lines.push(dashed);
  lines.push("");

  // Cliente
  lines.push("CLIENTE:");
  lines.push(`Nombre: ${receipt.clienteNombre}`);
  lines.push(`Identidad: ${receipt.clienteIdentidad}`);
  lines.push("");
  lines.push(dashed);
  lines.push("");

  // Detalle
  lines.push("DETALLE:");
  lines.push("");

  if (receipt.detalleGenerico) {
    const qty = receipt.items?.reduce((sum: number, item: { cantidad: number }) => sum + item.cantidad, 0) || 0;
    lines.push(twoColumns("Servicios Medicos", ""));
    lines.push(twoColumns(`  ${qty} unidad(es)`, formatCurrency(receipt.total)));
  } else {
    if (receipt.items && receipt.items.length > 0) {
      receipt.items.forEach((item: { nombre: string; cantidad: number; precioUnitario: number; total: number }) => {
        lines.push(item.nombre);
        lines.push(twoColumns(
          `  ${item.cantidad} x ${formatCurrency(item.precioUnitario)}`,
          formatCurrency(item.total)
        ));
      });
    } else {
      lines.push(twoColumns("Items del pago", formatCurrency(receipt.total)));
    }
  }

  lines.push("");
  lines.push(dashed);
  lines.push("");

  // Totales
  lines.push(twoColumns("Subtotal:", formatCurrency(receipt.subtotal)));
  if (receipt.descuentos > 0) {
    lines.push(twoColumns("Descuentos:", formatCurrency(receipt.descuentos)));
  }
  lines.push(twoColumns("ISV (15%):", formatCurrency(receipt.isv)));
  lines.push(separator);
  lines.push(twoColumns("TOTAL:", formatCurrency(receipt.total)));
  lines.push(separator);

  // Observaciones
  if (receipt.observaciones) {
    lines.push("");
    lines.push("OBSERVACIONES:");
    lines.push(receipt.observaciones);
    lines.push("");
  }

  // Pie de página
  lines.push("");
  lines.push(center("Gracias por su preferencia"));
  lines.push("");
  lines.push(center("Este recibo no es valido"));
  lines.push(center("para efectos fiscales"));
  lines.push("");

  return lines.join("\n");
}

/**
 * Genera factura legal desde datos guardados en BD
 */
export function generateLegalInvoiceFromDB(invoice: LegalInvoiceWithRelations): string {
  
  const lines: string[] = [];
  const width = 48;

  const center = (text: string): string => {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return " ".repeat(padding) + text;
  };

  const twoColumns = (left: string, right: string): string => {
    const rightLength = right.length;
    const leftMaxLength = width - rightLength - 1;
    const leftTrimmed = left.length > leftMaxLength 
      ? left.substring(0, leftMaxLength - 3) + "..." 
      : left;
    const padding = width - leftTrimmed.length - rightLength;
    return leftTrimmed + " ".repeat(Math.max(1, padding)) + right;
  };

  const formatCurrency = (amount: number): string => {
    return `L${amount.toFixed(2)}`;
  };

  const separator = "=".repeat(width);
  const dashed = "-".repeat(width);

  // ==========================================
  // ENCABEZADO
  // ==========================================
  lines.push("");
  lines.push(center((invoice.emisorNombre || "").toUpperCase()));
  if (invoice.emisorRazonSocial) {
    lines.push(center(invoice.emisorRazonSocial));
  }
  if (invoice.emisorRTN) {
    lines.push(center(`RTN: ${invoice.emisorRTN}`));
  }
  lines.push("");
  lines.push(center("FACTURA FISCAL"));
  lines.push(separator);
  lines.push("");

  // ==========================================
  // INFORMACIÓN FISCAL
  // ==========================================
  lines.push(`No. Factura: ${invoice.numeroDocumento}`);
  if (invoice.cai) {
    lines.push(`CAI: ${invoice.cai}`);
  }
  lines.push(`Fecha Emision: ${formatDateHonduras(invoice.fechaEmision)}`);
  lines.push("");
  lines.push(dashed);
  lines.push("");

  // ==========================================
  // DATOS DEL CLIENTE
  // ==========================================
  lines.push("FACTURADO A:");
  lines.push(`Empresa: ${invoice.clienteNombre}`);
  lines.push(`RTN: ${invoice.clienteRTN}`);
  lines.push(`Paciente: ${invoice.payment.patient.firstName} ${invoice.payment.patient.lastName}`);
  lines.push(`Identidad: ${invoice.clienteIdentidad}`);
  lines.push("");
  lines.push(dashed);
  lines.push("");

  // ==========================================
  // DETALLE DE ITEMS
  // ==========================================
  lines.push("DETALLE:");
  lines.push("");

  if (invoice.detalleGenerico) {
    const qty = invoice.items?.reduce((sum: number, item: { cantidad: number }) => sum + item.cantidad, 0) || 0;
    lines.push(twoColumns("Servicios Medicos", ""));
    lines.push(twoColumns(`  ${qty} unidad(es)`, formatCurrency(invoice.total)));
  } else {
    if (invoice.items && invoice.items.length > 0) {
      invoice.items.forEach((item: { nombre: string; cantidad: number; precioUnitario: number; total: number }) => {
        lines.push(item.nombre);
        lines.push(twoColumns(
          `  ${item.cantidad} x ${formatCurrency(item.precioUnitario)}`,
          formatCurrency(item.total)
        ));
      });
    } else {
      lines.push(twoColumns("Items del pago", formatCurrency(invoice.total)));
    }
  }

  lines.push("");
  lines.push(dashed);
  lines.push("");

  // ==========================================
  // TOTALES
  // ==========================================
  lines.push(twoColumns("Subtotal:", formatCurrency(invoice.subtotal)));
  if (invoice.descuentos > 0) {
    lines.push(twoColumns("Descuentos:", formatCurrency(invoice.descuentos)));
  }
  lines.push(twoColumns("ISV (15%):", formatCurrency(invoice.isv)));
  lines.push(separator);
  lines.push(twoColumns("TOTAL A PAGAR:", formatCurrency(invoice.total)));
  lines.push(separator);

  // ==========================================
  // OBSERVACIONES
  // ==========================================
  if (invoice.observaciones) {
    lines.push("");
    lines.push("OBSERVACIONES:");
    lines.push(invoice.observaciones);
    lines.push("");
  }

  // ==========================================
  // PIE DE PÁGINA
  // ==========================================
  lines.push("");
  lines.push(center("Gracias por su preferencia"));
  lines.push("");
  lines.push(center("Original: Cliente"));
  lines.push(center("Copia: Emisor"));
  lines.push("");
  
  // Información del rango (solo si existe)
  if (invoice.invoiceRange) {
    lines.push(center(`Rango Autorizado:`));
    lines.push(center(`${invoice.invoiceRange.rangoInicio} - ${invoice.invoiceRange.rangoFin}`));
    lines.push(center(`Fecha Limite: ${formatDateOnlyHonduras(invoice.invoiceRange.fechaLimiteEmision)}`));
    lines.push("");
  }

  return lines.join("\n");
}

