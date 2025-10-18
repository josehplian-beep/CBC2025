import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import VideoCard from "@/components/VideoCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Video, Images, Radio } from "lucide-react";
import { searchYouTubeVideos, type YouTubeVideo } from "@/lib/youtube";
import communityImage from "@/assets/community.jpg";
import worshipImage from "@/assets/worship.jpg";

const Media = () => {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [youtubeVideos, setYoutubeVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      // Fetch videos from Chin Bethel Church DC channel
      const videos = await searchYouTubeVideos({
        channelId: "UCNQNT1hM2b6_jd50ja-XAeQ",
        maxResults: 24,
        order: 'date'
      });
      setYoutubeVideos(videos);
      setLoading(false);
    };

    fetchVideos();
  }, []);

  const albums = [
    { title: "Christmas Celebration 2024", imageCount: 45, images: 12 },
    { title: "Youth Camp Summer 2024", imageCount: 78, images: 15 },
    { title: "Easter Service 2024", imageCount: 32, images: 8 },
    { title: "Community Outreach", imageCount: 56, images: 10 },
    { title: "Baptism Service", imageCount: 24, images: 6 },
    { title: "Thanksgiving Dinner", imageCount: 35, images: 8 },
    { title: "VBS 2024", imageCount: 89, images: 18 },
    { title: "Mission Trip", imageCount: 67, images: 14 },
  ];

  const processedVideos = youtubeVideos.map((video) => {
    const date = new Date(video.publishedAt);
    const year = date.getFullYear().toString();
    const title = video.title.toLowerCase();
    
    // Categorize videos
    let category: "Sermon" | "Solo" | "Livestream" = "Solo";
    if (title.includes('sermon')) {
      category = 'Sermon';
    } else if (title.includes('live') || title.includes('livestream') || title.includes('service')) {
      category = 'Livestream';
    } else if (title.includes('solo') || title.includes('choir') || title.includes('worship') || title.includes('praise')) {
      category = 'Solo';
    }
    
    return {
      title: video.title,
      date: date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      category,
      year,
      thumbnail: video.thumbnail,
      videoId: video.id,
    };
  });

  const filteredVideos = processedVideos.filter((video) => {
    const matchesCategory = categoryFilter === "all" || video.category === categoryFilter;
    const matchesYear = yearFilter === "all" || video.year === yearFilter;
    const notLivestream = video.category !== "Livestream"; // Exclude livestreams from videos tab
    return matchesCategory && matchesYear && notLivestream;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative h-[300px] flex items-center justify-center overflow-hidden mt-20 bg-primary">
        <div className="relative z-10 text-center text-primary-foreground px-4">
          <h1 className="font-display text-5xl md:text-6xl font-bold mb-4">Media</h1>
          <p className="text-xl md:text-2xl text-primary-foreground/90">
            Sermons, Worship, and Church Life
          </p>
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
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Sermon">Sermons</SelectItem>
                  <SelectItem value="Solo">Worship & Music</SelectItem>
                  <SelectItem value="Livestream">Livestreams</SelectItem>
                </SelectContent>
              </Select>

              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
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
                <p className="text-muted-foreground">
                  Join us live every Sunday at 1:00 PM EST
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="albums" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {albums.map((album, index) => (
                <div key={index} className="group cursor-pointer">
                  <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-gradient-to-br from-primary/20 to-accent/20">
                    <img 
                      src={index % 2 === 0 ? communityImage : worshipImage}
                      alt={album.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                    {album.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{album.imageCount} photos</p>
                </div>
              ))}
            </div>
          </TabsContent>
        </div>
      </Tabs>

      <Footer />
    </div>
  );
};

export default Media;
