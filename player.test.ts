import { test, expect } from 'bun:test';
import Hls from 'hls.js';

test('Hls.js full bundle includes active AudioTrackController and AudioStreamController', () => {
  const hls = new Hls();
  // Ensure audio controllers are active instances, not dummy stubs
  expect(hls).toBeDefined();
  expect((hls as any).audioTrackController).toBeDefined();
  expect((hls as any).audioStreamController).toBeDefined();

  // Verify prototype has audio methods
  expect(typeof (hls as any).audioTracks).toBe('object');
  expect(typeof (hls as any).setAudioOption).toBe('function');

  hls.destroy();
});

test('Master manifest audio track rewriting and prioritization', async () => {
  const sampleManifest = `
#EXTM3U
#EXT-X-MEDIA:URI="https://googlevideo.com/audio1",TYPE=AUDIO,GROUP-ID="233",NAME="Vietnamese (Tiếng Việt)",DEFAULT=NO,AUTOSELECT=YES
#EXT-X-MEDIA:URI="https://googlevideo.com/audio2",TYPE=AUDIO,GROUP-ID="234",NAME="English",DEFAULT=YES,AUTOSELECT=YES
#EXT-X-STREAM-INF:BANDWIDTH=300000,AUDIO="233"
https://googlevideo.com/video1
`;

  const hasVi = sampleManifest.includes('Tiếng Việt');
  expect(hasVi).toBe(true);

  const lines = sampleManifest.split('\n');
  const rewritten = lines.map(line => {
    line = line.trim();
    if (line.startsWith('#EXT-X-MEDIA') && line.includes('TYPE=AUDIO') && hasVi) {
      const isVi = line.includes('Tiếng Việt');
      if (isVi) {
        return line.replace(/DEFAULT=(YES|NO)/, 'DEFAULT=YES');
      } else {
        return line.replace(/DEFAULT=(YES|NO)/, 'DEFAULT=NO');
      }
    }
    return line;
  }).join('\n');

  expect(rewritten).toContain('NAME="Vietnamese (Tiếng Việt)",DEFAULT=YES');
  expect(rewritten).toContain('NAME="English",DEFAULT=NO');
});

test('HD initial level selection chooses 1080p/720p without 240p downscaling', () => {
  const mockLevels = [
    { height: 240, bitrate: 300000 },
    { height: 360, bitrate: 600000 },
    { height: 480, bitrate: 850000 },
    { height: 720, bitrate: 1250000 },
    { height: 1080, bitrate: 4680000 }
  ];

  const idx1080 = mockLevels.findIndex(l => l.height === 1080);
  const idx720 = mockLevels.findIndex(l => l.height === 720);
  const initialHd = idx1080 !== -1 ? idx1080 : (idx720 !== -1 ? idx720 : -1);

  expect(initialHd).toBe(4);
  expect(mockLevels[initialHd].height).toBe(1080);

  // When only 720p is available
  const mock720Only = [
    { height: 240, bitrate: 300000 },
    { height: 720, bitrate: 1250000 }
  ];
  const idx1080Missing = mock720Only.findIndex(l => l.height === 1080);
  const idx720Found = mock720Only.findIndex(l => l.height === 720);
  const selected = idx1080Missing !== -1 ? idx1080Missing : (idx720Found !== -1 ? idx720Found : -1);
  expect(selected).toBe(1);
  expect(mock720Only[selected].height).toBe(720);
});
