import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import VideoCard from "@/components/VideoCard";
import StaffCard from "@/components/StaffCard";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, Heart, Book } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { searchYouTubeVideos, type YouTubeVideo } from "@/lib/youtube";
import modernChurch from "@/assets/modern-church.jpg";
import communityImage from "@/assets/community.jpg";
import revJosephImage from "@/assets/rev-joseph.jpg";
import revVanDuhCeuImage from "@/assets/rev-van-duh-ceu.jpg";
const Index = () => {
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
        maxResults: 8,
        order: 'date'
      });
      setYoutubeVideos(videos);
      setLoading(false);
    };
    fetchVideos();
  }, []);
  const albums = [{
    title: "Christmas Celebration 2024",
    imageCount: 45
  }, {
    title: "Youth Camp Summer 2024",
    imageCount: 78
  }, {
    title: "Easter Service 2024",
    imageCount: 32
  }, {
    title: "Community Outreach",
    imageCount: 56
  }];
  const staff = [{
    name: "Rev. Van Duh Ceu",
    role: "Senior Pastor",
    email: "vdc@cbc.org",
    image: revVanDuhCeuImage
  }, {
    name: "Rev. Joseph Nihre Bawihrin",
    role: "Associate Pastor",
    email: "jnb@cbc.org",
    image: revJosephImage
  }];
  const processedVideos = youtubeVideos.map(video => {
    const date = new Date(video.publishedAt);
    const year = date.getFullYear().toString();
    const category = video.title.toLowerCase().includes('sermon') ? 'Sermon' : 'Solo';
    return {
      title: video.title,
      date: date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      category: category as "Sermon" | "Solo",
      year,
      thumbnail: video.thumbnail,
      videoId: video.id
    };
  });
  const filteredVideos = processedVideos.filter(video => {
    const matchesCategory = categoryFilter === "all" || video.category === categoryFilter;
    const matchesYear = yearFilter === "all" || video.year === yearFilter;
    return matchesCategory && matchesYear;
  });
  return <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{
          backgroundImage: `url(${modernChurch})`
        }}>
          <div className="absolute inset-0 bg-black/40" />
        </div>
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            Welcome to CBC!
          </h1>
          <p className="text-xl mb-8 text-white/90 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150 md:text-xl text-center">"Bawipa kan cungah aa lawmh ahcun"
14:8</p>
          <Button size="lg" className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
            Join Us This Sunday
          </Button>
        </div>
      </section>

      {/* Service Times */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Clock className="w-8 h-8" />
              <h2 className="font-display text-3xl font-bold">Sunday Service</h2>
            </div>
            <p className="text-4xl font-bold mb-2">1:00 PM - 3:00 PM</p>
            <p className="text-primary-foreground/80">
              Join us every Sunday for worship, fellowship, and spiritual growth
            </p>
          </div>
        </div>
      </section>

      {/* Latest Videos */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-bold mb-4">Latest Videos</h2>
            <p className="text-muted-foreground text-lg">
              Watch our recent sermons and worship sessions
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 justify-center mb-12">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
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

          {loading ? <div className="text-center py-12">
              <p className="text-muted-foreground">Loading videos...</p>
            </div> : filteredVideos.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredVideos.map((video, index) => <VideoCard key={index} {...video} />)}
            </div> : <div className="text-center py-12">
              <p className="text-muted-foreground">No videos found</p>
            </div>}
        </div>
      </section>

      {/* Latest Albums */}
      <section className="py-20 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-bold mb-4">Latest Albums</h2>
            <p className="text-muted-foreground text-lg">
              Moments from our church community
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {albums.map((album, index) => <div key={index} className="group cursor-pointer">
                <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-gradient-to-br from-primary/20 to-accent/20">
                  <img src={communityImage} alt={album.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                  {album.title}
                </h3>
                <p className="text-sm text-muted-foreground">{album.imageCount} photos</p>
              </div>)}
          </div>
        </div>
      </section>

      {/* Staff Preview */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-bold mb-4">Our Pastors</h2>
            <p className="text-muted-foreground text-lg">
              Meet our spiritual leaders
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {staff.map((member, index) => <StaffCard key={index} {...member} />)}
          </div>

          <div className="text-center mt-12">
            <Button variant="outline" size="lg">
              View All Staff
            </Button>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="space-y-4">
                <div className="bg-primary-foreground/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                  <Users className="w-8 h-8" />
                </div>
                <h3 className="font-display text-xl font-bold">Connect</h3>
                <p className="text-primary-foreground/80">
                  Join our welcoming community and build lasting relationships
                </p>
              </div>
              <div className="space-y-4">
                <div className="bg-primary-foreground/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                  <Book className="w-8 h-8" />
                </div>
                <h3 className="font-display text-xl font-bold">Learn</h3>
                <p className="text-primary-foreground/80">
                  Grow in your faith through Bible study and worship
                </p>
              </div>
              <div className="space-y-4">
                <div className="bg-primary-foreground/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                  <Heart className="w-8 h-8" />
                </div>
                <h3 className="font-display text-xl font-bold">Serve</h3>
                <p className="text-primary-foreground/80">
                  Make a difference in our community through service
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>;
};
export default Index;