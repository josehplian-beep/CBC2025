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
    <div className="group cursor-pointer" onClick={handleClick}>
      <div className="relative aspect-video rounded-2xl overflow-hidden mb-3 shadow-md group-hover:shadow-xl transition-all duration-300">
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute top-3 left-3">
          <span className="text-white/90 text-xs font-medium italic">{date}</span>
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-white/80 text-xs font-semibold uppercase tracking-wider">{category}</p>
          <h3 className="text-white font-bold text-sm leading-tight line-clamp-2 mt-0.5">{title}</h3>
        </div>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
      </div>
      <div className="px-1">
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
