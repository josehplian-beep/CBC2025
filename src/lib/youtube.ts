import { supabase } from "@/integrations/supabase/client";

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
  try {
    const { data, error } = await supabase.functions.invoke('youtube-search', {
      body: params,
    });

    if (error) {
      return [];
    }

    return data || [];
  } catch (error) {
    return [];
  }
}

export async function getChannelVideos(channelId: string, maxResults: number = 8): Promise<YouTubeVideo[]> {
  return searchYouTubeVideos({ channelId, maxResults });
}
