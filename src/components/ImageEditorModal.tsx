import React, { useState, useRef } from 'react';
import { X, Upload, Link as LinkIcon, RotateCcw, Sparkles, Camera, Plus, Trash2, Images, Disc, CheckCircle2, Image as ImageIcon, ArrowUp, ArrowDown, Check, Music, Edit3, Save } from 'lucide-react';
import { useBandImages, KungnoiImageMap, PRESET_LIBRARY, SlideshowItem } from '../context/ImageContext';
import { DEFAULT_SLIDES_PRESETS } from '../data/albumArtworkTemplates';
import { SONGS } from '../data/bandData';
import { compressImageDataUrl } from '../utils/imageCompressor';

const TARGET_LABELS: Record<keyof KungnoiImageMap, { name: string; role: string; desc: string }> = {
  albumCover: {
    name: 'ปกอัลบั้มหลัก (Kungnoi Y.)',
    role: 'Main Album Cover',
    desc: 'รูปหน้าปกอัลบั้มและเครื่องเล่นเพลง Kungnoi Y. Debut Album',
  },
  heroBanner: {
    name: 'ภาพบรรยากาศ & เวที (Stage Atmosphere)',
    role: 'Hero Background',
    desc: 'ภาพฉากหลังเวทีแสงสีส้ม-โรสโกลด์อบอุ่นในหน้าแรก',
  },
};

export const ImageEditorModal: React.FC = () => {
  const {
    images,
    updateImage,
    resetImage,
    resetAllImages,
    isImageEditorOpen,
    closeImageEditor,
    activeEditingTarget,
    setActiveEditingTarget,
    slideshowList,
    addCustomSlide,
    addPresetToSlideshow,
    updateSlide,
    deleteSlide,
    moveSlide,
    resetSlideshowList,
  } = useBandImages();

  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'presets' | 'slideshow_list'>('slideshow_list');
  const [inputUrl, setInputUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAddingToSlideshow, setIsAddingToSlideshow] = useState(true);
  const [slideTitle, setSlideTitle] = useState('');
  const [slideSubtitle, setSlideSubtitle] = useState('');
  const [slideTag, setSlideTag] = useState('');
  const [addedPresetId, setAddedPresetId] = useState<string | null>(null);
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ title: string; subtitle: string; tag: string }>({ title: '', subtitle: '', tag: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isImageEditorOpen) return null;

  const currentImage = previewUrl || images[activeEditingTarget];
  const targetInfo = TARGET_LABELS[activeEditingTarget] || {
    name: 'รูปภาพอัลบั้ม Kungnoi Y.',
    role: 'Kungnoi Y. Media',
    desc: 'รูปภาพสำหรับแสดงผลในอัลบั้ม',
  };
  const presets = DEFAULT_SLIDES_PRESETS;

  const handleSelectSongForNewSlide = (songId: string) => {
    const song = SONGS.find(s => s.id === songId);
    if (song) {
      setSlideTitle(`แทร็ก 0${song.trackNumber} • ${song.titleThai}`);
      setSlideSubtitle(`Track 0${song.trackNumber} ✦ ${song.titleEng} (${song.duration})`);
      setSlideTag(`แทร็ก 0${song.trackNumber} • ${song.titleThai}`);
    }
  };

  const startEditingSlide = (slide: SlideshowItem) => {
    setEditingSlideId(slide.id);
    setEditForm({
      title: slide.title,
      subtitle: slide.subtitle,
      tag: slide.tag || ''
    });
  };

  const handleSaveSlideEdit = (id: string) => {
    updateSlide(id, {
      title: editForm.title.trim() || 'Kungnoi Y. - Made for You, Only You',
      subtitle: editForm.subtitle.trim() || 'Dreamy Soul Pop • Mozart Music',
      tag: editForm.tag.trim() || undefined,
    });
    setEditingSlideId(null);
  };

  const handleApplySongToExistingSlide = (songId: string) => {
    const song = SONGS.find(s => s.id === songId);
    if (song) {
      setEditForm({
        title: `แทร็ก 0${song.trackNumber} • ${song.titleThai}`,
        subtitle: `Track 0${song.trackNumber} ✦ ${song.titleEng} (${song.duration})`,
        tag: `แทร็ก 0${song.trackNumber} • ${song.titleThai}`
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    try {
      if (files.length > 1) {
        // Multiple files upload directly into slideshow
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (!file.type.startsWith('image/')) continue;
          
          await new Promise<void>((resolve) => {
            const reader = new FileReader();
            reader.onload = async (event) => {
              const rawResult = event.target?.result as string;
              if (rawResult) {
                try {
                  const compressed = await compressImageDataUrl(rawResult, 1200, 1200, 0.8);
                  await addCustomSlide(
                    file.name.replace(/\.[^/.]+$/, "") || `Kungnoi Y. Photo #${slideshowList.length + 1}`,
                    'Kungnoi Y. Debut Album • Mozart Music',
                    compressed
                  );
                } catch {
                  await addCustomSlide(
                    `Kungnoi Y. Photo #${slideshowList.length + 1}`,
                    'Kungnoi Y. Debut Album • Mozart Music',
                    rawResult
                  );
                }
              }
              resolve();
            };
            reader.readAsDataURL(file);
          });
        }
        setActiveTab('slideshow_list');
      } else {
        // Single file upload preview
        const file = files[0];
        if (!file.type.startsWith('image/')) {
          alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPG, PNG, WEBP, GIF)');
          setIsProcessing(false);
          return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
          const rawResult = event.target?.result as string;
          if (rawResult) {
            try {
              const compressed = await compressImageDataUrl(rawResult, 1200, 1200, 0.8);
              setPreviewUrl(compressed);
            } catch {
              setPreviewUrl(rawResult);
            }
          }
          setIsProcessing(false);
        };
        reader.onerror = () => setIsProcessing(false);
        reader.readAsDataURL(file);
      }
    } catch {
      // Ignored
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleApplyUrl = () => {
    if (!inputUrl.trim()) return;
    setPreviewUrl(inputUrl.trim());
  };

  const handleSave = async () => {
    const finalUrl = previewUrl || (activeTab === 'url' ? inputUrl.trim() : null);
    if (!finalUrl) return;

    setIsProcessing(true);
    if (isAddingToSlideshow) {
      await addCustomSlide(
        slideTitle || `Kungnoi Y. Photo #${slideshowList.length + 1}`,
        slideSubtitle || 'Dreamy Soul Pop • Mozart Music',
        finalUrl
      );
    } else {
      await updateImage(activeEditingTarget, finalUrl);
    }
    setIsProcessing(false);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setPreviewUrl(null);
      setInputUrl('');
      setSlideTitle('');
      setSlideSubtitle('');
      if (isAddingToSlideshow) {
        setActiveTab('slideshow_list');
      }
    }, 1200);
  };

  const handleAddPresetDirect = (preset: typeof DEFAULT_SLIDES_PRESETS[0]) => {
    addPresetToSlideshow(preset.id);
    setAddedPresetId(preset.id);
    setTimeout(() => {
      setAddedPresetId(null);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-neutral-900 border border-neutral-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Modal Bar */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-600/20 border border-amber-500/30 rounded-xl text-amber-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>จัดการรูปภาพ & สไลด์โชว์ 10 ภาพ (Kungnoi Y.)</span>
                <span className="text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800/80 px-2 py-0.5 rounded-full font-bold">
                  10 PHOTOS MANAGER
                </span>
              </h3>
              <p className="text-xs text-neutral-400">
                เพิ่ม เปลี่ยน อัปโหลด จัดลำดับภาพสไลด์โชว์ (สูงสุด 10+ รูป) และปกอัลบั้ม
              </p>
            </div>
          </div>

          <button
            onClick={closeImageEditor}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Container */}
        <div className="flex-1 overflow-y-auto p-6 grid md:grid-cols-12 gap-6">
          
          {/* Left Column: Select Artwork / Slides Target */}
          <div className="md:col-span-4 space-y-4 border-r border-neutral-800/80 pr-0 md:pr-4">
            <div>
              <label className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider block mb-2">
                รูปภาพหลักของอัลบั้ม:
              </label>

              <div className="space-y-1.5">
                {(Object.keys(TARGET_LABELS) as Array<keyof KungnoiImageMap>).map((key) => {
                  const isSelected = activeEditingTarget === key;
                  const info = TARGET_LABELS[key];

                  return (
                    <button
                      key={key}
                      onClick={() => {
                        setActiveEditingTarget(key);
                        setPreviewUrl(null);
                        setInputUrl('');
                      }}
                      className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-amber-950/80 to-neutral-900 border-amber-500 text-white shadow-md'
                          : 'bg-neutral-950/60 border-neutral-800 text-neutral-300 hover:bg-neutral-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={images[key]}
                          alt={info.name}
                          className="w-8 h-8 rounded-lg object-cover border border-neutral-700 flex-shrink-0"
                        />
                        <div className="truncate">
                          <div className="text-xs font-bold truncate">{info.name}</div>
                          <div className="text-[10px] text-neutral-400 font-mono truncate">{info.role}</div>
                        </div>
                      </div>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-amber-400"></div>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Slideshow Management Button on Sidebar */}
            <div className="pt-2 border-t border-neutral-800/80">
              <label className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider block mb-2">
                สไลด์โชว์หน้าแรก ({slideshowList.length} รูป):
              </label>

              <button
                onClick={() => setActiveTab('slideshow_list')}
                className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'slideshow_list'
                    ? 'bg-amber-950/80 border-amber-500 text-amber-300 shadow-md'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:bg-neutral-800/60'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Images className="w-4 h-4 text-amber-400" />
                  <span>จัดการภาพสไลด์โชว์ทั้งหมด</span>
                </span>
                <span className="text-[10px] bg-neutral-900 px-2 py-0.5 rounded-full border border-neutral-700 font-mono">
                  {slideshowList.length} รูป
                </span>
              </button>
            </div>

            <div className="pt-2">
              <button
                onClick={resetAllImages}
                className="w-full text-xs text-neutral-400 hover:text-rose-400 bg-neutral-950 border border-neutral-800 hover:border-rose-900/60 p-2 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>รีเซ็ตรูปทั้งหมด (10 พรีเซ็ต)</span>
              </button>
            </div>
          </div>

          {/* Right Column: Upload / URL / Presets / Slideshow Control */}
          <div className="md:col-span-8 space-y-4">
            
            {/* Current Target Title Banner */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">
                  กำลังจัดการ: {activeTab === 'slideshow_list' ? 'สไลด์โชว์หน้าแรก' : targetInfo.role}
                </span>
                <h4 className="text-sm font-bold text-white">
                  {activeTab === 'slideshow_list' ? `รายการภาพสไลด์โชว์ (${slideshowList.length} รูป)` : targetInfo.name}
                </h4>
                <p className="text-[11px] text-neutral-400">
                  {activeTab === 'slideshow_list' ? 'สามารถกดปุ่ม ↑/↓ เพื่อจัดลำดับ, ลบ หรือเพิ่มรูปภาพใหม่ในสไลด์โชว์ได้' : targetInfo.desc}
                </p>
              </div>

              {previewUrl && (
                <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full self-start sm:self-auto flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>มีพรีวิวภาพใหม่</span>
                </span>
              )}
            </div>

            {/* Comprehensive Image Dimensions & Naming Guide */}
            <div className="bg-gradient-to-r from-amber-950/40 via-neutral-950 to-neutral-950 border border-amber-800/40 rounded-xl p-3.5 space-y-2.5 text-xs text-neutral-300 shadow-inner">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span className="text-sm">💡 คำแนะนำขนาดภาพ & การตั้งชื่อไฟล์ (Dimensions & Naming Guide)</span>
                </div>
                <span className="text-[10px] font-mono bg-amber-900/40 text-amber-300 border border-amber-700/50 px-2 py-0.5 rounded">
                  RECOMMENDED
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="bg-neutral-900/80 border border-neutral-800 p-2.5 rounded-lg space-y-1">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    <span>1. ภาพสไลด์โชว์หน้าแรก (10 Slides)</span>
                  </div>
                  <p className="text-neutral-400 font-mono">
                    • <strong>ขนาดแนะนำ:</strong> <span className="text-amber-300 font-bold">1920 × 900 px</span> หรือ <span className="text-amber-300 font-bold">1920 × 1080 px</span> (สัดส่วน 16:9 ถึง 2.1:1)<br/>
                    • <strong>รูปแบบไฟล์:</strong> JPG, PNG, WEBP<br/>
                    • <strong>ตัวอย่างชื่อไฟล์:</strong> <code className="text-amber-200 bg-neutral-950 px-1 py-0.5 rounded">slide-01-cover.jpg</code> ถึง <code className="text-amber-200 bg-neutral-950 px-1 py-0.5 rounded">slide-10-acoustic.jpg</code>
                  </p>
                </div>

                <div className="bg-neutral-900/80 border border-neutral-800 p-2.5 rounded-lg space-y-1">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-400"></span>
                    <span>2. ปกอัลบั้ม / แผ่นเสียง (Square 1:1)</span>
                  </div>
                  <p className="text-neutral-400 font-mono">
                    • <strong>ขนาดแนะนำ:</strong> <span className="text-red-300 font-bold">1000 × 1000 px</span> หรือ <span className="text-red-300 font-bold">1200 × 1200 px</span> (สี่เหลี่ยมจัตุรัส)<br/>
                    • <strong>รูปแบบไฟล์:</strong> JPG, PNG (พื้นหลังใสได้)<br/>
                    • <strong>ตัวอย่างชื่อไฟล์:</strong> <code className="text-red-200 bg-neutral-950 px-1 py-0.5 rounded">album-cover-main.jpg</code>, <code className="text-red-200 bg-neutral-950 px-1 py-0.5 rounded">vinyl-disc-art.png</code>
                  </p>
                </div>

                <div className="bg-neutral-900/80 border border-neutral-800 p-2.5 rounded-lg space-y-1">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>3. ภาพพื้นหลังเวที / แบนเนอร์กว้าง</span>
                  </div>
                  <p className="text-neutral-400 font-mono">
                    • <strong>ขนาดแนะนำ:</strong> <span className="text-emerald-300 font-bold">1920 × 1080 px</span> หรือ <span className="text-emerald-300 font-bold">2560 × 1440 px</span> (Full HD / 2K)<br/>
                    • <strong>รูปแบบไฟล์:</strong> JPG, WEBP<br/>
                    • <strong>ตัวอย่างชื่อไฟล์:</strong> <code className="text-emerald-200 bg-neutral-950 px-1 py-0.5 rounded">stage-background.jpg</code>, <code className="text-emerald-200 bg-neutral-950 px-1 py-0.5 rounded">hero-banner.jpg</code>
                  </p>
                </div>

                <div className="bg-neutral-900/80 border border-neutral-800 p-2.5 rounded-lg space-y-1">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                    <span>4. กฎการตั้งชื่อไฟล์ที่ดี (Best Practices)</span>
                  </div>
                  <p className="text-neutral-400 font-mono">
                    • ใช้ภาษาอังกฤษพิมพ์เล็กและขีดคั่น <code className="text-sky-300 bg-neutral-950 px-1 rounded">-</code> เช่น <code className="text-sky-200 bg-neutral-950 px-1 rounded">kungnoi-track-01.jpg</code><br/>
                    • หลีกเลี่ยงการเว้นวรรคและอักขระพิเศษ <code className="text-rose-400"># ? % &</code><br/>
                    • ระบบมี Auto-Compress บีบอัดภาพให้อัตโนมัติ ป้องกันเว็บโหลดช้า
                  </p>
                </div>
              </div>
            </div>

            {/* Input Mode Tabs */}
            <div className="flex flex-wrap border-b border-neutral-800 text-xs font-medium gap-y-1">
              <button
                onClick={() => setActiveTab('slideshow_list')}
                className={`pb-2.5 px-3.5 flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'slideshow_list'
                    ? 'border-amber-500 text-amber-300 font-bold bg-amber-950/40 rounded-t-lg'
                    : 'border-transparent text-amber-400/80 hover:text-amber-300'
                }`}
              >
                <Images className="w-3.5 h-3.5 text-amber-400" />
                <span>จัดการสไลด์ ({slideshowList.length} รูป)</span>
              </button>

              <button
                onClick={() => setActiveTab('upload')}
                className={`pb-2.5 px-3.5 flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'upload'
                    ? 'border-amber-500 text-amber-400 font-bold'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>อัปโหลดจากเครื่อง</span>
              </button>

              <button
                onClick={() => setActiveTab('url')}
                className={`pb-2.5 px-3.5 flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'url'
                    ? 'border-amber-500 text-amber-400 font-bold'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>ใส่ลิงก์รูปภาพ (URL)</span>
              </button>

              <button
                onClick={() => setActiveTab('presets')}
                className={`pb-2.5 px-3.5 flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'presets'
                    ? 'border-amber-500 text-amber-400 font-bold'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>คลัง 10 พรีเซ็ต</span>
              </button>
            </div>

            {/* Slide Add Toggle Box (For Upload / URL tabs) */}
            {(activeTab === 'upload' || activeTab === 'url') && (
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-neutral-200">
                  <input
                    type="checkbox"
                    checked={isAddingToSlideshow}
                    onChange={(e) => setIsAddingToSlideshow(e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-700 text-amber-600 focus:ring-amber-500 bg-neutral-900 cursor-pointer"
                  />
                  <span className="flex items-center gap-1.5 text-amber-300">
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่มรูปนี้เป็นสไลด์ใหม่ในสไลด์โชว์หน้าแรก (Slideshow)</span>
                  </span>
                </label>

                {isAddingToSlideshow && (
                  <div className="space-y-2 pt-1 border-t border-neutral-900">
                    <div>
                      <span className="text-[11px] font-mono text-neutral-400 block mb-1.5 flex items-center gap-1">
                        <Music className="w-3 h-3 text-amber-400" />
                        <span>คลิกเลือกจับคู่กับ 10 เพลงในอัลบั้ม Kungnoi Y. (กรอกชื่อเพลงอัตโนมัติ):</span>
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {SONGS.map((song) => (
                          <button
                            key={song.id}
                            type="button"
                            onClick={() => handleSelectSongForNewSlide(song.id)}
                            className="text-[10px] bg-neutral-900 hover:bg-amber-950/80 hover:text-amber-300 border border-neutral-800 hover:border-amber-500/50 text-neutral-300 px-2 py-1 rounded-md transition-colors cursor-pointer"
                          >
                            0{song.trackNumber}. {song.titleThai}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="ชื่อเพลง / หัวข้อสไลด์ (เช่น แทร็ก 01 • ถ้าเธอยังไม่ลืม)"
                        value={slideTitle}
                        onChange={(e) => setSlideTitle(e.target.value)}
                        className="bg-neutral-900 border border-neutral-800 text-xs text-white rounded-lg px-2.5 py-1.5 focus:border-amber-500 outline-none"
                      />
                      <input
                        type="text"
                        placeholder="คำบรรยาย / ชื่อภาษาอังกฤษ (เช่น Track 01 ✦ If You Haven't Forgotten)"
                        value={slideSubtitle}
                        onChange={(e) => setSlideSubtitle(e.target.value)}
                        className="bg-neutral-900 border border-neutral-800 text-xs text-white rounded-lg px-2.5 py-1.5 focus:border-amber-500 outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: SLIDESHOW LIST MANAGER */}
            {activeTab === 'slideshow_list' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono text-amber-400 block font-bold flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-amber-400" />
                    <span>สไลด์และชื่อเพลงทั้งหมดในหน้าแรก ({slideshowList.length} รูป):</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveTab('upload')}
                      className="text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ เพิ่มภาพ</span>
                    </button>
                    <button
                      onClick={resetSlideshowList}
                      className="text-[11px] text-amber-300 hover:text-white bg-amber-950/60 hover:bg-amber-900 border border-amber-500/40 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                      title="รีเซ็ตกลับเป็นภาพจริง 10 ภาพพร้อมชื่อเพลงทางการของ Kungnoi Y."
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>รีเซ็ต 10 บทเพลง</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {slideshowList.map((slide, index) => (
                    <div
                      key={slide.id || index}
                      className={`bg-neutral-950 border rounded-xl p-2.5 transition-all ${
                        editingSlideId === slide.id
                          ? 'border-amber-500/70 bg-neutral-950/90 ring-1 ring-amber-500/30'
                          : 'border-neutral-800/90 hover:border-neutral-700'
                      }`}
                    >
                      {/* Main Item Row */}
                      <div className="flex items-center justify-between gap-2 sm:gap-3">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                          {/* Order Number */}
                          <span className="text-xs font-mono text-amber-400 font-bold w-6 text-center flex-shrink-0">
                            #{index + 1}
                          </span>

                          {/* Reorder Buttons Up/Down */}
                          <div className="flex flex-col gap-0.5 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => moveSlide(index, 'up')}
                              disabled={index === 0}
                              className="p-1 rounded bg-neutral-900 hover:bg-neutral-800 disabled:opacity-30 text-neutral-300 hover:text-amber-300 cursor-pointer disabled:cursor-not-allowed transition-colors"
                              title="เลื่อนขึ้น"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveSlide(index, 'down')}
                              disabled={index === slideshowList.length - 1}
                              className="p-1 rounded bg-neutral-900 hover:bg-neutral-800 disabled:opacity-30 text-neutral-300 hover:text-amber-300 cursor-pointer disabled:cursor-not-allowed transition-colors"
                              title="เลื่อนลง"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Thumbnail */}
                          <img
                            src={slide.url}
                            alt={slide.title}
                            className="w-14 h-9 rounded-lg object-cover border border-neutral-800 flex-shrink-0"
                          />

                          {/* Song & Slide Info */}
                          <div className="truncate min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-white truncate flex items-center gap-1">
                                <Music className="w-3 h-3 text-amber-400 flex-shrink-0" />
                                {slide.title}
                              </span>
                            </div>
                            <div className="text-[10px] text-neutral-400 truncate">{slide.subtitle}</div>
                          </div>
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {slide.tag && (
                            <span className="hidden sm:inline-block text-[9px] font-mono bg-neutral-900 text-amber-300/80 border border-neutral-800 px-1.5 py-0.5 rounded truncate max-w-[120px]">
                              {slide.tag}
                            </span>
                          )}
                          <button
                            onClick={() => editingSlideId === slide.id ? setEditingSlideId(null) : startEditingSlide(slide)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              editingSlideId === slide.id
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'text-neutral-400 hover:text-amber-300 hover:bg-neutral-800'
                            }`}
                            title="แก้ไขชื่อเพลง / รายละเอียดสไลด์"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteSlide(slide.id)}
                            className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                            title="ลบสไลด์นี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Inline Edit Panel when active */}
                      {editingSlideId === slide.id && (
                        <div className="mt-3 pt-3 border-t border-neutral-800/80 space-y-2.5 animate-fadeIn">
                          <div>
                            <span className="text-[10px] font-mono text-neutral-400 block mb-1">
                              คลิกเพื่อเลือกชื่อเพลงจาก 10 แทร็กในอัลบั้ม:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {SONGS.map((song) => (
                                <button
                                  key={song.id}
                                  type="button"
                                  onClick={() => handleApplySongToExistingSlide(song.id)}
                                  className="text-[9px] bg-neutral-900 hover:bg-amber-950 hover:text-amber-300 border border-neutral-800 hover:border-amber-600/50 text-neutral-300 px-2 py-0.5 rounded transition-colors cursor-pointer"
                                >
                                  0{song.trackNumber}. {song.titleThai}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <input
                              type="text"
                              value={editForm.title}
                              onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                              placeholder="ชื่อเพลง (เช่น แทร็ก 01 • ถ้าเธอยังไม่ลืม)"
                              className="bg-neutral-900 border border-neutral-800 text-xs text-white rounded-lg px-2.5 py-1.5 focus:border-amber-500 outline-none"
                            />
                            <input
                              type="text"
                              value={editForm.subtitle}
                              onChange={(e) => setEditForm(prev => ({ ...prev, subtitle: e.target.value }))}
                              placeholder="ชื่อภาษาอังกฤษ / คำบรรยาย"
                              className="bg-neutral-900 border border-neutral-800 text-xs text-white rounded-lg px-2.5 py-1.5 focus:border-amber-500 outline-none"
                            />
                            <input
                              type="text"
                              value={editForm.tag}
                              onChange={(e) => setEditForm(prev => ({ ...prev, tag: e.target.value }))}
                              placeholder="ป้ายกำกับ (เช่น แทร็ก 01 • Title Track)"
                              className="bg-neutral-900 border border-neutral-800 text-xs text-white rounded-lg px-2.5 py-1.5 focus:border-amber-500 outline-none"
                            />
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setEditingSlideId(null)}
                              className="text-xs text-neutral-400 hover:text-white px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                            >
                              ยกเลิก
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveSlideEdit(slide.id)}
                              className="text-xs bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold px-3 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Save className="w-3 h-3" />
                              <span>บันทึกชื่อเพลง</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT: UPLOAD FROM DEVICE */}
            {activeTab === 'upload' && (
              <div className="space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-neutral-700 hover:border-amber-500/80 bg-neutral-950/80 hover:bg-neutral-950 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-full bg-neutral-900 group-hover:bg-amber-950/60 border border-neutral-700 group-hover:border-amber-500/50 flex items-center justify-center text-neutral-400 group-hover:text-amber-400 transition-colors">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white group-hover:text-amber-200">
                      คลิกเพื่อเลือกรูปภาพจากอุปกรณ์ (เลือกพร้อมกันได้หลายรูป สูงสุด 10 รูป)
                    </p>
                    <p className="text-xs text-neutral-400 mt-0.5 font-mono">
                      รองรับไฟล์ JPG, PNG, WEBP, GIF (ระบบบีบอัดอัตโนมัติ)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: URL INPUT */}
            {activeTab === 'url' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-mono text-neutral-400 block">
                    วางลิงก์รูปภาพสาธารณะ (Direct Image URL):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/... หรือ ลิงก์รูปภาพที่ต้องการ"
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                      className="flex-1 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-xl px-3 py-2.5 focus:border-amber-500 outline-none"
                    />
                    <button
                      onClick={handleApplyUrl}
                      className="bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer flex-shrink-0"
                    >
                      ดูตัวอย่าง
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: 10 PRESETS */}
            {activeTab === 'presets' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono text-neutral-300 block font-bold">
                    คลัง 10 รูปภาพศิลปินทางการ Kungnoi Y. (ไฟล์ภาพจริง):
                  </label>
                  <span className="text-[10px] font-mono text-amber-400 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                    10 OFFICIAL PHOTOS
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                  {presets.map((preset, idx) => (
                    <div
                      key={preset.id}
                      className="group relative rounded-xl overflow-hidden border border-neutral-800 hover:border-amber-500/60 bg-neutral-950 transition-all p-2 flex flex-col justify-between gap-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-amber-400 bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded">
                          #{idx + 1}
                        </span>
                        <div className="truncate min-w-0 flex-1">
                          <h5 className="text-xs font-bold text-white truncate">{preset.title}</h5>
                          <p className="text-[10px] text-neutral-400 truncate">{preset.subtitle}</p>
                        </div>
                      </div>

                      <div className="relative aspect-[16/9] rounded-lg overflow-hidden border border-neutral-800/80 bg-neutral-900">
                        <img
                          src={preset.url}
                          alt={preset.title}
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => handleAddPresetDirect(preset)}
                          className={`flex-1 text-[11px] font-semibold py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                            addedPresetId === preset.id
                              ? 'bg-emerald-950 border border-emerald-500 text-emerald-300'
                              : 'bg-amber-950/70 hover:bg-amber-900/90 border border-amber-600/50 text-amber-200'
                          }`}
                        >
                          {addedPresetId === preset.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>เพิ่มแล้ว!</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3 h-3" />
                              <span>+ เพิ่มเข้าสไลด์โชว์</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setPreviewUrl(preset.url);
                            setIsAddingToSlideshow(false);
                          }}
                          className="text-[11px] text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 py-1.5 px-2 rounded-lg transition-colors cursor-pointer"
                          title="เลือกรูปนี้เป็นปกหลัก"
                        >
                          ใช้เป็นปก
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PREVIEW & CONFIRM BAR */}
            {previewUrl && (
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={previewUrl}
                    alt="ตัวอย่างรูปใหม่"
                    className="w-12 h-12 rounded-lg object-cover border border-amber-500 flex-shrink-0"
                  />
                  <div className="truncate">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                      <span>ตัวอย่างรูปภาพที่จะใช้</span>
                    </div>
                    <div className="text-[10px] text-neutral-400 truncate">
                      {isAddingToSlideshow ? 'จะถูกเพิ่มในสไลด์โชว์หน้าแรก' : `จะแทนที่ ${targetInfo.name}`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setPreviewUrl(null)}
                    className="text-xs text-neutral-400 hover:text-white px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 transition-colors cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isProcessing}
                    className="text-xs font-bold text-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 px-4 py-2 rounded-xl shadow-lg shadow-amber-950/50 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <span className="flex items-center gap-1">กำลังบันทึก...</span>
                    ) : saveSuccess ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                        <span>บันทึกแล้ว!</span>
                      </span>
                    ) : (
                      <span>{isAddingToSlideshow ? 'เพิ่มในสไลด์โชว์' : 'บันทึกใช้รูปนี้'}</span>
                    )}
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Modal Footer Bar */}
        <div className="px-6 py-3 border-t border-neutral-800/80 bg-neutral-950 flex items-center justify-between text-xs text-neutral-400">
          <span>* รูปภาพที่อัปโหลดและสไลด์โชว์ทั้ง 10 รูปจะถูกบันทึกไว้ในเบราว์เซอร์ของคุณอย่างปลอดภัย</span>
          <button
            onClick={closeImageEditor}
            className="hover:text-white transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง [ESC]
          </button>
        </div>

      </div>
    </div>
  );
};
