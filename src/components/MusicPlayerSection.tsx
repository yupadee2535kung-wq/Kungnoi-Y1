import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Disc, Music, FileText, Share2, Heart, Sparkles, ExternalLink, Repeat, Repeat1, Shuffle, ChevronLeft, ChevronRight, CheckCircle2, Youtube, Video, BookOpen, Images, ListOrdered, Upload, Link, Radio, RefreshCw, Globe, Check, Edit3, Plus, Trash2 } from 'lucide-react';
import { ALBUM_INFO } from '../data/bandData';
import { Song } from '../types';
import { useSongs } from '../context/SongContext';
import { useBandImages } from '../context/ImageContext';
import { getYouTubeWatchUrl, getYouTubeSequentialEmbedUrl, getYouTubeThumbnailUrl, getYouTubeVideoId } from '../utils/youtubeUtils';
import { generateGitHubAudioUrls } from '../utils/audioSynth';

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
    playTrack,
    playNext,
    playPrev,
    toggleRepeatMode,
    toggleShuffle,
    seek,
    setVolume,
    uploadSongAudio,
    playTestSound,
    resumeAudio,
    githubAudioRepo,
    setGithubAudioRepo,
    applyGithubAudioToAllSongs,
    editSong,
    updateMultipleSongs,
  } = useSongs();

  const currentTrackId = propCurrentTrackId || contextTrackId;
  const onSelectTrack = (id: string) => {
    if (propOnSelectTrack) {
      propOnSelectTrack(id);
    }
    setCurrentTrackId(id);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetSongId, setUploadTargetSongId] = useState<string | null>(null);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);
  const [testSoundMsg, setTestSoundMsg] = useState<boolean>(false);
  const [isGithubModalOpen, setIsGithubModalOpen] = useState(false);
  const [customRepoInput, setCustomRepoInput] = useState(githubAudioRepo || 'yupadee2535/triplets-band-website');
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  // MV Video URLs Management Modal State
  const [isMvModalOpen, setIsMvModalOpen] = useState(false);
  const [mvModalTab, setMvModalTab] = useState<'batch' | 'multiline' | 'single'>('batch');
  const [mvEditSongId, setMvEditSongId] = useState<string>('');
  const [mvUrlsInput, setMvUrlsInput] = useState<string[]>(['']);
  const [batchUrlsInput, setBatchUrlsInput] = useState<Record<string, string>>({});
  const [multilineMvInput, setMultilineMvInput] = useState<string>('');
  const [mvSaveSuccessMsg, setMvSaveSuccessMsg] = useState<string | null>(null);
  const [inlineMvInput, setInlineMvInput] = useState<string>('');
  const [inlineMvSuccess, setInlineMvSuccess] = useState<string | null>(null);

  // Sync inline MV input with currently active song
  useEffect(() => {
    const active = songs.find((s) => s.id === currentTrackId) || songs[0];
    if (active) {
      const currentUrl = active.youtubeUrl || (active.youtubeUrls && active.youtubeUrls[0]) || '';
      setInlineMvInput(currentUrl);
    }
  }, [currentTrackId, songs]);

  const openMvEditModal = (songId?: string, initialTab: 'batch' | 'multiline' | 'single' = 'batch') => {
    const targetId = songId || currentTrackId;
    const targetSong = songs.find((s) => s.id === targetId) || songs[0];
    setMvEditSongId(targetSong.id);
    setMvModalTab(initialTab);

    // Initialize single song URLs
    let initialUrls: string[] = [];
    if (Array.isArray(targetSong.youtubeUrls) && targetSong.youtubeUrls.length > 0) {
      initialUrls = [...targetSong.youtubeUrls];
    } else if (targetSong.youtubeUrl && targetSong.youtubeUrl.trim()) {
      initialUrls = [targetSong.youtubeUrl.trim()];
    } else {
      initialUrls = [''];
    }
    setMvUrlsInput(initialUrls);

    // Initialize batch URLs for all songs
    const batchMap: Record<string, string> = {};
    const multiLines: string[] = [];
    songs.forEach((s) => {
      const u = s.youtubeUrl || (s.youtubeUrls && s.youtubeUrls[0]) || '';
      batchMap[s.id] = u;
      multiLines.push(u);
    });
    setBatchUrlsInput(batchMap);
    setMultilineMvInput(multiLines.join('\n'));

    setIsMvModalOpen(true);
  };

  const handleSaveInlineMv = () => {
    const active = songs.find((s) => s.id === currentTrackId) || songs[0];
    if (!active) return;

    const cleanUrl = inlineMvInput.trim();
    editSong(active.id, {
      youtubeUrl: cleanUrl,
      youtubeUrls: cleanUrl ? [cleanUrl] : [],
    });

    setVisualMode('mv');
    setInlineMvSuccess(cleanUrl ? '✅ บันทึกลิงก์ MV และเปิดเล่นทันที!' : '🗑️ ล้างลิงก์ MV ของเพลงนี้แล้ว');
    setTimeout(() => setInlineMvSuccess(null), 2500);
  };

  const handleSaveBatchMvUrls = () => {
    const updates = songs.map((s) => {
      const u = (batchUrlsInput[s.id] || '').trim();
      return {
        id: s.id,
        data: {
          youtubeUrl: u,
          youtubeUrls: u ? [u] : [],
        },
      };
    });

    updateMultipleSongs(updates);
    setMvSaveSuccessMsg('✅ บันทึกลิงก์ YouTube MV สำหรับทุกเพลงเรียบร้อยแล้ว!');
    setTimeout(() => {
      setMvSaveSuccessMsg(null);
      setIsMvModalOpen(false);
    }, 1500);
  };

  const handleClearAllBatchUrls = () => {
    if (window.confirm('คุณต้องการล้างลิงก์ YouTube MV ของทุกเพลงใช่หรือไม่?')) {
      const emptyBatch: Record<string, string> = {};
      songs.forEach((s) => {
        emptyBatch[s.id] = '';
      });
      setBatchUrlsInput(emptyBatch);
      setMultilineMvInput('');
      const updates = songs.map((s) => ({
        id: s.id,
        data: {
          youtubeUrl: '',
          youtubeUrls: [],
        },
      }));
      updateMultipleSongs(updates);
      setMvSaveSuccessMsg('🗑️ ล้างลิงก์ YouTube MV ของทุกเพลงแล้ว');
      setTimeout(() => setMvSaveSuccessMsg(null), 2500);
    }
  };

  const handleApplyMultilineToBatch = () => {
    const lines = multilineMvInput
      .split('\n')
      .map((l) => l.trim());

    const newBatchMap: Record<string, string> = {};
    const updates = songs.map((song, idx) => {
      const url = lines[idx] || '';
      newBatchMap[song.id] = url;
      return {
        id: song.id,
        data: {
          youtubeUrl: url,
          youtubeUrls: url ? [url] : [],
        },
      };
    });

    setBatchUrlsInput(newBatchMap);
    updateMultipleSongs(updates);
    setMvSaveSuccessMsg(`✅ นำเข้าลิงก์ MV ให้กับทั้ง ${songs.length} เพลงเรียบร้อยแล้ว!`);
    setTimeout(() => {
      setMvSaveSuccessMsg(null);
      setIsMvModalOpen(false);
    }, 1500);
  };

  const handleSelectMvEditSong = (songId: string) => {
    setMvEditSongId(songId);
    const targetSong = songs.find((s) => s.id === songId);
    if (!targetSong) return;

    let initialUrls: string[] = [];
    if (Array.isArray(targetSong.youtubeUrls) && targetSong.youtubeUrls.length > 0) {
      initialUrls = [...targetSong.youtubeUrls];
    } else if (targetSong.youtubeUrl && targetSong.youtubeUrl.trim()) {
      initialUrls = [targetSong.youtubeUrl.trim()];
    } else {
      initialUrls = [''];
    }
    setMvUrlsInput(initialUrls);
  };

  const handleSaveMvUrls = () => {
    const cleanUrls = mvUrlsInput
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    const primaryUrl = cleanUrls[0] || '';
    editSong(mvEditSongId, {
      youtubeUrl: primaryUrl,
      youtubeUrls: cleanUrls,
    });

    setMvSaveSuccessMsg('✅ บันทึกลิงก์ YouTube MV เรียบร้อยแล้ว!');
    setTimeout(() => {
      setMvSaveSuccessMsg(null);
      setIsMvModalOpen(false);
    }, 1500);
  };

  const handleAddMvUrlField = () => {
    if (mvUrlsInput.length < 10) {
      setMvUrlsInput((prev) => [...prev, '']);
    }
  };

  const handleRemoveMvUrlField = (index: number) => {
    setMvUrlsInput((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      return updated.length > 0 ? updated : [''];
    });
  };

  const handleUpdateMvUrlField = (index: number, val: string) => {
    setMvUrlsInput((prev) => {
      const updated = [...prev];
      updated[index] = val;
      return updated;
    });
  };

  const handleAudioFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTargetSongId) return;

    const success = await uploadSongAudio(uploadTargetSongId, file);
    if (success) {
      setUploadSuccessMsg('อัปโหลดไฟล์เสียงสำเร็จแล้ว!');
      setTimeout(() => setUploadSuccessMsg(null), 3000);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerUploadForSong = (songId: string) => {
    setUploadTargetSongId(songId);
    fileInputRef.current?.click();
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

  // Compute previous and next songs for seamless skipping across tracks
  const currentSongIndex = songs.findIndex((s) => s.id === activeSong.id);
  const safeCurrentIdx = currentSongIndex !== -1 ? currentSongIndex : 0;
  const prevSong = songs[(safeCurrentIdx - 1 + songs.length) % songs.length];
  const nextSong = songs[(safeCurrentIdx + 1) % songs.length];

  // Valid YouTube URLs list for active song (up to 10 URLs)
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

  // MV Skip navigation handlers
  const handleSkipToSong = (songId: string) => {
    onSelectTrack(songId);
    setCurrentMvIndex(0);
    setVisualMode('mv');
    if (isPlaying) {
      togglePlayPause();
    }
  };

  const handleMvSkipPrev = () => {
    if (activeSongMvUrls.length > 1 && currentMvIndex > 0) {
      setCurrentMvIndex((prev) => prev - 1);
    } else {
      handleSkipToSong(prevSong.id);
    }
  };

  const handleMvSkipNext = () => {
    if (activeSongMvUrls.length > 1 && currentMvIndex < activeSongMvUrls.length - 1) {
      setCurrentMvIndex((prev) => prev + 1);
    } else {
      handleSkipToSong(nextSong.id);
    }
  };

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
              /* YouTube MV Video Player with Sequential 10-URL support & Skip Controls */
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

                    {/* Left & Right Floating Overlay Skip Buttons (Quick Skip on Video) */}
                    <button
                      type="button"
                      onClick={handleMvSkipPrev}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 p-2.5 rounded-2xl bg-neutral-950/80 hover:bg-red-600 border border-neutral-700/80 hover:border-red-500 text-white shadow-2xl backdrop-blur-md transition-all cursor-pointer z-20 opacity-70 group-hover:opacity-100 hover:scale-110 flex items-center justify-center"
                      title={`ข้ามไปเพลงก่อนหน้า: แทร็ก #${prevSong.trackNumber} ${prevSong.titleThai}`}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    <button
                      type="button"
                      onClick={handleMvSkipNext}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2.5 rounded-2xl bg-neutral-950/80 hover:bg-red-600 border border-neutral-700/80 hover:border-red-500 text-white shadow-2xl backdrop-blur-md transition-all cursor-pointer z-20 opacity-70 group-hover:opacity-100 hover:scale-110 flex items-center justify-center"
                      title={`ข้ามไปเพลงถัดไป: แทร็ก #${nextSong.trackNumber} ${nextSong.titleThai}`}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>

                    {/* Top Floating Info & Skip Bar in MV Mode */}
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-20 gap-1.5">
                      {/* Left: Track badge & Sequence */}
                      <div className="pointer-events-auto flex items-center gap-1.5 bg-neutral-950/90 border border-neutral-700/90 text-white text-[11px] font-mono font-bold px-2.5 py-1 rounded-xl shadow-xl backdrop-blur-md">
                        <Youtube className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        <span className="truncate max-w-[110px] sm:max-w-[150px]">
                          #{activeSong.trackNumber} {activeSong.titleThai}
                        </span>
                        {activeSongMvUrls.length > 1 && (
                          <span className="text-[10px] text-red-400 bg-red-950/80 border border-red-800/80 px-1 py-0.2 rounded shrink-0">
                            {currentMvIndex + 1}/{activeSongMvUrls.length}
                          </span>
                        )}
                      </div>

                      {/* Center: Quick Skip Buttons */}
                      <div className="pointer-events-auto flex items-center gap-1 bg-neutral-950/90 border border-neutral-700/90 rounded-xl p-0.5 shadow-xl backdrop-blur-md">
                        <button
                          type="button"
                          onClick={handleMvSkipPrev}
                          className="flex items-center gap-1 text-[11px] font-bold text-neutral-300 hover:text-white hover:bg-neutral-800 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                          title={`ข้ามไปเพลงก่อนหน้า (${prevSong.titleThai})`}
                        >
                          <SkipBack className="w-3 h-3 text-red-400" />
                          <span className="hidden sm:inline">ก่อนหน้า</span>
                        </button>
                        <span className="text-neutral-600 text-xs">|</span>
                        <button
                          type="button"
                          onClick={handleMvSkipNext}
                          className="flex items-center gap-1 text-[11px] font-bold text-neutral-300 hover:text-white hover:bg-neutral-800 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                          title={`ข้ามไปเพลงถัดไป (${nextSong.titleThai})`}
                        >
                          <span className="hidden sm:inline">ถัดไป</span>
                          <SkipForward className="w-3 h-3 text-red-400" />
                        </button>
                      </div>

                      {/* Right: Actions */}
                      <div className="pointer-events-auto flex items-center gap-1 opacity-90 hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => openMvEditModal(activeSong.id)}
                          className="flex items-center gap-1 bg-neutral-950/90 hover:bg-neutral-800 border border-neutral-700 hover:border-red-500 text-neutral-200 hover:text-white text-[11px] font-bold px-2 py-1 rounded-xl shadow-xl backdrop-blur-md transition-all cursor-pointer"
                          title="แก้ไขหรือเพิ่มลิงก์ YouTube MV เพลงนี้"
                        >
                          <Edit3 className="w-3 h-3 text-amber-400" />
                          <span className="hidden md:inline">แก้ไข MV</span>
                        </button>

                        {getYouTubeWatchUrl(activeSongMvUrls[currentMvIndex] || activeSongMvUrls[0]) && (
                          <a
                            href={getYouTubeWatchUrl(activeSongMvUrls[currentMvIndex] || activeSongMvUrls[0])!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 bg-neutral-950/90 hover:bg-red-600 border border-neutral-700 text-white text-[11px] font-bold px-2 py-1 rounded-xl shadow-xl backdrop-blur-md transition-all"
                          >
                            <ExternalLink className="w-3 h-3" />
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
                          className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer flex-shrink-0 flex items-center gap-1 text-[11px]"
                          title="วิดีโอก่อนหน้า"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">ก่อนหน้า</span>
                        </button>

                        {/* Numbered Pills 1 to 10 with horizontal scroll */}
                        <div className="flex items-center gap-1 overflow-x-auto py-0.5 max-w-[calc(100%-120px)] scrollbar-none">
                          <span className="text-[10px] font-mono text-neutral-400 mr-1 hidden md:inline flex-shrink-0">
                            วิดีโอ:
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
                          className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer flex-shrink-0 flex items-center gap-1 text-[11px]"
                          title="วิดีโอถัดไป"
                        >
                          <span className="hidden sm:inline">ถัดไป</span>
                          <ChevronRight className="w-3.5 h-3.5" />
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
                        โหมด MV: แทร็ก #{activeSong.trackNumber} "{activeSong.titleThai}"
                      </h4>
                      <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                        ยังไม่ได้ใส่ลิงก์ YouTube MV สำหรับเพลงนี้ สามารถกดใส่ลิงก์ หรือกดปุ่มด้านล่างเพื่อข้ามไปดู MV เพลงอื่นได้ทันที
                      </p>
                    </div>

                    <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => openMvEditModal(activeSong.id)}
                        className="text-xs bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-lg shadow-red-950"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>ใส่ลิงก์ YouTube MV เพลงนี้</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleMvSkipNext}
                        className="text-xs bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white px-3.5 py-2 rounded-xl cursor-pointer font-medium transition-colors flex items-center gap-1"
                      >
                        <span>ข้ามไปเพลงถัดไป ⏭</span>
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

            {/* Quick MV Track Switcher & Skip Ribbon (When in MV mode) */}
            {visualMode === 'mv' && (
              <div className="bg-neutral-950/90 border border-neutral-800/90 rounded-2xl p-3 space-y-2 shadow-xl animate-fadeIn">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <SkipForward className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    <span>กดข้ามเพลง MV ({songs.length} เพลง):</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleMvSkipPrev}
                      className="px-2 py-0.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-[11px] font-bold text-neutral-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                      title={`ข้ามไปเพลงก่อนหน้า: ${prevSong.titleThai}`}
                    >
                      <SkipBack className="w-3 h-3 text-red-400" />
                      <span>ก่อนหน้า</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleMvSkipNext}
                      className="px-2 py-0.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-[11px] font-bold text-neutral-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                      title={`ข้ามไปเพลงถัดไป: ${nextSong.titleThai}`}
                    >
                      <span>ถัดไป</span>
                      <SkipForward className="w-3 h-3 text-red-400" />
                    </button>
                  </div>
                </div>

                {/* Horizontal Scrollable Track Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {songs.map((song) => {
                    const isCurrent = song.id === activeSong.id;
                    const hasMv = (Array.isArray(song.youtubeUrls) && song.youtubeUrls.some((u) => u && u.trim().length > 0)) || (song.youtubeUrl && song.youtubeUrl.trim().length > 0);
                    return (
                      <button
                        key={song.id}
                        type="button"
                        onClick={() => handleSkipToSong(song.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all cursor-pointer flex-shrink-0 ${
                          isCurrent
                            ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-950/80 border border-red-400 scale-[1.02]'
                            : hasMv
                            ? 'bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-red-900/50 hover:border-red-500'
                            : 'bg-neutral-900/60 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
                        }`}
                        title={`กดเพื่อข้ามไปดู MV เพลง #${song.trackNumber} ${song.titleThai}`}
                      >
                        <span>#{song.trackNumber}</span>
                        <span className="font-sans font-medium">{song.titleThai}</span>
                        {hasMv && (
                          <span className={`text-[10px] px-1 py-0.2 rounded font-mono ${isCurrent ? 'bg-red-950/80 text-white' : 'text-red-400 bg-red-950/40'}`}>
                            🎬
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Inline Direct MV URL Bar (when in MV mode) */}
            {visualMode === 'mv' && (
              <div className="bg-neutral-900/90 border border-neutral-800/90 rounded-2xl p-3 space-y-2 shadow-lg animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Youtube className="w-4 h-4 text-red-500" />
                    <span className="text-xs font-bold text-white">
                      ลิงก์ YouTube MV เพลง "{activeSong.titleThai}":
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openMvEditModal(activeSong.id, 'batch')}
                    className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <ListOrdered className="w-3.5 h-3.5" />
                    <span>เปิดตารางใส่ครบ 10 เพลง</span>
                  </button>
                </div>

                {inlineMvSuccess && (
                  <div className="text-xs text-emerald-300 bg-emerald-950/80 border border-emerald-700/60 px-3 py-1.5 rounded-xl flex items-center gap-1.5 animate-fadeIn">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{inlineMvSuccess}</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inlineMvInput}
                    onChange={(e) => setInlineMvInput(e.target.value)}
                    placeholder="วางลิงก์ YouTube MV เช่น https://www.youtube.com/watch?v=..."
                    className="flex-1 bg-neutral-950 border border-neutral-700 focus:border-red-500 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 font-mono focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveInlineMv();
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSaveInlineMv}
                    className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-colors cursor-pointer shrink-0 flex items-center gap-1 shadow-md shadow-red-950"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>บันทึก MV</span>
                  </button>
                  {inlineMvInput.trim().length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setInlineMvInput('');
                        editSong(activeSong.id, { youtubeUrl: '', youtubeUrls: [] });
                        setInlineMvSuccess('🗑️ ล้างลิงก์ MV เพลงนี้แล้ว');
                        setTimeout(() => setInlineMvSuccess(null), 2000);
                      }}
                      className="bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-red-400 p-2 rounded-xl border border-neutral-700 transition-colors cursor-pointer shrink-0"
                      title="ลบลิงก์ MV เพลงนี้"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
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

              {/* Master Audio Format Badge & Quick Upload / GitHub Button */}
              <div className="pt-1 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-800/60 text-[11px] font-mono text-neutral-400">
                <div className="flex items-center flex-wrap gap-2">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded flex items-center gap-1 border ${
                    isUsingRealAudio
                      ? 'text-emerald-300 bg-emerald-950/80 border-emerald-700'
                      : 'text-amber-300 bg-amber-950/70 border-amber-800'
                  }`}>
                    <CheckCircle2 className={`w-3 h-3 ${isUsingRealAudio ? 'text-emerald-400' : 'text-amber-400'}`} />
                    <span>{isUsingRealAudio ? '🔊 เล่นจากไฟล์ MP3 / GitHub' : '🎹 ระบบเสียงสังเคราะห์สตูดิโอ (Synth)'}</span>
                  </span>
                  <span className="text-neutral-500 hidden sm:inline">•</span>
                  <button
                    type="button"
                    onClick={() => setIsGithubModalOpen(true)}
                    className="text-[10px] bg-neutral-900 hover:bg-neutral-800 text-rose-300 hover:text-white border border-neutral-700 hover:border-rose-500 px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-colors"
                    title="เชื่อมต่อและดึงไฟล์เสียง MP3 จาก GitHub"
                  >
                    <Radio className="w-3 h-3 text-rose-400" />
                    <span>ดึงเพลงจาก GitHub 🐙</span>
                  </button>
                  <span className="text-neutral-500 hidden sm:inline">•</span>
                  <button
                    type="button"
                    onClick={() => {
                      resumeAudio();
                      playTestSound();
                      setTestSoundMsg(true);
                      setTimeout(() => setTestSoundMsg(false), 3500);
                    }}
                    className="text-[10px] bg-neutral-900 hover:bg-neutral-800 text-cyan-300 hover:text-white border border-neutral-700 hover:border-cyan-500 px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-colors"
                    title="คลิกเพื่อทดสอบเสียงลำโพง (กระดิ่ง Major Bell)"
                  >
                    <Volume2 className="w-3 h-3 text-cyan-400" />
                    <span>ทดสอบเสียงลำโพง 🔔</span>
                  </button>
                  <span className="text-neutral-500 hidden sm:inline">•</span>
                  <button
                    type="button"
                    onClick={() => triggerUploadForSong(activeSong.id)}
                    className="text-[10px] bg-neutral-900 hover:bg-neutral-800 text-amber-300 hover:text-white border border-neutral-700 hover:border-amber-500 px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-colors"
                    title="อัปโหลดไฟล์เพลง MP3 สำหรับเพลงนี้"
                  >
                    <Upload className="w-3 h-3 text-amber-400" />
                    <span>อัปโหลด MP3</span>
                  </button>
                </div>
                <span className="text-[10px] text-red-400 font-bold bg-red-950/40 border border-red-900/50 px-2 py-0.5 rounded">
                  TRIPLETS RECORD
                </span>
              </div>

              {/* Sound Test / Unmute Alert */}
              {testSoundMsg && (
                <div className="bg-cyan-950/90 border border-cyan-600 text-cyan-200 text-xs px-3 py-2 rounded-xl flex items-center justify-between gap-2 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>🔔 ส่งสัญญาณเสียงทดสอบแล้ว! หากไม่ได้ยิน ให้ตรวจสอบปุ่มเปิดเสียง/ระดับเสียงบนเครื่องของคุณ</span>
                  </div>
                </div>
              )}

              {/* Upload Success Alert */}
              {uploadSuccessMsg && (
                <div className="bg-emerald-950/90 border border-emerald-600 text-emerald-300 text-xs px-3 py-1.5 rounded-xl flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{uploadSuccessMsg}</span>
                </div>
              )}
            </div>

            {/* Hidden Audio File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAudioFileChange}
              accept="audio/*,.mp3,.wav,.ogg,.m4a,.flac"
              className="hidden"
            />

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
                    onClick={visualMode === 'mv' ? handleMvSkipPrev : playPrev}
                    className="p-2.5 sm:p-3 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white transition-all cursor-pointer hover:scale-105 active:scale-95"
                    aria-label="Previous Track"
                    title={visualMode === 'mv' ? `ข้ามไป MV ก่อนหน้า (${prevSong.titleThai})` : 'เพลงก่อนหน้า'}
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
                    onClick={visualMode === 'mv' ? handleMvSkipNext : playNext}
                    className="p-2.5 sm:p-3 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white transition-all cursor-pointer hover:scale-105 active:scale-95"
                    aria-label="Next Track"
                    title={visualMode === 'mv' ? `ข้ามไป MV ถัดไป (${nextSong.titleThai})` : 'เพลงถัดไป'}
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
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>รายชื่อเพลงในอัลบั้ม ({songs.length} เพลง)</span>
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openMvEditModal(activeSong.id)}
                    className="text-[11px] font-mono bg-neutral-800 hover:bg-red-950 text-neutral-300 hover:text-red-300 border border-neutral-700 hover:border-red-700 px-2.5 py-1 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                    title="จัดการ / ใส่ลิงก์ YouTube MV ของเพลงในอัลบั้ม"
                  >
                    <Youtube className="w-3.5 h-3.5 text-red-500" />
                    <span>ใส่ลิงก์ MV 🎬</span>
                  </button>
                  <span className="text-xs font-mono text-neutral-400">
                    Total: {songs.length} Tracks
                  </span>
                </div>
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

                      <div className="flex items-center gap-2 sm:gap-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openMvEditModal(song.id);
                          }}
                          className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-neutral-800 transition-colors opacity-60 hover:opacity-100 cursor-pointer"
                          title="แก้ไขหรือใส่ลิงก์ YouTube MV สำหรับเพลงนี้"
                        >
                          <Youtube className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerUploadForSong(song.id);
                          }}
                          className="p-1.5 rounded-lg text-neutral-500 hover:text-amber-300 hover:bg-neutral-800 transition-colors opacity-60 hover:opacity-100 cursor-pointer"
                          title="อัปโหลดไฟล์ MP3 สำหรับเพลงนี้"
                        >
                          <Upload className="w-3.5 h-3.5" />
                        </button>

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

      {/* GitHub Audio Sync Modal */}
      {isGithubModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 text-neutral-200">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-rose-400">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    ดึงเพลง MP3 จาก GitHub
                    <span className="text-xs bg-rose-950/80 text-rose-300 border border-rose-800/80 px-2 py-0.5 rounded-full font-mono">
                      Real MP3 Sync
                    </span>
                  </h3>
                  <p className="text-xs text-neutral-400">
                    เล่นไฟล์เสียงจริงจากโฟลเดอร์ <code className="text-amber-300 font-mono">public/audio/*.mp3</code> บน GitHub
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGithubModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-neutral-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {syncStatusMsg && (
              <div className="bg-emerald-950/90 border border-emerald-600 text-emerald-200 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{syncStatusMsg}</span>
              </div>
            )}

            <div className="space-y-3">
              <label className="block text-xs font-bold text-neutral-300">
                GitHub Repository หรือ URL (สาขา main / master)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customRepoInput}
                  onChange={(e) => setCustomRepoInput(e.target.value)}
                  placeholder="เช่น yupadee2535/triplets-band-website หรือ full GitHub URL"
                  className="flex-1 bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>
              <p className="text-[11px] text-neutral-400">
                💡 รูปแบบไฟล์ที่รองรับ: <span className="text-neutral-300 font-mono">01.mp3, 02.mp3, ..., 10.mp3</span> ในโฟลเดอร์ <span className="text-amber-400 font-mono">public/audio/</span>
              </p>
            </div>

            {/* Quick Action Button */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  applyGithubAudioToAllSongs(customRepoInput);
                  setSyncStatusMsg('✅ เชื่อมต่อและดึงไฟล์เสียง MP3 ทั้ง 10 เพลงจาก GitHub สำเร็จแล้ว!');
                  setTimeout(() => setSyncStatusMsg(null), 4000);
                }}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-950 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>ซิงค์ดึงเพลงทั้ง 10 เพลงจาก GitHub ทันที</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  // Test play active track
                  const active = songs.find(s => s.id === currentTrackId) || songs[0];
                  if (active) {
                    const { rawUrl } = generateGitHubAudioUrls(customRepoInput, active.trackNumber || 1);
                    editSong(active.id, { audioUrl: rawUrl });
                    playTrack(active.id);
                    setSyncStatusMsg(`🎵 กำลังทดสอบสตรีมเพลง "${active.titleThai}" จาก GitHub...`);
                    setTimeout(() => setSyncStatusMsg(null), 3500);
                  }
                }}
                className="bg-neutral-800 hover:bg-neutral-700 text-cyan-300 border border-neutral-600 hover:border-cyan-500 font-bold py-2.5 px-4 rounded-xl text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Play className="w-4 h-4 text-cyan-400" />
                <span>ทดสอบเล่นเพลงนี้</span>
              </button>
            </div>

            {/* Preview of Track URLs */}
            <div className="pt-2">
              <h4 className="text-xs font-bold text-neutral-400 mb-2">ตัวอย่างลิงก์ไฟล์เสียงที่จะดึงจาก GitHub:</h4>
              <div className="bg-neutral-950 rounded-xl p-3 max-h-36 overflow-y-auto space-y-1.5 text-xs font-mono border border-neutral-800">
                {songs.map((song, i) => {
                  const { rawUrl } = generateGitHubAudioUrls(customRepoInput, song.trackNumber || (i + 1));
                  return (
                    <div key={song.id} className="flex items-center justify-between text-neutral-400 hover:text-white py-0.5">
                      <span className="truncate max-w-[200px] sm:max-w-[240px]">
                        {song.trackNumber || (i + 1)}. {song.titleThai}
                      </span>
                      <a
                        href={rawUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-rose-400 hover:text-rose-300 flex items-center gap-1 text-[11px]"
                      >
                        <span>เปิดไฟล์ MP3</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setIsGithubModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                เสร็จสิ้น / ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* YouTube MV URL Management Modal */}
      {isMvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-neutral-900 border border-neutral-700 rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl space-y-5 text-neutral-200 max-h-[92vh] flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-red-950/90 border border-red-700/80 flex items-center justify-center text-red-500 shadow-lg shadow-red-950/60">
                  <Youtube className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    จัดการลิงก์ YouTube MV ของวง
                    <span className="text-xs bg-red-950 text-red-300 border border-red-800 px-2 py-0.5 rounded-full font-mono">
                      ง่าย & รวดเร็ว
                    </span>
                  </h3>
                  <p className="text-xs text-neutral-400">
                    ใส่ URL หรือลิงก์ YouTube MV เพลงของวง Kungnoi Y. ได้ครบทุกเพลงในหน้าเดียว
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMvModalOpen(false)}
                className="text-neutral-400 hover:text-white p-2 rounded-xl hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Success alert message */}
            {mvSaveSuccessMsg && (
              <div className="bg-emerald-950/90 border border-emerald-600 text-emerald-200 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2 animate-fadeIn shrink-0 shadow-lg">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold">{mvSaveSuccessMsg}</span>
              </div>
            )}

            {/* Tabs Navigation */}
            <div className="flex items-center gap-1.5 p-1 bg-neutral-950 rounded-2xl border border-neutral-800 shrink-0">
              <button
                type="button"
                onClick={() => setMvModalTab('batch')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mvModalTab === 'batch'
                    ? 'bg-red-600 text-white shadow-md shadow-red-950'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <ListOrdered className="w-3.5 h-3.5" />
                <span>ตารางครบ 10 เพลง (แนะนำ)</span>
              </button>

              <button
                type="button"
                onClick={() => setMvModalTab('multiline')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mvModalTab === 'multiline'
                    ? 'bg-red-600 text-white shadow-md shadow-red-950'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>วางรวมหลายบรรทัด</span>
              </button>

              <button
                type="button"
                onClick={() => setMvModalTab('single')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mvModalTab === 'single'
                    ? 'bg-red-600 text-white shadow-md shadow-red-950'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>ตั้งค่าทีละเพลง</span>
              </button>
            </div>

            {/* Modal Body Scroll Area */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-neutral-800">
              
              {/* TAB 1: BATCH ALL 10 SONGS (DEFAULT & EASIEST) */}
              {mvModalTab === 'batch' && (
                <div className="space-y-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-neutral-950/60 p-3 rounded-2xl border border-neutral-800/80">
                    <div className="text-xs text-neutral-300">
                      <span>สถานะ: </span>
                      <strong className="text-red-400 font-mono">
                        {songs.filter((s) => (batchUrlsInput[s.id] || '').trim().length > 0).length} / {songs.length} เพลง
                      </strong>
                      <span className="text-neutral-500 ml-2">(วางลิงก์ในช่องของแต่ละเพลงได้เลย)</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleClearAllBatchUrls}
                        className="text-[11px] text-neutral-400 hover:text-red-400 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>ล้างทุกลิงก์</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {songs.map((song) => {
                      const currentVal = batchUrlsInput[song.id] || '';
                      const videoId = getYouTubeVideoId(currentVal);
                      const thumb = videoId ? `https://img.youtube.com/vi/${videoId}/default.jpg` : null;

                      return (
                        <div
                          key={song.id}
                          className="bg-neutral-950/70 hover:bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-2xl p-3 space-y-2 transition-all"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-7 h-7 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-xs font-mono font-bold text-amber-400 shrink-0">
                                {String(song.trackNumber).padStart(2, '0')}
                              </span>
                              <span className="text-xs font-bold text-white truncate">
                                {song.titleThai}
                              </span>
                              <span className="text-[11px] text-neutral-500 font-mono truncate hidden sm:inline">
                                ({song.titleEng})
                              </span>
                            </div>

                            {/* Status badge */}
                            {videoId ? (
                              <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full font-mono shrink-0">
                                ✓ พร้อมเล่น
                              </span>
                            ) : currentVal.trim() ? (
                              <span className="text-[10px] bg-amber-950 text-amber-400 border border-amber-800 px-2 py-0.5 rounded-full font-mono shrink-0">
                                ⚠️ รูปแบบลิงก์
                              </span>
                            ) : (
                              <span className="text-[10px] text-neutral-500 font-mono shrink-0">
                                (ยังไม่ใส่)
                              </span>
                            )}
                          </div>

                          {/* URL Input field */}
                          <div className="flex items-center gap-2">
                            {thumb && (
                              <img
                                src={thumb}
                                alt="thumb"
                                className="w-10 h-7 object-cover rounded-lg border border-neutral-800 shrink-0"
                                referrerPolicy="no-referrer"
                              />
                            )}
                            <input
                              type="text"
                              value={currentVal}
                              onChange={(e) => {
                                const val = e.target.value;
                                setBatchUrlsInput((prev) => ({ ...prev, [song.id]: val }));
                              }}
                              placeholder={`วางลิงก์ YouTube MV เพลง ${song.titleThai}...`}
                              className="flex-1 bg-neutral-900 border border-neutral-700/80 focus:border-red-500 rounded-xl px-3 py-1.5 text-xs text-white placeholder-neutral-500 font-mono focus:outline-none"
                            />
                            {currentVal.trim() && (
                              <button
                                type="button"
                                onClick={() => {
                                  setBatchUrlsInput((prev) => ({ ...prev, [song.id]: '' }));
                                }}
                                className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer shrink-0"
                                title="ล้างลิงก์เพลงนี้"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {videoId && (
                              <button
                                type="button"
                                onClick={() => {
                                  // Save this song and switch to it in MV mode
                                  editSong(song.id, {
                                    youtubeUrl: currentVal.trim(),
                                    youtubeUrls: [currentVal.trim()],
                                  });
                                  setCurrentTrackId(song.id);
                                  setVisualMode('mv');
                                  setIsMvModalOpen(false);
                                }}
                                className="px-2 py-1 bg-red-950 hover:bg-red-900 border border-red-800 text-red-300 hover:text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                                title="บันทึกและเปิดเล่นเพลงนี้ทันที"
                              >
                                <Play className="w-3 h-3" />
                                <span className="hidden sm:inline">เล่น</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: MULTI-LINE PASTE */}
              {mvModalTab === 'multiline' && (
                <div className="space-y-4">
                  <div className="bg-neutral-950/80 rounded-2xl p-3.5 border border-neutral-800 space-y-2">
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>วางลิงก์ YouTube หลายบรรทัดพร้อมกัน (1 บรรทัด = 1 เพลง)</span>
                    </h4>
                    <p className="text-xs text-neutral-400">
                      คัดลอกลิงก์ YouTube เรียงตามลำดับแทร็ก 1 ถึง {songs.length} แล้วกดวางด้านล่าง ระบบจะจัดใส่ให้ครบทุกเพลงอัตโนมัติ
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-neutral-400">
                      <label className="font-bold text-neutral-300">
                        กล่องข้อความสำหรับวางลิงก์:
                      </label>
                      <span className="font-mono">
                        {multilineMvInput.split('\n').filter((l) => l.trim()).length} บรรทัด
                      </span>
                    </div>

                    <textarea
                      rows={10}
                      value={multilineMvInput}
                      onChange={(e) => setMultilineMvInput(e.target.value)}
                      placeholder={`https://www.youtube.com/watch?v=... (เพลงที่ 1: ${songs[0]?.titleThai})\nhttps://www.youtube.com/watch?v=... (เพลงที่ 2: ${songs[1]?.titleThai})\nhttps://www.youtube.com/watch?v=... (เพลงที่ 3: ${songs[2]?.titleThai})\n...`}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-2xl p-3.5 text-xs text-white placeholder-neutral-600 font-mono focus:outline-none focus:border-red-500 leading-relaxed resize-y"
                    />
                  </div>

                  <div className="bg-neutral-950 rounded-2xl p-3 text-[11px] text-neutral-400 border border-neutral-800 space-y-1">
                    <div className="font-bold text-amber-400">ตัวอย่างลำดับเพลง:</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 font-mono text-[10px] text-neutral-500">
                      {songs.map((s, i) => (
                        <div key={s.id} className="truncate">
                          บรรทัดที่ {i + 1} ➔ แทร็ก {s.trackNumber}: {s.titleThai}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyMultilineToBatch}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold transition-all shadow-xl shadow-red-950 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>🚀 จัดใส่เพลงที่ 1 ถึง {songs.length} และบันทึกทันที</span>
                  </button>
                </div>
              )}

              {/* TAB 3: SINGLE SONG DETAILED SEQUENCER */}
              {mvModalTab === 'single' && (
                <div className="space-y-4">
                  {/* Song Selector */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-neutral-300">
                      เลือกเพลงที่ต้องการใส่ / แก้ไขลิงก์ MV:
                    </label>
                    <select
                      value={mvEditSongId}
                      onChange={(e) => handleSelectMvEditSong(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-500 font-sans cursor-pointer"
                    >
                      {songs.map((song) => (
                        <option key={song.id} value={song.id}>
                          แทร็ก {song.trackNumber}: {song.titleThai} ({song.titleEng})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* URL Input Fields */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-neutral-300">
                        ลิงก์ YouTube (URL):
                      </label>
                      <span className="text-[11px] text-neutral-400 font-mono">
                        {mvUrlsInput.filter((u) => u.trim()).length}/10 ลิงก์
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {mvUrlsInput.map((url, idx) => {
                        const videoId = getYouTubeVideoId(url);
                        const thumb = videoId ? `https://img.youtube.com/vi/${videoId}/default.jpg` : null;

                        return (
                          <div key={idx} className="space-y-1.5 bg-neutral-950/60 p-2.5 rounded-xl border border-neutral-800">
                            <div className="flex items-center gap-2">
                              <span className="w-6 text-center text-xs font-mono font-bold text-neutral-400">
                                #{idx + 1}
                              </span>
                              <input
                                type="text"
                                value={url}
                                onChange={(e) => handleUpdateMvUrlField(idx, e.target.value)}
                                placeholder="เช่น https://www.youtube.com/watch?v=... หรือ https://youtu.be/..."
                                className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 font-mono"
                              />
                              {mvUrlsInput.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMvUrlField(idx)}
                                  className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                                  title="ลบช่องนี้"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            {/* Video validation & thumbnail preview */}
                            {videoId ? (
                              <div className="flex items-center gap-2 text-[11px] text-emerald-400 pl-8">
                                {thumb && (
                                  <img
                                    src={thumb}
                                    alt="preview"
                                    className="w-10 h-7 object-cover rounded border border-neutral-700"
                                    referrerPolicy="no-referrer"
                                  />
                                )}
                                <span className="font-mono">✓ ตรวจพบ Video ID: <code className="text-white font-bold">{videoId}</code></span>
                              </div>
                            ) : url.trim().length > 0 ? (
                              <p className="text-[11px] text-amber-400 pl-8 font-mono">
                                ⚠️ ไม่พบ Video ID ในรูปแบบ URL นี้ (กรุณาใช้ลิงก์ YouTube ปกติ เช่น https://youtu.be/...)
                              </p>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>

                    {mvUrlsInput.length < 10 && (
                      <button
                        type="button"
                        onClick={handleAddMvUrlField}
                        className="text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border border-neutral-700"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>เพิ่มลิงก์วิดีโอลำดับถัดไป (เล่นต่อกัน)</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Quick guide format info */}
            <div className="bg-neutral-950 rounded-2xl p-3 text-[11px] text-neutral-400 border border-neutral-800 font-mono shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-neutral-300">💡 รูปแบบ:</span>
                <span><code>https://www.youtube.com/watch?v=...</code> หรือ <code>https://youtu.be/...</code></span>
              </div>
              <div className="text-[10px] text-amber-300">
                💾 ข้อมูลจะถูกบันทึกในเบราว์เซอร์อัตโนมัติ
              </div>
            </div>

            {/* Action Buttons Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-neutral-800 shrink-0">
              <button
                type="button"
                onClick={() => setIsMvModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>

              {mvModalTab === 'batch' ? (
                <button
                  type="button"
                  onClick={handleSaveBatchMvUrls}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-red-950 cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>บันทึกทุกลิงก์พร้อมกัน (Save All)</span>
                </button>
              ) : mvModalTab === 'single' ? (
                <button
                  type="button"
                  onClick={handleSaveMvUrls}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-red-950 cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>บันทึกเพลงนี้</span>
                </button>
              ) : null}
            </div>

          </div>
        </div>
      )}

    </section>
  );
};
