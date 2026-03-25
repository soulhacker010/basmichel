import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Menu, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export default function StylingTips() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const auth = await base44.auth.isAuthenticated();
        setIsAuthenticated(auth);
        if (auth) {
          const userData = await base44.auth.me();
          setUser(userData);
        }
      } catch (e) {}
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogin = () => base44.auth.redirectToLogin();

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-20">
            <Link to={createPageUrl('Home')}>
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696d131f67e4f7236fb13603/41d5ec5ec_BasMichel_K152.png"
                alt="Bas Michel"
                className="h-20"
              />
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-12">
              <Link to={createPageUrl('Home')} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Home
              </Link>
              <Link to={createPageUrl('Contact')} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Contact
              </Link>
              {isAuthenticated ? (
                <Link to={createPageUrl(user?.role === 'admin' ? 'AdminDashboard' : 'ClientDashboard')}>
                  <Button className="rounded px-6 h-9 text-sm bg-black hover:bg-gray-900 text-white">
                    Mijn Account
                  </Button>
                </Link>
              ) : (
                <Button onClick={handleLogin} className="rounded px-6 h-9 text-sm bg-black hover:bg-gray-900 text-white">
                  Inloggen voor Makelaars
                </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-gray-600"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="md:hidden mx-3 mb-3 rounded-2xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
            >
              <div className="px-4 py-3 space-y-1">
                <Link to={createPageUrl('Home')} className="flex items-center px-3 py-3 rounded-xl text-gray-700 text-sm font-medium hover:bg-black/5 transition-colors" onClick={() => setMenuOpen(false)}>
                  Home
                </Link>
                <Link to={createPageUrl('Contact')} className="flex items-center px-3 py-3 rounded-xl text-gray-700 text-sm font-medium hover:bg-black/5 transition-colors" onClick={() => setMenuOpen(false)}>
                  Contact
                </Link>
              </div>
              <div className="px-4 pb-4" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                <div className="pt-3">
                  {isAuthenticated ? (
                    <Link to={createPageUrl(user?.role === 'admin' ? 'AdminDashboard' : 'ClientDashboard')} onClick={() => setMenuOpen(false)}>
                      <Button className="w-full rounded-xl text-sm font-medium bg-black text-white">Mijn Account</Button>
                    </Link>
                  ) : (
                    <Button onClick={() => { setMenuOpen(false); handleLogin(); }} className="w-full rounded-xl text-sm font-medium bg-black text-white">
                      Inloggen voor Makelaars
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero / Title Section */}
      <section className="pt-40 pb-16 text-center px-6">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-5xl md:text-6xl font-light text-gray-900 mb-6"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          Styling tips
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-xl md:text-2xl italic text-gray-600 mb-3"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          Een goede eerste indruk is essentieel bij de verkoop of verhuur van vastgoed.
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-sm text-gray-500 max-w-xl mx-auto"
        >
          Met deze praktische tips zorg je ervoor dat je woning er verzorgd en uitnodigend uitziet tijdens de fotoshoot en bezichtigingen
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-10 flex justify-center"
        >
          <div className="w-px h-16 bg-amber-300" />
        </motion.div>
      </section>

      {/* Content Sections */}
      <div className="max-w-3xl mx-auto px-6 lg:px-8 pb-24 space-y-20">

        {/* Section 1 */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-light text-gray-900 mb-4" style={{ fontFamily: 'Georgia, serif' }}>
            Opruimen is de Eerste Stap
          </h2>
          <p className="text-gray-600 leading-relaxed mb-8">
            Een opgeruimde woning oogt automatisch ruimer en uitnodigender. Verwijder losse spullen zoals afstandsbedieningen, speelgoed of wasmanden, zodat niets afleidt van de ruimte zelf. Hoe minder visuele afleiding, hoe beter de woning tot zijn recht komt op beeld.
          </p>
          <div className="overflow-hidden rounded-sm">
            <img
              src="https://images-pw.pixieset.com/site/2kZAYq/kKwxQ7/SSvgtbW8HCnoFEnBMRxhw-accbbea2-1500.jpg"
              alt="Modern Scandinavisch interieur met minimalistische meubels, witte muren en een juten tapijt"
              className="w-full object-cover"
            />
          </div>
        </motion.section>

        {/* Section 2 */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-light text-gray-900 mb-4" style={{ fontFamily: 'Georgia, serif' }}>
            Licht en Sfeer
          </h2>
          <p className="text-gray-600 leading-relaxed mb-8">
            Daglicht maakt elke ruimte aantrekkelijker. Zet alle gordijnen en jaloezieën open om natuurlijk licht binnen te laten. Persoonlijke foto's of opvallende decoratie kun je het beste verwijderen — die leiden de aandacht af van de woning. Blijft er toch iets hangen? Geen probleem: deze worden achteraf geblurd.
          </p>
          <div className="overflow-hidden rounded-sm">
            <img
              src="https://images-pw.pixieset.com/site/2kZAYq/e9PAGX/bright-living-room-stockcake-4b7e96b4-1500.jpg"
              alt="Moderne, zonnige woonkamer met witte muren en vloer-tot-plafond ramen"
              className="w-full object-cover"
            />
          </div>
        </motion.section>

        {/* Section 3 */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-light text-gray-900 mb-4" style={{ fontFamily: 'Georgia, serif' }}>
            Details Maken het Verschil
          </h2>
          <p className="text-gray-600 leading-relaxed mb-8">
            Denk aan de kleine dingen die snel over het hoofd worden gezien: handdoeken en theedoeken mogen uit beeld, toiletdeksels dicht, stoelen recht en spiegels schoon. Met kleine sfeerelementen zoals een vaas bloemen of een opgemaakt bed geef je de ruimte nét wat extra uitstraling, zonder te overdrijven.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="overflow-hidden rounded-sm">
              <img
                src="https://images-pw.pixieset.com/site/2kZAYq/05EOmO/pexels-photo-13408378-4387a010-1500.jpeg"
                alt="Verse lentebloemen in glazen vazen op een zonnig vensterbank"
                className="w-full h-64 object-cover"
              />
            </div>
            <div className="overflow-hidden rounded-sm">
              <img
                src="https://images-pw.pixieset.com/site/2kZAYq/mlLo9o/vt-tuinen-555aabfc-1500.jpg"
                alt="Ruim groen gazon met bomen en hagen rondom een witte woning"
                className="w-full h-64 object-cover"
              />
            </div>
          </div>
        </motion.section>

        {/* Section 4 */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-light text-gray-900 mb-4" style={{ fontFamily: 'Georgia, serif' }}>
            Vergeet Buiten Niet
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Ook het balkon, terras of de tuin telt mee. Zorg dat alles buiten netjes is opgeruimd en eventueel aangekleed met tuinmeubilair of een plantje. Buitenruimtes zijn een verlengstuk van de woning en maken vaak het verschil in de beleving van de kijker.
          </p>
        </motion.section>

        {/* Section 5 - Checklist */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-gray-50 p-8 md:p-10 rounded-sm"
        >
          <h2 className="text-3xl font-light text-gray-900 mb-4" style={{ fontFamily: 'Georgia, serif' }}>
            Alles Klaar voor de Shoot?
          </h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            Loop nog even alles na voordat we langskomen. Zijn de ruimtes netjes opgeruimd? Gordijnen open voor zoveel mogelijk daglicht? Handdoeken en persoonlijke foto's uit beeld? Staat er iets kleins voor de sfeer, zoals een plantje of een schaal fruit? Denk ook aan de buitenruimte — een verzorgde tuin of balkon maakt het totaalplaatje compleet.
          </p>
          <p className="text-gray-800 font-medium leading-relaxed">
            <span className="text-gray-500 font-normal">Extra tip:</span> haal waar mogelijk de horren uit de ramen. Zo krijgen we een helder zicht naar buiten en oogt het ruimtelijker op beeld.
          </p>
          <p className="text-gray-600 leading-relaxed mt-4">
            Zo zorgen we samen voor een sterke, professionele presentatie van jouw woning.
          </p>
        </motion.section>
      </div>

      {/* Footer */}
      <footer className="py-16 bg-black text-white">
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
          <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">© {new Date().getFullYear()} Bas Michel. Alle rechten voorbehouden.</p>
            <div className="flex gap-6 text-sm text-gray-500">
              {isAuthenticated && (
                <Link to={createPageUrl(user?.role === 'admin' ? 'AdminDashboard' : 'ClientDashboard')} className="hover:text-white transition-colors">
                  Mijn Account
                </Link>
              )}
              {(!isAuthenticated || user?.role === 'admin') && (
                <Link to={createPageUrl('AdminLogin')} className="hover:text-white transition-colors">
                  Beheer
                </Link>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}