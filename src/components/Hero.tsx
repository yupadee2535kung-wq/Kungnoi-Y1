import React, { useState, useEffect } from 'react';
import { Play, Pause, ChevronRight, ChevronLeft, Disc, Music, FileText, BookOpen, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { useBandImages } from '../context/ImageContext';
import { useSongs } from '../context/SongContext';

interface HeroProps {
  onSelectTrack?: (songId: string) => void;
  onNavigateSection: (sectionId: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ onSelectTrack, onNavigateSection }) => {
  const { images, slideshowList } = useBandImages();
  const {
    songs,
    currentTrackId,
    isPlaying,
    togglePlayPause,
    playTrack,
  } = useSongs();

  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isAutoSlide, setIsAutoSlide] = useState(true);
  const [showQuickBar, setShowQuickBar] = useState(true);

  useEffect(() => {
    if (!isAutoSlide || slideshowList.length <= 1) return;
    const interval = setInterval(() => {
      setActiveSlideIndex((prev) => (prev + 1) % slideshowList.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoSlide, slideshowList.length]);

  const activeSlide = slideshowList[activeSlideIndex] || slideshowList[0] || {
    id: 'default',
    title: 'แทร็ก 01 • ถ้าเธอยังไม่ลืม',
    subtitle: 'Track 01 ✦ Dreamy Soul Pop',
    url: images.albumCover,
  };

  const activeSong = songs.find(s => s.id === currentTrackId) || songs[0];
  const slideSong = songs[activeSlideIndex] || songs[0];
  const isThisSlideSongPlaying = isPlaying && currentTrackId === slideSong?.id;

  const handlePlaySlideSong = () => {
    if (slideSong) {
      if (onSelectTrack) {
        onSelectTrack(slideSong.id);
      }
      if (currentTrackId === slideSong.id && isPlaying) {
        togglePlayPause(slideSong.id);
      } else {
        playTrack(slideSong.id);
      }
    }
  };

  const handleSyncSlideToActiveSong = () => {
    const songIndex = songs.findIndex(s => s.id === activeSong.id);
    if (songIndex !== -1 && songIndex < slideshowList.length) {
      setActiveSlideIndex(songIndex);
    }
  };

  return (
    <section id="hero" className="relative min-h-[92vh] bg-neutral-950 pt-24 pb-16 flex flex-col justify-center overflow-hidden">
      {/* Ambient Backdrop */}
      <div className="absolute inset-0 z-0">
        <img
          src={activeSlide.url}
          alt={activeSlide.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center filter blur-3xl brightness-[0.14] scale-115 transition-all duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-950 via-neutral-950/85 to-neutral-950"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(180,90,70,0.15)_0%,rgba(10,10,10,0.95)_75%)]"></div>
      </div>

      <div className="relative z-10 max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-8">
        
        {/* Header Style (Kungnoi Y. with Image 3: Made for You, Only You) */}
        <div className="text-center space-y-1 max-w-4xl mx-auto">
          <p className="text-[11px] sm:text-xs tracking-[0.3em] uppercase text-neutral-400 font-mono font-medium">
            DEBUT ALBUM • DREAMY SOUL POP
          </p>

          <h1 className="font-script text-5xl sm:text-7xl lg:text-8xl text-rosegold tracking-wide py-1 drop-shadow-2xl select-none">
            Kungnoi Y.
          </h1>

          {/* Image 3 Replacement: Made for You, Only You */}
          <div className="pt-0.5 flex flex-col items-center justify-center">
            <p className="font-script text-2xl sm:text-3xl lg:text-4xl text-rosegold tracking-wider drop-shadow-lg italic select-none">
              Made for You, Only You
            </p>
            <div className="w-24 sm:w-32 h-[1px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent mt-1"></div>
          </div>
        </div>

        {/* Enlarged Prominent Slideshow View */}
        <div className="space-y-4">
          <div className="relative aspect-[16/10] sm:aspect-[16/9] lg:aspect-[2.1/1] min-h-[340px] sm:min-h-[440px] lg:min-h-[540px] max-h-[680px] w-full rounded-3xl overflow-hidden shadow-2xl border border-neutral-800 bg-neutral-900 group">
            <img
              src={activeSlide.url}
              alt={activeSlide.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center transition-all duration-700 group-hover:scale-102"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (!target.src.includes('slide_01')) {
                  target.src = '/images/slide_01.jpg';
                }
              }}
            />
            {/* Soft gradient only at top and bottom to ensure full image visibility */}
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-neutral-950/90 via-neutral-950/40 to-transparent pointer-events-none"></div>
            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-neutral-950/60 to-transparent pointer-events-none"></div>

            {/* Top Toolbar Overlay */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
              <span className="bg-neutral-950/85 backdrop-blur-md text-amber-200/90 border border-amber-500/30 font-mono text-xs font-bold px-3.5 py-1 rounded-full uppercase shadow">
                {activeSlide.tag || `สไลด์ ${activeSlideIndex + 1}/${slideshowList.length}`}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAutoSlide(!isAutoSlide)}
                  className={`text-xs font-mono font-bold px-3 py-1 rounded-full backdrop-blur-md transition-all border ${
                    isAutoSlide
                      ? 'bg-red-950/90 border-red-500 text-red-300'
                      : 'bg-neutral-950/85 border-neutral-700 text-neutral-400'
                  }`}
                >
                  {isAutoSlide ? 'Auto-Slide ON' : 'Paused'}
                </button>
              </div>
            </div>

            {/* Navigation Arrows */}
            <button
              type="button"
              onClick={() => setActiveSlideIndex((prev) => (prev - 1 + slideshowList.length) % slideshowList.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-neutral-950/75 hover:bg-neutral-900 border border-neutral-700/80 text-white opacity-85 hover:opacity-100 transition-all cursor-pointer z-10 shadow-lg"
              title="รูปก่อนหน้า"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              type="button"
              onClick={() => setActiveSlideIndex((prev) => (prev + 1) % slideshowList.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-neutral-950/75 hover:bg-neutral-900 border border-neutral-700/80 text-white opacity-85 hover:opacity-100 transition-all cursor-pointer z-10 shadow-lg"
              title="รูปถัดไป"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Slide Title Bottom Overlay */}
            <div className="absolute bottom-4 left-4 right-4 z-10 bg-neutral-950/90 backdrop-blur-md border border-neutral-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span>{activeSlide.title}</span>
                  <span className="text-xs font-normal text-amber-200/80 font-mono bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded-md">
                    {activeSlideIndex + 1} / {slideshowList.length}
                  </span>
                </h3>
                <p className="text-xs sm:text-sm text-neutral-300 font-light truncate">
                  {slideSong ? `${slideSong.titleThai} (${slideSong.titleEng}) • ${slideSong.duration}` : activeSlide.subtitle}
                </p>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={handlePlaySlideSong}
                  className={`font-semibold text-xs sm:text-sm px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
                    isThisSlideSongPlaying
                      ? 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse'
                      : 'bg-red-600 hover:bg-red-500 text-white'
                  }`}
                  title={`เล่นเพลง ${slideSong?.titleThai || activeSlide.title}`}
                >
                  {isThisSlideSongPlaying ? (
                    <>
                      <Pause className="w-4 h-4 fill-current" />
                      <span>กำลังเล่นเพลงนี้ (หยุด)</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>ฟังเพลงนี้ (#{slideSong?.trackNumber || activeSlideIndex + 1})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Indicator Navigation Dots (Supports 10+ slides) */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 pt-1 flex-wrap px-4">
            {slideshowList.map((slide, idx) => (
              <button
                key={slide.id || idx}
                onClick={() => setActiveSlideIndex(idx)}
                className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === activeSlideIndex
                    ? 'w-7 sm:w-10 bg-gradient-to-r from-red-500 to-amber-500 shadow-md shadow-red-500/50 scale-105'
                    : 'w-2 sm:w-2.5 bg-neutral-700/80 hover:bg-neutral-500 hover:scale-110'
                }`}
                title={`ดูภาพสไลด์ที่ ${idx + 1} จาก ${slideshowList.length}: ${slide.title}`}
              />
            ))}
          </div>
        </div>

        {/* Bottom Quick Controls Strip with Hide/Show */}
        {showQuickBar ? (
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-4 transition-all animate-fadeIn">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                type="button"
                onClick={togglePlayPause}
                className="p-3 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-lg transition-transform transform hover:scale-105 cursor-pointer flex-shrink-0"
                title={isPlaying ? 'หยุดเพลง' : 'เล่นเพลง'}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5 fill-current" />}
              </button>
              <div className="min-w-0">
                <p className="text-[10px] font-mono uppercase text-neutral-400">กำลังเล่น / NOW PLAYING</p>
                <h4 className="text-sm sm:text-base font-bold text-white truncate flex items-center gap-2">
                  <span>#{activeSong.trackNumber} {activeSong.titleThai} ({activeSong.titleEng})</span>
                  {isPlaying && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  )}
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap sm:flex-nowrap">
              <button
                type="button"
                onClick={handleSyncSlideToActiveSong}
                className="flex-1 md:flex-none px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-amber-500/60 text-xs font-semibold text-amber-300 hover:text-amber-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                title="เลื่อนภาพสไลด์ด้านบนไปยังเพลงที่กำลังเล่นอยู่ตอนนี้"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>ดูภาพเพลงนี้</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateSection('music')}
                className="flex-1 md:flex-none px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-red-500/50 text-xs font-semibold text-neutral-200 hover:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Music className="w-3.5 h-3.5 text-red-400" />
                <span>รายชื่อ 10 เพลง</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateSection('music')}
                className="flex-1 md:flex-none px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-red-500/50 text-xs font-semibold text-neutral-200 hover:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-red-400" />
                <span>เนื้อเพลง (Lyrics)</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateSection('music')}
                className="flex-1 md:flex-none px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-red-500/50 text-xs font-semibold text-neutral-200 hover:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-red-400" />
                <span>คอร์ดกีตาร์ (Chords)</span>
              </button>

              {/* Hide Hero Quick Bar Button */}
              <button
                type="button"
                onClick={() => setShowQuickBar(false)}
                className="px-2.5 py-2 rounded-xl bg-neutral-950/80 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-amber-200 text-xs flex items-center gap-1 transition-all cursor-pointer"
                title="ซ่อนแถบควบคุมเพลงนี้"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                <span className="text-[11px]">ซ่อนแถบ</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setShowQuickBar(true)}
              className="inline-flex items-center gap-2 bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/50 text-neutral-300 hover:text-amber-200 text-xs font-semibold px-4 py-2 rounded-full shadow-lg transition-all cursor-pointer backdrop-blur-md"
              title="แสดงแถบควบคุมเพลงด่วน"
            >
              <Disc className={`w-3.5 h-3.5 text-red-400 ${isPlaying ? 'animate-spin' : ''}`} />
              <span>แสดงแถบควบคุมเพลง</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

      </div>
    </section>
  );
};
