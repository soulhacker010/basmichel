import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Cookieverklaring() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-100 py-4 px-6 lg:px-12">
        <Link to={createPageUrl('Home')}>
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696d131f67e4f7236fb13603/41d5ec5ec_BasMichel_K152.png"
            alt="Bas Michel"
            className="h-16"
          />
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-3xl mx-auto px-6 py-16 w-full">
        <h1 className="text-3xl font-light text-gray-900 mb-2">COOKIEVERKLARING – Bas Michel Vastgoedpresentatie</h1>
        <p className="text-sm text-gray-500 mb-10">Laatst bijgewerkt: 01/05/2025</p>
        <p className="text-gray-700 mb-8">Op de website van Bas Michel Vastgoedpresentatie maken wij gebruik van cookies. In deze verklaring leggen we uit wat cookies zijn, welke cookies we gebruiken en waarom.</p>
        <div className="space-y-6 text-gray-700 leading-relaxed">
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">1. Wat zijn cookies?</h2>
            <p>Cookies zijn kleine tekstbestanden die bij je bezoek aan een website op je computer, tablet of smartphone worden geplaatst. Ze zorgen er bijvoorbeeld voor dat de website goed werkt of meten hoe bezoekers de website gebruiken.</p>
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">2. Welke cookies gebruiken wij?</h2>
            <h3 className="font-medium text-gray-800 mt-3 mb-1">a. Functionele cookies (noodzakelijk)</h3>
            <p>Deze cookies zijn nodig om de website goed te laten functioneren. Ze onthouden bijvoorbeeld voorkeuren of zorgen ervoor dat formulieren correct werken.</p>
            <p>- Doel: goede werking van de site</p>
            <p>- Gegevens: geen persoonsgegevens</p>
            <p>- Opslagduur: tot einde sessie of enkele dagen</p>
            <h3 className="font-medium text-gray-800 mt-3 mb-1">b. Analytische cookies (optioneel, via bijv. Google Analytics)</h3>
            <p>Met deze cookies meten wij anoniem het gebruik van de website. Dit helpt ons om de site te verbeteren en gebruikerservaring te optimaliseren.</p>
            <p>- Doel: inzicht in websitegebruik</p>
            <p>- Gegevens: geanonimiseerde IP-adressen</p>
            <p>- Opslagduur: maximaal 2 jaar</p>
            <p>Let op: we gebruiken Google Analytics met IP-anonimisering en zonder gegevens te delen met derden.</p>
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">3. Geen tracking of marketingcookies</h2>
            <p>Wij gebruiken géén trackingcookies of cookies voor gepersonaliseerde advertenties. Je gegevens worden dus niet gebruikt voor commerciële profiling.</p>
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">4. Cookies beheren of verwijderen</h2>
            <p>Je kunt cookies altijd zelf verwijderen via de instellingen van je browser. Ook kun je daar instellen dat websites geen cookies mogen plaatsen. Houd er dan wel rekening mee dat de site mogelijk niet optimaal functioneert.</p>
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">5. Vragen?</h2>
            <p>Heb je vragen over ons cookiegebruik? Neem dan contact op via <a href="mailto:info@basmichel.nl" className="text-gray-900 underline">info@basmichel.nl</a>.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-16 bg-black text-white mt-auto">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div>
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696d131f67e4f7236fb13603/d493012a0_BasMichel_K102.png"
                alt="Bas Michel"
                className="h-14 brightness-0 invert mb-4"
              />
              <ul className="space-y-1 text-sm text-gray-400">
                <li>Bas Michel</li>
                <li><a href="mailto:basmichelsite@gmail.com" className="hover:text-white transition-colors">basmichelsite@gmail.com</a></li>
                <li>Goudvink 35, Numansdorp</li>
                <li className="pt-1">KvK: 87212978</li>
                <li>BTW: 004372351B68</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-4 uppercase tracking-wide">Diensten</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to={createPageUrl('Home')} className="hover:text-white transition-colors">Fotografie</Link></li>
                <li><Link to={createPageUrl('Home')} className="hover:text-white transition-colors">Video Tours</Link></li>
                <li><Link to={createPageUrl('Home')} className="hover:text-white transition-colors">360° Virtuele Tours</Link></li>
                <li><Link to={createPageUrl('Home')} className="hover:text-white transition-colors">Plattegronden</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-4 uppercase tracking-wide">Juridisch</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to={createPageUrl('AlgemeneVoorwaarden')} className="hover:text-white transition-colors">Algemene Voorwaarden</Link></li>
                <li><Link to={createPageUrl('Servicevoorwaarden')} className="hover:text-white transition-colors">Servicevoorwaarden</Link></li>
                <li><Link to={createPageUrl('Privacyverklaring')} className="hover:text-white transition-colors">Privacyverklaring</Link></li>
                <li><Link to={createPageUrl('Cookieverklaring')} className="hover:text-white transition-colors">Cookieverklaring</Link></li>
                <li><Link to={createPageUrl('Disclaimer')} className="hover:text-white transition-colors">Disclaimer</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-800">
            <p className="text-sm text-gray-500">© {new Date().getFullYear()} Bas Michel. Alle rechten voorbehouden.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}