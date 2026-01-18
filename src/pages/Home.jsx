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
  'https://images-pw.pixieset.com/site/2kZAYq/n0yx4n/28-2391eb03-1500.jpg',
  'https://images-pw.pixieset.com/site/2kZAYq/Y8x0Wp/18-c0df2033-1500.jpg',
  'https://images-pw.pixieset.com/site/2kZAYq/5wYxAo/18-a7ac6f3d-1500.jpg',
  'https://images-pw.pixieset.com/site/2kZAYq/MwejZR/37-81220a67-1500.jpg',
  'https://images-pw.pixieset.com/site/2kZAYq/q8Ywmp/17-44e2a40d-1500.jpg',
  'https://images-pw.pixieset.com/site/2kZAYq/1QPWOp/9-9aac2383-1500.jpg',
  'https://images-pw.pixieset.com/site/2kZAYq/xyelwP/27-022c7d3f-1500.jpg',
  'https://images-pw.pixieset.com/site/2kZAYq/p3ajLE/19-427c3857-1500.jpg',
  'https://images-pw.pixieset.com/site/2kZAYq/0kvr5Y/21-8b2fd28a-1500.jpg',
  'https://images-pw.pixieset.com/site/2kZAYq/dV0RMD/26-f6ce7864-1500.jpg',
  'https://images-pw.pixieset.com/site/2kZAYq/D7ejaW/30-3faffc91-1500.jpg',
  'https://images-pw.pixieset.com/site/2kZAYq/WlxE63/18-f670d36a-1500.jpg'
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
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-20">
            <span className="text-xl font-light text-gray-900 tracking-[0.2em] uppercase">Framestate</span>
            
            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-12">
              <a href="#diensten" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Diensten
              </a>
              <a href="#pakketten" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Prijzen
              </a>
              <a href="#portfolio" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Portfolio
              </a>
              <a href="#contact" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Boeken
              </a>
              {isAuthenticated ? (
                <Link to={createPageUrl(user?.role === 'admin' ? 'AdminDashboard' : 'ClientDashboard')}>
                  <Button className="bg-black hover:bg-gray-900 text-white rounded px-6 h-9 text-sm">
                    Inloggen
                  </Button>
                </Link>
              ) : (
                <Button 
                  onClick={handleLogin} 
                  className="bg-black hover:bg-gray-900 text-white rounded px-6 h-9 text-sm"
                >
                  Klant Nu
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
          <div className="md:hidden bg-white border-t border-gray-100 px-6 py-6 space-y-4">
            <a href="#diensten" className="block text-gray-600 py-2" onClick={() => setMenuOpen(false)}>
              Diensten
            </a>
            <a href="#pakketten" className="block text-gray-600 py-2" onClick={() => setMenuOpen(false)}>
              Prijzen
            </a>
            <a href="#portfolio" className="block text-gray-600 py-2" onClick={() => setMenuOpen(false)}>
              Portfolio
            </a>
            <a href="#contact" className="block text-gray-600 py-2" onClick={() => setMenuOpen(false)}>
              Boeken
            </a>
          </div>
        )}
      </nav>

      {/* Hero Slider */}
      <section className="relative h-screen">
        <div className="absolute inset-0">
          <img 
            src="https://images-pw.pixieset.com/site/2kZAYq/n0yx4n/28-2391eb03-1500.jpg"
            alt="Hero"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>
        
        <div className="relative h-full flex items-center justify-center">
          <div className="text-center text-white px-6 max-w-4xl">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-5xl md:text-6xl lg:text-7xl font-light mb-6 leading-tight"
            >
              Elke Woning,
              <br />
              <span className="italic">Een Verhaal</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-lg md:text-xl mb-10 font-light max-w-2xl mx-auto"
            >
              Professionele vastgoedfotografie die woningen tot leven brengt en uw trackrecord
              <br className="hidden md:block" />
              zichtbaar maakt en verstevigt
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              {isAuthenticated ? (
                <Link to={createPageUrl(user?.role === 'admin' ? 'AdminDashboard' : 'ClientBooking')}>
                  <Button size="lg" className="bg-white hover:bg-gray-100 text-black rounded px-8 h-12">
                    Boek een Sessie
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              ) : (
                <Button onClick={handleLogin} size="lg" className="bg-white hover:bg-gray-100 text-black rounded px-8 h-12">
                  Boek een Sessie
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              )}
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 rounded px-8 h-12">
                Bekijk Portfolio
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Slide indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
          {[0, 1, 2].map((i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-1 transition-all ${
                i === currentSlide ? 'w-8 bg-white' : 'w-1 bg-white/50'
              }`}
            />
          ))}
        </div>
      </section>

      {/* USPs */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {usps.map((usp, index) => (
              <motion.div
                key={usp.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <usp.icon className="w-10 h-10 text-gray-700" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{usp.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{usp.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services with Images */}
      <section id="diensten" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <p className="text-sm uppercase tracking-wide text-gray-500 mb-3">Onze Diensten</p>
            <h2 className="text-4xl md:text-5xl font-light text-gray-900">
              Alles wat je nodig hebt om
              <br />
              <span className="italic">woningen te presenteren</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white overflow-hidden group"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img 
                    src={portfolioImages[index]}
                    alt={service.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="p-8">
                  <div className="flex items-start gap-4">
                    <service.icon className="w-6 h-6 text-gray-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-xl font-medium text-gray-900 mb-2">{service.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{service.description}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages */}
      <section id="pakketten" className="py-24 bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <p className="text-sm uppercase tracking-wide text-gray-400 mb-3">Prijzen</p>
            <h2 className="text-4xl md:text-5xl font-light mb-4">
              Kies jouw <span className="italic">pakket</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {packages.map((pkg, index) => (
              <motion.div
                key={pkg.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`relative p-8 border ${
                  pkg.highlighted 
                    ? 'bg-white text-black border-white' 
                    : 'bg-black border-gray-700'
                }`}
              >
                {pkg.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-500 text-white text-xs px-4 py-1 rounded-full">
                      MEEST GEKOZEN
                    </span>
                  </div>
                )}
                
                <h3 className="text-2xl font-medium mb-2">{pkg.name}</h3>
                <p className={`text-sm mb-6 ${pkg.highlighted ? 'text-gray-600' : 'text-gray-400'}`}>
                  {pkg.description}
                </p>
                
                <div className="mb-6">
                  <span className="text-5xl font-light">€{pkg.price}</span>
                  <span className={`text-sm ml-2 ${pkg.highlighted ? 'text-gray-600' : 'text-gray-400'}`}>
                    /shoot
                  </span>
                </div>

                <ul className="space-y-3 mb-8">
                  {pkg.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                        pkg.highlighted ? 'text-green-600' : 'text-green-500'
                      }`} />
                      <span className={`text-sm ${pkg.highlighted ? 'text-gray-700' : 'text-gray-300'}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className={`w-full ${
                    pkg.highlighted 
                      ? 'bg-black hover:bg-gray-900 text-white' 
                      : 'bg-white hover:bg-gray-100 text-black'
                  }`}
                  onClick={handleLogin}
                >
                  Nu Boeken
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio */}
      <section id="portfolio" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <p className="text-sm uppercase tracking-wide text-gray-500 mb-3">Portfolio</p>
            <h2 className="text-4xl md:text-5xl font-light text-gray-900">
              Recent <span className="italic">werk</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {portfolioImages.map((image, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                viewport={{ once: true }}
                className="aspect-[4/3] overflow-hidden group cursor-pointer"
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

      {/* CTA Section */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images-pw.pixieset.com/site/2kZAYq/5wYxAo/18-a7ac6f3d-1500.jpg"
            alt="CTA Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>
        
        <div className="relative max-w-4xl mx-auto text-center px-6 text-white">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-light mb-6 leading-tight">
            Klaar om je woningen
            <br />
            <span className="italic">naar een hoger niveau te tillen?</span>
          </h2>
          <p className="text-xl mb-10 font-light opacity-90">
            Sta je web op de hoosfdolor worden die slaat, wij helpen om uw
            <br className="hidden md:block" />
            woning op het best te presenteren
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Link to={createPageUrl(user?.role === 'admin' ? 'AdminDashboard' : 'ClientBooking')}>
                <Button size="lg" className="bg-white hover:bg-gray-100 text-black rounded px-8 h-12">
                  Boek een Sessie
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            ) : (
              <Button onClick={handleLogin} size="lg" className="bg-white hover:bg-gray-100 text-black rounded px-8 h-12">
                Boek een Sessie
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            )}
            <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 rounded px-8 h-12">
              Prijslijst Aanvragen
            </Button>
          </div>
        </div>
      </section>



      {/* Contact/Booking */}
      <section id="contact" className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-light text-gray-900 mb-6">
            Boek jouw sessie
            <br />
            <span className="italic">eenvoudig online</span>
          </h2>
          <p className="text-lg text-gray-600 mb-10">
            Plan gemakkelijk jouw moment in via onze agenda
          </p>
          {isAuthenticated ? (
            <Link to={createPageUrl(user?.role === 'admin' ? 'AdminDashboard' : 'ClientBooking')}>
              <Button size="lg" className="bg-black hover:bg-gray-900 text-white rounded px-10 h-12">
                Boek hier
              </Button>
            </Link>
          ) : (
            <Button onClick={handleLogin} size="lg" className="bg-black hover:bg-gray-900 text-white rounded px-10 h-12">
              Boek hier
            </Button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <span className="text-xl font-light tracking-[0.2em] uppercase">Framestate</span>
              <p className="text-sm text-gray-400 mt-3">
                Framestate zet jouw woningen op een manier die werkt en verkoop.
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-4 uppercase tracking-wide">Diensten</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#diensten" className="hover:text-white transition-colors">Fotografie</a></li>
                <li><a href="#diensten" className="hover:text-white transition-colors">Video Tours</a></li>
                <li><a href="#diensten" className="hover:text-white transition-colors">Virtuele Tours</a></li>
                <li><a href="#diensten" className="hover:text-white transition-colors">Plattegronden</a></li>
                <li><a href="#pakketten" className="hover:text-white transition-colors">Drone</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-4 uppercase tracking-wide">Bedrijf</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#portfolio" className="hover:text-white transition-colors">Home</a></li>
                <li><a href="#diensten" className="hover:text-white transition-colors">Ik Boeken</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Klantencentral</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-4 uppercase tracking-wide">Volg Ons</h4>
              <div className="flex gap-4">
                <a href="#" className="w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded flex items-center justify-center transition-colors">
                  <span className="text-xs">in</span>
                </a>
                <a href="#" className="w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded flex items-center justify-center transition-colors">
                  <span className="text-xs">fb</span>
                </a>
                <a href="#" className="w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded flex items-center justify-center transition-colors">
                  <span className="text-xs">tw</span>
                </a>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">© {new Date().getFullYear()} Framestate. Alle rechten voorbehouden.</p>
            <div className="flex gap-6 text-sm text-gray-500">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Voorwaarden</a>
              {isAuthenticated && (
                <Link to={createPageUrl(user?.role === 'admin' ? 'AdminDashboard' : 'ClientDashboard')} className="hover:text-white transition-colors">
                  Mijn Account
                </Link>
              )}
              <Link to={createPageUrl('AdminLogin')} className="hover:text-white transition-colors">
                Beheer
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}