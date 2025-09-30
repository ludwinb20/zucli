'use client';

export function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
      <div className="bg-white p-10 rounded-xl shadow-lg text-center max-w-sm">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-[#2E9589] rounded-full animate-spin mx-auto mb-5"></div>
        <div className="text-gray-600 text-base font-medium">
          Verificando sesión...
        </div>
      </div>
    </div>
  );
}
