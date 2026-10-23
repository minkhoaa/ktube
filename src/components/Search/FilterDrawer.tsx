import { useState } from 'preact/hooks';
import type { SearchFilters } from '../../types';
import './FilterDrawer.css';

interface FilterDrawerProps {
  filters: SearchFilters;
  onFilterChange: (filters: SearchFilters) => void;
}

export function FilterDrawer({ filters, onFilterChange }: FilterDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (key: keyof SearchFilters, value: string | undefined) => {
    const updated = { ...filters };
    if (updated[key] === value || value === undefined) {
      delete updated[key];
    } else {
      updated[key] = value;
    }
    onFilterChange(updated);
  };

  const currentFeatures: string[] = Array.isArray(filters.features)
    ? filters.features
    : typeof filters.features === 'string'
    ? filters.features.split(',').map((f) => f.trim()).filter(Boolean)
    : [];

  const handleFeatureToggle = (feat: string) => {
    const list = [...currentFeatures];
    const idx = list.indexOf(feat);
    if (idx >= 0) {
      list.splice(idx, 1);
    } else {
      list.push(feat);
    }

    const updated = { ...filters };
    if (list.length === 0) {
      delete updated.features;
    } else {
      updated.features = list;
    }
    onFilterChange(updated);
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <div className="filter-drawer-container">
      <div className="filter-header-bar">
        <button className="filter-toggle-btn" onClick={() => setIsOpen(!isOpen)}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" />
          </svg>
          <span>Bộ lọc {hasActiveFilters ? `(${Object.keys(filters).length})` : ''}</span>
        </button>

        {hasActiveFilters && (
          <button className="clear-filters-btn" onClick={() => onFilterChange({})}>
            Xóa bộ lọc
          </button>
        )}
      </div>

      {isOpen && (
        <div className="filter-drawer-content">
          {/* 1. Ngày tải lên */}
          <div className="filter-column">
            <div className="filter-column-title">Ngày tải lên</div>
            <div className="filter-options-list">
              <span
                className={`filter-option-item ${!filters.upload_date ? 'active' : ''}`}
                onClick={() => handleSelect('upload_date', undefined)}
              >
                Mọi lúc
              </span>
              <span
                className={`filter-option-item ${filters.upload_date === 'hour' ? 'active' : ''}`}
                onClick={() => handleSelect('upload_date', 'hour')}
              >
                Giờ qua
              </span>
              <span
                className={`filter-option-item ${filters.upload_date === 'today' ? 'active' : ''}`}
                onClick={() => handleSelect('upload_date', 'today')}
              >
                Hôm nay
              </span>
              <span
                className={`filter-option-item ${filters.upload_date === 'this_week' ? 'active' : ''}`}
                onClick={() => handleSelect('upload_date', 'this_week')}
              >
                Tuần này
              </span>
              <span
                className={`filter-option-item ${filters.upload_date === 'this_month' ? 'active' : ''}`}
                onClick={() => handleSelect('upload_date', 'this_month')}
              >
                Tháng này
              </span>
              <span
                className={`filter-option-item ${filters.upload_date === 'this_year' ? 'active' : ''}`}
                onClick={() => handleSelect('upload_date', 'this_year')}
              >
                Năm nay
              </span>
            </div>
          </div>

          {/* 2. Thời lượng */}
          <div className="filter-column">
            <div className="filter-column-title">Thời lượng</div>
            <div className="filter-options-list">
              <span
                className={`filter-option-item ${!filters.duration ? 'active' : ''}`}
                onClick={() => handleSelect('duration', undefined)}
              >
                Mọi thời lượng
              </span>
              <span
                className={`filter-option-item ${filters.duration === 'short' ? 'active' : ''}`}
                onClick={() => handleSelect('duration', 'short')}
              >
                Dưới 4 phút
              </span>
              <span
                className={`filter-option-item ${filters.duration === 'medium' ? 'active' : ''}`}
                onClick={() => handleSelect('duration', 'medium')}
              >
                4 - 20 phút
              </span>
              <span
                className={`filter-option-item ${filters.duration === 'long' ? 'active' : ''}`}
                onClick={() => handleSelect('duration', 'long')}
              >
                Trên 20 phút
              </span>
            </div>
          </div>

          {/* 3. Loại */}
          <div className="filter-column">
            <div className="filter-column-title">Loại nội dung</div>
            <div className="filter-options-list">
              <span
                className={`filter-option-item ${!filters.type ? 'active' : ''}`}
                onClick={() => handleSelect('type', undefined)}
              >
                Tất cả
              </span>
              <span
                className={`filter-option-item ${filters.type === 'video' ? 'active' : ''}`}
                onClick={() => handleSelect('type', 'video')}
              >
                Video
              </span>
              <span
                className={`filter-option-item ${filters.type === 'shorts' ? 'active' : ''}`}
                onClick={() => handleSelect('type', 'shorts')}
              >
                Shorts
              </span>
              <span
                className={`filter-option-item ${filters.type === 'channel' ? 'active' : ''}`}
                onClick={() => handleSelect('type', 'channel')}
              >
                Kênh
              </span>
              <span
                className={`filter-option-item ${filters.type === 'playlist' ? 'active' : ''}`}
                onClick={() => handleSelect('type', 'playlist')}
              >
                Danh sách phát
              </span>
            </div>
          </div>

          {/* 4. Đặc điểm (Multi-select) */}
          <div className="filter-column">
            <div className="filter-column-title">Đặc điểm video</div>
            <div className="filter-options-list">
              <span
                className={`filter-option-item feature-item ${currentFeatures.includes('hd') ? 'active' : ''}`}
                onClick={() => handleFeatureToggle('hd')}
              >
                <span className="feature-checkbox">{currentFeatures.includes('hd') ? '✓' : ''}</span>
                <span>Độ nét cao (HD)</span>
              </span>
              <span
                className={`filter-option-item feature-item ${currentFeatures.includes('subtitles') ? 'active' : ''}`}
                onClick={() => handleFeatureToggle('subtitles')}
              >
                <span className="feature-checkbox">{currentFeatures.includes('subtitles') ? '✓' : ''}</span>
                <span>Phụ đề (CC)</span>
              </span>
              <span
                className={`filter-option-item feature-item ${currentFeatures.includes('live') ? 'active' : ''}`}
                onClick={() => handleFeatureToggle('live')}
              >
                <span className="feature-checkbox">{currentFeatures.includes('live') ? '✓' : ''}</span>
                <span>Trực tiếp (Live)</span>
              </span>
            </div>
          </div>

          {/* 5. Sắp xếp theo */}
          <div className="filter-column">
            <div className="filter-column-title">Sắp xếp theo</div>
            <div className="filter-options-list">
              <span
                className={`filter-option-item ${!filters.sort_by || filters.sort_by === 'relevance' ? 'active' : ''}`}
                onClick={() => handleSelect('sort_by', 'relevance')}
              >
                Mức độ liên quan
              </span>
              <span
                className={`filter-option-item ${filters.sort_by === 'upload_date' ? 'active' : ''}`}
                onClick={() => handleSelect('sort_by', 'upload_date')}
              >
                Ngày tải lên
              </span>
              <span
                className={`filter-option-item ${filters.sort_by === 'view_count' ? 'active' : ''}`}
                onClick={() => handleSelect('sort_by', 'view_count')}
              >
                Lượt xem
              </span>
              <span
                className={`filter-option-item ${filters.sort_by === 'rating' ? 'active' : ''}`}
                onClick={() => handleSelect('sort_by', 'rating')}
              >
                Xếp hạng cao
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
