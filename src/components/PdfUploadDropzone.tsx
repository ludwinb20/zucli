"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface PdfUploadDropzoneProps {
  onUploadSuccess?: () => void;
}

export function PdfUploadDropzone({ onUploadSuccess }: PdfUploadDropzoneProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");
  const [uploadMessage, setUploadMessage] = useState("");
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validar que sea PDF
    if (file.type !== "application/pdf") {
      toast({
        title: "Error",
        description: "Solo se permiten archivos PDF",
        variant: "error",
      });
      return;
    }

    setIsUploading(true);
    setUploadStatus("idle");

    try {
      const formData = new FormData();
      formData.append("pdf", file);

      const response = await fetch("/api/invoice-ranges/upload-pdf", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al procesar el PDF");
      }

      setUploadStatus("success");
      setUploadMessage(`Rango de facturación creado exitosamente: ${result.invoiceRange.numeroFactura}`);
      
      toast({
        title: "Éxito",
        description: "PDF procesado y rango de facturación creado",
        variant: "success",
      });

      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error) {
      console.error("Error uploading PDF:", error);
      setUploadStatus("error");
      setUploadMessage(`❌ Error: ${error instanceof Error ? error.message : "Error desconocido"}`);
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al procesar el PDF",
        variant: "error",
      });
    } finally {
      setIsUploading(false);
    }
  }, [toast, onUploadSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    multiple: false,
    disabled: isUploading,
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>Subir Autorización SAR</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${
              isDragActive
                ? "border-blue-400 bg-blue-50"
                : uploadStatus === "success"
                ? "border-green-400 bg-green-50"
                : uploadStatus === "error"
                ? "border-red-400 bg-red-50"
                : "border-gray-300 hover:border-gray-400"
            }
            ${isUploading ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <input {...getInputProps()} />
          
          <div className="flex flex-col items-center space-y-4">
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-gray-600">Procesando PDF...</p>
              </>
            ) : uploadStatus === "success" ? (
              <>
                <CheckCircle className="h-12 w-12 text-green-600" />
                <p className="text-green-700 font-medium">¡PDF procesado exitosamente!</p>
              </>
            ) : uploadStatus === "error" ? (
              <>
                <AlertCircle className="h-12 w-12 text-red-600" />
                <p className="text-red-700 font-medium">Error al procesar PDF</p>
              </>
            ) : (
              <>
                <Upload className="h-12 w-12 text-gray-400" />
                <div>
                  <p className="text-lg font-medium text-gray-700">
                    {isDragActive ? "Suelta el archivo aquí" : "Arrastra tu PDF aquí"}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    o haz clic para seleccionar un archivo
                  </p>
                </div>
              </>
            )}
          </div>

          {uploadMessage && (
            <div className="mt-4 p-3 bg-gray-100 rounded text-sm text-left">
              <p className="font-medium">Resultado:</p>
              <p className="text-gray-700">{uploadMessage}</p>
            </div>
          )}

          <div className="mt-6 text-xs text-gray-500">
            <p>Formato esperado: Solicitud de Autorización de Impresión por Autoimpresor</p>
            <p>Se extraerá automáticamente: RTN, Razón Social, CAI, Fecha Límite, Rangos</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
