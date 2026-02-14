import { Play } from "lucide-react";
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
    <div className="group cursor-pointer bg-card rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300" onClick={handleClick}>
      <div className="h-1 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500" />
      <div className="relative aspect-video overflow-hidden">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
            <Play className="w-12 h-12 text-primary/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-primary text-primary-foreground rounded-full p-3">
              <Play className="w-6 h-6 fill-current" />
            </div>
          </div>
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-xs mt-1 text-muted-foreground">
          {category} || {date}
        </p>
      </div>
    </div>
  );
};

export default VideoCard;
