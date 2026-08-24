import React, { createContext, useContext, useState, useEffect } from 'react';
import { compressImageDataUrl } from '../utils/imageCompressor';
import { DEFAULT_SLIDES_PRESETS } from '../data/albumArtworkTemplates';

export interface KungnoiImageMap {
  albumCover: string;
  heroBanner: string;
}

// Alias for compatibility
export type BandImageMap = KungnoiImageMap;

export interface SlideshowItem {
  id: string;
  key?: keyof KungnoiImageMap;
  title: string;
  subtitle: string;
  url: string;
  isCustom?: boolean;
  tag?: string;
  description?: string;
}

const DEFAULT_IMAGES: KungnoiImageMap = {
  albumCover: DEFAULT_SLIDES_PRESETS[0]?.url || '',
  heroBanner: DEFAULT_SLIDES_PRESETS[2]?.url || '',
};

const STORAGE_KEY = 'kungnoi_y_custom_images_v25';
const CUSTOM_SLIDES_STORAGE_KEY = 'kungnoi_y_custom_slideshow_v25';
const HIDDEN_SLIDES_STORAGE_KEY = 'kungnoi_y_hidden_slides_v25';

export interface ImageContextType {
  images: KungnoiImageMap;
  updateImage: (key: keyof KungnoiImageMap, url: string) => Promise<void>;
  resetImage: (key: keyof KungnoiImageMap) => void;
  resetAllImages: () => void;
  isImageEditorOpen: boolean;
  openImageEditor: (targetKey?: keyof KungnoiImageMap) => void;
  closeImageEditor: () => void;
  activeEditingTarget: keyof KungnoiImageMap;
  setActiveEditingTarget: (key: keyof KungnoiImageMap) => void;

  // Slideshow management (Supports 10+ photos & presets)
  slideshowList: SlideshowItem[];
  addCustomSlide: (title: string, subtitle: string, url: string, tag?: string) => Promise<void>;
  addPresetToSlideshow: (presetId: string) => void;
  updateSlide: (id: string, updates: Partial<SlideshowItem>) => void;
  deleteSlide: (id: string) => void;
  moveSlide: (index: number, direction: 'up' | 'down') => void;
  resetSlideshowList: () => void;
}

const ImageContext = createContext<ImageContextType | undefined>(undefined);

export const PRESET_LIBRARY: Record<keyof KungnoiImageMap, { id: string; name: string; url: string; tag?: string }[]> = {
  albumCover: DEFAULT_SLIDES_PRESETS.map((preset, idx) => ({
    id: `ac-${idx + 1}`,
    name: preset.title,
    url: preset.url,
    tag: preset.tag
  })),
  heroBanner: DEFAULT_SLIDES_PRESETS.map((preset, idx) => ({
    id: `hb-${idx + 1}`,
    name: `${preset.title} (${preset.subtitle})`,
    url: preset.url,
    tag: preset.tag
  })),
};

const SLIDESHOW_STORAGE_KEY = 'kungnoi_y_slideshow_v25';

export const ImageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [images, setImages] = useState<KungnoiImageMap>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_IMAGES, ...parsed };
      }
    } catch {
      // Ignored
    }
    return DEFAULT_IMAGES;
  });

  // Initialize with 10 default presets or stored slideshow list
  const [slideshowList, setSlideshowList] = useState<SlideshowItem[]>(() => {
    try {
      const saved = localStorage.getItem(SLIDESHOW_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure non-custom slides use the latest actual photo URL
          return parsed.map((item: SlideshowItem) => {
            if (!item.isCustom) {
              const matchedPreset = DEFAULT_SLIDES_PRESETS.find(p => p.id === item.id);
              if (matchedPreset) {
                return { ...item, url: matchedPreset.url };
              }
            }
            return item;
          });
        }
      }
    } catch {
      // Ignored
    }
    return DEFAULT_SLIDES_PRESETS.map((slide, idx) => ({
      id: slide.id,
      title: slide.title,
      subtitle: slide.subtitle,
      url: slide.url,
      tag: slide.tag,
      description: slide.description,
      key: idx === 0 ? 'albumCover' : undefined,
    }));
  });

  const [isImageEditorOpen, setIsImageEditorOpen] = useState(false);
  const [activeEditingTarget, setActiveEditingTarget] = useState<keyof KungnoiImageMap>('albumCover');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(images));
    } catch (e) {
      console.warn('LocalStorage save warning:', e);
    }
  }, [images]);

  useEffect(() => {
    try {
      localStorage.setItem(SLIDESHOW_STORAGE_KEY, JSON.stringify(slideshowList));
    } catch (e) {
      console.warn('LocalStorage slideshow save warning:', e);
    }
  }, [slideshowList]);

  const updateImage = async (key: keyof KungnoiImageMap, url: string) => {
    let compressedUrl = url;
    if (url && url.startsWith('data:image/')) {
      compressedUrl = await compressImageDataUrl(url, 1200, 1200, 0.8);
    }
    setImages(prev => ({ ...prev, [key]: compressedUrl }));
  };

  const resetImage = (key: keyof KungnoiImageMap) => {
    setImages(prev => ({ ...prev, [key]: DEFAULT_IMAGES[key] }));
  };

  const resetAllImages = () => {
    setImages(DEFAULT_IMAGES);
    resetSlideshowList();
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(SLIDESHOW_STORAGE_KEY);
    } catch {
      // Ignored
    }
  };

  const addCustomSlide = async (title: string, subtitle: string, url: string, tag?: string) => {
    let compressedUrl = url;
    if (url && url.startsWith('data:image/')) {
      compressedUrl = await compressImageDataUrl(url, 1200, 1200, 0.8);
    }
    const newSlide: SlideshowItem = {
      id: `custom-slide-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: title.trim() || 'Kungnoi Y. - Made for You, Only You',
      subtitle: subtitle.trim() || 'Dreamy Soul Pop • Mozart Music',
      url: compressedUrl,
      isCustom: true,
      tag: tag || `รูปที่ ${slideshowList.length + 1}`
    };
    setSlideshowList(prev => [...prev, newSlide]);
  };

  const updateSlide = (id: string, updates: Partial<SlideshowItem>) => {
    setSlideshowList(prev => prev.map(slide => slide.id === id ? { ...slide, ...updates } : slide));
  };

  const addPresetToSlideshow = (presetId: string) => {
    const preset = DEFAULT_SLIDES_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    const newSlide: SlideshowItem = {
      id: `preset-${preset.id}-${Date.now()}`,
      title: preset.title,
      subtitle: preset.subtitle,
      url: preset.url,
      tag: preset.tag,
      description: preset.description,
    };
    setSlideshowList(prev => [...prev, newSlide]);
  };

  const deleteSlide = (id: string) => {
    setSlideshowList(prev => {
      const filtered = prev.filter(s => s.id !== id);
      return filtered.length > 0 ? filtered : [
        {
          id: 'default-fallback',
          title: 'Kungnoi Y. — Debut Album',
          subtitle: 'Dreamy Soul Pop ✦ R&B Pop',
          url: DEFAULT_SLIDES_PRESETS[0]?.url || '',
          tag: 'Official Debut'
        }
      ];
    });
  };

  const moveSlide = (index: number, direction: 'up' | 'down') => {
    setSlideshowList(prev => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const resetSlideshowList = () => {
    const defaults: SlideshowItem[] = DEFAULT_SLIDES_PRESETS.map((slide, idx) => ({
      id: slide.id,
      title: slide.title,
      subtitle: slide.subtitle,
      url: slide.url,
      tag: slide.tag,
      description: slide.description,
      key: idx === 0 ? 'albumCover' : undefined,
    }));
    setSlideshowList(defaults);
    try {
      localStorage.setItem(SLIDESHOW_STORAGE_KEY, JSON.stringify(defaults));
    } catch {
      // Ignored
    }
  };

  const openImageEditor = (targetKey?: keyof KungnoiImageMap) => {
    if (targetKey) {
      setActiveEditingTarget(targetKey);
    }
    setIsImageEditorOpen(true);
  };

  const closeImageEditor = () => {
    setIsImageEditorOpen(false);
  };

  return (
    <ImageContext.Provider
      value={{
        images,
        updateImage,
        resetImage,
        resetAllImages,
        isImageEditorOpen,
        openImageEditor,
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
      }}
    >
      {children}
    </ImageContext.Provider>
  );
};

export const useBandImages = () => {
  const context = useContext(ImageContext);
  if (!context) {
    throw new Error('useBandImages must be used within an ImageProvider');
  }
  return context;
};
