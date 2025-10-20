import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Play } from "lucide-react";
import { searchYouTubeVideos, type YouTubeVideo } from "@/lib/youtube";

const WatchVideo = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [recentVideos, setRecentVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  
  const currentVideo = location.state?.video;

  useEffect(() => {
    const fetchRecentVideos = async () => {
      setLoading(true);
      const videos = await searchYouTubeVideos({
        channelId: "UCNQNT1hM2b6_jd50ja-XAeQ",
        maxResults: 12,
        order: 'date'
      });
      setRecentVideos(videos.filter(v => v.id !== videoId));
      setLoading(false);
    };

    fetchRecentVideos();
  }, [videoId]);

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Video Player */}
          <div className="lg:col-span-2 space-y-4">
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

          {/* Recent Videos Sidebar */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Recent Videos</h2>
            
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentVideos.map((video) => (
                  <Card 
                    key={video.id}
                    className="cursor-pointer hover:shadow-md transition-all duration-300 group"
                    onClick={() => handleVideoClick(video)}
                  >
                    <CardContent className="p-3">
                      <div className="flex gap-3">
                        <div className="relative w-32 h-20 flex-shrink-0 bg-muted rounded overflow-hidden">
                          {video.thumbnail ? (
                            <img 
                              src={video.thumbnail} 
                              alt={video.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                              <Play className="w-8 h-8 text-primary/40" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <Play className="w-6 h-6 text-white fill-white" />
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
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
