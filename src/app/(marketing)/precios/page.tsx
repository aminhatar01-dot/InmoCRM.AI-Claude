import Link from 'next/link'
export default function PaginaPrecios() {
  return <div className="min-h-screen flex items-center justify-center"><div className="text-center"><h1 className="text-4xl font-bold text-gray-900">Precios</h1><Link href="/registrarse" className="mt-6 inline-block bg-violet-600 text-white px-6 py-3 rounded-xl">Empezar gratis</Link></div></div>
}
