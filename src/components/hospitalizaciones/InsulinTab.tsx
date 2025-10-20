import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Droplet, Plus, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { HospitalizationWithRelations } from "@/types/hospitalization";

interface InsulinTabProps {
  hospitalization: HospitalizationWithRelations;
  isActive: boolean;
  onRegisterInsulin: () => void;
}

export default function InsulinTab({
  hospitalization,
  isActive,
  onRegisterInsulin,
}: InsulinTabProps) {
  return (
    <Tabs defaultValue="listado" className="w-11/12 mx-auto">
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="listado">Historial</TabsTrigger>
        <TabsTrigger value="graficas">Evolución (Gráficas)</TabsTrigger>
      </TabsList>

      {/* Sub-Tab: Listado de Controles de Insulina */}
      <TabsContent value="listado">
        {hospitalization.insulinControls && hospitalization.insulinControls.length > 0 ? (
          <>
            {isActive && (
              <div className="mb-4 flex justify-end">
                <Button
                  onClick={onRegisterInsulin}
                  className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Control de Insulina
                </Button>
              </div>
            )}
            <div className="space-y-3">
              {hospitalization.insulinControls.map((control, index) => (
                <div key={control.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Droplet className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="font-semibold text-gray-900">
                          Control #{hospitalization.insulinControls!.length - index}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(control.createdAt).toLocaleString("es-HN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-purple-50 rounded-lg p-3">
                      <p className="text-gray-500 mb-1 text-xs">Resultado de Glucosa</p>
                      <p className="font-bold text-lg text-purple-700">{control.resultado} mg/dL</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-gray-500 mb-1 text-xs">Insulina Administrada</p>
                      <p className="font-bold text-lg text-blue-700">{control.insulinaAdministrada} unidades</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <Droplet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No hay controles de insulina registrados</p>
            {isActive && (
              <Button
                onClick={onRegisterInsulin}
                className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Registrar Primer Control
              </Button>
            )}
          </div>
        )}
      </TabsContent>

      {/* Sub-Tab: Gráficas de Evolución */}
      <TabsContent value="graficas">
        {hospitalization.insulinControls && hospitalization.insulinControls.length > 1 ? (
          <Card className="bg-white border-gray-200">
            <CardHeader className="border-b border-gray-200">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[#2E9589]" />
                <h3 className="font-semibold text-gray-900">Control de Insulina - Glucosa vs Insulina Administrada</h3>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={hospitalization.insulinControls
                    .slice()
                    .reverse()
                    .map((control, idx) => ({
                      name: `#${idx + 1}`,
                      fecha: new Date(control.createdAt).toLocaleDateString('es-HN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      }),
                      glucosa: control.resultado,
                      insulina: control.insulinaAdministrada,
                    }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="fecha" 
                    tick={{ fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }} 
                    label={{ value: 'Valores', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    formatter={(value: number, name: string) => {
                      if (name === 'glucosa') return [`${value} mg/dL`, 'Glucosa'];
                      if (name === 'insulina') return [`${value} unidades`, 'Insulina'];
                      return [value, name];
                    }}
                  />
                  <Legend 
                    formatter={(value: string) => {
                      if (value === 'glucosa') return 'Glucosa (mg/dL)';
                      if (value === 'insulina') return 'Insulina (unidades)';
                      return value;
                    }}
                  />
                  <Bar 
                    dataKey="glucosa" 
                    stackId="a"
                    fill="#9333ea" 
                    name="glucosa"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar 
                    dataKey="insulina" 
                    stackId="a"
                    fill="#3b82f6" 
                    name="insulina"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Se necesitan al menos 2 controles para generar gráficas</p>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

