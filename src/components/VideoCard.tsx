import { useState } from "react";
import { Play, Calendar } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Dialog, DialogContent } from "./ui/dialog";


interface VideoCardProps {
  title: string;
  date: string;
  category: "Sermon" | "Solo" | "Choir" | "Worship & Music" | "Livestream";
  thumbnail?: string;
  videoId?: string;
}

const VideoCard = ({ title, date, category, thumbnail, videoId }: VideoCardProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = () => {
    if (videoId) {
      setIsOpen(true);
    }
  };

  return (
    <>
      <Card 
        className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
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
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{date}</span>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl w-full p-0">
          <div className="relative w-full pt-[56.25%]">
            <iframe
              className="absolute top-0 left-0 w-full h-full"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VideoCard;
