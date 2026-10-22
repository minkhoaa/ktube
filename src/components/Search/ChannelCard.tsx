import type { ChannelItem } from '../../types';
import './ChannelCard.css';

interface ChannelCardProps {
  channel: ChannelItem;
}

export function ChannelCard({ channel }: ChannelCardProps) {
  return (
    <div className="channel-card">
      <img
        className="channel-card-avatar"
        src={channel.avatar || 'https://via.placeholder.com/100?text=Channel'}
        alt={channel.name}
        loading="lazy"
      />
      <div className="channel-card-info">
        <h3 className="channel-card-name">{channel.name}</h3>
        <span className="channel-card-subs">{channel.subscriberCount}</span>
        {channel.description && <p className="channel-card-desc">{channel.description}</p>}
      </div>
      <button className="subscribe-btn" title="Đăng ký kênh">
        Đăng ký
      </button>
    </div>
  );
}
