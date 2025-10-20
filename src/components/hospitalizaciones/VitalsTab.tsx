import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Activity, Plus, ChevronDown, ChevronUp, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { HospitalizationWithRelations } from "@/types/hospitalization";

interface VitalsTabProps {
  hospitalization: HospitalizationWithRelations;
  isActive: boolean;
  onRegisterVitals: () => void;
}

export default function VitalsTab({
  hospitalization,
  isActive,
  onRegisterVitals,
}: VitalsTabProps) {
  const [expandedPreclinica, setExpandedPreclinica] = useState<string | null>(null);
  const [selectedVitals, setSelectedVitals] = useState<string[]>(['temperatura', 'fc', 'satO2']);

  return (
    <Tabs defaultValue="listado" className="w-11/12 mx-auto">
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="listado">Historial</TabsTrigger>
        <TabsTrigger value="graficas">Evolución (Gráficas)</TabsTrigger>
      </TabsList>

      {/* Sub-Tab: Listado de Signos Vitales (Acordeón) */}
      <TabsContent value="listado">
        {hospitalization.preclinicas && hospitalization.preclinicas.length > 0 ? (
          <>
            {isActive && (
              <div className="mb-4 flex justify-end">
                <Button
                  onClick={onRegisterVitals}
                  className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevos Signos Vitales
                </Button>
              </div>
            )}
            <div className="space-y-3">
              {hospitalization.preclinicas.map((preclinica, index) => {
                const isExpanded = expandedPreclinica === preclinica.id;

                return (
                  <div key={preclinica.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Header del Acordeón */}
                    <button
                      onClick={() => setExpandedPreclinica(isExpanded ? null : preclinica.id)}
                      className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Activity className="h-4 w-4 text-blue-600" />
                        <div className="text-left">
                          <p className="font-semibold text-gray-900">
                            Signos Vitales #{hospitalization.preclinicas!.length - index}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(preclinica.createdAt).toLocaleString("es-HN", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </p>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </button>

                    {/* Contenido del Acordeón */}
                    {isExpanded && (
                      <div className="p-4 bg-white">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
                          {preclinica.presionArterial && (
                            <div>
                              <p className="text-gray-500 mb-1">Presión Arterial</p>
                              <p className="font-medium text-gray-900">{preclinica.presionArterial}</p>
                            </div>
                          )}
                          {preclinica.temperatura && (
                            <div>
                              <p className="text-gray-500 mb-1">Temperatura</p>
                              <p className="font-medium text-gray-900">{preclinica.temperatura}°C</p>
                            </div>
                          )}
                          {preclinica.fc && (
                            <div>
                              <p className="text-gray-500 mb-1">Frecuencia Cardíaca</p>
                              <p className="font-medium text-gray-900">{preclinica.fc} lpm</p>
                            </div>
                          )}
                          {preclinica.fr && (
                            <div>
                              <p className="text-gray-500 mb-1">Frecuencia Respiratoria</p>
                              <p className="font-medium text-gray-900">{preclinica.fr} rpm</p>
                            </div>
                          )}
                          {preclinica.satO2 && (
                            <div>
                              <p className="text-gray-500 mb-1">Saturación O2</p>
                              <p className="font-medium text-gray-900">{preclinica.satO2}%</p>
                            </div>
                          )}
                          {preclinica.peso && (
                            <div>
                              <p className="text-gray-500 mb-1">Peso</p>
                              <p className="font-medium text-gray-900">{preclinica.peso} lb</p>
                            </div>
                          )}
                          {preclinica.talla && (
                            <div>
                              <p className="text-gray-500 mb-1">Talla</p>
                              <p className="font-medium text-gray-900">{preclinica.talla} cm</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No hay signos vitales registrados</p>
            {isActive && (
              <Button
                onClick={onRegisterVitals}
                className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Registrar Primeros Signos Vitales
              </Button>
            )}
          </div>
        )}
      </TabsContent>

      {/* Sub-Tab: Gráficas de Evolución */}
      <TabsContent value="graficas">
        {hospitalization.preclinicas && hospitalization.preclinicas.length > 0 ? (
          <Card className="bg-white border-gray-200">
            <CardHeader className="border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-[#2E9589]" />
                  <h3 className="font-semibold text-gray-900">Evolución de Signos Vitales</h3>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedVitals.includes('temperatura')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedVitals([...selectedVitals, 'temperatura']);
                      } else {
                        setSelectedVitals(selectedVitals.filter(v => v !== 'temperatura'));
                      }
                    }}
                    className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Temperatura (°C)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedVitals.includes('fc')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedVitals([...selectedVitals, 'fc']);
                      } else {
                        setSelectedVitals(selectedVitals.filter(v => v !== 'fc'));
                      }
                    }}
                    className="w-4 h-4 text-pink-600 rounded focus:ring-pink-500"
                  />
                  <span className="text-sm font-medium text-gray-700">FC (lpm)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedVitals.includes('fr')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedVitals([...selectedVitals, 'fr']);
                      } else {
                        setSelectedVitals(selectedVitals.filter(v => v !== 'fr'));
                      }
                    }}
                    className="w-4 h-4 text-cyan-600 rounded focus:ring-cyan-500"
                  />
                  <span className="text-sm font-medium text-gray-700">FR (rpm)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedVitals.includes('satO2')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedVitals([...selectedVitals, 'satO2']);
                      } else {
                        setSelectedVitals(selectedVitals.filter(v => v !== 'satO2'));
                      }
                    }}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">SatO₂ (%)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedVitals.includes('peso')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedVitals([...selectedVitals, 'peso']);
                      } else {
                        setSelectedVitals(selectedVitals.filter(v => v !== 'peso'));
                      }
                    }}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Peso (lb)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedVitals.includes('presionArterial')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedVitals([...selectedVitals, 'presionArterial']);
                      } else {
                        setSelectedVitals(selectedVitals.filter(v => v !== 'presionArterial'));
                      }
                    }}
                    className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Presión Arterial</span>
                </label>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {selectedVitals.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart
                    data={hospitalization.preclinicas
                      .slice()
                      .reverse()
                      .map((p, idx) => {
                        const dataPoint: Record<string, string | number | null> = {
                          name: `#${idx + 1}`,
                          fecha: new Date(p.createdAt).toLocaleDateString('es-HN', { 
                            day: '2-digit', 
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          }),
                        };
                        
                        if (selectedVitals.includes('temperatura')) dataPoint.temperatura = p.temperatura || null;
                        if (selectedVitals.includes('fc')) dataPoint.fc = p.fc || null;
                        if (selectedVitals.includes('fr')) dataPoint.fr = p.fr || null;
                        if (selectedVitals.includes('satO2')) dataPoint.satO2 = p.satO2 || null;
                        if (selectedVitals.includes('peso')) dataPoint.peso = p.peso || null;
                        
                        if (selectedVitals.includes('presionArterial') && p.presionArterial) {
                          const [sistolica, diastolica] = p.presionArterial.split('/').map(v => parseInt(v.trim()));
                          dataPoint.sistolica = sistolica || null;
                          dataPoint.diastolica = diastolica || null;
                        }
                        
                        return dataPoint;
                      })}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="fecha" 
                      tick={{ fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    />
                    <Legend />
                    
                    {selectedVitals.includes('temperatura') && (
                      <Line 
                        type="monotone" 
                        dataKey="temperatura" 
                        name="Temperatura (°C)"
                        stroke="#ef4444" 
                        strokeWidth={2} 
                        dot={{ fill: '#ef4444', r: 4 }} 
                      />
                    )}
                    {selectedVitals.includes('fc') && (
                      <Line 
                        type="monotone" 
                        dataKey="fc" 
                        name="FC (lpm)"
                        stroke="#ec4899" 
                        strokeWidth={2} 
                        dot={{ fill: '#ec4899', r: 4 }} 
                      />
                    )}
                    {selectedVitals.includes('fr') && (
                      <Line 
                        type="monotone" 
                        dataKey="fr" 
                        name="FR (rpm)"
                        stroke="#06b6d4" 
                        strokeWidth={2} 
                        dot={{ fill: '#06b6d4', r: 4 }} 
                      />
                    )}
                    {selectedVitals.includes('satO2') && (
                      <Line 
                        type="monotone" 
                        dataKey="satO2" 
                        name="SatO₂ (%)"
                        stroke="#3b82f6" 
                        strokeWidth={2} 
                        dot={{ fill: '#3b82f6', r: 4 }} 
                      />
                    )}
                    {selectedVitals.includes('peso') && (
                      <Line 
                        type="monotone" 
                        dataKey="peso" 
                        name="Peso (lb)"
                        stroke="#9333ea" 
                        strokeWidth={2} 
                        dot={{ fill: '#9333ea', r: 4 }} 
                      />
                    )}
                    {selectedVitals.includes('presionArterial') && (
                      <>
                        <Line 
                          type="monotone" 
                          dataKey="sistolica" 
                          name="P. Sistólica"
                          stroke="#f97316" 
                          strokeWidth={2} 
                          dot={{ fill: '#f97316', r: 4 }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="diastolica" 
                          name="P. Diastólica"
                          stroke="#fb923c" 
                          strokeWidth={2} 
                          dot={{ fill: '#fb923c', r: 4 }} 
                        />
                      </>
                    )}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Selecciona al menos un signo vital para visualizar</p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No hay datos suficientes para generar gráficas</p>
            <p className="text-sm text-gray-400 mt-2">Registra al menos una medición de signos vitales</p>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

