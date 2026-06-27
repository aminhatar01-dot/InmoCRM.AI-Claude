import Link from 'next/link'
export default function PaginaOnboarding() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-white flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">🎉</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">¡Todo listo!</h1>
        <p className="text-gray-500 mb-8">Tu cuenta fue creada exitosamente. Ahora configuremos tu agencia.</p>
        <Link href="/tablero" className="bg-violet-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-violet-700 transition-colors">
          Ir al tablero →
        </Link>
      </div>
    </div>
  )
}
