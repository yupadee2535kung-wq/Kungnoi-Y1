import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Song } from '../types';
import { SONGS as DEFAULT_SONGS, BAND_INFO } from '../data/bandData';
import { audioSynth, GITHUB_AUDIO_BASE_KEY, generateGitHubAudioUrls, normalizeAudioUrl } from '../utils/audioSynth';

const SONGS_STORAGE_KEY = 'triplets_custom_songs_v10';
const ADMIN_STORAGE_KEY = 'triplets_admin_logged_in_v1';
const BOOKING_STORAGE_KEY = 'triplets_booking_contact_v1';
const REPEAT_STORAGE_KEY = 'triplets_repeat_mode_v1';
const SHUFFLE_STORAGE_KEY = 'triplets_shuffle_mode_v1';
export const ADMIN_CORRECT_PIN = '123456';

export type RepeatMode = 'all' | 'one' | 'off';

export interface BookingContactInfo {
  title: string;
  phone: string;
  email: string;
  line: string;
}

const DEFAULT_BOOKING_CONTACT: BookingContactInfo = {
  title: 'ติดต่องานแสดง & สปอนเซอร์',
  phone: BAND_INFO.bookingContact.phone,
  email: BAND_INFO.bookingContact.email,
  line: BAND_INFO.bookingContact.line,
};

interface SongContextType {
  songs: Song[];
  isAdmin: boolean;
  adminPinError: string | null;
  loginAdmin: (pin: string) => boolean;
  logoutAdmin: () => void;
  addSong: (newSongData: Omit<Song, 'id' | 'trackNumber'>) => Song;
  editSong: (songId: string, updatedData: Partial<Song>) => void;
  deleteSong: (songId: string) => boolean;
  resetSongs: () => void;

  // GitHub Audio Sync
  githubAudioRepo: string;
  setGithubAudioRepo: (repo: string) => void;
  applyGithubAudioToAllSongs: (repo: string) => void;

  // Booking contact management
  bookingContact: BookingContactInfo;
  updateBookingContact: (updated: Partial<BookingContactInfo>) => void;
  resetBookingContact: () => void;
  
  // Modals management
  isAdminModalOpen: boolean;
  openAdminModal: () => void;
  closeAdminModal: () => void;
  
  isSongEditorOpen: boolean;
  editingSong: Song | null;
  openSongEditor: (songToEdit?: Song) => void;
  closeSongEditor: () => void;

  // Audio Playback & Loop / Continuous State
  currentTrackId: string;
  setCurrentTrackId: (id: string) => void;
  isPlaying: boolean;
  isUsingRealAudio: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  repeatMode: RepeatMode;
  isShuffle: boolean;
  frequencies: number[];

  // Audio Playback Actions
  playTrack: (songId?: string) => void;
  pauseTrack: () => void;
  togglePlayPause: (songId?: string) => void;
  playNext: () => void;
  playPrev: () => void;
  toggleRepeatMode: () => void;
  setRepeatMode: (mode: RepeatMode) => void;
  toggleShuffle: () => void;
  seek: (seconds: number) => void;
  setVolume: (vol: number) => void;
  uploadSongAudio: (songId: string, file: Blob) => Promise<boolean>;
  playTestSound: () => void;
  resumeAudio: () => void;
}

const SongContext = createContext<SongContextType | undefined>(undefined);

export const SongProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [songs, setSongs] = useState<Song[]>(() => {
    try {
      const saved = localStorage.getItem(SONGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse saved songs:', e);
    }
    return DEFAULT_SONGS;
  });

  const [bookingContact, setBookingContact] = useState<BookingContactInfo>(() => {
    try {
      const saved = localStorage.getItem(BOOKING_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return { ...DEFAULT_BOOKING_CONTACT, ...parsed };
        }
      }
    } catch (e) {
      console.error('Failed to parse saved booking contact:', e);
    }
    return DEFAULT_BOOKING_CONTACT;
  });

  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      return localStorage.getItem(ADMIN_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [adminPinError, setAdminPinError] = useState<string | null>(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isSongEditorOpen, setIsSongEditorOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);

  // Audio Player State
  const [currentTrackId, setCurrentTrackId] = useState<string>(() => songs[0]?.id || 'song-1');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUsingRealAudio, setIsUsingRealAudio] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(268);
  const [volume, setVolumeState] = useState(0.8);
  const [frequencies, setFrequencies] = useState<number[]>(Array(16).fill(12));

  // Loop & Continuous Playback Modes
  const [repeatMode, setRepeatModeState] = useState<RepeatMode>(() => {
    try {
      const saved = localStorage.getItem(REPEAT_STORAGE_KEY) as RepeatMode;
      if (saved === 'all' || saved === 'one' || saved === 'off') {
        return saved;
      }
    } catch {}
    return 'all'; // Default: loop all album continuously
  });

  const [isShuffle, setIsShuffle] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SHUFFLE_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // State refs to ensure async audio events always have fresh state
  const songsRef = useRef(songs);
  songsRef.current = songs;

  const currentTrackIdRef = useRef(currentTrackId);
  currentTrackIdRef.current = currentTrackId;

  const repeatModeRef = useRef(repeatMode);
  repeatModeRef.current = repeatMode;

  const isShuffleRef = useRef(isShuffle);
  isShuffleRef.current = isShuffle;

  // Sync state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SONGS_STORAGE_KEY, JSON.stringify(songs));
    } catch (e) {
      console.error('Failed to save songs to localStorage:', e);
    }
  }, [songs]);

  useEffect(() => {
    try {
      localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(bookingContact));
    } catch (e) {
      console.error('Failed to save booking contact to localStorage:', e);
    }
  }, [bookingContact]);

  useEffect(() => {
    try {
      localStorage.setItem(ADMIN_STORAGE_KEY, String(isAdmin));
    } catch (e) {
      console.error('Failed to save admin state:', e);
    }
  }, [isAdmin]);

  useEffect(() => {
    try {
      localStorage.setItem(REPEAT_STORAGE_KEY, repeatMode);
    } catch {}
  }, [repeatMode]);

  useEffect(() => {
    try {
      localStorage.setItem(SHUFFLE_STORAGE_KEY, String(isShuffle));
    } catch {}
  }, [isShuffle]);

  const [githubAudioRepo, setGithubAudioRepoState] = useState<string>(() => {
    try {
      return localStorage.getItem(GITHUB_AUDIO_BASE_KEY) || '';
    } catch {
      return '';
    }
  });

  const setGithubAudioRepo = (repo: string) => {
    setGithubAudioRepoState(repo);
    try {
      if (repo.trim()) {
        localStorage.setItem(GITHUB_AUDIO_BASE_KEY, repo.trim());
      } else {
        localStorage.removeItem(GITHUB_AUDIO_BASE_KEY);
      }
    } catch {}
  };

  const applyGithubAudioToAllSongs = (repoInput: string) => {
    const trimmed = repoInput.trim();
    if (!trimmed) return;

    setGithubAudioRepo(trimmed);

    setSongs(prev => {
      return prev.map((song, idx) => {
        const trackNum = song.trackNumber || (idx + 1);
        const { rawUrl } = generateGitHubAudioUrls(trimmed, trackNum);
        return {
          ...song,
          audioUrl: rawUrl,
        };
      });
    });

    // If currently playing, restart active song with new GitHub URL
    const active = songsRef.current.find(s => s.id === currentTrackIdRef.current);
    if (active && isPlaying) {
      const { rawUrl } = generateGitHubAudioUrls(trimmed, active.trackNumber || 1);
      audioSynth.playTrack(
        active.id,
        active.durationSeconds,
        active.audioParams?.rootNote || 58,
        active.audioParams?.bpm || 108,
        active.audioParams?.style || 'rnb_pop',
        rawUrl,
        active.trackNumber
      );
    }
  };

  // Add real audio upload helper
  const uploadSongAudio = async (songId: string, file: Blob): Promise<boolean> => {
    try {
      const { storeAudioBlob } = await import('../utils/audioStorage');
      const idbUrl = await storeAudioBlob(songId, file);
      editSong(songId, { audioUrl: idbUrl });
      
      // If currently selected or playing this song, play the real audio immediately
      if (currentTrackId === songId) {
        const target = songsRef.current.find(s => s.id === songId);
        if (target) {
          audioSynth.playTrack(
            target.id,
            target.durationSeconds,
            target.audioParams?.rootNote || 58,
            target.audioParams?.bpm || 108,
            target.audioParams?.style || 'rnb_pop',
            idbUrl,
            target.trackNumber
          );
        }
      }
      return true;
    } catch (e) {
      console.error('Failed to upload song audio:', e);
      return false;
    }
  };

  // Subscribe to audio engine updates & visualizer at 60fps
  useEffect(() => {
    const unsubscribe = audioSynth.subscribe(() => {
      const state = audioSynth.getState();
      setIsPlaying(state.isPlaying);
      setIsUsingRealAudio(Boolean(state.isUsingRealAudio));
      setCurrentTime(state.currentTime);
      setDuration(state.duration);
      setVolumeState(state.volume);
    });

    let animFrameId: number;
    const updateSpectrum = () => {
      if (audioSynth.getState().isPlaying) {
        setFrequencies(audioSynth.getFrequencyData());
      } else {
        setFrequencies(Array(16).fill(10));
      }
      animFrameId = requestAnimationFrame(updateSpectrum);
    };
    animFrameId = requestAnimationFrame(updateSpectrum);

    return () => {
      unsubscribe();
      cancelAnimationFrame(animFrameId);
    };
  }, []);

  // Internal Play Track by ID
  const playTrackById = (songId: string) => {
    const list = songsRef.current;
    const target = list.find(s => s.id === songId) || list[0];
    if (!target) return;

    setCurrentTrackId(target.id);
    audioSynth.playTrack(
      target.id,
      target.durationSeconds,
      target.audioParams?.rootNote || 58,
      target.audioParams?.bpm || 108,
      target.audioParams?.style || 'rnb_pop',
      target.audioUrl,
      target.trackNumber
    );
  };

  // Continuous Playback & Track Ended Handler
  useEffect(() => {
    const handleTrackEnded = () => {
      const list = songsRef.current;
      if (list.length === 0) return;

      const mode = repeatModeRef.current;
      const shuffle = isShuffleRef.current;
      const currentId = currentTrackIdRef.current;
      const currentIdx = list.findIndex(s => s.id === currentId);

      // 1. Loop One Song (เล่นวนซ้ำเพลงเดิม)
      if (mode === 'one') {
        const currentSong = currentIdx >= 0 ? list[currentIdx] : list[0];
        audioSynth.seek(0);
        audioSynth.playTrack(
          currentSong.id,
          currentSong.durationSeconds,
          currentSong.audioParams?.rootNote || 57,
          currentSong.audioParams?.bpm || 118,
          currentSong.audioParams?.style || 'melancholic_rock',
          currentSong.audioUrl
        );
        return;
      }

      // 2. Shuffle mode (สุ่มเพลงถัดไป)
      if (shuffle && list.length > 1) {
        const otherIndices = list.map((_, i) => i).filter(i => i !== currentIdx);
        const randomIdx = otherIndices[Math.floor(Math.random() * otherIndices.length)];
        playTrackById(list[randomIdx].id);
        return;
      }

      // 3. Continuous Playback (เล่นต่อเนื่องตามลำดับ)
      const nextIdx = currentIdx + 1;
      if (nextIdx < list.length) {
        // Play next song in album
        playTrackById(list[nextIdx].id);
      } else {
        // Reached end of album
        if (mode === 'all') {
          // Loop all album (วนกลับมาเล่นเพลงแรก)
          playTrackById(list[0].id);
        } else {
          // Mode is 'off' -> Stop at the end of album
          audioSynth.pause();
          audioSynth.seek(0);
        }
      }
    };

    audioSynth.setOnEndedCallback(handleTrackEnded);

    return () => {
      audioSynth.setOnEndedCallback(null);
    };
  }, []);

  // Public Playback Control Methods
  const playTrack = (songId?: string) => {
    const targetId = songId || currentTrackId;
    playTrackById(targetId);
  };

  const pauseTrack = () => {
    audioSynth.pause();
  };

  const togglePlayPause = (songId?: string) => {
    const targetId = songId || currentTrackId;
    const target = songsRef.current.find(s => s.id === targetId) || songsRef.current[0];
    if (!target) return;

    if (isPlaying && currentTrackId === targetId) {
      audioSynth.pause();
    } else {
      playTrackById(target.id);
    }
  };

  const playNext = () => {
    if (songs.length === 0) return;
    const currentIdx = songs.findIndex(s => s.id === currentTrackId);
    
    if (isShuffle && songs.length > 1) {
      const otherIndices = songs.map((_, i) => i).filter(i => i !== currentIdx);
      const randomIdx = otherIndices[Math.floor(Math.random() * otherIndices.length)];
      playTrackById(songs[randomIdx].id);
    } else {
      const nextIdx = (currentIdx + 1) % songs.length;
      playTrackById(songs[nextIdx].id);
    }
  };

  const playPrev = () => {
    if (songs.length === 0) return;
    const state = audioSynth.getState();
    if (state.currentTime > 3) {
      audioSynth.seek(0);
      return;
    }
    const currentIdx = songs.findIndex(s => s.id === currentTrackId);
    const prevIdx = (currentIdx - 1 + songs.length) % songs.length;
    playTrackById(songs[prevIdx].id);
  };

  const toggleRepeatMode = () => {
    setRepeatModeState(prev => {
      if (prev === 'all') return 'one';
      if (prev === 'one') return 'off';
      return 'all';
    });
  };

  const setRepeatMode = (mode: RepeatMode) => {
    setRepeatModeState(mode);
  };

  const toggleShuffle = () => {
    setIsShuffle(prev => !prev);
  };

  const seek = (seconds: number) => {
    audioSynth.seek(seconds);
  };

  const setVolume = (vol: number) => {
    audioSynth.setVolume(vol);
  };

  const playTestSound = () => {
    audioSynth.playTestChime();
  };

  const resumeAudio = () => {
    audioSynth.initContextSync();
  };

  const updateBookingContact = (updated: Partial<BookingContactInfo>) => {
    setBookingContact(prev => ({ ...prev, ...updated }));
  };

  const resetBookingContact = () => {
    setBookingContact(DEFAULT_BOOKING_CONTACT);
    localStorage.removeItem(BOOKING_STORAGE_KEY);
  };

  const loginAdmin = (pin: string): boolean => {
    if (pin.trim() === ADMIN_CORRECT_PIN) {
      setIsAdmin(true);
      setAdminPinError(null);
      setIsAdminModalOpen(false);
      return true;
    } else {
      setAdminPinError('รหัสผ่านไม่ถูกต้อง! กรุณาลองใหม่อีกครั้ง');
      return false;
    }
  };

  const logoutAdmin = () => {
    setIsAdmin(false);
    localStorage.removeItem(ADMIN_STORAGE_KEY);
  };

  const addSong = (newSongData: Omit<Song, 'id' | 'trackNumber'>): Song => {
    const nextId = `song-custom-${Date.now()}`;
    const nextTrackNum = songs.length + 1;
    
    const newSong: Song = {
      ...newSongData,
      id: nextId,
      trackNumber: nextTrackNum,
    };

    setSongs(prev => [...prev, newSong]);
    return newSong;
  };

  const editSong = (songId: string, updatedData: Partial<Song>) => {
    setSongs(prev =>
      prev.map(song => (song.id === songId ? { ...song, ...updatedData } : song))
    );
  };

  const deleteSong = (songId: string): boolean => {
    if (songs.length <= 1) {
      alert('ไม่สามารถลบเพลงทั้งหมดได้ ต้องมีอย่างน้อย 1 เพลงในระบบ');
      return false;
    }

    setSongs(prev => {
      const filtered = prev.filter(s => s.id !== songId);
      return filtered.map((song, idx) => ({ ...song, trackNumber: idx + 1 }));
    });
    return true;
  };

  const resetSongs = () => {
    if (window.confirm('คุณต้องการรีเซ็ตรายชื่อเพลงและเนื้อเพลงกลับเป็นค่าเริ่มต้นทั้งหมดใช่หรือไม่?')) {
      setSongs(DEFAULT_SONGS);
      localStorage.removeItem(SONGS_STORAGE_KEY);
    }
  };

  const openAdminModal = () => {
    setAdminPinError(null);
    setIsAdminModalOpen(true);
  };

  const closeAdminModal = () => {
    setIsAdminModalOpen(false);
    setAdminPinError(null);
  };

  const openSongEditor = (songToEdit?: Song) => {
    setEditingSong(songToEdit || null);
    setIsSongEditorOpen(true);
  };

  const closeSongEditor = () => {
    setIsSongEditorOpen(false);
    setEditingSong(null);
  };

  return (
    <SongContext.Provider
      value={{
        songs,
        isAdmin,
        adminPinError,
        loginAdmin,
        logoutAdmin,
        addSong,
        editSong,
        deleteSong,
        resetSongs,
        githubAudioRepo,
        setGithubAudioRepo,
        applyGithubAudioToAllSongs,
        bookingContact,
        updateBookingContact,
        resetBookingContact,
        isAdminModalOpen,
        openAdminModal,
        closeAdminModal,
        isSongEditorOpen,
        editingSong,
        openSongEditor,
        closeSongEditor,

        // Playback state & controls
        currentTrackId,
        setCurrentTrackId,
        isPlaying,
        isUsingRealAudio,
        currentTime,
        duration,
        volume,
        repeatMode,
        isShuffle,
        frequencies,
        playTrack,
        pauseTrack,
        togglePlayPause,
        playNext,
        playPrev,
        toggleRepeatMode,
        setRepeatMode,
        toggleShuffle,
        seek,
        setVolume,
        uploadSongAudio,
        playTestSound,
        resumeAudio,
      }}
    >
      {children}
    </SongContext.Provider>
  );
};

export const useSongs = () => {
  const context = useContext(SongContext);
  if (!context) {
    throw new Error('useSongs must be used within a SongProvider');
  }
  return context;
};
