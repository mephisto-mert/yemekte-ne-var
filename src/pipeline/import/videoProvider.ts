export interface RecipeVideoCandidate {
  videoId: string;
  provider: 'youtube' | 'curated' | 'external';
  url: string;
  embedUrl: string;
  title?: string;
  channelTitle?: string;
  duration?: string;
  language: 'tr' | 'global';
  permissionStatus: 'authorized_embed' | 'pending_review';
  isOfficialRecipeVideo: boolean;
}

export interface VideoSearchOptions {
  recipeTitle: string;
  cuisine?: string;
  language?: 'tr' | 'global';
}

export interface VideoProviderResult {
  candidates: RecipeVideoCandidate[];
  totalFound: number;
  provider: string;
}

/**
 * Contract for Recipe Video Providers (YouTube Data API v3 or Curated Video Catalog).
 * Strictly forbids unofficial thumbnail scraping or fake video generation.
 */
export interface RecipeVideoProvider {
  readonly id: string;
  readonly name: string;

  searchVideos(options: VideoSearchOptions): Promise<VideoProviderResult>;
  getVideoById(videoId: string): Promise<RecipeVideoCandidate | null>;
}

/**
 * Parses and validates YouTube video URLs or IDs into canonical embed models.
 */
export function parseYouTubeVideoId(input?: string | null): string | null {
  if (!input || typeof input !== 'string') return null;

  const trimmed = input.trim();
  // Direct 11-character video ID
  if (/^[\w-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // YouTube standard / shorts / embed URLs
  const match = trimmed.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/);
  return match && match[1] ? match[1] : null;
}

/**
 * Generates an official YouTube privacy-enhanced embed URL.
 */
export function buildYouTubeEmbedUrl(videoId: string): string {
  const cleanId = parseYouTubeVideoId(videoId);
  if (!cleanId) return '';
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(cleanId)}`;
}

/**
 * Curated Local Video Catalog Provider (Deterministic).
 */
export class CuratedRecipeVideoProvider implements RecipeVideoProvider {
  readonly id = 'curated_video_provider';
  readonly name = 'Curated Recipe Video Catalog';

  private catalog: Map<string, RecipeVideoCandidate> = new Map();

  constructor() {
    // Seed initial verified culinary video IDs
    this.registerVideo('mercimek', {
      videoId: 'mock_vid_mercimek',
      provider: 'youtube',
      url: 'https://www.youtube.com/watch?v=mock_vid_mercimek',
      embedUrl: 'https://www.youtube-nocookie.com/embed/mock_vid_mercimek',
      title: 'Ustasından Mercimek Çorbası Tarifi',
      channelTitle: 'Geleneksel Türk Mutfağı',
      language: 'tr',
      permissionStatus: 'authorized_embed',
      isOfficialRecipeVideo: true
    });
  }

  registerVideo(keyword: string, video: RecipeVideoCandidate): void {
    this.catalog.set(keyword.toLowerCase(), video);
  }

  async searchVideos(options: VideoSearchOptions): Promise<VideoProviderResult> {
    const q = options.recipeTitle.toLowerCase().trim();
    const matches: RecipeVideoCandidate[] = [];

    this.catalog.forEach((video, key) => {
      if (q.includes(key) || (video.title && video.title.toLowerCase().includes(q))) {
        matches.push(video);
      }
    });

    return {
      candidates: matches,
      totalFound: matches.length,
      provider: this.id
    };
  }

  async getVideoById(videoId: string): Promise<RecipeVideoCandidate | null> {
    const cleanId = parseYouTubeVideoId(videoId);
    if (!cleanId) return null;

    return {
      videoId: cleanId,
      provider: 'youtube',
      url: `https://www.youtube.com/watch?v=${cleanId}`,
      embedUrl: buildYouTubeEmbedUrl(cleanId),
      language: 'tr',
      permissionStatus: 'authorized_embed',
      isOfficialRecipeVideo: false
    };
  }
}

/**
 * Live YouTube Data API v3 Provider (Network & API Key Enabled).
 * Gracefully handles missing credentials, rate limits (403/429), and network errors without throwing.
 */
export class LiveYouTubeVideoProvider implements RecipeVideoProvider {
  readonly id = 'youtube_api_provider';
  readonly name = 'YouTube Data API v3 Provider';

  private apiKey?: string;

  constructor(options?: { apiKey?: string }) {
    this.apiKey = options?.apiKey || (typeof process !== 'undefined' && process.env ? process.env.YOUTUBE_API_KEY : undefined);
  }

  async searchVideos(options: VideoSearchOptions): Promise<VideoProviderResult> {
    if (!this.apiKey || this.apiKey.trim().length === 0) {
      return {
        candidates: [],
        totalFound: 0,
        provider: this.id
      };
    }

    try {
      const q = encodeURIComponent(`${options.recipeTitle} recipe cooking tutorial`);
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${q}&maxResults=5&key=${this.apiKey}`;
      
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) {
        return { candidates: [], totalFound: 0, provider: this.id };
      }

      const data = await res.json();
      const items = data.items || [];
      const candidates: RecipeVideoCandidate[] = [];

      for (const item of items) {
        const vidId = item.id?.videoId;
        const cleanId = parseYouTubeVideoId(vidId);
        if (cleanId) {
          candidates.push({
            videoId: cleanId,
            provider: 'youtube',
            url: `https://www.youtube.com/watch?v=${cleanId}`,
            embedUrl: buildYouTubeEmbedUrl(cleanId),
            title: item.snippet?.title || `${options.recipeTitle} Video`,
            channelTitle: item.snippet?.channelTitle || 'YouTube Creator',
            language: options.language || 'global',
            permissionStatus: 'authorized_embed',
            isOfficialRecipeVideo: true
          });
        }
      }

      return {
        candidates,
        totalFound: candidates.length,
        provider: this.id
      };
    } catch {
      // Safe fallback on any network or parse error
      return {
        candidates: [],
        totalFound: 0,
        provider: this.id
      };
    }
  }

  async getVideoById(videoId: string): Promise<RecipeVideoCandidate | null> {
    const cleanId = parseYouTubeVideoId(videoId);
    if (!cleanId) return null;

    return {
      videoId: cleanId,
      provider: 'youtube',
      url: `https://www.youtube.com/watch?v=${cleanId}`,
      embedUrl: buildYouTubeEmbedUrl(cleanId),
      language: 'global',
      permissionStatus: 'authorized_embed',
      isOfficialRecipeVideo: false
    };
  }
}

