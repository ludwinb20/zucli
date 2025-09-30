'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        router.push('/dashboard');
      } else {
        setError('Credenciales incorrectas');
      }
    } catch (err) {
      setError('Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg bg-white">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-white/10 rounded-full">
              <Image 
                src="/assets/logo.png" 
                alt="Hospital Zuniga Logo" 
                width={255} 
                height={255}
                className="w-64 h-auto"
              />
            </div>
          </div>
          {/* <CardTitle className="text-2xl font-bold text-gray-900">
            Hospital Zuniga
          </CardTitle> */}
          <CardDescription className="text-gray-600">
            Inicia sesión para acceder al sistema
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@clinica.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589]"
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-[#2E9589] hover:bg-[#2E9589]/90 text-white" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
          </form>

          {/* <div className="mt-6 p-4 bg-[#F5F7FA] rounded-lg">
            <h4 className="font-medium text-sm text-gray-900 mb-2">Usuarios de prueba:</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div><strong>Admin:</strong> admin@clinica.com</div>
              <div><strong>Especialista:</strong> especialista@clinica.com</div>
              <div><strong>Recepción:</strong> recepcion@clinica.com</div>
              <div><strong>Caja:</strong> caja@clinica.com</div>
              <div className="mt-2 text-gray-500">Contraseña: password123</div>
            </div>
          </div> */}
        </CardContent>
      </Card>
    </div>
  );
}
