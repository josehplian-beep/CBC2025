import { Play, Calendar } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { useNavigate } from "react-router-dom";

interface VideoCardProps {
  title: string;
  date: string;
  category: "Sermon" | "Solo" | "Choir" | "Worship & Music" | "Livestream";
  thumbnail?: string;
  videoId?: string;
}

const VideoCard = ({ title, date, category, thumbnail, videoId }: VideoCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (videoId) {
      navigate(`/watch/${videoId}`, {
        state: { video: { title, date, category, thumbnail, videoId } }
      });
    }
  };

  return (
    <>
      <Card 
        className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer h-full flex flex-col"
        onClick={handleClick}
      >
        <div className="relative aspect-video bg-muted overflow-hidden">
          {thumbnail ? (
            <img 
              src={thumbnail} 
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
              <Play className="w-16 h-16 text-primary/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-primary text-primary-foreground rounded-full p-4">
                <Play className="w-8 h-8 fill-current" />
              </div>
            </div>
          </div>
        </div>
        <CardContent className="p-4 flex flex-col flex-1">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors flex-1">
            {title}
          </h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-auto">
            <Calendar className="w-4 h-4" />
            <span>{date}</span>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default VideoCard;
