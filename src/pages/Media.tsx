import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import VideoCard from "@/components/VideoCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Video, Images, Radio, Search } from "lucide-react";
import { searchYouTubeVideos, type YouTubeVideo } from "@/lib/youtube";
import communityImage from "@/assets/community.jpg";
import { supabase } from "@/integrations/supabase/client";

interface Album {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  photo_count?: number;
}

const Media = () => {
  const navigate = useNavigate();
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [youtubeVideos, setYoutubeVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [albumsLoading, setAlbumsLoading] = useState(true);

  useEffect(() => {
    fetchVideos();
    fetchAlbums();
  }, []);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      console.log('Starting video fetch...');
      // Fetch videos from Chin Bethel Church DC channel with retries
      let attempts = 0;
      const maxAttempts = 3;
      let videos: YouTubeVideo[] = [];
      
      while (attempts < maxAttempts && videos.length === 0) {
        console.log(`Attempt ${attempts + 1} to fetch videos...`);
        videos = await searchYouTubeVideos({
          channelId: "UCNQNT1hM2b6_jd50ja-XAeQ",
          maxResults: 200, // Increased to get more videos
          order: "date",
        });
        
        console.log(`Received ${videos.length} videos on attempt ${attempts + 1}`);
        
        if (videos.length === 0) {
          console.log(`Attempt ${attempts + 1} failed, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        }
        attempts++;
      }
      
      setYoutubeVideos(videos);
      console.log('Successfully set videos:', videos.length);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlbums = async () => {
    try {
      const { data: albumsData, error } = await supabase
        .from('albums')
        .select(`
          id,
          title,
          description,
          cover_image_url
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get photo counts for each album
      const albumsWithCounts = await Promise.all(
        (albumsData || []).map(async (album) => {
          const { count } = await supabase
            .from('photos')
            .select('*', { count: 'exact', head: true })
            .eq('album_id', album.id);

          return {
            ...album,
            photo_count: count || 0,
          };
        })
      );

      setAlbums(albumsWithCounts);
    } catch (error) {
      console.error('Error fetching albums:', error);
    } finally {
      setAlbumsLoading(false);
    }
  };

  const processedVideos = youtubeVideos.map((video) => {
    const date = new Date(video.publishedAt);
    const year = date.getFullYear().toString();
    const title = video.title.toLowerCase();
    
    console.log('Processing video:', {
      title: video.title,
      publishedAt: video.publishedAt,
      year: year
    });
    
    // Improved video categorization with more keywords
    let category: "Sermon" | "Solo" | "Choir" | "Worship & Music" | "Livestream" = "Worship & Music";
    if (title.includes("sermon") || title.includes("message") || title.includes("preaching")) {
      category = "Sermon";
    } else if (title.includes("live") || title.includes("livestream") || title.includes("service") || title.includes("sunday")) {
      category = "Livestream";
    } else if (title.includes("solo") || title.includes("special") || title.includes("song")) {
      category = "Solo";
    } else if (title.includes("choir") || title.includes("group")) {
      category = "Choir";
    } else if (title.includes("worship") || title.includes("praise") || title.includes("music")) {
      category = "Worship & Music";
    }

    return {
      title: video.title,
      date: date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      category,
      year,
      thumbnail: video.thumbnail,
      videoId: video.id,
    };
  });

  const filteredVideos = processedVideos.filter((video) => {
    const matchesCategory = categoryFilter === "all" || video.category === categoryFilter;
    const matchesYear = yearFilter === "all" || video.year === yearFilter;
    const matchesSearch = searchQuery === "" || video.title.toLowerCase().includes(searchQuery.toLowerCase());
    const notLivestream = categoryFilter === "all" ? true : video.category !== "Livestream"; // Only exclude livestreams if not specifically filtering for them
    
    console.log('Filtering video:', {
      title: video.title,
      year: video.year,
      yearFilter,
      matchesYear,
      category: video.category,
      categoryFilter,
      matchesCategory,
      willShow: matchesCategory && matchesYear && matchesSearch && notLivestream
    });
    
    return matchesCategory && matchesYear && matchesSearch && notLivestream;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="relative h-[300px] flex items-center justify-center overflow-hidden mt-20 bg-primary">
        <div className="relative z-10 text-center text-primary-foreground px-4">
          <h1 className="font-display text-5xl md:text-6xl font-bold mb-4">Media</h1>
          <p className="text-xl md:text-2xl text-primary-foreground/90">Sermons, Worship, and Church Life</p>
        </div>
      </section>

      <Tabs defaultValue="videos" className="w-full py-20">
        <div className="container mx-auto px-4">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 mb-12">
            <TabsTrigger value="videos" className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              Videos
            </TabsTrigger>
            <TabsTrigger value="livestream" className="flex items-center gap-2">
              <Radio className="w-4 h-4" />
              Livestream
            </TabsTrigger>
            <TabsTrigger value="albums" className="flex items-center gap-2">
              <Images className="w-4 h-4" />
              Albums
            </TabsTrigger>
          </TabsList>

          <TabsContent value="videos" className="space-y-8">
            {/* Filters */}
            <div className="flex flex-wrap gap-4 justify-center">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search videos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Sermon">Sermon</SelectItem>
                  <SelectItem value="Solo">Solo</SelectItem>
                  <SelectItem value="Choir">Choir</SelectItem>
                  <SelectItem value="Worship & Music">Worship & Music</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                value={yearFilter} 
                onValueChange={(value) => {
                  console.log('Year filter changed to:', value);
                  setYearFilter(value);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading videos...</p>
              </div>
            ) : filteredVideos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredVideos.map((video, index) => (
                  <VideoCard key={index} {...video} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No videos found</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="livestream" className="space-y-8">
            <div className="max-w-4xl mx-auto">
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                <iframe
                  className="w-full h-full"
                  src="https://www.youtube.com/embed/live_stream?channel=UCNQNT1hM2b6_jd50ja-XAeQ"
                  title="CBC Live Stream"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="text-center mt-6">
                <h3 className="text-2xl font-bold mb-2">Live Worship Service</h3>
                <p className="text-muted-foreground">Join us live every Sunday at 1:00 PM EST</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="albums" className="space-y-8">
            {albumsLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading albums...</p>
              </div>
            ) : albums.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {albums.map((album) => (
                  <div 
                    key={album.id} 
                    className="group cursor-pointer"
                    onClick={() => navigate(`/media/album/${album.id}`)}
                  >
                    <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-gradient-to-br from-primary/20 to-accent/20">
                      <img 
                        src={album.cover_image_url || communityImage} 
                        alt={album.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                      />
                    </div>
                    <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                      {album.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{album.photo_count || 0} photos</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No albums available yet</p>
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>

      <Footer />
    </div>
  );
};

export default Media;
