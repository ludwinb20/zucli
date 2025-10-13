import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pdf } from "pdf-parse";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("pdf") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó archivo PDF" },
        { status: 400 }
      );
    }

    // Validar que sea PDF
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "El archivo debe ser un PDF" },
        { status: 400 }
      );
    }

    // Convertir File a Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extraer texto del PDF
    const pdfData = await pdf(buffer);
    const text = pdfData.text;
    console.log(text);

    // Parsear datos del PDF
    const extractedData = parseSarPdf(text);

    if (!extractedData) {
      return NextResponse.json(
        { error: "No se pudieron extraer los datos del PDF. Verifique que sea un documento de autorización SAR válido." },
        { status: 400 }
      );
    }

    // Verificar si ya existe un rango con el mismo CAI
    const existingRange = await prisma.invoiceRange.findFirst({
      where: { cai: extractedData.cai },
    });

    if (existingRange) {
      return NextResponse.json(
        { error: `Ya existe un rango de facturación con el CAI: ${extractedData.cai}` },
        { status: 400 }
      );
    }

    // Crear el registro en la base de datos
    const invoiceRange = await prisma.invoiceRange.create({
      data: {
        rtn: extractedData.rtn,
        razonSocial: extractedData.razonSocial,
        nombreComercial: extractedData.nombreComercial,
        cai: extractedData.cai,
        fechaLimiteEmision: extractedData.fechaLimiteEmision,
        puntoEmision: extractedData.puntoEmision,
        rangoInicio: extractedData.rangoInicio,
        rangoFin: extractedData.rangoFin,
        correlativoActual: extractedData.rangoInicio - 1, // Empezar en el número anterior
        cantidadAutorizada: extractedData.cantidadAutorizada,
        estado: "activo",
      },
    });

    return NextResponse.json({
      success: true,
      invoiceRange,
      extractedData,
    });
  } catch (error) {
    console.error("Error processing PDF:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al procesar el PDF" },
      { status: 500 }
    );
  }
}

function parseSarPdf(text: string) {
  try {
    // Patrones para extraer datos del PDF SAR
    const patterns = {
      rtn: /RTN:\s*(\d{14})/i,
      razonSocial: /Razón o Denominación Social:\s*([^\n\r]+)/i,
      nombreComercial: /Nombre comercial:\s*([^\n\r]+)/i,
      cai: /([A-F0-9-]{6}-[A-F0-9-]{6}-[A-F0-9-]{6}-[A-F0-9-]{6}-[A-F0-9-]{6}-[A-F0-9-]{2})/i,
      fechaLimite: /(\d{2}\/\d{2}\/\d{4})/i,
      puntoEmision: /(\d{3})\s*-\s*Auto/i,
      rangoInicio: /(\d{3}-\d{3}-\d{2}-\d{8})/i,
      rangoFin: /(\d{3}-\d{3}-\d{2}-\d{8})/i,
      cantidad: /(\d{4})\s*000-002-01-00012701/i,
    };

    // Extraer datos usando los patrones
    const rtn = patterns.rtn.exec(text)?.[1];
    const razonSocial = patterns.razonSocial.exec(text)?.[1]?.trim();
    const nombreComercial = patterns.nombreComercial.exec(text)?.[1]?.trim();
    const cai = patterns.cai.exec(text)?.[1];
    
    // Extraer fecha límite (segunda fecha que aparece)
    const fechaMatches = text.match(/(\d{2}\/\d{2}\/\d{4})/g);
    const fechaLimiteStr = fechaMatches && fechaMatches.length >= 2 ? fechaMatches[0] : null;
    
    const puntoEmision = patterns.puntoEmision.exec(text)?.[1];
    
    // Extraer rangos - buscar todas las coincidencias
    const rangoMatches = text.match(/(\d{3}\s*-\s*\d{3}\s*-\s*\d{2}\s*-\s*\d{8})/g);
    const rangoMatchesClean = rangoMatches?.map(m => m.replace(/\s+/g, ''));
    console.log("Rangos encontrados", rangoMatchesClean);
    
    const rangoInicioStr = rangoMatchesClean && rangoMatchesClean.length >= 1 ? rangoMatchesClean[0] : null;
    const rangoFinStr = rangoMatchesClean && rangoMatchesClean.length >= 2 ? rangoMatchesClean[1] : null;
    
    const cantidadStr = patterns.cantidad.exec(text)?.[1];
    console.log("Datos extraidos", {
      rtn,
      razonSocial,
      nombreComercial,
      cai,
      fechaLimiteStr,
      puntoEmision,
      rangoInicioStr,
      rangoFinStr,
      cantidadStr
    });

    // Validar que se encontraron los datos esenciales
    if (!rtn || !razonSocial || !cai || !fechaLimiteStr || !puntoEmision || !rangoInicioStr || !rangoFinStr) {
      console.log("Datos faltantes:", {
        rtn: !!rtn,
        razonSocial: !!razonSocial,
        cai: !!cai,
        fechaLimiteStr: !!fechaLimiteStr,
        puntoEmision: !!puntoEmision,
        rangoInicioStr: !!rangoInicioStr,
        rangoFinStr: !!rangoFinStr,
      });
      return null;
    }

    // Convertir fecha límite
    const [day, month, year] = fechaLimiteStr.split("/");
    const fechaLimiteEmision = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

    // Extraer números de rango de las cadenas completas
    const rangoInicioMatch = rangoInicioStr?.match(/(\d{8})$/);
    const rangoFinMatch = rangoFinStr?.match(/(\d{8})$/);
    
    const rangoInicio = rangoInicioMatch ? parseInt(rangoInicioMatch[1]) : 0;
    const rangoFin = rangoFinMatch ? parseInt(rangoFinMatch[1]) : 0;
    const cantidadAutorizada = cantidadStr ? parseInt(cantidadStr) : rangoFin - rangoInicio + 1;

    // Generar número de factura de ejemplo
    const numeroFactura = `${puntoEmision.padStart(3, "0")}-${puntoEmision.padStart(3, "0")}-01-${rangoInicio.toString().padStart(8, "0")}`;

    return {
      rtn,
      razonSocial,
      nombreComercial: nombreComercial || razonSocial,
      cai,
      fechaLimiteEmision,
      puntoEmision: puntoEmision.padStart(3, "0"),
      rangoInicio,
      rangoFin,
      cantidadAutorizada,
      numeroFactura,
    };
  } catch (error) {
    console.error("Error parsing SAR PDF:", error);
    return null;
  }
}
