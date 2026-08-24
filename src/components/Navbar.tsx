import React, { useState, useEffect } from 'react';
import { Music, Disc, Menu, X, Volume2 } from 'lucide-react';
import { audioSynth } from '../utils/audioSynth';

interface NavbarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeSection, setActiveSection }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);

    const unsubscribe = audioSynth.subscribe(() => {
      setIsPlaying(audioSynth.getState().isPlaying);
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      unsubscribe();
    };
  }, []);

  const navItems = [
    { id: 'hero', label: 'หน้าหลัก (อัลบั้ม)', icon: Disc },
    { id: 'music', label: 'ฟังเพลง & เนื้อเพลง (Lyrics)', icon: Music },
  ];

  const handleNavClick = (id: string) => {
    setActiveSection(id);
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800/80 shadow-2xl py-3' 
        : 'bg-gradient-to-b from-neutral-950/90 via-neutral-950/50 to-transparent py-5'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Brand Logo - Image 4 Kungnoi Y. script */}
        <button 
          onClick={() => handleNavClick('hero')}
          className="flex items-center gap-2 group text-left cursor-pointer py-1"
        >
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="font-script text-3xl sm:text-4xl text-rosegold tracking-wide drop-shadow-md group-hover:brightness-110 transition-all select-none">
                Kungnoi Y.
              </span>
              <span className="text-[9px] font-mono tracking-[0.25em] text-neutral-400 uppercase hidden sm:inline-block bg-neutral-900/80 border border-neutral-800 px-2 py-0.5 rounded-full">
                MOZART MUSIC
              </span>
            </div>
          </div>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-neutral-900/60 border border-neutral-800/60 rounded-full px-3 py-1.5 backdrop-blur-sm">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                activeSection === item.id
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md shadow-red-900/40 font-semibold'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Player Indicator */}
          {isPlaying && (
            <button 
              onClick={() => handleNavClick('music')}
              className="flex items-center gap-2 bg-red-950/40 border border-red-800/50 px-3 py-1.5 rounded-full text-xs text-red-300 animate-pulse hover:bg-red-900/50 transition-colors cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5 text-red-400 animate-bounce" />
              <span className="font-mono text-[11px] font-medium">กำลังเล่นเพลง</span>
              <div className="flex items-end gap-0.5 h-3">
                <span className="w-0.5 bg-red-500 h-full animate-[ping_1s_infinite]"></span>
                <span className="w-0.5 bg-red-400 h-2/3 animate-[ping_1.2s_infinite]"></span>
                <span className="w-0.5 bg-red-500 h-1/2 animate-[ping_0.8s_infinite]"></span>
              </div>
            </button>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-neutral-300 hover:text-white bg-neutral-900 border border-neutral-800 rounded-lg cursor-pointer"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-neutral-950/98 border-b border-neutral-800 px-4 pt-3 pb-6 space-y-2 mt-3 animate-fadeIn">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-left transition-colors cursor-pointer ${
                  activeSection === item.id
                    ? 'bg-red-600 text-white font-medium'
                    : 'text-neutral-300 hover:bg-neutral-900'
                }`}
              >
                {Icon && <Icon className="w-4 h-4 opacity-80" />}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
