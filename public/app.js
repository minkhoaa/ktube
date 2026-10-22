document.addEventListener('DOMContentLoaded', () => {
  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');
  const playerSection = document.getElementById('player-section');
  const videoElement = document.getElementById('video-element');
  const loadingOverlay = document.getElementById('loading-overlay');
  const videoTitle = document.getElementById('video-title');
  const videoAuthor = document.getElementById('video-author');
  const videoDesc = document.getElementById('video-desc');
  const videoGrid = document.getElementById('video-grid');
  const pipBtn = document.getElementById('pip-btn');
  const audioSelect = document.getElementById('audio-select');
  const qualityPill = document.getElementById('quality-pill');
  const vietnameseDubAlert = document.getElementById('vietnamese-dub-alert');
  const chips = document.querySelectorAll('.chip');

  let hlsInstance = null;
  let currentVideoId = null;

  function cleanVideoId(raw) {
    if (!raw) return '';
    raw = raw.trim();
    if (raw.includes('v=')) {
      return raw.split('v=')[1].split('&')[0];
    }
    if (raw.includes('youtu.be/')) {
      return raw.split('youtu.be/')[1].split('?')[0];
    }
    if (raw.includes('/shorts/')) {
      return raw.split('/shorts/')[1].split('?')[0];
    }
    return raw;
  }

  // Setup Chips
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const vid = chip.getAttribute('data-id');
      if (vid) loadAndPlayVideo(vid);
    });
  });

  // Audio Select change listener
  audioSelect.addEventListener('change', (e) => {
    const selectedIdx = parseInt(e.target.value, 10);
    if (hlsInstance && !isNaN(selectedIdx) && hlsInstance.audioTracks[selectedIdx]) {
      console.log(`[Audio] Switching HLS audio track to index ${selectedIdx}:`, hlsInstance.audioTracks[selectedIdx]);
      hlsInstance.audioTrack = selectedIdx;
    } else if (videoElement.audioTracks) {
      for (let i = 0; i < videoElement.audioTracks.length; i++) {
        videoElement.audioTracks[i].enabled = (i === selectedIdx);
      }
    }
  });

  // Search Form
  searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (!query) return;

    // Check if query is a YouTube URL or direct ID
    if (query.includes('youtu.be/') || query.includes('watch?v=') || /^[a-zA-Z0-9_-]{11}$/.test(query)) {
      loadAndPlayVideo(query);
    } else {
      performSearch(query);
    }
  });

  // Search API
  async function performSearch(query) {
    try {
      videoGrid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 40px; color: #888;">Đang tìm kiếm...</div>';
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();

      if (!data.results || data.results.length === 0) {
        videoGrid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 40px;">Không tìm thấy video nào.</div>';
        return;
      }

      renderVideoGrid(data.results);
    } catch (err) {
      console.error('Search error:', err);
      videoGrid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; color: #ff4444; padding: 40px;">Lỗi khi tìm kiếm video.</div>';
    }
  }

  // Render Video Grid
  function renderVideoGrid(videos) {
    videoGrid.innerHTML = '';
    videos.forEach(v => {
      const card = document.createElement('div');
      card.className = 'video-card';
      card.innerHTML = `
        <div class="thumb-wrapper">
          <img src="${v.thumbnail}" alt="${v.title}" loading="lazy" />
          <span class="duration-tag">${v.duration || 'Video'}</span>
        </div>
        <div class="card-info">
          <h3 class="card-title">${v.title}</h3>
          <p class="card-author">${v.author}</p>
          <p class="card-stats">${v.views ? v.views + ' • ' : ''}${v.published || ''}</p>
        </div>
      `;
      card.addEventListener('click', () => {
        loadAndPlayVideo(v.id);
      });
      videoGrid.appendChild(card);
    });
  }

  // Helper to sync audio tracks to dropdown
  function syncAudioTracks(tracks, currentIdx) {
    if (!tracks || tracks.length <= 1) {
      audioSelect.innerHTML = '<option value="0">Gốc (Default)</option>';
      return 0;
    }

    audioSelect.innerHTML = '';
    let viIndex = -1;

    tracks.forEach((track, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      const lang = (track.lang || track.language || '').toLowerCase();
      const name = (track.name || track.label || '').toLowerCase();
      const isVi = lang.startsWith('vi') || name.includes('vietnam') || name.includes('tiếng việt');

      opt.textContent = `${isVi ? '🇻🇳 ' : ''}${track.name || track.label || lang.toUpperCase() || ('Kênh ' + (idx + 1))}`;
      
      if (track.default || (isVi && viIndex === -1)) {
        viIndex = idx;
      }

      audioSelect.appendChild(opt);
    });

    const activeIdx = (currentIdx >= 0 && currentIdx < tracks.length) ? currentIdx : (viIndex !== -1 ? viIndex : 0);
    audioSelect.value = activeIdx;

    if (viIndex !== -1) {
      vietnameseDubAlert.classList.remove('hidden');
    } else {
      vietnameseDubAlert.classList.add('hidden');
    }

    return activeIdx;
  }

  // Load and Play Video
  async function loadAndPlayVideo(rawId) {
    const cleanId = cleanVideoId(rawId);
    if (!cleanId) return;

    playerSection.classList.remove('hidden');
    loadingOverlay.classList.remove('hidden');
    loadingOverlay.innerHTML = '<div class="spinner"></div><p>Đang kết nối luồng phát YouTube...</p>';
    playerSection.scrollIntoView({ behavior: 'smooth' });

    try {
      // 1. Fetch Video Metadata
      const infoRes = await fetch(`/api/info?v=${encodeURIComponent(cleanId)}`);
      if (!infoRes.ok) throw new Error('Không thể lấy thông tin video');
      const info = await infoRes.json();
      currentVideoId = info.id;

      // Update UI
      videoTitle.textContent = info.title;
      videoAuthor.textContent = info.author;
      videoDesc.textContent = info.description || 'Không có mô tả.';

      if (info.hasVietnameseAudio) {
        vietnameseDubAlert.classList.remove('hidden');
      } else {
        vietnameseDubAlert.classList.add('hidden');
      }

      // Initial audio select placeholder
      audioSelect.innerHTML = '<option value="0">Đang nhận diện âm thanh...</option>';

      // Setup Media Session API
      setupMediaSession(info);

      // 2. Load Stream via HLS
      const streamUrl = `/api/stream/master.m3u8?v=${encodeURIComponent(cleanId)}`;

      if (Hls.isSupported()) {
        if (hlsInstance) {
          hlsInstance.destroy();
        }

        hlsInstance = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          startLevel: 0, // Loads the lowest resolution chunk first (< 50KB) for instant start
          startFragPrefetch: true, // Prefetches the next fragment ahead of time
          capLevelToPlayerSize: true, // Optimizes bandwidth according to display resolution
          maxBufferLength: 60,
          maxMaxBufferLength: 120,
          backBufferLength: 60,
          audioPreference: {
            lang: 'vi'
          }
        });

        hlsInstance.loadSource(streamUrl);
        hlsInstance.attachMedia(videoElement);

        videoElement.addEventListener('playing', () => {
          if (hlsInstance && hlsInstance.autoLevelEnabled === false) {
            hlsInstance.currentLevel = -1; // Re-enable auto ABR
          }
        }, { once: true });

        hlsInstance.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
          loadingOverlay.classList.add('hidden');
          videoElement.play().catch(e => console.log('Autoplay prevented:', e));
          
          if (data.levels && data.levels.length > 0) {
            const highest = Math.max(...data.levels.map(l => l.height));
            qualityPill.textContent = `${highest}p HD`;
          }

          if (hlsInstance.audioTracks && hlsInstance.audioTracks.length > 0) {
            const chosen = syncAudioTracks(hlsInstance.audioTracks, hlsInstance.audioTrack);
            if (chosen !== undefined && hlsInstance.audioTrack !== chosen) {
              hlsInstance.audioTrack = chosen;
            }
          }
        });

        hlsInstance.on(Hls.Events.AUDIO_TRACKS_UPDATED, (event, data) => {
          const tracks = data.audioTracks || hlsInstance.audioTracks;
          const chosen = syncAudioTracks(tracks, hlsInstance.audioTrack);
          if (chosen !== undefined && hlsInstance.audioTrack !== chosen) {
            hlsInstance.audioTrack = chosen;
          }
        });

        hlsInstance.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
          const level = hlsInstance.levels[data.level];
          if (level) {
            qualityPill.textContent = `${level.height}p`;
          }
        });

        hlsInstance.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            console.error('HLS Fatal Error:', data);
            loadingOverlay.classList.remove('hidden');
            loadingOverlay.innerHTML = `
              <p style="color:#ff4444;">Lỗi phát luồng HLS (${data.type})</p>
              <button onclick="location.reload()" class="chip">Thử lại</button>
            `;
          }
        });
      } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        // Native Safari HLS
        videoElement.src = streamUrl;
        videoElement.addEventListener('loadedmetadata', () => {
          loadingOverlay.classList.add('hidden');
          videoElement.play();

          if (videoElement.audioTracks && videoElement.audioTracks.length > 0) {
            const chosen = syncAudioTracks(videoElement.audioTracks, 0);
            if (chosen !== undefined) {
              for (let i = 0; i < videoElement.audioTracks.length; i++) {
                videoElement.audioTracks[i].enabled = (i === chosen);
              }
            }
          }
        });
      } else {
        alert('Trình duyệt của bạn không hỗ trợ HLS stream.');
      }

    } catch (err) {
      console.error('Play error:', err);
      loadingOverlay.classList.remove('hidden');
      loadingOverlay.innerHTML = `<p style="color:#ff4444;">Lỗi: ${err.message}</p>`;
    }
  }

  // Media Session Setup (Lock screen controls)
  function setupMediaSession(info) {
    if ('mediaSession' in navigator) {
      const artwork = (info.thumbnails || []).map(t => ({
        src: t.url,
        sizes: `${t.width}x${t.height}`,
        type: 'image/jpeg'
      }));

      navigator.mediaSession.metadata = new MediaMetadata({
        title: info.title,
        artist: info.author,
        album: 'Pure Tuber Web (Ad-Free)',
        artwork: artwork
      });

      navigator.mediaSession.setActionHandler('play', () => videoElement.play());
      navigator.mediaSession.setActionHandler('pause', () => videoElement.pause());
      navigator.mediaSession.setActionHandler('seekbackward', () => { videoElement.currentTime = Math.max(videoElement.currentTime - 10, 0); });
      navigator.mediaSession.setActionHandler('seekforward', () => { videoElement.currentTime = Math.min(videoElement.currentTime + 10, videoElement.duration); });
    }
  }

  // Picture in Picture
  pipBtn.addEventListener('click', async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await videoElement.requestPictureInPicture();
      }
    } catch (err) {
      console.error('PiP error:', err);
    }
  });

  // Default initial search
  performSearch('MrBeast');
});
