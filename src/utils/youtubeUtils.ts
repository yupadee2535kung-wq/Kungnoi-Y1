/**
 * Helper to parse various YouTube URL formats into embeddable URLs
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 */
export function getYouTubeVideoId(url?: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // youtu.be/VIDEO_ID
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch && shortMatch[1]) return shortMatch[1];

  // youtube.com/watch?v=VIDEO_ID or /shorts/VIDEO_ID or /embed/VIDEO_ID
  const standardMatch = trimmed.match(/(?:v=|\/shorts\/|\/embed\/|live\/)([a-zA-Z0-9_-]{11})/);
  if (standardMatch && standardMatch[1]) return standardMatch[1];

  // Fallback for 11-character video ID directly
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

export function getYouTubeVideoIds(urls?: (string | undefined)[]): string[] {
  if (!urls || !Array.isArray(urls)) return [];
  const ids: string[] = [];
  for (const u of urls) {
    const id = getYouTubeVideoId(u);
    if (id && !ids.includes(id)) {
      ids.push(id);
    }
  }
  return ids;
}

export function getYouTubeEmbedUrl(url?: string, autoplay = true): string | null {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return null;
  const autoParam = autoplay ? '1' : '0';
  return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=${autoParam}&rel=0&modestbranding=1&enablejsapi=1`;
}

/**
 * Creates an embed URL for playing multiple videos sequentially.
 * Uses YouTube playlist parameter (&playlist=ID1,ID2,ID3,ID4,ID5)
 */
export function getYouTubeSequentialEmbedUrl(
  urls: (string | undefined)[],
  currentIndex = 0,
  autoplay = true
): string | null {
  const validIds: string[] = [];
  for (const u of urls) {
    const id = getYouTubeVideoId(u);
    if (id) validIds.push(id);
  }

  if (validIds.length === 0) return null;

  const safeIndex = Math.max(0, Math.min(currentIndex, validIds.length - 1));
  const activeVideoId = validIds[safeIndex];
  const autoParam = autoplay ? '1' : '0';

  if (validIds.length === 1) {
    return `https://www.youtube-nocookie.com/embed/${activeVideoId}?autoplay=${autoParam}&rel=0&modestbranding=1&enablejsapi=1`;
  }

  // When multiple videos, pass the playlist parameter with all IDs starting from activeVideo
  const playlistParam = validIds.join(',');
  return `https://www.youtube-nocookie.com/embed/${activeVideoId}?playlist=${playlistParam}&index=${safeIndex}&autoplay=${autoParam}&rel=0&modestbranding=1&enablejsapi=1`;
}

export function getYouTubeWatchUrl(url?: string): string | null {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return url || null;
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function getYouTubeThumbnailUrl(url?: string): string | null {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}
