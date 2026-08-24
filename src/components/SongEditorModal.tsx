import React, { useState, useEffect, useRef } from 'react';
import { X, Music, Save, Plus, FileText, Sparkles, Check, AlignLeft, Upload, Volume2, Link as LinkIcon, Trash2, Loader2, Play, Youtube, Video, ChevronUp, ChevronDown, ListOrdered } from 'lucide-react';
import { useSongs } from '../context/SongContext';
import { Song } from '../types';
import { storeAudioBlob, removeAudioBlob, getAudioBlobUrl } from '../utils/audioStorage';
import { getYouTubeVideoId } from '../utils/youtubeUtils';

const AUDIO_PRESETS = [
  {
    name: '🎸 Rock Riff Sample 1',
    url: 'https://actions.google.com/sounds/v1/ambiences/outdoor_rock_concert.ogg',
  },
  {
    name: '🥁 Heavy Drums Loop Sample',
    url: 'https://actions.google.com/sounds/v1/sports/skateboarding_loop.ogg',
  },
  {
    name: '🎵 Melancholic Piano & Guitar Sample',
    url: 'https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg',
  },
];

export const SongEditorModal: React.FC = () => {
  const { isSongEditorOpen, closeSongEditor, editingSong, addSong, editSong } = useSongs();

  const [titleThai, setTitleThai] = useState('');
  const [titleEng, setTitleEng] = useState('');
  const [duration, setDuration] = useState('4:15');
  const [featuredArtist, setFeaturedArtist] = useState('');
  const [story, setStory] = useState('');
  const [lyricsText, setLyricsText] = useState('');
  const [chords, setChords] = useState('');
  const [bpm, setBpm] = useState(116);
  const [musicKey, setMusicKey] = useState('A Minor');
  const [audioStyle, setAudioStyle] = useState<'melancholic_rock' | 'heavy_groove' | 'ballad' | 'energetic_alt'>('melancholic_rock');
  const [audioUrl, setAudioUrl] = useState('');
  const [youtubeUrls, setYoutubeUrls] = useState<string[]>(['']);
  const [audioFileName, setAudioFileName] = useState('');
  const [pendingAudioBlob, setPendingAudioBlob] = useState<Blob | null>(null);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const audioFileInputRef = useRef<HTMLInputElement>(null);

  const handleUpdateYoutubeUrl = (index: number, val: string) => {
    setYoutubeUrls((prev) => {
      const updated = [...prev];
      updated[index] = val;
      return updated;
    });
  };

  const handleAddYoutubeUrl = () => {
    if (youtubeUrls.length < 10) {
      setYoutubeUrls((prev) => [...prev, '']);
    }
  };

  const handleRemoveYoutubeUrl = (index: number) => {
    setYoutubeUrls((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      return filtered.length > 0 ? filtered : [''];
    });
  };

  const handleMoveYoutubeUrl = (index: number, direction: 'up' | 'down') => {
    setYoutubeUrls((prev) => {
      const targetIdx = direction === 'up' ? index - 1 : index + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[targetIdx];
      updated[targetIdx] = temp;
      return updated;
    });
  };

  useEffect(() => {
    // Stop preview audio when modal closes or song changes
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
      setPreviewPlaying(false);
    }
  }, [isSongEditorOpen, editingSong]);

  const togglePreviewAudio = async () => {
    if (previewPlaying && previewAudioRef.current) {
      previewAudioRef.current.pause();
      setPreviewPlaying(false);
      return;
    }

    let src = '';
    if (pendingAudioBlob) {
      src = URL.createObjectURL(pendingAudioBlob);
    } else if (audioUrl.startsWith('idb://')) {
      const idbKey = audioUrl.replace('idb://', '');
      const blobUrl = await getAudioBlobUrl(idbKey);
      if (blobUrl) src = blobUrl;
    } else if (audioUrl.trim()) {
      src = audioUrl.trim();
    }

    if (!src) {
      alert('ยังไม่มีไฟล์เสียงสำหรับทดลองฟัง กรุณาเลือกไฟล์หรือระบุ URL');
      return;
    }

    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }

    const audio = new Audio(src);
    audio.onended = () => setPreviewPlaying(false);
    audio.onerror = () => {
      alert('ไม่สามารถเล่นไฟล์เสียงนี้ได้ กรุณาตรวจสอบไฟล์หรือลิงก์');
      setPreviewPlaying(false);
    };

    previewAudioRef.current = audio;
    try {
      await audio.play();
      setPreviewPlaying(true);
    } catch {
      setPreviewPlaying(false);
    }
  };

  useEffect(() => {
    if (editingSong) {
      setTitleThai(editingSong.titleThai || '');
      setTitleEng(editingSong.titleEng || '');
      setDuration(editingSong.duration || '4:15');
      setFeaturedArtist(editingSong.featuredArtist || '');
      setStory(editingSong.story || '');
      setLyricsText(Array.isArray(editingSong.lyrics) ? editingSong.lyrics.join('\n') : '');
      setChords(editingSong.chords || '');
      setBpm(editingSong.audioParams?.bpm || 116);
      setMusicKey(editingSong.audioParams?.key || 'A Minor');
      setAudioStyle(editingSong.audioParams?.style || 'melancholic_rock');
      setAudioUrl(editingSong.audioUrl || '');
      let loadedUrls: string[] = [];
      if (Array.isArray(editingSong.youtubeUrls) && editingSong.youtubeUrls.length > 0) {
        loadedUrls = editingSong.youtubeUrls.filter(Boolean);
      } else if (editingSong.youtubeUrl) {
        loadedUrls = [editingSong.youtubeUrl];
      }
      setYoutubeUrls(loadedUrls.length > 0 ? loadedUrls.slice(0, 10) : ['']);
      setAudioFileName(editingSong.audioUrl ? (editingSong.audioUrl.startsWith('idb://') ? 'ไฟล์เสียง MP3/WAV ที่อัปโหลดแล้ว' : 'ลิงก์ไฟล์เสียง Audio URL') : '');
      setPendingAudioBlob(null);
    } else {
      // Reset form for new song
      setTitleThai('');
      setTitleEng('');
      setDuration('4:15');
      setFeaturedArtist('');
      setStory('');
      setLyricsText('มองย้อนไปในวันเก่า ที่เคยมีเธอตรงนี้\nทุกภาพความทรงจำยังชัดเจนในใจ...\n\n(Chorus)\nหากวันนั้นฉันรู้ว่านั่นคือครั้งสุดท้าย...');
      setChords('Intro: Am | F | C | G\nChorus: F | G | Em | Am');
      setBpm(116);
      setMusicKey('A Minor');
      setAudioStyle('melancholic_rock');
      setAudioUrl('');
      setYoutubeUrls(['']);
      setAudioFileName('');
      setPendingAudioBlob(null);
    }
  }, [editingSong, isSongEditorOpen]);

  if (!isSongEditorOpen) return null;

  // Handle uploading audio file (.mp3, .wav, .m4a, .ogg)
  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingAudio(true);
    setAudioFileName(file.name);
    setPendingAudioBlob(file);

    // Auto calculate duration from uploaded audio metadata
    const objectUrl = URL.createObjectURL(file);
    const testAudio = new Audio(objectUrl);
    testAudio.onloadedmetadata = () => {
      if (testAudio.duration && !isNaN(testAudio.duration)) {
        const mins = Math.floor(testAudio.duration / 60);
        const secs = Math.floor(testAudio.duration % 60);
        const formatted = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        setDuration(formatted);
      }
      setIsProcessingAudio(false);
      URL.revokeObjectURL(objectUrl);
    };
    testAudio.onerror = () => {
      setIsProcessingAudio(false);
      URL.revokeObjectURL(objectUrl);
    };
  };

  const handleClearAudio = async () => {
    setAudioUrl('');
    setAudioFileName('');
    setPendingAudioBlob(null);
    if (editingSong?.id) {
      await removeAudioBlob(editingSong.id);
    }
    if (audioFileInputRef.current) {
      audioFileInputRef.current.value = '';
    }
  };

  // Calculate duration in seconds e.g. "4:15" => 255
  const parseDurationSeconds = (durStr: string): number => {
    try {
      const parts = durStr.split(':');
      if (parts.length === 2) {
        const mins = parseInt(parts[0], 10) || 0;
        const secs = parseInt(parts[1], 10) || 0;
        return mins * 60 + secs;
      }
    } catch {
      // fallback
    }
    return 240;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!titleThai.trim()) {
      alert('กรุณากรอกชื่อเพลงภาษาไทย');
      return;
    }

    setIsProcessingAudio(true);

    let finalAudioUrl = audioUrl.trim();
    const songId = editingSong ? editingSong.id : `song-custom-${Date.now()}`;

    // If an MP3/WAV audio file was selected, save it into IndexedDB
    if (pendingAudioBlob) {
      try {
        finalAudioUrl = await storeAudioBlob(songId, pendingAudioBlob);
      } catch (err) {
        console.error('Failed to store audio file:', err);
      }
    }

    const lyricsArray = lyricsText
      .split('\n')
      .map(line => line.trimEnd());

    const durSecs = parseDurationSeconds(duration);

    const validYoutubeUrls = youtubeUrls
      .map((u) => u.trim())
      .filter((u) => u.length > 0)
      .slice(0, 10);

    const songData = {
      titleThai: titleThai.trim(),
      titleEng: titleEng.trim() || titleThai.trim(),
      duration: duration.trim() || '4:00',
      durationSeconds: durSecs,
      featuredArtist: featuredArtist.trim() || undefined,
      story: story.trim() || 'บทเพลงอารมณ์ลึกซึ้งจากวง TRIPLETS',
      lyrics: lyricsArray,
      chords: chords.trim() || undefined,
      audioUrl: finalAudioUrl || undefined,
      youtubeUrl: validYoutubeUrls[0] || undefined,
      youtubeUrls: validYoutubeUrls.length > 0 ? validYoutubeUrls : undefined,
      audioParams: {
        bpm: Number(bpm) || 120,
        key: musicKey || 'A Minor',
        style: audioStyle,
        rootNote: 57,
      },
    };

    if (editingSong) {
      editSong(editingSong.id, songData);
    } else {
      addSong(songData);
    }

    setIsProcessingAudio(false);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      closeSongEditor();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-neutral-900 border border-neutral-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-600/20 border border-red-500/30 rounded-xl text-red-500">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>{editingSong ? 'แก้ไขเพลงและเนื้อเพลง' : 'เพิ่มเพลงใหม่'}</span>
                <span className="text-[10px] font-mono bg-red-950 text-red-400 border border-red-800 px-2 py-0.5 rounded-full">
                  ADMIN MANAGER
                </span>
              </h3>
              <p className="text-xs text-neutral-400">
                {editingSong ? `แก้ไขเพลง "${editingSong.titleThai}"` : 'กรอกรายละเอียดเพื่อเพิ่มเพลงลงในอัลบั้ม'}
              </p>
            </div>
          </div>

          <button
            onClick={closeSongEditor}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Track Basic Info Grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-neutral-300 block">
                ชื่อเพลง (ภาษาไทย) *
              </label>
              <input
                type="text"
                required
                value={titleThai}
                onChange={(e) => setTitleThai(e.target.value)}
                placeholder="เช่น หากวันนั้น..."
                className="w-full bg-neutral-950 border border-neutral-700 focus:border-red-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-neutral-300 block">
                ชื่อเพลง (ภาษาอังกฤษ)
              </label>
              <input
                type="text"
                value={titleEng}
                onChange={(e) => setTitleEng(e.target.value)}
                placeholder="เช่น If That Day..."
                className="w-full bg-neutral-950 border border-neutral-700 focus:border-red-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-neutral-300 block">
                ความยาวเพลง (นาที:วินาที)
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="4:15"
                className="w-full bg-neutral-950 border border-neutral-700 focus:border-red-500 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-neutral-300 block">
                ศิลปินร่วม / นักร้องรับเชิญ (ถ้ามี)
              </label>
              <input
                type="text"
                value={featuredArtist}
                onChange={(e) => setFeaturedArtist(e.target.value)}
                placeholder="เช่น Feat. Mona"
                className="w-full bg-neutral-950 border border-neutral-700 focus:border-red-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
              />
            </div>

          </div>

          {/* Story Behind Song */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold text-neutral-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-red-500" />
              <span>เรื่องราว / แนวคิดเบื้องหลังบทเพลง (Story)</span>
            </label>
            <textarea
              rows={2}
              value={story}
              onChange={(e) => setStory(e.target.value)}
              placeholder="อธิบายที่มา หรือเรื่องราวที่ถ่ายทอดในเพลงนี้..."
              className="w-full bg-neutral-950 border border-neutral-700 focus:border-red-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none resize-none"
            />
          </div>

          {/* Lyrics Editor (Key Request: เพิ่ม ลบ เนื้อเพลงได้) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold text-neutral-300 flex items-center gap-1.5">
                <AlignLeft className="w-3.5 h-3.5 text-red-500" />
                <span>เนื้อเพลงเต็ม (Lyrics) - กรอกบรรทัดละ 1 ประโยค</span>
              </label>
              <span className="text-[10px] text-neutral-400 font-mono">
                {lyricsText.split('\n').filter(l => l.trim()).length} บรรทัด
              </span>
            </div>

            <textarea
              rows={8}
              value={lyricsText}
              onChange={(e) => setLyricsText(e.target.value)}
              placeholder={`พิมพ์หรือวางเนื้อเพลงที่นี่...\n(Chorus)\nหากวันนั้นฉันรู้ว่านั่นคือครั้งสุดท้าย...`}
              className="w-full bg-neutral-950 border border-neutral-700 focus:border-red-500 rounded-xl p-3.5 text-xs text-neutral-100 font-mono leading-relaxed focus:outline-none resize-y"
            />
          </div>

          {/* Chords & Synthesizer Parameters */}
          <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-800/80">
            
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-neutral-300 block">
                คอร์ดเพลง (Chords)
              </label>
              <textarea
                rows={3}
                value={chords}
                onChange={(e) => setChords(e.target.value)}
                placeholder="Intro: Am | F | C | G..."
                className="w-full bg-neutral-950 border border-neutral-700 focus:border-red-500 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-neutral-300 block">
                สไตล์ดนตรีและจังหวะ (Audio Synth)
              </label>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-neutral-400 font-mono block">สไตล์ดนตรี:</span>
                  <select
                    value={audioStyle}
                    onChange={(e) => setAudioStyle(e.target.value as any)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-xs text-white"
                  >
                    <option value="melancholic_rock">Melancholic Rock</option>
                    <option value="heavy_groove">Heavy Groove</option>
                    <option value="ballad">Emotional Ballad</option>
                    <option value="energetic_alt">Energetic Alt-Rock</option>
                  </select>
                </div>

                <div>
                  <span className="text-[10px] text-neutral-400 font-mono block">BPM จังหวะ:</span>
                  <input
                    type="number"
                    value={bpm}
                    onChange={(e) => setBpm(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-xs text-white font-mono"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Audio File Upload & Stream URL Section */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold text-white flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-red-500" />
                <span>เพิ่มไฟล์เพลงสตรีมมิ่ง (Audio File / MP3 / WAV)</span>
              </label>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2.5 py-0.5 rounded-full">
                {audioFileName || audioUrl ? 'มีไฟล์เสียงแล้ว' : 'ใช้ระบบดนตรีสังเคราะห์ (Synth)'}
              </span>
            </div>

            <p className="text-[11px] text-neutral-400">
              อัปโหลดไฟล์เพลงจริงของคุณ (.mp3, .wav, .m4a, .ogg) หรือระบุลิงก์ไฟล์เสียง Audio URL เพื่อให้ผู้ฟังเปิดเล่นเพลงจริงได้ผ่านผู้เล่นเพลง
            </p>

            {/* Hidden File Input */}
            <input
              ref={audioFileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleAudioFileChange}
              className="hidden"
            />

            <div className="grid sm:grid-cols-2 gap-3">
              {/* Option 1: Upload MP3/WAV File from computer */}
              <button
                type="button"
                onClick={() => audioFileInputRef.current?.click()}
                disabled={isProcessingAudio}
                className="flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-red-500 text-white font-medium text-xs py-3 px-4 rounded-xl transition-all cursor-pointer group"
              >
                {isProcessingAudio ? (
                  <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
                )}
                <span>{audioFileName ? 'เปลี่ยนไฟล์เพลง MP3/WAV' : 'เลือกไฟล์เพลงจากเครื่อง (.mp3)'}</span>
              </button>

              {/* Option 2: Enter Audio File URL */}
              <div className="relative flex items-center">
                <LinkIcon className="w-4 h-4 text-neutral-500 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={audioUrl.startsWith('idb://') ? '' : audioUrl}
                  onChange={(e) => {
                    setAudioUrl(e.target.value);
                    setAudioFileName(e.target.value ? 'ลิงก์ไฟล์เสียง Audio URL' : '');
                    setPendingAudioBlob(null);
                  }}
                  placeholder="หรือ วางลิงก์ Audio URL (https://...)"
                  className="w-full bg-neutral-900 border border-neutral-700 focus:border-red-500 rounded-xl pl-9 pr-3 py-3 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Current Active File Indicator & Presets */}
            {(audioFileName || audioUrl || pendingAudioBlob) && (
              <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="p-2 bg-red-600/20 text-red-400 rounded-lg shrink-0">
                    <Music className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-white truncate">
                      {audioFileName || audioUrl}
                    </p>
                    <p className="text-[10px] text-emerald-400 font-mono">
                      ✓ โหลดไฟล์เสียงพร้อมใช้งาน
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={togglePreviewAudio}
                    className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer border ${
                      previewPlaying
                        ? 'bg-red-600 border-red-500 text-white animate-pulse'
                        : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-200'
                    }`}
                  >
                    {previewPlaying ? <Volume2 className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-red-400" />}
                    <span>{previewPlaying ? 'หยุดฟัง' : 'ลองฟังเสียง'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClearAudio}
                    className="p-1.5 bg-neutral-800 hover:bg-red-900/80 text-neutral-400 hover:text-red-300 rounded-lg transition-colors cursor-pointer shrink-0"
                    title="ลบไฟล์เพลงนี้ออก"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Demo Presets Row */}
            <div className="pt-1">
              <span className="text-[10px] text-neutral-400 font-mono block mb-1.5">
                หรือเลือกใช้ตัวอย่างเพลง Rock Demo Presets:
              </span>
              <div className="flex flex-wrap gap-2">
                {AUDIO_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setAudioUrl(preset.url);
                      setAudioFileName(preset.name);
                      setPendingAudioBlob(null);
                    }}
                    className="text-[11px] bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 hover:border-neutral-500 text-neutral-300 hover:text-white px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Play className="w-3 h-3 text-red-500" />
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* YouTube MV Links Box (Up to 10 URLs playing in sequence) */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-mono font-bold text-white flex items-center gap-2">
                <Youtube className="w-4 h-4 text-red-500" />
                <span>ลิงก์วิดีโอ / MV YouTube (ใส่ได้สูงสุด 10 URL เพื่อเล่นตามลำดับ)</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-neutral-400 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ListOrdered className="w-3 h-3 text-red-400" />
                  <span>{youtubeUrls.filter(u => u.trim()).length} / 10 วิดีโอ</span>
                </span>
                {youtubeUrls.some(u => u.trim()) && (
                  <span className="text-[10px] font-mono text-red-400 bg-red-950/80 border border-red-800/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Video className="w-3 h-3" />
                    <span>เชื่อมโยงแล้ว</span>
                  </span>
                )}
              </div>
            </div>

            <p className="text-[11px] text-neutral-400 leading-relaxed">
              สามารถใส่ได้สูงสุด <strong>10 URL</strong> (เช่น Official MV, Live Session, Teaser, Acoustic หรือเบื้องหลัง) ระบบจะจัดเพลย์ลิสต์และ<strong>เล่นอัตโนมัติตามลำดับ 1 → 2 → ... → 10</strong> ในโหมดเล่น MV ให้ทันที
            </p>

            {/* List of 1 to 10 URL inputs */}
            <div className="space-y-2.5 pt-1">
              {youtubeUrls.map((url, idx) => {
                const videoId = getYouTubeVideoId(url);
                return (
                  <div
                    key={idx}
                    className="bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700 rounded-xl p-2.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 transition-colors"
                  >
                    {/* Index Badge */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <div className="w-6 h-6 rounded-lg bg-red-950/90 border border-red-800/80 flex items-center justify-center text-[11px] font-mono font-bold text-red-400">
                        {idx + 1}
                      </div>
                      <span className="text-[10px] font-mono text-neutral-400 w-16">
                        {idx === 0 ? 'MV หลัก' : `วิดีโอ #${idx + 1}`}
                      </span>
                    </div>

                    {/* URL Input */}
                    <div className="relative flex-1 flex items-center">
                      <Youtube className="w-4 h-4 text-red-500 absolute left-3 pointer-events-none" />
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => handleUpdateYoutubeUrl(idx, e.target.value)}
                        placeholder={`วางลิงก์ YouTube ลำดับที่ ${idx + 1} เช่น https://youtu.be/...`}
                        className="w-full bg-neutral-950 border border-neutral-700 focus:border-red-500 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none placeholder:text-neutral-600 font-mono"
                      />
                    </div>

                    {/* Status & Action Controls */}
                    <div className="flex items-center justify-end gap-1 flex-shrink-0">
                      {videoId ? (
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-1 rounded-md truncate max-w-[90px]" title={`YouTube ID: ${videoId}`}>
                          ✓ {videoId}
                        </span>
                      ) : url.trim() ? (
                        <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-1 rounded-md">
                          ! URL
                        </span>
                      ) : null}

                      {/* Move Up */}
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => handleMoveYoutubeUrl(idx, 'up')}
                          className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-md transition-colors cursor-pointer"
                          title="เลื่อนขึ้น"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Move Down */}
                      {idx < youtubeUrls.length - 1 && (
                        <button
                          type="button"
                          onClick={() => handleMoveYoutubeUrl(idx, 'down')}
                          className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-md transition-colors cursor-pointer"
                          title="เลื่อนลง"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Remove Button */}
                      {youtubeUrls.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => handleRemoveYoutubeUrl(idx)}
                          className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-red-950/50 rounded-md transition-colors cursor-pointer"
                          title="ลบ URL นี้"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleUpdateYoutubeUrl(0, '')}
                          className="p-1.5 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 rounded-md transition-colors cursor-pointer"
                          title="ล้างข้อมูล"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add New URL Button (up to 10) */}
            {youtubeUrls.length < 10 && (
              <button
                type="button"
                onClick={handleAddYoutubeUrl}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-neutral-900 hover:bg-neutral-800/90 border border-dashed border-neutral-700 hover:border-red-500/80 rounded-xl text-xs font-bold text-neutral-300 hover:text-red-400 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-red-500" />
                <span>+ เพิ่มลิงก์วิดีโอถัดไป (ลำดับที่ {youtubeUrls.length + 1} จาก 10)</span>
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
            <button
              type="button"
              onClick={closeSongEditor}
              className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              disabled={savedSuccess}
              className={`font-bold px-6 py-2.5 rounded-xl text-xs transition-all shadow-lg flex items-center gap-2 cursor-pointer ${
                savedSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-red-600 hover:bg-red-500 text-white shadow-red-950/60'
              }`}
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>บันทึกสำเร็จ!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{editingSong ? 'บันทึกการแก้ไข' : 'เพิ่มเพลงใหม่'}</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
