import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AlgemeneVoorwaarden() {
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
        <h1 className="text-3xl font-light text-gray-900 mb-10">ALGEMENE VOORWAARDEN - Bas Michel</h1>
        <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed space-y-6">
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">Artikel 1 - Definities</h2>
            <p>In deze algemene voorwaarden wordt verstaan onder:</p>
            <p>- Opdrachtnemer: Bas Michel, gevestigd te Goudvink 35, 3281RH, Numansdorp, handelend onder de naam basmichel.nl.</p>
            <p>- Opdrachtgever: iedere natuurlijke of rechtspersoon die een opdracht verstrekt aan Opdrachtnemer.</p>
            <p>- Diensten: alle diensten die door Opdrachtnemer worden aangeboden, waaronder maar niet beperkt tot: vastgoedfotografie, 2D-plattegronden, meetrapporten, 360°-fotografie, dronebeelden, en video.</p>
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">Artikel 2 - Toepasselijkheid</h2>
            <p>2.1 Deze algemene voorwaarden zijn van toepassing op alle aanbiedingen, offertes, opdrachten en overeenkomsten tussen Opdrachtnemer en Opdrachtgever.</p>
            <p>2.2 Afwijkingen van deze voorwaarden zijn slechts geldig indien schriftelijk overeengekomen.</p>
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">Artikel 3 - Offertes en tarieven</h2>
            <p>3.1 Alle offertes zijn vrijblijvend en 14 dagen geldig.</p>
            <p>3.2 Genoemde prijzen zijn exclusief btw, tenzij anders vermeld.</p>
            <p>3.3 Opdrachtnemer behoudt zich het recht voor tarieven te wijzigen, met tijdige kennisgeving aan Opdrachtgever.</p>
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">Artikel 4 - Uitvoering van de opdracht</h2>
            <p>4.1 Opdrachtnemer zal de opdracht naar beste inzicht en vermogen uitvoeren.</p>
            <p>4.2 Levering van beeldmateriaal geschiedt doorgaans binnen 3 werkdagen na opname, tenzij anders overeengekomen.</p>
            <p>4.3 Opdrachtnemer is niet aansprakelijk voor vertragingen door overmacht of derden.</p>
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">Artikel 5 - Auteursrechten en gebruik</h2>
            <p>5.1 Het auteursrecht op alle geleverde beelden en plattegronden blijft bij Opdrachtnemer.</p>
            <p>5.2 Opdrachtgever verkrijgt een niet-exclusieve licentie voor gebruik ten behoeve van vastgoedpromotie.</p>
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">Artikel 6 - Annulering</h2>
            <p>6.1 Annulering van een opdracht dient minimaal 24 uur van tevoren te worden gemeld.</p>
            <p>6.2 Bij te late annulering kan 50% van de afgesproken prijs in rekening worden gebracht.</p>
            <p>6.3 Bij no-show op locatie wordt 50% van het afgesproken bedrag in rekening gebracht.</p>
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">Artikel 7 - Aansprakelijkheid</h2>
            <p>7.1 Opdrachtnemer is niet aansprakelijk voor indirecte schade, gevolgschade of gederfde winst.</p>
            <p>7.2 De aansprakelijkheid is beperkt tot het bedrag dat de verzekeraar van Opdrachtnemer uitkeert, of tot maximaal het factuurbedrag van de opdracht.</p>
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">Artikel 8 - Betaling</h2>
            <p>8.1 Betaling dient te geschieden binnen 14 dagen na factuurdatum.</p>
            <p>8.2 Bij niet-tijdige betaling is Opdrachtgever van rechtswege in verzuim en is wettelijke rente verschuldigd.</p>
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">Artikel 9 - Toepasselijk recht</h2>
            <p>9.1 Op alle overeenkomsten is Nederlands recht van toepassing.</p>
            <p>9.2 Geschillen worden voorgelegd aan de bevoegde rechter in het arrondissement waar Opdrachtnemer is gevestigd.</p>
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