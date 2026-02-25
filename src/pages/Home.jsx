import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import {
  Camera,
  Video,
  Maximize,
  Home as HomeIcon,
  ArrowRight,
  Menu,
  X,
  Clock,
  Star,
  Users,
  ThumbsUp,
  Check } from
'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const services = [
{
  icon: Camera,
  title: 'Fotografie',
  description: 'Hoogwaardige foto\'s met professionele belichting en composities die de sfeer van uw woning optimaal vastleggen.'
},
{
  icon: Video,
  title: 'Video Tours',
  description: 'Cinematische walkthroughs die een emotionele connectie maken met potentiële kopers.'
},
{
  icon: Maximize,
  title: '360° Virtuele Tours',
  description: 'Interactieve en digitale tours zodat bezoekers vanuit hun luie stoel een rondje door uw woning kunnen lopen.'
},
{
  icon: HomeIcon,
  title: 'Plattegronden',
  description: 'Heldere en nauwkeurige plattegronden die de indeling en afmetingen duidelijk in beeld brengen.'
}];


const values = [
{
  icon: Clock,
  title: 'Betrouwbaar',
  description: 'Altijd op tijd en volgens afspraak. Uw planning staat voorop.'
},
{
  icon: Star,
  title: 'Hoogwaardige Kwaliteit',
  description: 'Elke opname wordt met oog voor detail bewerkt en afgeleverd.'
},
{
  icon: Users,
  title: 'Persoonlijke Samenwerking',
  description: 'Direct contact, maatwerk en begrip voor uw unieke wensen.'
},
{
  icon: ThumbsUp,
  title: 'Ervaring',
  description: 'Jarenlange expertise in vastgoedfotografie voor makelaars.'
}];


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
'https://images-pw.pixieset.com/site/2kZAYq/WlxE63/18-f670d36a-1500.jpg',
'https://images-pw.pixieset.com/site/2kZAYq/zaj8yl/27-defce31b-1500.jpg',
'https://images-pw.pixieset.com/site/2kZAYq/r6V0l6/15-28d0c836-1500.jpg',
'https://images-pw.pixieset.com/site/2kZAYq/LVekX1/20-bf11417c-1500.jpg',
'https://images-pw.pixieset.com/site/2kZAYq/yQj3G0/53-e9ee0c17-1500.jpg',
'https://images-pw.pixieset.com/site/2kZAYq/P9XjwG/19-d6d04d10-1500.jpg',
'https://images-pw.pixieset.com/site/2kZAYq/jm7kYO/08-80bbc095-1500.jpg',
'https://images-pw.pixieset.com/site/2kZAYq/ewlWvo/16-0669292d-1500.jpg',
'https://images-pw.pixieset.com/site/2kZAYq/aQx8wd/17-ee1ea6d3-1500.jpg',
'https://images-pw.pixieset.com/site/2kZAYq/aQxj5b/13-366c5ab5-1500.jpg',
'https://images-pw.pixieset.com/site/2kZAYq/4VaOAG/12-b65526fe-1500.jpg',
'https://images-pw.pixieset.com/site/2kZAYq/0kvrv7/20-88238abf-1500.jpg',
'https://images-pw.pixieset.com/site/2kZAYq/yQjbQa/24-583310a6-1500.jpg'];


export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const heroSlides = [
  'https://images-pw.pixieset.com/site/2kZAYq/n0yx4n/28-2391eb03-1500.jpg',
  'https://images-pw.pixieset.com/site/2kZAYq/Y8x0Wp/18-c0df2033-1500.jpg',
  'https://images-pw.pixieset.com/site/2kZAYq/5wYxAo/18-a7ac6f3d-1500.jpg',
  'https://images-pw.pixieset.com/site/2kZAYq/q8Ywmp/17-44e2a40d-1500.jpg',
  'https://images-pw.pixieset.com/site/2kZAYq/1QPWOp/9-9aac2383-1500.jpg',
  'https://images-pw.pixieset.com/site/2kZAYq/r6V0l6/15-28d0c836-1500.jpg',
  'https://images-pw.pixieset.com/site/2kZAYq/yQjbQa/24-583310a6-1500.jpg',
  'https://images-pw.pixieset.com/site/2kZAYq/aQxj5b/13-366c5ab5-1500.jpg'];


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
      }};checkAuth();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogin = () => {
    base44.auth.redirectToLogin();
  };

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextImage = () => {
    setLightboxIndex((prev) => (prev + 1) % portfolioImages.length);
  };

  const prevImage = () => {
    setLightboxIndex((prev) => (prev - 1 + portfolioImages.length) % portfolioImages.length);
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!lightboxOpen) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [lightboxOpen]);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/80 backdrop-blur-md' : 'bg-black/20 backdrop-blur-sm'}`
      }>
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-20">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696d131f67e4f7236fb13603/41d5ec5ec_BasMichel_K152.png"
              alt="Bas Michel"
              className={`h-20 transition-all duration-300 ${scrolled ? '' : 'brightness-0 invert'}`} />

            
            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-12">
              <a href="#diensten" className={`text-sm transition-colors ${
              scrolled ? 'text-gray-600 hover:text-gray-900' : 'text-white hover:text-gray-200'}`
              }>
                Diensten
              </a>
              <a href="#portfolio" className={`text-sm transition-colors ${
              scrolled ? 'text-gray-600 hover:text-gray-900' : 'text-white hover:text-gray-200'}`
              }>
                Portfolio
              </a>
              <Link to={createPageUrl('Contact')} className={`text-sm transition-colors ${
              scrolled ? 'text-gray-600 hover:text-gray-900' : 'text-white hover:text-gray-200'}`
              }>
                Contact
              </Link>
              {isAuthenticated ?
              <Link to={createPageUrl(user?.role === 'admin' ? 'AdminDashboard' : 'ClientDashboard')}>
                  <Button className={`rounded px-6 h-9 text-sm transition-colors ${
                scrolled ? 'bg-black hover:bg-gray-900 text-white' : 'bg-white hover:bg-gray-100 text-black'}`
                }>
                    Mijn Account
                  </Button>
                </Link> :

              <Button
                onClick={handleLogin}
                className={`rounded px-6 h-9 text-sm transition-colors ${
                scrolled ? 'bg-black hover:bg-gray-900 text-white' : 'bg-white hover:bg-gray-100 text-black'}`
                }>

                  Inloggen voor Makelaars
                </Button>
              }
            </div>

            {/* Mobile Menu Button */}
            <button
              className={`md:hidden p-2 transition-colors ${
              scrolled ? 'text-gray-600' : 'text-white'}`
              }
              onClick={() => setMenuOpen(!menuOpen)}>

              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen &&
        <div className="md:hidden bg-white border-t border-gray-100 px-6 py-6 space-y-4">
            <a href="#diensten" className="block text-gray-600 py-2" onClick={() => setMenuOpen(false)}>
              Diensten
            </a>
            <a href="#portfolio" className="block text-gray-600 py-2" onClick={() => setMenuOpen(false)}>
              Portfolio
            </a>
            <Link to={createPageUrl('Contact')} className="block text-gray-600 py-2" onClick={() => setMenuOpen(false)}>
              Contact
            </Link>
          </div>
        }
      </nav>

      {/* Hero Slider */}
      <section className="relative h-screen overflow-hidden">
        <div className="absolute inset-0">
          {heroSlides.map((slide, index) =>
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'}`
            }>

              <img
              src={slide}
              alt={`Slide ${index + 1}`}
              className="w-full h-full object-cover" />

            </div>
          )}
          <div className="absolute inset-0 bg-black/30" />
        </div>
        
        <div className="relative h-full flex items-center">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 w-full">
            <div className="text-white max-w-2xl text-center mx-auto">
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-5xl md:text-6xl lg:text-7xl font-light mb-2 leading-tight">

                Elke Woning
              </motion.h1>
              <motion.h2
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="text-5xl md:text-6xl lg:text-7xl italic mb-8 leading-tight"
                style={{ fontFamily: 'Georgia, serif' }}>

                Een Verhaal
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-sm md:text-base font-light leading-relaxed max-w-xl mx-auto">

                "Verhalen die door beeld tot leven komen"
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-4 mt-10 justify-center">

                <Link to={createPageUrl('Contact')}>
                  <Button size="lg" className="bg-white hover:bg-gray-100 text-black rounded px-8 h-12">
                    Neem Contact Op
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Slide indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
          {heroSlides.map((_, i) =>
          <button
            key={i}
            onClick={() => setCurrentSlide(i)}
            className={`h-1 transition-all ${
            i === currentSlide ? 'w-8 bg-white' : 'w-1 bg-white/50'}`
            } />

          )}
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">
              Samenwerken met <span className="italic">Bas Michel</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Al jaren partner van toonaangevende makelaars in de regio
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {values.map((value, index) =>
            <motion.div
              key={value.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center">

                <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <value.icon className="w-10 h-10 text-gray-700" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{value.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{value.description}</p>
              </motion.div>
            )}
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
            {services.map((service, index) =>
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white overflow-hidden group">

                <div className="aspect-[4/3] overflow-hidden">
                  <img
                  src={portfolioImages[index]}
                  alt={service.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />

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
            )}
          </div>
        </div>
      </section>



      {/* Portfolio */}
      <section id="portfolio" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-light text-gray-900 mb-4">
              Impressie
            </h2>
            <p className="text-gray-600">Een selectie van recent werk</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {portfolioImages.map((image, index) =>
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: index * 0.02 }}
              viewport={{ once: true }}
              className="aspect-square overflow-hidden group cursor-pointer bg-gray-100"
              onClick={() => openLightbox(index)}>

                <img
                src={image}
                alt={`Project ${index + 1}`}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                loading="lazy" />

              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightboxOpen &&
      <div
        className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center"
        onClick={closeLightbox}>

          <button
          onClick={closeLightbox}
          className="absolute top-4 right-4 md:top-8 md:right-8 text-white hover:text-gray-300 transition-colors z-50">

            <X className="w-8 h-8 md:w-10 md:h-10" />
          </button>

          <button
          onClick={(e) => {e.stopPropagation();prevImage();}}
          className="absolute left-2 md:left-8 text-white hover:text-gray-300 transition-colors p-2">

            <ArrowRight className="w-8 h-8 md:w-12 md:h-12 rotate-180" />
          </button>

          <button
          onClick={(e) => {e.stopPropagation();nextImage();}}
          className="absolute right-2 md:right-8 text-white hover:text-gray-300 transition-colors p-2">

            <ArrowRight className="w-8 h-8 md:w-12 md:h-12" />
          </button>

          <div
          className="relative w-full h-full flex items-center justify-center p-4 md:p-12"
          onClick={(e) => e.stopPropagation()}>

            <img
            src={portfolioImages[lightboxIndex]}
            alt={`Project ${lightboxIndex + 1}`}
            className="max-w-full max-h-full object-contain" />

          </div>

          <div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 text-white text-sm">
            {lightboxIndex + 1} / {portfolioImages.length}
          </div>
        </div>
      }

      {/* CTA Section */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images-pw.pixieset.com/site/2kZAYq/5wYxAo/18-a7ac6f3d-1500.jpg"
            alt="CTA Background"
            className="w-full h-full object-cover" />

          <div className="absolute inset-0 bg-black/50" />
        </div>
        
        <div className="relative max-w-4xl mx-auto text-center px-6 text-white">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-light mb-6 leading-tight">
            Werk je samen
            <br />
            <span className="italic">met Bas Michel?</span>
          </h2>
          <p className="text-xl mb-10 font-light opacity-90">
            Log in op uw portal om projecten te beheren, galerijen te bekijken
            <br className="hidden md:block" />
            en nieuwe shoots te boeken
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ?
            <Link to={createPageUrl(user?.role === 'admin' ? 'AdminDashboard' : 'ClientDashboard')}>
                <Button size="lg" className="bg-white hover:bg-gray-100 text-black rounded px-8 h-12">
                  Naar Mijn Account
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link> :

            <Button onClick={handleLogin} size="lg" className="bg-white hover:bg-gray-100 text-black rounded px-8 h-12">
                Inloggen
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            }

          </div>
        </div>
      </section>




      {/* Footer */}
      <footer className="py-16 bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div>
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696d131f67e4f7236fb13603/d493012a0_BasMichel_K102.png"
                alt="Bas Michel"
                className="h-14 brightness-0 invert mb-4" />

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
                <li><a href="#diensten" className="hover:text-white transition-colors">Fotografie</a></li>
                <li><a href="#diensten" className="hover:text-white transition-colors">Video Tours</a></li>
                <li><a href="#diensten" className="hover:text-white transition-colors">360° Virtuele Tours</a></li>
                <li><a href="#diensten" className="hover:text-white transition-colors">Plattegronden</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-4 uppercase tracking-wide">Juridisch</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="https://www.basmichel.nl/algemene-voorwaarden/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Algemene Voorwaarden</a></li>
                <li><a href="https://www.basmichel.nl/servicevoorwaarden/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Servicevoorwaarden</a></li>
                <li><a href="https://www.basmichel.nl/privacyverklaring/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Privacyverklaring</a></li>
                <li><a href="https://www.basmichel.nl/cookieverklaring/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Cookieverklaring</a></li>
                <li><a href="https://www.basmichel.nl/disclaimer/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Disclaimer</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">© {new Date().getFullYear()} Bas Michel. Alle rechten voorbehouden.</p>
            <div className="flex gap-6 text-sm text-gray-500">
              {isAuthenticated &&
              <Link to={createPageUrl(user?.role === 'admin' ? 'AdminDashboard' : 'ClientDashboard')} className="hover:text-white transition-colors">
                  Mijn Account
                </Link>
              }
              {(!isAuthenticated || user?.role === 'admin') &&
              <Link to={createPageUrl('AdminLogin')} className="hover:text-white transition-colors">
                  Beheer
                </Link>
              }
            </div>
          </div>

          






        </div>
      </footer>
    </div>);

}