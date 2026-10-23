import { getLibraryData, getSearchHistory } from './libraryStore';

export interface SearchSuggestionItem {
  text: string;
  type: 'history' | 'personalized' | 'suggestion';
}

function foldDiacritics(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

const SYNONYM_MAP: Record<string, string[]> = {
  'nhac': ['nhạc lofi chill', 'nhạc trẻ remix', 'edm thư giãn', 'acoustic nhẹ nhàng'],
  'nhạc': ['nhạc lofi chill', 'nhạc trẻ remix', 'edm thư giãn', 'acoustic nhẹ nhàng'],
  'music': ['lofi chill music', 'relaxing acoustic', 'edm remix hits'],
  'phim': ['review phim', 'phim ngắn ý nghĩa', 'trailer phim mới', 'phim chiếu rạp'],
  'movie': ['movie trailer', 'short film', 'movie review'],
  'game': ['gameplay walkthrough', 'livestream game', 'highlights trò chơi'],
  'gaming': ['gameplay walkthrough', 'highlights gaming', 'livestream game'],
  'lap trinh': ['hướng dẫn lập trình', 'coding tutorial', 'javascript cơ bản', 'python cho người mới'],
  'lập trình': ['hướng dẫn lập trình', 'coding tutorial', 'javascript cơ bản', 'python cho người mới'],
  'coding': ['coding tutorial', 'python programming', 'web development'],
  'tin tuc': ['tin tức 24h', 'thời sự hôm nay', 'tin nóng việt nam'],
  'tin tức': ['tin tức 24h', 'thời sự hôm nay', 'tin nóng việt nam'],
  'hoat hinh': ['phim hoạt hình hay', 'anime vietsub', 'hoạt hình 3d'],
  'hoạt hình': ['phim hoạt hình hay', 'anime vietsub', 'hoạt hình 3d'],
  'anime': ['anime vietsub hay', 'anime chill', 'top anime mùa này']
};

export function getSynonymExpansions(query: string): string[] {
  const q = (query || '').trim().toLowerCase();
  if (!q) return [];

  const qFolded = foldDiacritics(q);
  const results = new Set<string>();

  for (const [key, expansions] of Object.entries(SYNONYM_MAP)) {
    const keyFolded = foldDiacritics(key);
    if (q.includes(key) || qFolded.includes(keyFolded) || key.includes(q) || keyFolded.includes(qFolded)) {
      for (const item of expansions) {
        results.add(item);
      }
    }
  }

  return Array.from(results).slice(0, 6);
}

export function detectQueryIntent(query: string): {
  isLive: boolean;
  isShorts: boolean;
  isMusic: boolean;
} {
  const q = foldDiacritics((query || '').trim().toLowerCase());

  const liveKeywords = ['truc tiep', 'live', 'livestream', 'stream'];
  const shortsKeywords = ['shorts', 'short', 'tiktok', 'video ngan'];
  const musicKeywords = ['nhac', 'music', 'song', 'lofi', 'chill', 'remix', 'bai hat', 'ca khuc', 'acoustic'];

  const isLive = liveKeywords.some((k) => q.includes(k));
  const isShorts = shortsKeywords.some((k) => q.includes(k));
  const isMusic = musicKeywords.some((k) => q.includes(k));

  return { isLive, isShorts, isMusic };
}

export function getPersonalizedSuggestions(query: string): SearchSuggestionItem[] {
  const q = (query || '').trim().toLowerCase();
  const qFolded = foldDiacritics(q);

  const seen = new Set<string>();
  const output: SearchSuggestionItem[] = [];

  // 1. Search History matches (Priority 1)
  const history = getSearchHistory();
  for (const h of history) {
    const hText = h.query.trim();
    const hLower = hText.toLowerCase();
    const hFolded = foldDiacritics(hLower);

    if (!q || hLower.includes(q) || hFolded.includes(qFolded)) {
      if (!seen.has(hLower)) {
        seen.add(hLower);
        output.push({ text: hText, type: 'history' });
      }
    }
    if (output.length >= 8) return output;
  }

  // 2. Subscribed Channels matches (Priority 2)
  const library = getLibraryData();
  for (const sub of library.subscriptions) {
    const name = sub.channelName.trim();
    const nameLower = name.toLowerCase();
    const nameFolded = foldDiacritics(nameLower);

    if (q && (nameLower.includes(q) || nameFolded.includes(qFolded))) {
      if (!seen.has(nameLower)) {
        seen.add(nameLower);
        output.push({ text: name, type: 'personalized' });
      }
    }
    if (output.length >= 8) return output;
  }

  // 3. Watch History titles / authors matches (Priority 3)
  for (const watched of library.history) {
    const author = (watched.author || '').trim();
    if (author && q && (author.toLowerCase().includes(q) || foldDiacritics(author.toLowerCase()).includes(qFolded))) {
      if (!seen.has(author.toLowerCase())) {
        seen.add(author.toLowerCase());
        output.push({ text: author, type: 'personalized' });
      }
    }
    if (output.length >= 8) return output;
  }

  return output;
}
