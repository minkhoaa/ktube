import { describe, test, expect, beforeEach } from 'bun:test';
import { getPersonalizedSuggestions, getSynonymExpansions, detectQueryIntent } from './searchIntelligence';
import { addSearchQuery, clearSearchHistory } from './libraryStore';

describe('Search Intelligence Service', () => {
  beforeEach(() => {
    clearSearchHistory();
  });

  test('returns matching search history items first', () => {
    addSearchQuery('nhac lofi chill');
    addSearchQuery('hoc lap trinh python');

    const suggestions = getPersonalizedSuggestions('nhac');
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0].text).toBe('nhac lofi chill');
    expect(suggestions[0].type).toBe('history');
  });

  test('expands synonyms for known topics (e.g. nhac -> lofi, edm; phim -> trailer, movie)', () => {
    const musicSynonyms = getSynonymExpansions('nhạc');
    expect(musicSynonyms.length).toBeGreaterThan(0);
    expect(musicSynonyms.some(s => s.toLowerCase().includes('lofi') || s.toLowerCase().includes('chill') || s.toLowerCase().includes('nhạc'))).toBe(true);

    const codingSynonyms = getSynonymExpansions('lập trình');
    expect(codingSynonyms.length).toBeGreaterThan(0);
    expect(codingSynonyms.some(s => s.toLowerCase().includes('tutorial') || s.toLowerCase().includes('coding') || s.toLowerCase().includes('lập trình'))).toBe(true);
  });

  test('detects intent correctly (live, shorts, music)', () => {
    expect(detectQueryIntent('xem bóng đá trực tiếp').isLive).toBe(true);
    expect(detectQueryIntent('video shorts vui nhộn').isShorts).toBe(true);
    expect(detectQueryIntent('nghe nhạc thư giãn').isMusic).toBe(true);
    expect(detectQueryIntent('hướng dẫn nấu ăn').isLive).toBe(false);
  });
});
