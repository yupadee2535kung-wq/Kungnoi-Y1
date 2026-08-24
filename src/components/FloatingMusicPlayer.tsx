import React, { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Disc, Music, Repeat, Repeat1, Shuffle, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';
import { useSongs } from '../context/SongContext';

interface FloatingMusicPlayerProps {
  currentTrackId?: string;
  onSelectTrack?: (songId: string) => void;
  onNavigateMusic: () => void;
}

export const FloatingMusicPlayer: React.FC<FloatingMusicPlayerProps> = ({
  currentTrackId: propCurrentTrackId,
  onSelectTrack: propOnSelectTrack,
  onNavigateMusic
}) => {
  const {
    songs,
    currentTrackId: contextTrackId,
    setCurrentTrackId,
    isPlaying,
    currentTime,
    duration,
    repeatMode,
    isShuffle,
    togglePlayPause,
    playNext,
    playPrev,
    toggleRepeatMode,
    toggleShuffle,
    seek,
  } = useSongs();

  const [isMinimized, setIsMinimized] = useState(false);

  const currentTrackId = propCurrentTrackId || contextTrackId;
  const onSelectTrack = (id: string) => {
    if (propOnSelectTrack) {
      propOnSelectTrack(id);
    }
    setCurrentTrackId(id);
  };

  const activeSong = songs.find(s => s.id === currentTrackId) || songs[0] || {
    id: 'fallback',
    trackNumber: 1,
    titleThai: 'ไม่มีเพลง',
    titleEng: 'No Songs',
    duration: '0:00',
    durationSeconds: 0,
    story: '',
    lyrics: [],
    audioParams: { bpm: 120, key: 'C', style: 'melancholic_rock' as const, rootNote: 60 }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-2 sm:px-6 pb-3 pointer-events-none transition-all duration-300">
      
      {/* Minimized Floating Pill View */}
      {isMinimized ? (
        <div className="max-w-md mx-auto flex items-center justify-between gap-3 bg-neutral-950/95 border border-red-500/30 hover:border-red-500/60 rounded-full py-2 px-4 shadow-2xl backdrop-blur-xl pointer-events-auto text-white transition-all transform hover:-translate-y-0.5">
          <div 
            onClick={onNavigateMusic}
            className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
          >
            <div className={`w-7 h-7 rounded-full bg-red-950/80 border border-red-800/80 flex items-center justify-center shrink-0 ${isPlaying ? 'animate-spin' : ''}`}>
              <Disc className="w-4 h-4 text-red-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate text-white">
                {activeSong.titleThai}
              </p>
              <p className="text-[10px] text-neutral-400 font-mono truncate">
                Kungnoi Y. • {formatTime(currentTime)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => {
                onSelectTrack(activeSong.id);
                togglePlayPause(activeSong.id);
              }}
              className="p-2 rounded-full bg-red-600 hover:bg-red-500 text-white shadow transition-transform transform hover:scale-105 cursor-pointer"
              title={isPlaying ? 'หยุดชั่วคราว' : 'เล่น'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
            </button>

            <button
              onClick={() => setIsMinimized(false)}
              className="flex items-center gap-1 text-[11px] font-bold text-amber-200/90 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 px-2.5 py-1.5 rounded-full transition-all cursor-pointer"
              title="แสดงแถบเครื่องเล่นเพลงเต็ม"
            >
              <ChevronUp className="w-3.5 h-3.5" />
              <span>แสดงแถบ</span>
            </button>
          </div>
        </div>
      ) : (
        /* Full Expanded Player Bar */
        <div className="max-w-4xl mx-auto bg-neutral-950/95 border border-neutral-800 hover:border-neutral-700 rounded-2xl shadow-2xl backdrop-blur-xl pointer-events-auto overflow-hidden text-white transition-all">
          
          {/* Interactive Slim Timeline Bar */}
          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickPos = (e.clientX - rect.left) / rect.width;
              seek(clickPos * duration);
            }}
            className="w-full h-1 bg-neutral-800 cursor-pointer relative group"
            title="คลิกเพื่อเลื่อนตำแหน่งเวลา"
          >
            <div
              className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-400 relative transition-all duration-75"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow transition-opacity"></div>
            </div>
          </div>

          {/* Compact Bar View */}
          <div className="p-3 flex items-center justify-between gap-3">
            
            {/* Song Info */}
            <div className="flex items-center gap-3 min-w-0 cursor-pointer" onClick={onNavigateMusic}>
              <div className={`w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0 relative overflow-hidden ${isPlaying ? 'animate-pulse' : ''}`}>
                <Disc className={`w-6 h-6 text-red-500 ${isPlaying ? 'animate-spin' : ''}`} />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-xs sm:text-sm truncate flex items-center gap-1.5">
                  <span className="text-white">{activeSong.titleThai}</span>
                  <span className="text-[10px] text-amber-300 font-mono bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-800/60 hidden sm:inline">
                    #{activeSong.trackNumber}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 font-mono truncate flex items-center gap-2">
                  <span>Kungnoi Y. • {formatTime(currentTime)} / {activeSong.duration}</span>
                  <span className="text-[10px] text-neutral-500 hidden sm:inline">
                    {repeatMode === 'all' && '🔁 วนทั้งอัลบั้ม'}
                    {repeatMode === 'one' && '🔂 วนเพลงเดียว'}
                    {repeatMode === 'off' && '➡️ เล่นต่อเนื่อง'}
                    {isShuffle && ' • 🔀 สุ่ม'}
                  </span>
                </p>
              </div>
            </div>

            {/* Quick Playback Controls */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Shuffle Button */}
              <button
                type="button"
                onClick={toggleShuffle}
                className={`p-2 rounded-lg transition-colors cursor-pointer hidden sm:block ${
                  isShuffle ? 'text-red-400 bg-red-950/80' : 'text-neutral-400 hover:text-white'
                }`}
                title={isShuffle ? 'สุ่มเพลง: เปิดอยู่' : 'สุ่มเพลง: ปิดอยู่'}
              >
                <Shuffle className="w-3.5 h-3.5" />
              </button>

              {/* Repeat Mode Button */}
              <button
                type="button"
                onClick={toggleRepeatMode}
                className={`p-2 rounded-lg transition-colors cursor-pointer hidden sm:block ${
                  repeatMode !== 'off' ? 'text-red-400 bg-red-950/80' : 'text-neutral-400 hover:text-white'
                }`}
                title={
                  repeatMode === 'all'
                    ? 'เล่นวนทั้งอัลบั้ม'
                    : repeatMode === 'one'
                    ? 'เล่นวนซ้ำเพลงเดียว'
                    : 'เล่นต่อเนื่องตามลำดับ'
                }
              >
                {repeatMode === 'one' ? <Repeat1 className="w-3.5 h-3.5 text-red-400" /> : <Repeat className="w-3.5 h-3.5" />}
              </button>

              {/* Previous Track */}
              <button
                onClick={playPrev}
                className="p-2 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title="เพลงก่อนหน้า"
              >
                <SkipBack className="w-4 h-4 fill-current" />
              </button>

              {/* Play / Pause Main Button */}
              <button
                onClick={() => {
                  onSelectTrack(activeSong.id);
                  togglePlayPause(activeSong.id);
                }}
                className="p-2.5 sm:p-3 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-950 transition-all cursor-pointer hover:scale-105 active:scale-95"
                title={isPlaying ? 'หยุดชั่วคราว' : 'เล่น'}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>

              {/* Next Track */}
              <button
                onClick={playNext}
                className="p-2 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title="เพลงถัดไป"
              >
                <SkipForward className="w-4 h-4 fill-current" />
              </button>

              {/* Full Lyrics View Shortcut */}
              <button
                onClick={onNavigateMusic}
                className="p-2 text-neutral-400 hover:text-white transition-colors cursor-pointer hidden md:block"
                title="ดูเนื้อเพลงและรายละเอียดเพลง"
              >
                <Music className="w-4 h-4" />
              </button>

              {/* Hide Bar / Minimize Button */}
              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                className="flex items-center gap-1 text-[11px] font-semibold text-neutral-400 hover:text-amber-200 bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 px-2 sm:px-2.5 py-1.5 rounded-xl transition-all cursor-pointer ml-1"
                title="ซ่อนแถบเครื่องเล่นเพลง"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ซ่อนแถบ</span>
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
