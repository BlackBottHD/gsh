'use client'

import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <main className="p-6 md:p-12 space-y-16">

        {/* Hero */}
        <section className="text-center py-12 bg-gray-800 rounded-xl shadow">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Willkommen bei HGDEVS</h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Dein Hosting-Partner für kostenlose Gameserver – finanziert durch Werbung, betrieben mit Leidenschaft.
          </p>
        </section>

        {/* Über uns */}
        <section className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold mb-4 text-white">Was ist HGDEVS?</h2>
          <p className="text-gray-300">
            HGDEVS ist ein innovativer Hosting-Dienstleister, der sich auf Gaming-Server spezialisiert hat.
            Unser Ziel: Jeder Gamer soll Zugang zu hochwertigen Servern erhalten – ohne dafür zu bezahlen.
            Möglich macht das unser werbebasiertes Finanzierungsmodell.
          </p>
        </section>

        {/* Wie funktioniert’s */}
        <section className="bg-gray-800 p-6 rounded-xl shadow max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold mb-4 text-white">Wie funktioniert das?</h2>
          <p className="text-gray-300 mb-4">
            Bei HGDEVS kannst du dir Gameserver und Hosting-Pakete durch einfache Werbeaktionen finanzieren – ganz ohne eigenes Geld auszugeben.
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-300">
            <li>Schau dir kurze Werbevideos an oder klicke auf bezahlte Banner</li>
            <li>Nutze deinen persönlichen Short-Link: Teile ihn mit Freunden, jede Weiterleitung bringt dir Coins</li>
            <li>Erhalte einen personalisierten Werbebanner, den du auf deiner Website oder in deinem Forum einbinden kannst</li>
            <li>Nutze und teile deinen individuellen Gutscheincode – je nach Partner-Stufe bekommst du und deine Community Rabatte oder Bonus-Coins</li>
            <li>Jede dieser Aktionen lädt dein Guthabenkonto auf (Coins oder Diamanten)</li>
            <li>Du kannst jederzeit auch Coins kaufen, um Werbung zu deaktivieren oder mehr Leistung zu erhalten</li>
          </ul>
        </section>

        {/* Vorschau Pakete */}
        <section className="text-center">
          <h2 className="text-2xl font-semibold mb-4 text-white">Bereit? Schau dir unsere Pakete an</h2>
          <Link href="/shop">
            <button className="bg-green-600 text-white px-6 py-3 rounded text-lg hover:bg-green-700 transition">
              Zum Shop
            </button>
          </Link>
        </section>

        {/* Mehr als nur Gameserver */}
        <section className="bg-gray-800 p-6 rounded-xl shadow max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold mb-4 text-white">Mehr als nur Gameserver</h2>
          <p className="text-gray-300 mb-4">
            HGDEVS ist nicht nur dein Partner für Gameserver. Wir bieten auch skalierbare Lösungen für ambitionierte Projekte – vom privaten Testserver bis hin zur dedizierten Infrastruktur für Unternehmen.
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-300">
            <li><strong>V-Server:</strong> Flexibel, günstig und ideal für kleinere bis mittlere Anwendungen</li>
            <li><strong>Root-Server:</strong> Volle Kontrolle für erfahrene Admins und Entwickler</li>
            <li><strong>Dedizierte Server:</strong> Maximale Leistung für große Projekte oder Firmenlösungen</li>
          </ul>
        </section>
        {/* Community-Bereich */}
        <section className="text-center mt-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Werde Teil unserer Community
          </h2>
          <p className="text-gray-400 mb-6">
            Tausche dich mit anderen Spielern, Server-Admins und HGDEVS-Teammitgliedern aus – direkt auf unserem Discord-Server.
          </p>

          <Link href="https://discord.hgdevs.eu" target="_blank">
            <button className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-medium px-6 py-2 rounded transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.369a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.078.037c-.211.375-.444.864-.608 1.25a18.214 18.214 0 0 0-5.451 0 12.395 12.395 0 0 0-.617-1.25.078.078 0 0 0-.078-.037A19.736 19.736 0 0 0 3.683 4.369a.07.07 0 0 0-.032.027C.533 9.045-.32 13.58.099 18.057a.083.083 0 0 0 .031.054 19.89 19.89 0 0 0 5.993 3.058.078.078 0 0 0 .084-.027c.462-.63.873-1.295 1.226-1.993a.076.076 0 0 0-.041-.103 12.755 12.755 0 0 1-1.81-.867.078.078 0 0 1-.008-.13c.122-.093.244-.188.36-.287a.074.074 0 0 1 .079-.01c3.818 1.748 7.948 1.748 11.713 0a.074.074 0 0 1 .08.01c.116.099.237.194.36.287a.078.078 0 0 1-.006.13 11.852 11.852 0 0 1-1.811.867.076.076 0 0 0-.04.103c.36.698.77 1.363 1.225 1.993a.078.078 0 0 0 .084.028 19.933 19.933 0 0 0 6.002-3.058.078.078 0 0 0 .03-.054c.5-5.177-.838-9.673-3.587-13.661a.061.061 0 0 0-.03-.027ZM8.02 15.331c-1.182 0-2.156-1.085-2.156-2.419 0-1.333.955-2.418 2.157-2.418 1.21 0 2.174 1.093 2.156 2.419 0 1.333-.955 2.418-2.157 2.418Zm7.974 0c-1.182 0-2.156-1.085-2.156-2.419 0-1.333.955-2.418 2.156-2.418 1.21 0 2.174 1.093 2.156 2.419 0 1.333-.945 2.418-2.156 2.418Z" />
              </svg>
              Zum Discord-Server
            </button>
          </Link>
        </section>

      </main>
    </div>
  )
}
