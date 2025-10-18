const YOUTUBE_API_KEY = "AIzaSyDInlp_GeJCHDkUvVrtzWSAVfwwU5lHNEY";
const YOUTUBE_API_BASE_URL = "https://www.googleapis.com/youtube/v3";

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  channelId: string;
  channelTitle: string;
}

export interface YouTubeSearchParams {
  channelId?: string;
  query?: string;
  maxResults?: number;
  order?: 'date' | 'relevance' | 'viewCount';
}

export async function searchYouTubeVideos(params: YouTubeSearchParams): Promise<YouTubeVideo[]> {
  const {
    channelId,
    query = '',
    maxResults = 8,
    order = 'date'
  } = params;

  const searchParams = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    maxResults: maxResults.toString(),
    order,
    key: YOUTUBE_API_KEY,
  });

  if (channelId) {
    searchParams.append('channelId', channelId);
  }

  if (query) {
    searchParams.append('q', query);
  }

  try {
    const response = await fetch(
      `${YOUTUBE_API_BASE_URL}/search?${searchParams.toString()}`
    );

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();

    return data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
      publishedAt: item.snippet.publishedAt,
      channelId: item.snippet.channelId,
      channelTitle: item.snippet.channelTitle,
    }));
  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    return [];
  }
}

export async function getChannelVideos(channelId: string, maxResults: number = 8): Promise<YouTubeVideo[]> {
  return searchYouTubeVideos({ channelId, maxResults });
}
