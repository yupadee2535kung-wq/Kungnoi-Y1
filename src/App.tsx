import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { MusicPlayerSection } from './components/MusicPlayerSection';
import { FloatingMusicPlayer } from './components/FloatingMusicPlayer';
import { ImageProvider } from './context/ImageContext';
import { SongProvider } from './context/SongContext';

export default function App() {
  const [activeSection, setActiveSection] = useState('hero');

  const handleNavigateSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <ImageProvider>
      <SongProvider>
        <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-red-600 selection:text-white">
          
          {/* Navigation Bar */}
          <Navbar
            activeSection={activeSection}
            setActiveSection={setActiveSection}
          />

          {/* Hero Album Showcase & Quick Player */}
          <Hero
            onNavigateSection={handleNavigateSection}
          />

          {/* Music Player, 10-Track Playlist, Lyrics, Story & Chords */}
          <MusicPlayerSection />

          {/* Floating Audio Player Sticky Bar */}
          <FloatingMusicPlayer
            onNavigateMusic={() => handleNavigateSection('music')}
          />

        </div>
      </SongProvider>
    </ImageProvider>
  );
}

