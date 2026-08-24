import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Disc, Music, FileText, Share2, Heart, Sparkles, ExternalLink, Repeat, Repeat1, Shuffle, ChevronLeft, ChevronRight, CheckCircle2, Youtube, Video, BookOpen, Images, ListOrdered } from 'lucide-react';
import { ALBUM_INFO } from '../data/bandData';
import { Song } from '../types';
import { useSongs } from '../context/SongContext';
import { useBandImages } from '../context/ImageContext';
import { getYouTubeWatchUrl, getYouTubeSequentialEmbedUrl } from '../utils/youtubeUtils';

interface MusicPlayerSectionProps {
  currentTrackId?: string;
  onSelectTrack?: (songId: string) => void;
}

export const MusicPlayerSection: React.FC<MusicPlayerSectionProps> = ({ currentTrackId: propCurrentTrackId, onSelectTrack: propOnSelectTrack }) => {
  const {
    songs,
    currentTrackId: contextTrackId,
    setCurrentTrackId,
    isPlaying,
    isUsingRealAudio,
    currentTime,
    duration,
    volume,
    repeatMode,
    isShuffle,
    frequencies,
    togglePlayPause,
    playNext,
    playPrev,
    toggleRepeatMode,
    toggleShuffle,
    seek,
    setVolume,
  } = useSongs();

  const currentTrackId = propCurrentTrackId || contextTrackId;
  const onSelectTrack = (id: string) => {
    if (propOnSelectTrack) {
      propOnSelectTrack(id);
    }
    setCurrentTrackId(id);
  };

  const { images, slideshowList } = useBandImages();

  const [activeTab, setActiveTab] = useState<'lyrics' | 'story' | 'chords'>('lyrics');
  const [copiedLink, setCopiedLink] = useState(false);

  // Visual Display Mode: Slideshow vs YouTube MV
  const [visualMode, setVisualMode] = useState<'slideshow' | 'mv'>('slideshow');
  const [currentMvIndex, setCurrentMvIndex] = useState(0);

  // Band Image Slideshow states
  const [isSlideshowMode, setIsSlideshowMode] = useState(true);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Auto transition slideshow every 4.5 seconds when active
  useEffect(() => {
    if (!isSlideshowMode || slideshowList.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slideshowList.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isSlideshowMode, slideshowList.length]);

  const activeSlide = slideshowList[currentSlideIndex] || slideshowList[0] || {
    id: 'default',
    title: ALBUM_INFO.titleThai,
    subtitle: 'TRIPLETS Official',
    url: images.albumCover,
  };

  // Fallback to first song if currentTrackId isn't found
  const activeSong = songs.find(s => s.id === currentTrackId) || songs[0] || {
    id: 'fallback',
    trackNumber: 1,
    titleThai: 'ไม่มีเพลง',
    titleEng: 'No Songs',
    duration: '0:00',
    durationSeconds: 0,
    story: '',
    lyrics: ['ไม่มีเนื้อเพลง'],
    audioParams: { bpm: 120, key: 'C', style: 'melancholic_rock' as const, rootNote: 60 }
  };

  // Valid YouTube URLs list for active song (up to 5 URLs)
  const activeSongMvUrls: string[] = useMemo(() => {
    if (Array.isArray(activeSong.youtubeUrls) && activeSong.youtubeUrls.length > 0) {
      return activeSong.youtubeUrls.filter((u) => u && typeof u === 'string' && u.trim().length > 0);
    }
    if (activeSong.youtubeUrl && activeSong.youtubeUrl.trim()) {
      return [activeSong.youtubeUrl.trim()];
    }
    return [];
  }, [activeSong]);

  // Reset MV video index to 0 when changing tracks & sync slide index with song
  useEffect(() => {
    setCurrentMvIndex(0);
    const songIndex = songs.findIndex(s => s.id === activeSong.id);
    if (songIndex !== -1 && songIndex < slideshowList.length) {
      setCurrentSlideIndex(songIndex);
    }
  }, [activeSong.id]);

  const handleTogglePlay = (song: Song) => {
    if (!song) return;
    onSelectTrack(song.id);
    togglePlayPause(song.id);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    seek(val);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <section id="music" className="py-20 bg-neutral-950 text-neutral-100 relative overflow-hidden border-t border-neutral-800/80">
      
      {/* Background Decorative Gradient Light */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-red-950/20 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-red-500 uppercase tracking-widest bg-red-950/40 border border-red-800/40 px-3 py-1 rounded-full">
            <Disc className="w-3.5 h-3.5" />
            <span>MUSIC & OFFICIAL ALBUM</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white uppercase font-sans">
            ฟังเพลงอัลบั้ม <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-neutral-100 to-red-600">"{ALBUM_INFO.titleThai}"</span>
          </h2>
          {/* Image 2: Made for You, Only You */}
          <div className="pt-2 flex flex-col items-center justify-center">
            <p className="font-script text-3xl sm:text-4xl text-rosegold tracking-wider drop-shadow-lg italic select-none">
              Made for You, Only You
            </p>
            <div className="w-28 sm:w-36 h-[1px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent mt-1.5"></div>
          </div>
        </div>

        {/* Main Music Player Card Layout */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Interactive Album Player Main Visual */}
          <div className="lg:col-span-5 bg-neutral-900/80 border border-neutral-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-5">
            
            {/* Display Mode Switcher Tabs: [🖼️ โหมดภาพสไลด์] vs [▶️ โหมดเล่น MV] */}
            <div className="flex items-center justify-between bg-neutral-950/90 border border-neutral-800 rounded-2xl p-1.5 shadow-inner">
              <div className="flex items-center gap-1.5 w-full">
                <button
                  type="button"
                  onClick={() => setVisualMode('slideshow')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    visualMode === 'slideshow'
                      ? 'bg-neutral-800 text-white shadow-md border border-neutral-700'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
                  }`}
                >
                  <Images className="w-3.5 h-3.5 text-amber-400" />
                  <span>🖼️ โหมดภาพสไลด์</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setVisualMode('mv');
                    if (isPlaying) {
                      togglePlayPause();
                    }
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    visualMode === 'mv'
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-950/80 border border-red-500'
                      : 'text-neutral-400 hover:text-red-400 hover:bg-neutral-900/60'
                  }`}
                >
                  <Youtube className="w-4 h-4 text-red-500 group-hover:text-white" />
                  <span>▶️ โหมดเล่น MV</span>
                  {activeSongMvUrls.length > 0 && (
                    <span className="text-[10px] font-mono bg-red-950 text-red-300 border border-red-700/80 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                      {activeSongMvUrls.length > 1 ? (
                        <>
                          <ListOrdered className="w-2.5 h-2.5" />
                          <span>{activeSongMvUrls.length}</span>
                        </>
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-300 animate-pulse"></span>
                      )}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Visual Display Box (Square 1:1) */}
            {visualMode === 'mv' ? (
              /* YouTube MV Video Player with Sequential 10-URL support */
              <div className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl border border-neutral-800 bg-neutral-950 flex flex-col justify-center items-center group">
                {activeSongMvUrls.length > 0 && getYouTubeSequentialEmbedUrl(activeSongMvUrls, currentMvIndex) ? (
                  <div className="w-full h-full relative flex flex-col">
                    {/* YouTube iFrame Embed */}
                    <div className="w-full h-full relative flex-1">
                      <iframe
                        src={getYouTubeSequentialEmbedUrl(activeSongMvUrls, currentMvIndex, true)!}
                        title={`${activeSong.titleThai} - MV Video ${currentMvIndex + 1}`}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>

                    {/* Top Floating Info Bar in MV Mode */}
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-20">
                      {/* Left: Sequence badge */}
                      <div className="pointer-events-auto flex items-center gap-1.5 bg-neutral-950/90 border border-neutral-700/90 text-white text-[11px] font-mono font-bold px-2.5 py-1 rounded-xl shadow-xl backdrop-blur-md">
                        <Youtube className="w-3.5 h-3.5 text-red-500" />
                        <span>ลำดับ {currentMvIndex + 1}/{activeSongMvUrls.length}</span>
                        {activeSongMvUrls.length > 1 && (
                          <span className="text-[10px] text-red-400 font-normal hidden sm:inline">
                            (เล่นตามลำดับ)
                          </span>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className="pointer-events-auto flex items-center gap-1.5 opacity-90 hover:opacity-100 transition-opacity">
                        {getYouTubeWatchUrl(activeSongMvUrls[currentMvIndex] || activeSongMvUrls[0]) && (
                          <a
                            href={getYouTubeWatchUrl(activeSongMvUrls[currentMvIndex] || activeSongMvUrls[0])!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 bg-neutral-950/90 hover:bg-red-600 border border-neutral-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-xl shadow-xl backdrop-blur-md transition-all"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span className="hidden sm:inline">YouTube</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Bottom Floating Sequential Selector Bar (when multiple URLs exist) */}
                    {activeSongMvUrls.length > 1 && (
                      <div className="absolute bottom-2 left-2 right-2 bg-neutral-950/95 border border-neutral-800/90 rounded-xl px-2.5 py-1.5 flex items-center justify-between gap-1.5 shadow-2xl backdrop-blur-md z-20">
                        {/* Prev video button */}
                        <button
                          type="button"
                          onClick={() => setCurrentMvIndex((prev) => (prev - 1 + activeSongMvUrls.length) % activeSongMvUrls.length)}
                          className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                          title="วิดีโอก่อนหน้า"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>

                        {/* Numbered Pills 1 to 10 with horizontal scroll */}
                        <div className="flex items-center gap-1 overflow-x-auto py-0.5 max-w-[calc(100%-60px)] scrollbar-none">
                          <span className="text-[10px] font-mono text-neutral-400 mr-1 hidden md:inline flex-shrink-0">
                            ลำดับ:
                          </span>
                          {activeSongMvUrls.map((_, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setCurrentMvIndex(idx)}
                              className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1 flex-shrink-0 ${
                                currentMvIndex === idx
                                  ? 'bg-red-600 text-white shadow-md shadow-red-950/80 border border-red-400 scale-105'
                                  : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800'
                              }`}
                              title={`สลับไปเล่นวิดีโอลำดับที่ ${idx + 1}`}
                            >
                              <span>#{idx + 1}</span>
                              {currentMvIndex === idx && (
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                              )}
                            </button>
                          ))}
                        </div>

                        {/* Next video button */}
                        <button
                          type="button"
                          onClick={() => setCurrentMvIndex((prev) => (prev + 1) % activeSongMvUrls.length)}
                          className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                          title="วิดีโอถัดไป"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Sleek Empty State when no YouTube MV link is configured */
                  <div className="p-6 text-center space-y-4 max-w-sm">
                    <div className="w-16 h-16 rounded-2xl bg-red-950/60 border border-red-800/80 flex items-center justify-center mx-auto text-red-500 shadow-xl shadow-red-950/50">
                      <Youtube className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white mb-1">
                        โหมดรูปภาพและเครื่องเล่นเพลง
                      </h4>
                      <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                        เพลง <span className="text-red-400 font-semibold">"{activeSong.titleThai}"</span> กำลังเล่นเสียงเพลงคุณภาพสูง พร้อมภาพศิลปิน Kungnoi Y.
                      </p>
                    </div>

                    <div className="pt-2 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => setVisualMode('slideshow')}
                        className="text-xs bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white px-4 py-2 rounded-xl cursor-pointer font-medium transition-colors"
                      >
                        ← สลับไปดูภาพสไลด์โชว์
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Album Cover Art & Band Image Slideshow */
              <div className="relative aspect-square rounded-2xl overflow-hidden group shadow-2xl border border-neutral-800 bg-neutral-900">
                <img
                  key={`player-slide-${currentSlideIndex}`}
                  src={activeSlide.url}
                  alt={activeSlide.title}
                  referrerPolicy="no-referrer"
                  className={`w-full h-full object-cover transition-all duration-700 animate-fadeIn ${isPlaying ? 'scale-105' : 'scale-100'}`}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    const fallback = `/images/slide_${String(currentSlideIndex + 1).padStart(2, '0')}.jpg`;
                    if (target.src !== fallback) {
                      target.src = fallback;
                    }
                  }}
                />
                {/* Soft gradient to keep photo vibrant while text is legible */}
                <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-neutral-950/95 via-neutral-950/50 to-transparent pointer-events-none"></div>
                <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-neutral-950/70 to-transparent pointer-events-none"></div>

                {/* Top Bar Controls Overlay */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-1.5 z-10">
                  <span className="bg-neutral-950/80 backdrop-blur-md text-amber-300 font-mono text-[11px] font-bold px-2.5 py-1 rounded-xl border border-amber-500/30">
                    {activeSlide.tag || `รูปที่ ${currentSlideIndex + 1}/${slideshowList.length}`}
                  </span>

                  {/* Right controls: MV button, Slideshow Toggle & Vinyl Disc Indicator */}
                  <div className="flex items-center gap-1.5">
                    {activeSongMvUrls.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setVisualMode('mv');
                          if (isPlaying) togglePlayPause();
                        }}
                        className="flex items-center gap-1 bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-xl shadow-xl backdrop-blur-md transition-all cursor-pointer animate-pulse"
                        title="กดดู Official MV เพลงนี้"
                      >
                        <Youtube className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">ดู MV {activeSongMvUrls.length > 1 ? `(${activeSongMvUrls.length})` : ''}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setIsSlideshowMode(!isSlideshowMode)}
                      className={`flex items-center gap-1.5 text-[11px] font-mono font-bold px-2 py-1.5 rounded-xl shadow-lg backdrop-blur-md transition-all cursor-pointer border ${
                        isSlideshowMode
                          ? 'bg-red-950/90 border-red-600/80 text-red-300'
                          : 'bg-neutral-950/80 border-neutral-700 text-neutral-300 hover:text-white'
                      }`}
                      title="สลับโหมดสไลด์โชว์รูปภาพวงอัตโนมัติ"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span className="hidden sm:inline">{isSlideshowMode ? 'สไลด์ ON' : 'สไลด์ OFF'}</span>
                    </button>

                    <div className={`w-7 h-7 rounded-full border border-neutral-700/80 bg-neutral-950/90 flex items-center justify-center shadow-lg ${isPlaying ? 'animate-spin' : ''}`}>
                      <div className="w-2.5 h-2.5 rounded-full bg-red-600 border border-neutral-900"></div>
                    </div>
                  </div>
                </div>

                {/* Manual Nav Arrows (On Hover) */}
                <button
                  type="button"
                  onClick={() => setCurrentSlideIndex((prev) => (prev - 1 + slideshowList.length) % slideshowList.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-neutral-950/70 hover:bg-neutral-900 border border-neutral-700/80 text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer z-10"
                  title="รูปก่อนหน้า"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentSlideIndex((prev) => (prev + 1) % slideshowList.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-neutral-950/70 hover:bg-neutral-900 border border-neutral-700/80 text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer z-10"
                  title="รูปถัดไป"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Album Title & Slide Info Overlay Tag */}
                <div className="absolute bottom-3 left-4 right-4 z-10">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-mono text-red-400 uppercase tracking-widest font-bold bg-neutral-950/90 border border-neutral-800 px-2.5 py-0.5 rounded shadow">
                      ALBUM TRACK #{activeSong.trackNumber}
                    </span>

                    <span className="text-[10px] font-mono text-neutral-300 bg-neutral-900/90 border border-neutral-800 px-2 py-0.5 rounded-md truncate max-w-[150px]">
                      🖼️ {activeSlide.title}
                    </span>
                  </div>

                  <h3 className="text-2xl font-black text-white truncate drop-shadow-md">
                    {activeSong.titleThai}
                  </h3>
                  <p className="text-xs text-neutral-300 font-mono drop-shadow">
                    {activeSong.titleEng} {activeSong.featuredArtist && <span className="text-red-400 font-bold">({activeSong.featuredArtist})</span>}
                  </p>

                  {/* Slideshow Dot Indicators */}
                  <div className="flex items-center justify-center gap-1.5 pt-2.5">
                    {slideshowList.map((item, idx) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setCurrentSlideIndex(idx);
                          setIsSlideshowMode(false);
                        }}
                        className={`h-1.5 rounded-full transition-all cursor-pointer ${
                          idx === currentSlideIndex
                            ? 'w-6 bg-red-500'
                            : 'w-1.5 bg-neutral-600 hover:bg-neutral-400'
                        }`}
                        title={item.title}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Live Audio Equalizer Visualizer Bars & Quick MP3 Manager */}
            <div className="bg-neutral-950/95 border border-neutral-800/90 rounded-2xl p-4 space-y-3 shadow-inner">
              {/* Header with Spectrum label, Audio format indicator, and Key/BPM */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono gap-2 text-neutral-400">
                <div className="flex items-center flex-wrap gap-2">
                  <span className="flex items-center gap-1.5 text-amber-400 font-bold tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    AUDIO SPECTRUM
                  </span>
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full border font-sans font-semibold inline-flex items-center gap-1.5 ${
                    isUsingRealAudio
                      ? 'bg-emerald-950/90 text-emerald-300 border-emerald-600/70 shadow-sm shadow-emerald-950'
                      : 'bg-amber-950/40 text-amber-300 border-amber-800/50'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isUsingRealAudio ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`}></span>
                    {isUsingRealAudio ? '🔊 ไฟล์เสียง MP3 จริง' : '🎹 Dreamy Soul Synth'}
                  </span>
                </div>
                
                {/* BPM & Key metadata with highlight */}
                <div className="flex items-center gap-1.5 font-mono text-[11px] sm:text-xs">
                  <span className="bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-amber-300 font-bold">
                    BPM: {activeSong.audioParams?.bpm || 108}
                  </span>
                  <span className="bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-rose-300 font-bold">
                    Key: {activeSong.audioParams?.key || 'Bb Minor'}
                  </span>
                </div>
              </div>

              {/* 16-Band Responsive Visualizer with Rose Gold to Amber Gradient */}
              <div className="relative bg-neutral-900/60 rounded-xl p-2.5 border border-neutral-800/60">
                <div className="flex items-end justify-between h-14 sm:h-16 gap-1 sm:gap-1.5">
                  {frequencies.map((val, idx) => (
                    <div key={idx} className="flex-1 bg-neutral-950/90 rounded-t overflow-hidden h-full flex flex-col justify-end">
                      {/* Peak dot */}
                      <div
                        className="w-full h-1 bg-amber-200/80 rounded-t shadow-sm transition-all duration-75"
                        style={{ opacity: isPlaying ? 0.9 : 0.2 }}
                      ></div>
                      {/* Spectrum bar */}
                      <div
                        className={`w-full transition-all duration-75 rounded-t ${
                          isUsingRealAudio
                            ? 'bg-gradient-to-t from-emerald-900 via-emerald-500 to-teal-200'
                            : 'bg-gradient-to-t from-rose-900 via-amber-500 to-amber-200'
                        }`}
                        style={{ height: `${val}%` }}
                      ></div>
                    </div>
                  ))}
                </div>

                {/* Ambient Glow underneath visualizer */}
                <div className={`absolute bottom-0 left-1/4 right-1/4 h-2 blur-md pointer-events-none ${
                  isPlaying ? (isUsingRealAudio ? 'bg-emerald-500/40' : 'bg-amber-500/40') : 'opacity-0'
                }`}></div>
              </div>

              {/* Master Audio Format Badge */}
              <div className="pt-1 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-800/60 text-[11px] font-mono text-neutral-400">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-800 px-2 py-0.5 rounded flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>High-Fidelity Stereo Audio</span>
                  </span>
                  <span className="text-neutral-500 hidden sm:inline">•</span>
                  <span className="text-neutral-400 hidden sm:inline">10 Official Studio Tracks</span>
                </div>
                <span className="text-[10px] text-red-400 font-bold bg-red-950/40 border border-red-900/50 px-2 py-0.5 rounded">
                  TRIPLETS RECORD
                </span>
              </div>
            </div>

            {/* Track Timeline Seek Bar */}
            <div className="space-y-1.5">
              <input
                type="range"
                min="0"
                max={duration}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-red-600 hover:accent-red-500"
              />
              <div className="flex justify-between text-xs font-mono text-neutral-400">
                <span>{formatTime(currentTime)}</span>
                <span>{activeSong.duration}</span>
              </div>
            </div>

            {/* Audio Controls (Shuffle, Repeat, Next, Prev, Play/Pause, Volume) */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between">
                
                {/* Left: Shuffle & Repeat Mode Controls */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={toggleShuffle}
                    className={`p-2 rounded-xl border transition-all cursor-pointer ${
                      isShuffle
                        ? 'bg-red-950/90 border-red-600 text-red-300 shadow-lg shadow-red-950/60'
                        : 'bg-neutral-800/80 border-neutral-700/80 text-neutral-400 hover:text-white hover:bg-neutral-700'
                    }`}
                    title={isShuffle ? 'สุ่มเพลง: เปิดอยู่ (คลิกเพื่อปิด)' : 'สุ่มเพลง: ปิดอยู่ (คลิกเพื่อเปิด)'}
                  >
                    <Shuffle className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={toggleRepeatMode}
                    className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1 ${
                      repeatMode !== 'off'
                        ? 'bg-red-950/90 border-red-600 text-red-300 shadow-lg shadow-red-950/60'
                        : 'bg-neutral-800/80 border-neutral-700/80 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-700'
                    }`}
                    title={
                      repeatMode === 'all'
                        ? 'โหมดเล่นวน: วนทั้งอัลบั้ม (คลิกเพื่อเปลี่ยนเป็น วนเพลงเดียว)'
                        : repeatMode === 'one'
                        ? 'โหมดเล่นวน: วนซ้ำเพลงเดียว (คลิกเพื่อปิดโหมดวน)'
                        : 'โหมดเล่นวน: ปิดอยู่ (คลิกเพื่อเปิดเล่นวนทั้งอัลบั้ม)'
                    }
                  >
                    {repeatMode === 'one' ? <Repeat1 className="w-4 h-4 text-red-400" /> : <Repeat className="w-4 h-4" />}
                    {repeatMode === 'one' && <span className="text-[10px] font-bold font-mono">1</span>}
                  </button>

                  <button
                    onClick={handleShare}
                    className="p-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 border border-neutral-700/80 text-neutral-300 hover:text-white transition-colors cursor-pointer relative"
                    title="แชร์บทเพลง"
                  >
                    <Share2 className="w-4 h-4" />
                    {copiedLink && (
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap shadow">
                        คัดลอกลิงก์แล้ว!
                      </span>
                    )}
                  </button>
                </div>

                {/* Center: Prev, Play/Pause, Next */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    onClick={playPrev}
                    className="p-2.5 sm:p-3 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white transition-all cursor-pointer hover:scale-105 active:scale-95"
                    aria-label="Previous Track"
                    title="เพลงก่อนหน้า"
                  >
                    <SkipBack className="w-4 sm:w-5 h-4 sm:h-5 fill-current" />
                  </button>

                  <button
                    onClick={() => handleTogglePlay(activeSong)}
                    className="p-3.5 sm:p-4 rounded-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-xl shadow-red-950/80 transition-all cursor-pointer hover:scale-110 active:scale-95"
                    aria-label="Play or Pause"
                  >
                    {isPlaying && currentTrackId === activeSong.id ? (
                      <Pause className="w-5 sm:w-6 h-5 sm:h-6 fill-current" />
                    ) : (
                      <Play className="w-5 sm:w-6 h-5 sm:h-6 fill-current ml-0.5" />
                    )}
                  </button>

                  <button
                    onClick={playNext}
                    className="p-2.5 sm:p-3 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white transition-all cursor-pointer hover:scale-105 active:scale-95"
                    aria-label="Next Track"
                    title="เพลงถัดไป"
                  >
                    <SkipForward className="w-4 sm:w-5 h-4 sm:h-5 fill-current" />
                  </button>
                </div>

                {/* Right: Volume Slider */}
                <div className="flex items-center gap-1.5">
                  {volume === 0 ? <VolumeX className="w-4 h-4 text-neutral-500" /> : <Volume2 className="w-4 h-4 text-neutral-300" />}
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-14 sm:w-16 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-red-600"
                    title={`ระดับเสียง: ${Math.round(volume * 100)}%`}
                  />
                </div>
              </div>

              {/* Playback Mode Status Badge */}
              <div className="flex items-center justify-between text-[11px] font-mono px-3 py-1.5 rounded-xl bg-neutral-950/80 border border-neutral-800 text-neutral-400">
                <div className="flex items-center gap-1.5 truncate">
                  <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-600'}`}></span>
                  <span className="text-neutral-300 font-medium truncate">
                    {repeatMode === 'all' && '🔁 เล่นต่อเนื่อง (วนทั้งอัลบั้ม)'}
                    {repeatMode === 'one' && '🔂 เล่นวนซ้ำ (เพลงปัจจุบัน)'}
                    {repeatMode === 'off' && '➡️ เล่นต่อเนื่องตามลำดับ (Sequential)'}
                  </span>
                </div>
                {isShuffle && (
                  <span className="text-red-400 font-bold bg-red-950/90 border border-red-800/80 px-1.5 py-0.5 rounded text-[10px] shrink-0">
                    🔀 สุ่มเพลง ON
                  </span>
                )}
              </div>
            </div>

            {/* External Streaming Platform Buttons */}
            <div className="pt-4 border-t border-neutral-800 text-center space-y-2">
              <p className="text-xs text-neutral-400 font-mono uppercase">ฟังบนมิวสิกสตรีมมิงมินิเพลตฟอร์ม</p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <a href="https://spotify.com" target="_blank" rel="noopener noreferrer" className="text-xs bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 hover:bg-emerald-900 px-3 py-1.5 rounded-xl transition-colors inline-flex items-center gap-1.5">
                  Spotify <ExternalLink className="w-3 h-3" />
                </a>
                <a href="https://music.apple.com" target="_blank" rel="noopener noreferrer" className="text-xs bg-rose-950/60 border border-rose-800/60 text-rose-300 hover:bg-rose-900 px-3 py-1.5 rounded-xl transition-colors inline-flex items-center gap-1.5">
                  Apple Music <ExternalLink className="w-3 h-3" />
                </a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-xs bg-red-950/60 border border-red-800/60 text-red-300 hover:bg-red-900 px-3 py-1.5 rounded-xl transition-colors inline-flex items-center gap-1.5">
                  YouTube Music <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

          </div>

          {/* Right: Album Tracklist & Interactive Lyrics / Story Viewer */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Tracklist Table */}
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>รายชื่อเพลงในอัลบั้ม ({songs.length} เพลง)</span>
                </h3>
                <span className="text-xs font-mono text-neutral-400">
                  Total: {songs.length} Tracks
                </span>
              </div>

              <div className="divide-y divide-neutral-800/80">
                {songs.map((song) => {
                  const isCurrent = song.id === activeSong.id;
                  const isSongPlaying = isCurrent && isPlaying;

                  return (
                    <div
                      key={song.id}
                      onClick={() => handleTogglePlay(song)}
                      className={`flex items-center justify-between p-3.5 rounded-2xl transition-all cursor-pointer group ${
                        isCurrent 
                          ? 'bg-red-950/40 border border-red-800/50 text-white' 
                          : 'hover:bg-neutral-800/50 text-neutral-300'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-xs ${
                          isCurrent ? 'bg-red-600 text-white' : 'bg-neutral-800 text-neutral-400 group-hover:bg-neutral-700 group-hover:text-white'
                        }`}>
                          {isSongPlaying ? (
                            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
                          ) : (
                            song.trackNumber
                          )}
                        </div>

                        <div>
                          <div className="font-bold text-sm sm:text-base flex items-center gap-2">
                            <span>{song.titleThai}</span>
                            {song.featuredArtist && (
                              <span className="text-xs bg-red-950 text-red-400 border border-red-800/60 px-2 py-0.5 rounded font-mono">
                                {song.featuredArtist}
                              </span>
                            )}
                            {((song.youtubeUrls && song.youtubeUrls.length > 0) || song.youtubeUrl) && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectTrack(song.id);
                                  setVisualMode('mv');
                                  if (isPlaying) togglePlayPause();
                                }}
                                className="text-[10px] bg-red-950/90 hover:bg-red-600 text-red-400 hover:text-white border border-red-800/80 hover:border-red-500 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1 transition-all cursor-pointer"
                                title={`ดู MV เพลงนี้ (${(song.youtubeUrls && song.youtubeUrls.length > 0 ? song.youtubeUrls.length : 1)} วิดีโอเล่นตามลำดับ)`}
                              >
                                <Youtube className="w-3 h-3 text-red-400" />
                                <span>MV {song.youtubeUrls && song.youtubeUrls.length > 1 ? `(${song.youtubeUrls.length})` : ''}</span>
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-neutral-400 font-mono">
                            {song.titleEng} • {song.audioParams?.style ? song.audioParams.style.replace('_', ' ') : 'Rock'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-neutral-400">{song.duration}</span>

                        <button
                          className={`p-2 rounded-full transition-all ${
                            isSongPlaying ? 'bg-red-600 text-white' : 'bg-neutral-800 text-neutral-300 group-hover:bg-red-600 group-hover:text-white'
                          }`}
                        >
                          {isSongPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Lyrics / Story / Chords Tab Switcher */}
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('lyrics')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'lyrics'
                        ? 'bg-red-600 text-white shadow-md'
                        : 'bg-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    เนื้อเพลง (Lyrics)
                  </button>
                  <button
                    onClick={() => setActiveTab('story')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'story'
                        ? 'bg-red-600 text-white shadow-md'
                        : 'bg-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    เรื่องราวเพลง (Story)
                  </button>
                  {activeSong.chords && (
                    <button
                      onClick={() => setActiveTab('chords')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeTab === 'chords'
                          ? 'bg-red-600 text-white shadow-md'
                          : 'bg-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      คอร์ดกีตาร์ (Chords)
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-1.5 text-xs text-neutral-400 font-mono bg-neutral-950/60 border border-neutral-800/80 px-2.5 py-1 rounded-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                    <span>{activeSong.audioParams.key} • {activeSong.audioParams.bpm} BPM</span>
                  </div>
                </div>
              </div>

              {/* Tab Content Display */}
              <div className="pt-2">
                {activeTab === 'lyrics' && (
                  <div className="bg-neutral-950/80 border border-neutral-800/80 rounded-2xl p-6 max-h-80 overflow-y-auto space-y-2 text-center text-sm sm:text-base leading-relaxed text-neutral-300 font-sans tracking-wide">
                    {activeSong.lyrics.map((line, idx) => (
                      <p
                        key={idx}
                        className={`transition-all ${
                          line.startsWith('(Chorus')
                            ? 'text-red-400 font-bold py-1 text-base'
                            : line === ''
                            ? 'py-1'
                            : 'hover:text-white'
                        }`}
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                )}

                {activeTab === 'story' && (
                  <div className="bg-neutral-950/80 border border-neutral-800/80 rounded-2xl p-6 space-y-3 text-sm text-neutral-300 font-light leading-relaxed">
                    <h4 className="text-base font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-red-500" />
                      แรงบันดาลใจในการแต่งเพลง "{activeSong.titleThai}"
                    </h4>
                    <p>{activeSong.story}</p>
                    <div className="pt-3 border-t border-neutral-800 text-xs font-mono text-neutral-400 grid grid-cols-2 gap-2">
                      <div>จังหวะเพลง: {activeSong.audioParams.bpm} BPM</div>
                      <div>คีย์ดนตรี: {activeSong.audioParams.key}</div>
                    </div>
                  </div>
                )}

                {activeTab === 'chords' && activeSong.chords && (
                  <div className="bg-neutral-950/80 border border-neutral-800/80 rounded-2xl p-6 font-mono text-xs text-red-400 whitespace-pre-wrap leading-relaxed">
                    {activeSong.chords}
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>

      </div>

    </section>
  );
};
