const YOUTUBE_API_KEY = "AIzaSyDctADO_spUkRULHkBOodSR6awtOBN0hFc";
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

  // If a channelId is provided, prefer using the official uploads playlist for accuracy
  if (channelId) {
    try {
      // 1) Get the channel uploads playlist id
      const channelRes = await fetch(
        `${YOUTUBE_API_BASE_URL}/channels?part=contentDetails&id=${channelId}&key=${YOUTUBE_API_KEY}`
      );
      if (!channelRes.ok) throw new Error(`YouTube channels error: ${channelRes.status}`);
      const channelData = await channelRes.json();
      const uploadsId = channelData?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

      if (uploadsId) {
        // 2) Read latest items from the uploads playlist
        const playlistParams = new URLSearchParams({
          part: 'snippet',
          playlistId: uploadsId,
          maxResults: maxResults.toString(),
          key: YOUTUBE_API_KEY,
        });

        const playlistRes = await fetch(
          `${YOUTUBE_API_BASE_URL}/playlistItems?${playlistParams.toString()}`
        );
        if (!playlistRes.ok) throw new Error(`YouTube playlistItems error: ${playlistRes.status}`);
        const playlistData = await playlistRes.json();

        // Map playlist items to our shape
        const videos: YouTubeVideo[] = (playlistData.items || []).map((item: any) => ({
          id: item.snippet.resourceId?.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url,
          publishedAt: item.snippet.publishedAt,
          channelId: item.snippet.channelId,
          channelTitle: item.snippet.channelTitle,
        }));

        // Playlist is already reverse-chronological, but if "order" is provided differently we could sort here.
        return videos;
      }
    } catch (err) {
      console.error('Error using uploads playlist flow, falling back to search API:', err);
      // Fall through to generic search below
    }
  }

  // Fallback/generic: use the Search API
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
