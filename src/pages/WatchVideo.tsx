import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calendar, Play, Search } from "lucide-react";
import { searchYouTubeVideos, type YouTubeVideo } from "@/lib/youtube";

const WatchVideo = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [recentVideos, setRecentVideos] = useState<YouTubeVideo[]>([]);
  const [allVideos, setAllVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  const currentVideo = location.state?.video;

  useEffect(() => {
    const fetchRecentVideos = async () => {
      setLoading(true);
      const videos = await searchYouTubeVideos({
        channelId: "UCNQNT1hM2b6_jd50ja-XAeQ",
        maxResults: 12,
        order: 'date'
      });
      const filtered = videos.filter(v => v.id !== videoId);
      setAllVideos(filtered);
      setRecentVideos(filtered);
      setLoading(false);
    };

    fetchRecentVideos();
  }, [videoId]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setRecentVideos(allVideos);
    } else {
      const filtered = allVideos.filter(video =>
        video.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setRecentVideos(filtered);
    }
  }, [searchQuery, allVideos]);

  const handleVideoClick = (video: YouTubeVideo) => {
    navigate(`/watch/${video.id}`, {
      state: {
        video: {
          title: video.title,
          date: new Date(video.publishedAt).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }),
          thumbnail: video.thumbnail,
          videoId: video.id
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-20">
        {/* Search Bar */}
        <div className="relative max-w-md mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="space-y-8">
          {/* Main Video Player */}
          <div className="space-y-4">
            <div className="relative w-full pt-[56.25%] bg-muted rounded-lg overflow-hidden">
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                title={currentVideo?.title || "Video"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            
            {currentVideo && (
              <div className="space-y-2">
                <h1 className="text-2xl md:text-3xl font-bold">
                  {currentVideo.title}
                </h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{currentVideo.date}</span>
                </div>
              </div>
            )}
          </div>

          {/* Recent Videos Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Recent Videos</h2>
            
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {recentVideos.map((video) => (
                  <Card 
                    key={video.id}
                    className="cursor-pointer hover:shadow-md transition-all duration-300 group"
                    onClick={() => handleVideoClick(video)}
                  >
                    <CardContent className="p-3">
                      <div className="space-y-3">
                        <div className="relative w-full pt-[56.25%] bg-muted rounded overflow-hidden">
                          {video.thumbnail ? (
                            <img 
                              src={video.thumbnail} 
                              alt={video.title}
                              className="absolute top-0 left-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                              <Play className="w-8 h-8 text-primary/40" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <Play className="w-6 h-6 text-white fill-white" />
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="font-semibold text-sm line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                            {video.title}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {new Date(video.publishedAt).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default WatchVideo;
