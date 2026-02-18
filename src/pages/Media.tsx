import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import VideoCard from "@/components/VideoCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Video, Images, Radio, Search, Play, Clock, Users, ChevronRight, X, Facebook, Instagram, Youtube } from "lucide-react";
import { SOCIAL } from "@/config/social";
import { searchYouTubeVideos, type YouTubeVideo } from "@/lib/youtube";
import communityImage from "@/assets/community.jpg";
import { supabase } from "@/integrations/supabase/client";
import SermonNoteTaker from "@/components/SermonNoteTaker";

interface Album {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  photo_count?: number;
}

function LiveCountdown() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const getNextSunday1PM = () => {
      const now = new Date();
      const next = new Date(now);
      const day = now.getDay();
      next.setDate(now.getDate() + (day === 0 ? 0 : 7 - day));
      next.setHours(13, 0, 0, 0);
      if (next <= now) next.setDate(next.getDate() + 7);
      return next;
    };

    const update = () => {
      const diff = getNextSunday1PM().getTime() - Date.now();
      if (diff <= 0) return setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  const units = [
    { label: "Days", value: timeLeft.days },
    { label: "Hrs", value: timeLeft.hours },
    { label: "Min", value: timeLeft.minutes },
    { label: "Sec", value: timeLeft.seconds },
  ];

  return (
    <div className="rounded-2xl bg-gradient-to-br from-live/15 to-live/5 border border-live/20 p-6 text-center">
      <h3 className="font-semibold text-sm uppercase tracking-wider text-live mb-4">Next Sunday Service</h3>
      <div className="flex justify-center gap-3">
        {units.map(({ label, value }) => (
          <div key={label} className="flex flex-col items-center">
            <div className="bg-background/80 border border-live/20 rounded-xl w-14 h-14 flex items-center justify-center">
              <span className="text-xl font-bold tabular-nums">{String(value).padStart(2, "0")}</span>
            </div>
            <span className="text-[11px] text-muted-foreground mt-1">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const Media = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("videos");
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
      let attempts = 0;
      let videos: YouTubeVideo[] = [];
      
      while (attempts < 3 && videos.length === 0) {
        videos = await searchYouTubeVideos({
          channelId: "UCNQNT1hM2b6_jd50ja-XAeQ",
          maxResults: 500,
          order: "date",
        });
        if (videos.length === 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        attempts++;
      }
      setYoutubeVideos(videos);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const fetchAlbums = async () => {
    try {
      const { data: albumsData, error } = await supabase
        .from('albums')
        .select('id, title, description, cover_image_url')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const albumsWithCounts = await Promise.all(
        (albumsData || []).map(async (album) => {
          const { count } = await supabase
            .from('photos')
            .select('*', { count: 'exact', head: true })
            .eq('album_id', album.id);
          return { ...album, photo_count: count || 0 };
        })
      );
      setAlbums(albumsWithCounts);
    } catch {
      // silent
    } finally {
      setAlbumsLoading(false);
    }
  };

  const processedVideos = youtubeVideos.map((video) => {
    const date = new Date(video.publishedAt);
    const title = video.title.toLowerCase();
    
    let category: "Sermon" | "Solo" | "Choir" | "Worship & Music" | "Livestream" = "Worship & Music";
    if (title.includes("sermon") || title.includes("message") || title.includes("preaching")) {
      category = "Sermon";
    } else if (title.includes("live") || title.includes("livestream") || title.includes("service") || title.includes("sunday")) {
      category = "Livestream";
    } else if (title.includes("solo") || title.includes("special") || title.includes("song")) {
      category = "Solo";
    } else if (title.includes("choir") || title.includes("group")) {
      category = "Choir";
    }

    return {
      title: video.title,
      date: date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      category,
      year: date.getFullYear().toString(),
      thumbnail: video.thumbnail,
      videoId: video.id,
    };
  });

  const filteredVideos = processedVideos.filter((video) => {
    const matchesCategory = categoryFilter === "all" || video.category === categoryFilter;
    const matchesYear = yearFilter === "all" || video.year === yearFilter;
    const matchesSearch = !searchQuery || video.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesYear && matchesSearch;
  });

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setYearFilter("all");
  };

  const hasActiveFilters = searchQuery || categoryFilter !== "all" || yearFilter !== "all";

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Compact Hero */}
      <section className="relative pt-24 pb-12 bg-gradient-to-br from-primary via-primary to-accent overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="container mx-auto px-4 relative z-10">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-primary-foreground mb-2">
            Media Center
          </h1>
          <p className="text-primary-foreground/80 text-lg max-w-xl">
            Watch sermons, worship sessions, and relive our church moments
          </p>
        </div>
      </section>

      {/* Tab Navigation - Modern Pills */}
      <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="h-14 p-1 bg-transparent gap-2 justify-start">
              <TabsTrigger 
                value="videos" 
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 rounded-full transition-all"
              >
                <Video className="w-4 h-4 mr-2" />
                Videos
              </TabsTrigger>
              <TabsTrigger 
                value="livestream" 
                className="data-[state=active]:bg-live data-[state=active]:text-live-foreground px-6 rounded-full transition-all group"
              >
                <span className="relative flex items-center">
                  <span className="absolute -left-1 w-2 h-2 bg-live rounded-full animate-pulse group-data-[state=active]:bg-live-foreground" />
                  <Radio className="w-4 h-4 ml-3 mr-2" />
                  Live
                </span>
              </TabsTrigger>
              <TabsTrigger 
                value="albums" 
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 rounded-full transition-all"
              >
                <Images className="w-4 h-4 mr-2" />
                Albums
              </TabsTrigger>
              
              {/* Social Media Icons */}
              <div className="ml-auto flex items-center gap-1">
                <a
                  href={SOCIAL.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="w-5 h-5 text-muted-foreground hover:text-primary" />
                </a>
                <a
                  href={SOCIAL.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5 text-muted-foreground hover:text-primary" />
                </a>
                <a
                  href={SOCIAL.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                  aria-label="YouTube"
                >
                  <Youtube className="w-5 h-5 text-muted-foreground hover:text-live" />
                </a>
              </div>
            </TabsList>

            {/* Videos Tab */}
            <TabsContent value="videos" className="py-8">
              {/* Search & Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search videos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 rounded-full bg-muted/50 border-0 focus-visible:ring-primary"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-40 rounded-full">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="Sermon">Sermon</SelectItem>
                      <SelectItem value="Livestream">Sunday Service</SelectItem>
                      <SelectItem value="Solo">Solo</SelectItem>
                      <SelectItem value="Choir">Choir</SelectItem>
                      <SelectItem value="Worship & Music">Worship</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={yearFilter} onValueChange={setYearFilter}>
                    <SelectTrigger className="w-32 rounded-full">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      <SelectItem value="2026">2026</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2023">2023</SelectItem>
                      <SelectItem value="2022">2022</SelectItem>
                    </SelectContent>
                  </Select>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="rounded-full">
                      <X className="w-4 h-4 mr-1" /> Clear
                    </Button>
                  )}
                </div>
              </div>

              {/* Results Count */}
              {!loading && (
                <p className="text-sm text-muted-foreground mb-6">
                  {filteredVideos.length} video{filteredVideos.length !== 1 && "s"} found
                </p>
              )}

              {/* Video Grid */}
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="aspect-video bg-muted rounded-xl mb-3" />
                      <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : filteredVideos.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredVideos.map((video, i) => (
                    <VideoCard key={i} {...video} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Video className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No videos match your search</p>
                  <Button variant="link" onClick={clearFilters} className="mt-2">
                    Clear filters
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Livestream Tab - Red Theme */}
            <TabsContent value="livestream" className="py-8">
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Video Player */}
                <div className="lg:col-span-2">
                  <div className="relative rounded-2xl overflow-hidden bg-foreground/5 shadow-xl">
                    {/* Live Badge */}
                    <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-live text-live-foreground px-3 py-1.5 rounded-full text-sm font-medium shadow-lg">
                      <span className="w-2 h-2 bg-live-foreground rounded-full animate-pulse" />
                      LIVE
                    </div>
                    <div className="aspect-video">
                      <iframe
                        className="w-full h-full"
                        src="https://www.youtube.com/embed/live_stream?channel=UCNQNT1hM2b6_jd50ja-XAeQ&autoplay=0"
                        title="CBC Live Stream"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                  
                  {/* Stream Info */}
                  <div className="mt-6">
                    <h2 className="text-2xl font-bold mb-2">Sunday Worship Service</h2>
                    <p className="text-muted-foreground">Chin Bethel Church DC</p>
                  </div>

                  {/* Sermon Note Taker */}
                  <div className="mt-6">
                    <SermonNoteTaker videoId="live-sunday-service" videoTitle="Sunday Worship Service" />
                  </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                  {/* Countdown Timer */}
                  <LiveCountdown />

                  {/* Schedule Card */}
                  <div className="rounded-2xl bg-gradient-to-br from-live/10 to-live/5 border border-live/20 p-6">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-live" />
                      Service Schedule
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-3 border-b border-live/10">
                        <div>
                          <p className="font-medium">Sunday Worship</p>
                          <p className="text-sm text-muted-foreground">Main Service</p>
                        </div>
                        <span className="text-live font-semibold">1:00 PM</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-live/10">
                        <div>
                          <p className="font-medium">Bible Study</p>
                          <p className="text-sm text-muted-foreground">Wednesday</p>
                        </div>
                        <span className="text-live font-semibold">7:00 PM</span>
                      </div>
                      <div className="flex justify-between items-center py-3">
                        <div>
                          <p className="font-medium">Prayer Meeting</p>
                          <p className="text-sm text-muted-foreground">Friday</p>
                        </div>
                        <span className="text-live font-semibold">7:30 PM</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="rounded-2xl bg-card border p-6">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      Join Us
                    </h3>
                    <div className="space-y-3">
                      <Button 
                        variant="outline" 
                        className="w-full justify-between group hover:border-live hover:text-live"
                        onClick={() => window.open('https://www.youtube.com/@ChinBethelChurchDC', '_blank')}
                      >
                        Subscribe on YouTube
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-between group hover:border-primary hover:text-primary"
                        onClick={() => setActiveTab('videos')}
                      >
                        Watch Past Services
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </div>

                  {/* Timezone Note */}
                  <p className="text-xs text-muted-foreground text-center">
                    All times are in Eastern Standard Time (EST)
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Albums Tab */}
            <TabsContent value="albums" className="py-8">
              {albumsLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="aspect-square bg-muted rounded-xl mb-3" />
                      <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : albums.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {albums.map((album) => (
                    <div 
                      key={album.id} 
                      className="group cursor-pointer"
                      onClick={() => navigate(`/media/album/${album.id}`)}
                    >
                      <div className="relative aspect-square rounded-2xl overflow-hidden mb-3 bg-muted">
                        <img 
                          src={album.cover_image_url || communityImage} 
                          alt={album.title} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="sm" className="w-full rounded-full">
                            <Play className="w-4 h-4 mr-2" /> View Album
                          </Button>
                        </div>
                      </div>
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-1">
                        {album.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {album.photo_count} photo{album.photo_count !== 1 && "s"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Images className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No albums available yet</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Media;
