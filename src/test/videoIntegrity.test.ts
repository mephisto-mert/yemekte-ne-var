import { describe, it, expect } from 'vitest';
import { RECIPES_DATABASE } from '../data/recipesData';
import { isValidSecureEmbedUrl, validateSecureYouTubeEmbedUrl } from '../pipeline/enrichment/videoMatcher';

describe('Universal YouTube Video Integrity Suite', () => {
  it('validates official youtube-nocookie embed URL security format', () => {
    expect(isValidSecureEmbedUrl('https://www.youtube-nocookie.com/embed/3wo7qr6PIU4')).toBe(true);
    expect(isValidSecureEmbedUrl('https://youtube.com/embed/3wo7qr6PIU4')).toBe(true);
    expect(isValidSecureEmbedUrl('http://insecure.com/video.mp4')).toBe(false);
    expect(isValidSecureEmbedUrl('javascript:alert(1)')).toBe(false);
  });

  it('guarantees 100% of production recipes have valid YouTube video integration', () => {
    RECIPES_DATABASE.forEach(r => {
      expect(r.videoId, `Recipe ${r.title} missing videoId`).toBeDefined();
      expect(typeof r.videoId).toBe('string');
      expect(r.videoId!.length).toBeGreaterThanOrEqual(5);

      const embedUrl = `https://www.youtube-nocookie.com/embed/${r.videoId}`;
      const validation = validateSecureYouTubeEmbedUrl(embedUrl);
      expect(validation.valid, `Invalid embed URL for ${r.title}: ${embedUrl}`).toBe(true);
    });
  });

  it('guarantees all video metadata contains non-empty titles and authors', () => {
    RECIPES_DATABASE.forEach(r => {
      expect(r.videoTitle, `Missing videoTitle for ${r.title}`).toBeDefined();
      expect(r.videoTitle!.length).toBeGreaterThan(3);
      expect(r.videoAuthor, `Missing videoAuthor for ${r.title}`).toBeDefined();
    });
  });
});
