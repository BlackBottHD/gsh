import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-gray-400 text-center text-sm mt-12 p-4 border-t border-gray-700 space-y-2">
      <div className="space-x-4">
        <Link href="/impressum" className="hover:text-white hover:underline">Impressum</Link>
        <Link href="/datenschutz" className="hover:text-white hover:underline">Datenschutz</Link>
        <Link href="/agb" className="hover:text-white hover:underline">AGB</Link>
        <Link href="/cookies" className="hover:text-white hover:underline">Cookies</Link>
      </div>
      <div>© 2025 HGDEVS – Hosting für Gamer</div>
    </footer>
  )
}
