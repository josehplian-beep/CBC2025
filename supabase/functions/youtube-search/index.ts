import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const YOUTUBE_API_BASE_URL = "https://www.googleapis.com/youtube/v3";

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
          const videos: any[] = [];
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
            
            const playlistData: any = await playlistRes.json();

            const pageVideos: any[] = (playlistData.items || []).map((item: any) => ({
              id: item.snippet.resourceId?.videoId,
              title: item.snippet.title,
              description: item.snippet.description,
              thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url,
              publishedAt: item.snippet.publishedAt,
              channelId: item.snippet.channelId,
              channelTitle: item.snippet.channelTitle,
            }));

            videos.push(...pageVideos);

            nextPageToken = playlistData.nextPageToken;
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

    const data = await response.json();

    const videos = data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
      publishedAt: item.snippet.publishedAt,
      channelId: item.snippet.channelId,
      channelTitle: item.snippet.channelTitle,
    }));

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

