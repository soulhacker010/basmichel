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
  ArrowRight,
  Menu,
  X,
  Mail,
  MapPin,
  Phone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const services = [
  {
    icon: Camera,
    title: 'Woningfotografie',
    description: 'Professionele foto\'s die uw woning perfect in beeld brengen voor een snelle verkoop.'
  },
  {
    icon: Building2,
    title: 'Bedrijfsfotografie',
    description: 'Zakelijke fotografie voor kantoren, winkels en commercieel vastgoed.'
  },
  {
    icon: Plane,
    title: 'Drone Fotografie',
    description: 'Luchtfoto\'s voor een uniek perspectief op uw object en omgeving.'
  },
  {
    icon: Video,
    title: 'Video Tours',
    description: 'Dynamische video\'s die potentiële kopers meenemen door het pand.'
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
        // Not authenticated
      }
    };
    checkAuth();
  }, []);

  const handleLogin = () => {
    base44.auth.redirectToLogin();
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            <span className="text-lg font-light text-gray-900 tracking-wide">Basmichel</span>
            
            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-10">
              <a href="#diensten" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                Diensten
              </a>
              <a href="#portfolio" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                Portfolio
              </a>
              <a href="#contact" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                Contact
              </a>
              {isAuthenticated ? (
                <Link to={createPageUrl(user?.role === 'admin' ? 'AdminDashboard' : 'ClientDashboard')}>
                  <Button className="bg-[#5C6B52] hover:bg-[#4A5A42] text-white rounded-full px-6">
                    Mijn Account
                  </Button>
                </Link>
              ) : (
                <Button 
                  onClick={handleLogin} 
                  className="bg-[#5C6B52] hover:bg-[#4A5A42] text-white rounded-full px-6"
                >
                  Inloggen
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
        {menuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-white border-t border-gray-100 px-6 py-6 space-y-4"
          >
            <a href="#diensten" className="block text-gray-600 py-2" onClick={() => setMenuOpen(false)}>
              Diensten
            </a>
            <a href="#portfolio" className="block text-gray-600 py-2" onClick={() => setMenuOpen(false)}>
              Portfolio
            </a>
            <a href="#contact" className="block text-gray-600 py-2" onClick={() => setMenuOpen(false)}>
              Contact
            </a>
            {isAuthenticated ? (
              <Link to={createPageUrl(user?.role === 'admin' ? 'AdminDashboard' : 'ClientDashboard')} onClick={() => setMenuOpen(false)}>
                <Button className="w-full bg-[#5C6B52] hover:bg-[#4A5A42] text-white rounded-full">
                  Mijn Account
                </Button>
              </Link>
            ) : (
              <Button onClick={handleLogin} className="w-full bg-[#5C6B52] hover:bg-[#4A5A42] text-white rounded-full">
                Inloggen
              </Button>
            )}
          </motion.div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 md:pt-44 md:pb-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-sm text-[#5C6B52] font-medium tracking-wide uppercase mb-4"
            >
              Vastgoedfotografie
            </motion.p>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-light text-gray-900 leading-[1.1] mb-6"
            >
              Beelden die
              <br />
              <span className="text-[#5C6B52]">verkopen</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg text-gray-500 leading-relaxed mb-10 max-w-lg"
            >
              Professionele vastgoedfotografie voor makelaars. Van woningfotografie tot drone-opnames en video tours.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              {isAuthenticated ? (
                <Link to={createPageUrl(user?.role === 'admin' ? 'AdminDashboard' : 'ClientBooking')}>
                  <Button size="lg" className="bg-[#5C6B52] hover:bg-[#4A5A42] text-white rounded-full px-8 h-12">
                    Shoot boeken
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              ) : (
                <Button 
                  size="lg" 
                  onClick={handleLogin} 
                  className="bg-[#5C6B52] hover:bg-[#4A5A42] text-white rounded-full px-8 h-12"
                >
                  Inloggen om te boeken
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
              <a href="#portfolio">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="rounded-full px-8 h-12 border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  Bekijk werk
                </Button>
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Hero Image */}
      <section className="pb-24">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="rounded-2xl overflow-hidden"
          >
            <img 
              src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&auto=format&fit=crop&q=80"
              alt="Professionele vastgoedfotografie"
              className="w-full h-[350px] md:h-[500px] object-cover"
            />
          </motion.div>
        </div>
      </section>

      {/* Services */}
      <section id="diensten" className="py-24 bg-[#FAFAF9]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-xl mb-16">
            <p className="text-sm text-[#5C6B52] font-medium tracking-wide uppercase mb-3">Diensten</p>
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">
              Alles voor uw vastgoedpresentatie
            </h2>
            <p className="text-gray-500 leading-relaxed">
              Van professionele fotografie tot video tours. Wij zorgen voor beelden die uw listings doen opvallen.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-xl p-8 border border-gray-100 hover:border-gray-200 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-[#E8EDE5] flex items-center justify-center mb-5">
                  <service.icon className="w-6 h-6 text-[#5C6B52]" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">{service.title}</h3>
                <p className="text-gray-500 leading-relaxed">{service.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio */}
      <section id="portfolio" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-xl mb-16">
            <p className="text-sm text-[#5C6B52] font-medium tracking-wide uppercase mb-3">Portfolio</p>
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">
              Recent werk
            </h2>
            <p className="text-gray-500 leading-relaxed">
              Een selectie van onze recente projecten voor makelaars in de regio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {portfolioImages.map((image, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                viewport={{ once: true }}
                className="aspect-[4/3] rounded-xl overflow-hidden group cursor-pointer"
              >
                <img 
                  src={image}
                  alt={`Project ${index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-[#5C6B52]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
            Klaar om te beginnen?
          </h2>
          <p className="text-lg text-white/70 mb-8">
            Log in om direct een fotoshoot te plannen voor uw volgende listing.
          </p>
          {isAuthenticated ? (
            <Link to={createPageUrl(user?.role === 'admin' ? 'AdminDashboard' : 'ClientBooking')}>
              <Button 
                size="lg" 
                className="bg-white text-[#5C6B52] hover:bg-gray-100 rounded-full px-8 h-12"
              >
                Shoot boeken
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          ) : (
            <Button 
              size="lg" 
              onClick={handleLogin} 
              className="bg-white text-[#5C6B52] hover:bg-gray-100 rounded-full px-8 h-12"
            >
              Inloggen
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-24 bg-[#FAFAF9]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div>
              <p className="text-sm text-[#5C6B52] font-medium tracking-wide uppercase mb-3">Contact</p>
              <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">
                Neem contact op
              </h2>
              <p className="text-gray-500 leading-relaxed mb-10">
                Heeft u vragen of wilt u meer informatie? We staan voor u klaar.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-[#5C6B52]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">E-mail</p>
                    <a href="mailto:info@basmichel.nl" className="text-gray-900 hover:text-[#5C6B52] transition-colors">
                      info@basmichel.nl
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-[#5C6B52]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Telefoon</p>
                    <a href="tel:+31612345678" className="text-gray-900 hover:text-[#5C6B52] transition-colors">
                      +31 6 12 34 56 78
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-[#5C6B52]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Regio</p>
                    <p className="text-gray-900">Noord-Brabant & Limburg</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-8 border border-gray-100">
              <h3 className="text-xl font-medium text-gray-900 mb-6">Stuur een bericht</h3>
              <form className="space-y-5">
                <div>
                  <input 
                    type="text"
                    placeholder="Uw naam"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#A8B5A0] focus:border-transparent bg-white text-gray-900 placeholder-gray-400"
                  />
                </div>
                <div>
                  <input 
                    type="email"
                    placeholder="E-mailadres"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#A8B5A0] focus:border-transparent bg-white text-gray-900 placeholder-gray-400"
                  />
                </div>
                <div>
                  <textarea 
                    placeholder="Uw bericht"
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#A8B5A0] focus:border-transparent bg-white text-gray-900 placeholder-gray-400 resize-none"
                  />
                </div>
                <Button 
                  type="button" 
                  className="w-full bg-[#5C6B52] hover:bg-[#4A5A42] text-white rounded-full h-12"
                >
                  Versturen
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <span className="text-lg font-light text-gray-900 tracking-wide">Basmichel</span>
              <p className="text-sm text-gray-400 mt-1">Professionele vastgoedfotografie</p>
            </div>
            <div className="flex items-center gap-8">
              <a href="#diensten" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">Diensten</a>
              <a href="#portfolio" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">Portfolio</a>
              <a href="#contact" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">Contact</a>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-400">© {new Date().getFullYear()} Basmichel. Alle rechten voorbehouden.</p>
            <Link 
              to={createPageUrl('AdminDashboard')}
              className="text-xs text-gray-300 hover:text-gray-400 transition-colors"
            >
              Beheer
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}