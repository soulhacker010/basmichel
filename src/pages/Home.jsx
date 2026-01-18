import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { 
  Camera, 
  Home as HomeIcon, 
  Building2, 
  Plane,
  Video,
  ChevronRight,
  Star,
  ArrowRight,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const services = [
  {
    icon: Camera,
    title: 'Woningfotografie',
    description: 'Professionele foto\'s die uw woning in het beste licht zetten.'
  },
  {
    icon: Building2,
    title: 'Bedrijfsfotografie',
    description: 'Zakelijke fotografie voor kantoren en commercieel vastgoed.'
  },
  {
    icon: Plane,
    title: 'Drone Fotografie',
    description: 'Indrukwekkende luchtfoto\'s voor een uniek perspectief.'
  },
  {
    icon: Video,
    title: 'Video Tours',
    description: 'Dynamische video\'s die uw pand tot leven brengen.'
  }
];

const portfolioImages = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&auto=format&fit=crop&q=80'
];

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const auth = await base44.auth.isAuthenticated();
        setIsAuthenticated(auth);
        if (auth) {
          const userData = await base44.auth.me();
          setUser(userData);
        }
      } catch (e) {
        console.log('Not authenticated');
      }
    };
    checkAuth();
  }, []);

  const handleLogin = () => {
    base44.auth.redirectToLogin();
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <span className="text-xl font-light text-gray-900 tracking-wide">Basmichel</span>
            
            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#diensten" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Diensten</a>
              <a href="#portfolio" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Portfolio</a>
              <a href="#contact" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Contact</a>
              {isAuthenticated ? (
                <Link to={createPageUrl(user?.role === 'admin' ? 'AdminDashboard' : 'ClientDashboard')}>
                  <Button className="bg-[#A8B5A0] hover:bg-[#97A690] text-white">
                    Mijn Account
                  </Button>
                </Link>
              ) : (
                <Button onClick={handleLogin} className="bg-[#A8B5A0] hover:bg-[#97A690] text-white">
                  Inloggen voor Makelaars
                </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 py-6 space-y-4">
            <a href="#diensten" className="block text-gray-600" onClick={() => setMenuOpen(false)}>Diensten</a>
            <a href="#portfolio" className="block text-gray-600" onClick={() => setMenuOpen(false)}>Portfolio</a>
            <a href="#contact" className="block text-gray-600" onClick={() => setMenuOpen(false)}>Contact</a>
            {isAuthenticated ? (
              <Link to={createPageUrl(user?.role === 'admin' ? 'AdminDashboard' : 'ClientDashboard')} onClick={() => setMenuOpen(false)}>
                <Button className="w-full bg-[#A8B5A0] hover:bg-[#97A690] text-white">
                  Mijn Account
                </Button>
              </Link>
            ) : (
              <Button onClick={handleLogin} className="w-full bg-[#A8B5A0] hover:bg-[#97A690] text-white">
                Inloggen voor Makelaars
              </Button>
            )}
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-6xl font-light text-gray-900 leading-tight mb-6"
            >
              Professionele vastgoedfotografie die verkoopt
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-lg md:text-xl text-gray-600 mb-8"
            >
              Wij creëren beelden die potentiële kopers overtuigen. 
              Van woningfotografie tot drone-opnames en video tours.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              {isAuthenticated ? (
                <Link to={createPageUrl(user?.role === 'admin' ? 'AdminDashboard' : 'ClientDashboard')}>
                  <Button size="lg" className="bg-[#A8B5A0] hover:bg-[#97A690] text-white px-8">
                    Naar Dashboard
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              ) : (
                <Button size="lg" onClick={handleLogin} className="bg-[#A8B5A0] hover:bg-[#97A690] text-white px-8">
                  Inloggen om te boeken
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              )}
              <a href="#portfolio">
                <Button size="lg" variant="outline" className="px-8">
                  Bekijk Portfolio
                </Button>
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Hero Image */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="rounded-2xl overflow-hidden shadow-2xl"
          >
            <img 
              src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&auto=format&fit=crop&q=80"
              alt="Vastgoedfotografie"
              className="w-full h-[400px] md:h-[600px] object-cover"
            />
          </motion.div>
        </div>
      </section>

      {/* Services */}
      <section id="diensten" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">Onze Diensten</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Alles wat u nodig heeft om uw vastgoed professioneel te presenteren
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-[#FAFAF9] rounded-xl p-8 text-center hover:shadow-md transition-shadow"
              >
                <div className="w-16 h-16 rounded-full bg-[#E8EDE5] flex items-center justify-center mx-auto mb-6">
                  <service.icon className="w-8 h-8 text-[#5C6B52]" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-3">{service.title}</h3>
                <p className="text-gray-600">{service.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio */}
      <section id="portfolio" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">Portfolio</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Een selectie van onze recente projecten
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolioImages.map((image, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="aspect-[4/3] rounded-xl overflow-hidden group cursor-pointer"
              >
                <img 
                  src={image}
                  alt={`Portfolio ${index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#5C6B52]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-light text-white mb-6">
            Klaar om samen te werken?
          </h2>
          <p className="text-lg text-white/80 mb-8">
            Log in als makelaar om direct een fotoshoot te boeken voor uw volgende listing.
          </p>
          {isAuthenticated ? (
            <Link to={createPageUrl(user?.role === 'admin' ? 'AdminDashboard' : 'ClientDashboard')}>
              <Button size="lg" className="bg-white text-[#5C6B52] hover:bg-gray-100 px-8">
                Naar Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          ) : (
            <Button size="lg" onClick={handleLogin} className="bg-white text-[#5C6B52] hover:bg-gray-100 px-8">
              Inloggen om te boeken
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          )}
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div>
              <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-6">Contact</h2>
              <p className="text-lg text-gray-600 mb-8">
                Heeft u vragen of wilt u meer informatie? Neem gerust contact met ons op.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#E8EDE5] flex items-center justify-center">
                    <svg className="w-6 h-6 text-[#5C6B52]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">E-mail</p>
                    <a href="mailto:info@basmichel.nl" className="text-gray-900 hover:text-[#5C6B52]">info@basmichel.nl</a>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#E8EDE5] flex items-center justify-center">
                    <svg className="w-6 h-6 text-[#5C6B52]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Website</p>
                    <a href="https://basmichel.nl" target="_blank" rel="noopener noreferrer" className="text-gray-900 hover:text-[#5C6B52]">basmichel.nl</a>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-[#FAFAF9] rounded-xl p-8">
              <h3 className="text-xl font-medium text-gray-900 mb-6">Stuur een bericht</h3>
              <form className="space-y-4">
                <div>
                  <input 
                    type="text"
                    placeholder="Uw naam"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#A8B5A0]"
                  />
                </div>
                <div>
                  <input 
                    type="email"
                    placeholder="E-mailadres"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#A8B5A0]"
                  />
                </div>
                <div>
                  <textarea 
                    placeholder="Uw bericht"
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#A8B5A0] resize-none"
                  />
                </div>
                <Button type="button" className="w-full bg-[#A8B5A0] hover:bg-[#97A690] text-white">
                  Versturen
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <span className="text-xl font-light tracking-wide">Basmichel</span>
              <p className="text-sm text-gray-400 mt-2">Professionele vastgoedfotografie</p>
            </div>
            <div className="flex items-center gap-8">
              <a href="#diensten" className="text-sm text-gray-400 hover:text-white transition-colors">Diensten</a>
              <a href="#portfolio" className="text-sm text-gray-400 hover:text-white transition-colors">Portfolio</a>
              <a href="#contact" className="text-sm text-gray-400 hover:text-white transition-colors">Contact</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">© {new Date().getFullYear()} Basmichel. Alle rechten voorbehouden.</p>
            <Link 
              to={createPageUrl('AdminDashboard')}
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
            >
              Beheer
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}