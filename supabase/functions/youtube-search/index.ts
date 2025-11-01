import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const YOUTUBE_API_BASE_URL = "https://www.googleapis.com/youtube/v3";

type Video = {
  id?: string;
  title?: string;
  description?: string;
  thumbnail?: string;
  publishedAt?: string;
  channelId?: string;
  channelTitle?: string;
};

const asRecord = (v: unknown): Record<string, unknown> | undefined => (v && typeof v === 'object' ? v as Record<string, unknown> : undefined);
const getString = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined);

interface YouTubeSearchParams {
  channelId?: string;
  query?: string;
  maxResults?: number;
  order?: 'date' | 'relevance' | 'viewCount';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');
    
    if (!YOUTUBE_API_KEY) {
      throw new Error('YouTube API key not configured');
    }

    const params: YouTubeSearchParams = await req.json();
    const {
      channelId,
      query = '',
      maxResults = 8,
      order = 'date'
    } = params;

    console.log('YouTube search request:', { channelId, query, maxResults, order });

    // If a channelId is provided, use the uploads playlist for accuracy
    if (channelId) {
      try {
        // Get the channel uploads playlist id
        const channelRes = await fetch(
          `${YOUTUBE_API_BASE_URL}/channels?part=contentDetails&id=${channelId}&key=${YOUTUBE_API_KEY}`
        );
        
        if (!channelRes.ok) {
          throw new Error(`YouTube channels error: ${channelRes.status}`);
        }
        
        const channelData = await channelRes.json();
        const uploadsId = channelData?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

        if (uploadsId) {
            const videos: Video[] = [];
          let nextPageToken: string | undefined;
          const perPageLimit = 50;

          while (videos.length < maxResults) {
            const playlistParams: URLSearchParams = new URLSearchParams({
              part: 'snippet',
              playlistId: uploadsId,
              maxResults: Math.min(perPageLimit, maxResults - videos.length).toString(),
              key: YOUTUBE_API_KEY,
            });

            if (nextPageToken) {
              playlistParams.append('pageToken', nextPageToken);
            }

            const playlistRes: Response = await fetch(
              `${YOUTUBE_API_BASE_URL}/playlistItems?${playlistParams.toString()}`
            );
            
            if (!playlistRes.ok) {
              throw new Error(`YouTube playlistItems error: ${playlistRes.status}`);
            }
            
            const playlistData = await playlistRes.json() as unknown;
            const playlistObj = asRecord(playlistData);

            const items = (playlistObj?.items as unknown[] | undefined) || [];

            const pageVideos: Video[] = items.map((it) => {
              const item = asRecord(it) || {};
              const snippet = asRecord(item.snippet) || {};
              const resourceId = asRecord(snippet.resourceId) || {};
              const thumbnails = asRecord(snippet.thumbnails) || {};
              const high = asRecord(thumbnails.high) || {};
              const medium = asRecord(thumbnails.medium) || {};

              return {
                id: getString(resourceId.videoId),
                title: getString(snippet.title),
                description: getString(snippet.description),
                thumbnail: getString(high.url) || getString(medium.url),
                publishedAt: getString(snippet.publishedAt),
                channelId: getString(snippet.channelId),
                channelTitle: getString(snippet.channelTitle),
              };
            });

            videos.push(...pageVideos);

            nextPageToken = getString((playlistObj as Record<string, unknown>)?.nextPageToken);
            if (!nextPageToken || pageVideos.length === 0) {
              break;
            }
          }

          console.log(`Successfully fetched ${videos.length} videos from uploads playlist`);
          return new Response(JSON.stringify(videos), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } catch (err) {
        console.error('Error using uploads playlist, falling back to search API:', err);
      }
    }

    // Fallback: use the Search API
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

    const response = await fetch(
      `${YOUTUBE_API_BASE_URL}/search?${searchParams.toString()}`
    );

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json() as unknown;
    const dataObj = asRecord(data);
    const items = (dataObj?.items as unknown[] | undefined) || [];

    const videos: Video[] = items.map((it) => {
      const item = asRecord(it) || {};
      const idObj = asRecord(item.id) || {};
      const snippet = asRecord(item.snippet) || {};
      const thumbnails = asRecord(snippet.thumbnails) || {};
      const high = asRecord(thumbnails.high) || {};
      const medium = asRecord(thumbnails.medium) || {};

      return {
        id: getString(idObj.videoId),
        title: getString(snippet.title),
        description: getString(snippet.description),
        thumbnail: getString(high.url) || getString(medium.url),
        publishedAt: getString(snippet.publishedAt),
        channelId: getString(snippet.channelId),
        channelTitle: getString(snippet.channelTitle),
      };
    });

    console.log(`Successfully fetched ${videos.length} videos from search API`);
    return new Response(JSON.stringify(videos), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('YouTube search error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

