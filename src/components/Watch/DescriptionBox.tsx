import { useState } from 'preact/hooks';
import './DescriptionBox.css';

interface DescriptionBoxProps {
  description: string;
}

export function DescriptionBox({ description }: DescriptionBoxProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!description) return null;

  return (
    <div className="description-box" onClick={() => setIsExpanded(!isExpanded)}>
      <div className="desc-header-stats">
        <span>Thông tin & Mô tả video</span>
      </div>

      <div className={`desc-body-text ${isExpanded ? '' : 'collapsed'}`}>
        {description}
      </div>

      <span className="desc-toggle-btn">
        {isExpanded ? 'Ẩn bớt' : '...Thêm'}
      </span>
    </div>
  );
}
