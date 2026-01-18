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
    <div className="min-h-screen bg-[#FCFCFB]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-20">
            <span className="text-xl font-light text-gray-900 tracking-tight">basmichel</span>
            
            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-12">
              <a href="#diensten" className="text-sm text-gray-400 hover:text-gray-900 transition-colors">
                Diensten
              </a>
              <a href="#portfolio" className="text-sm text-gray-400 hover:text-gray-900 transition-colors">
                Portfolio
              </a>
              <a href="#contact" className="text-sm text-gray-400 hover:text-gray-900 transition-colors">
                Contact
              </a>
              {isAuthenticated ? (
                <Link to={createPageUrl(user?.role === 'admin' ? 'AdminDashboard' : 'ClientDashboard')}>
                  <Button className="bg-gray-900 hover:bg-gray-800 text-white rounded-full px-6 h-10 text-sm">
                    Mijn Account
                  </Button>
                </Link>
              ) : (
                <Button 
                  onClick={handleLogin} 
                  className="bg-gray-900 hover:bg-gray-800 text-white rounded-full px-6 h-10 text-sm"
                >
                  Inloggen
                </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 text-gray-400"
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
            <a href="#diensten" className="block text-gray-500 py-2" onClick={() => setMenuOpen(false)}>
              Diensten
            </a>
            <a href="#portfolio" className="block text-gray-500 py-2" onClick={() => setMenuOpen(false)}>
              Portfolio
            </a>
            <a href="#contact" className="block text-gray-500 py-2" onClick={() => setMenuOpen(false)}>
              Contact
            </a>
            {isAuthenticated ? (
              <Link to={createPageUrl(user?.role === 'admin' ? 'AdminDashboard' : 'ClientDashboard')} onClick={() => setMenuOpen(false)}>
                <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-full h-11">
                  Mijn Account
                </Button>
              </Link>
            ) : (
              <Button onClick={handleLogin} className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-full h-11">
                Inloggen
              </Button>
            )}
          </motion.div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-32 md:pt-56 md:pb-48">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="max-w-3xl">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-5xl md:text-6xl lg:text-7xl font-light text-gray-900 leading-[1.05] mb-8 tracking-tight"
            >
              Vastgoed
              <br />
              fotografie
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-xl text-gray-400 leading-relaxed mb-12 max-w-xl font-light"
            >
              Professionele beelden voor makelaars die het verschil maken
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <a href="#contact">
                <Button 
                  size="lg" 
                  className="bg-gray-900 hover:bg-gray-800 text-white rounded-full px-8 h-12 text-base font-light"
                >
                  Neem contact op
                </Button>
              </a>
              <a href="#portfolio">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="rounded-full px-8 h-12 border-gray-200 text-gray-600 hover:bg-gray-50 text-base font-light"
                >
                  Bekijk portfolio
                </Button>
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="diensten" className="py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="max-w-2xl mb-24">
            <h2 className="text-4xl md:text-5xl font-light text-gray-900 mb-6 tracking-tight">
              Diensten
            </h2>
            <p className="text-xl text-gray-400 leading-relaxed font-light">
              Professionele beeldvorming voor elk type vastgoed
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-20">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <h3 className="text-2xl font-light text-gray-900 mb-4">{service.title}</h3>
                <p className="text-gray-400 leading-relaxed font-light">{service.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio */}
      <section id="portfolio" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="max-w-2xl mb-24">
            <h2 className="text-4xl md:text-5xl font-light text-gray-900 mb-6 tracking-tight">
              Portfolio
            </h2>
            <p className="text-xl text-gray-400 leading-relaxed font-light">
              Een selectie van recent werk
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {portfolioImages.map((image, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="aspect-[3/2] overflow-hidden group cursor-pointer"
              >
                <img 
                  src={image}
                  alt={`Project ${index + 1}`}
                  className="w-full h-full object-cover group-hover:opacity-90 transition-opacity duration-500"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>



      {/* Contact */}
      <section id="contact" className="py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="max-w-2xl mb-24">
            <h2 className="text-4xl md:text-5xl font-light text-gray-900 mb-6 tracking-tight">
              Contact
            </h2>
            <p className="text-xl text-gray-400 leading-relaxed font-light mb-12">
              Interesse in een samenwerking? Neem gerust contact op
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
            <div className="space-y-10">
              <div>
                <p className="text-sm text-gray-400 uppercase tracking-wide mb-2 font-light">E-mail</p>
                <a href="mailto:info@basmichel.nl" className="text-2xl text-gray-900 hover:text-gray-600 transition-colors font-light">
                  info@basmichel.nl
                </a>
              </div>
              <div>
                <p className="text-sm text-gray-400 uppercase tracking-wide mb-2 font-light">Telefoon</p>
                <a href="tel:+31612345678" className="text-2xl text-gray-900 hover:text-gray-600 transition-colors font-light">
                  +31 6 12 34 56 78
                </a>
              </div>
              <div>
                <p className="text-sm text-gray-400 uppercase tracking-wide mb-2 font-light">Werkgebied</p>
                <p className="text-2xl text-gray-900 font-light">Noord-Brabant & Limburg</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-12 mb-16">
            <div>
              <span className="text-2xl font-light text-gray-900 tracking-tight">basmichel</span>
              <p className="text-sm text-gray-400 mt-2 font-light">Vastgoedfotografie</p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8 sm:gap-12">
              <a href="#diensten" className="text-sm text-gray-400 hover:text-gray-900 transition-colors font-light">Diensten</a>
              <a href="#portfolio" className="text-sm text-gray-400 hover:text-gray-900 transition-colors font-light">Portfolio</a>
              <a href="#contact" className="text-sm text-gray-400 hover:text-gray-900 transition-colors font-light">Contact</a>
              {isAuthenticated && (
                <Link to={createPageUrl(user?.role === 'admin' ? 'AdminDashboard' : 'ClientDashboard')} className="text-sm text-gray-400 hover:text-gray-900 transition-colors font-light">
                  Mijn Account
                </Link>
              )}
            </div>
          </div>
          <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <p className="text-sm text-gray-300 font-light">© {new Date().getFullYear()} basmichel</p>
            <Link 
              to={createPageUrl('AdminLogin')}
              className="text-xs text-gray-200 hover:text-gray-400 transition-colors font-light"
            >
              Beheer
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}