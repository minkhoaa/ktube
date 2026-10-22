export interface VideoItem {
  id: string;
  title: string;
  author: string;
  authorAvatar?: string;
  duration?: string;
  views?: string;
  published?: string;
  thumbnail: string;
  description?: string;
}

export interface ChannelItem {
  id: string;
  name: string;
  avatar: string;
  subscriberCount: string;
  description?: string;
}

export interface AudioTrack {
  itag: number;
  language: string;
  displayName: string;
  isDefault: boolean;
  isDubbed: boolean;
  isAutoDubbed: boolean;
}

export interface VideoInfo {
  id: string;
  title: string;
  author: string;
  description: string;
  duration: number;
  thumbnails: Array<{ url: string; width: number; height: number }>;
  videoQualities: string[];
  audioTracks: AudioTrack[];
  hasVietnameseAudio: boolean;
  vietnameseAudioTrack: AudioTrack | null;
  hasHls: boolean;
}

export interface CommentItem {
  id: string;
  author: {
    name: string;
    avatar: string;
  };
  content: string;
  published: string;
  likes: string;
  replyCount: number;
  isPinned?: boolean;
}

export interface SearchFilters {
  upload_date?: string;
  duration?: string;
  type?: string;
  sort_by?: string;
}
