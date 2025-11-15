import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, ArrowLeft, Share2, ThumbsUp } from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  category: string;
  image?: string;
}

const BlogDetail = () => {
  const { id } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<Array<{ author: string; text: string; date: string }>>([]);

  useEffect(() => {
    // Fetch blog post by ID - replace with Supabase query when ready
    const mockPost: BlogPost = {
      id: id || "1",
      title: "Welcome to Chin Bethel Church Blog",
      excerpt: "Discover the latest news, updates, and reflections from our church community.",
      content: `Welcome to the Chin Bethel Church Blog, where we share stories, reflections, and updates from our vibrant community of faith.

Our church is dedicated to fostering a welcoming environment where all members of our congregation can grow spiritually, connect with one another, and serve our community with love and compassion.

In this blog, you'll find:

- Weekly reflections on scripture and faith
- Updates about upcoming church events and activities
- Stories of transformation and spiritual growth from our community members
- Announcements about outreach and ministry opportunities
- Photos and highlights from recent church gatherings

We believe that faith is not just something we practice on Sunday mornings, but something we live out every day through our actions, words, and relationships with one another and with those around us.

Whether you are a longtime member of our congregation or visiting for the first time, we invite you to explore this blog and learn more about who we are and what we stand for.

Thank you for being a part of our church family. We look forward to walking this journey of faith together.

Blessings,
The Chin Bethel Church Community`,
      author: "CBC Team",
      date: "November 15, 2025",
      category: "Announcements",
      image: "https://images.unsplash.com/photo-1551632786-de41ec64a9b9?w=1200",
    };
    setPost(mockPost);
    setLikes(12);
  }, [id]);

  const handleLike = () => {
    if (!liked) {
      setLikes(likes + 1);
      setLiked(true);
    } else {
      setLikes(likes - 1);
      setLiked(false);
    }
  };

  const handleAddComment = () => {
    if (comment.trim()) {
      setComments([
        ...comments,
        {
          author: "You",
          text: comment,
          date: new Date().toLocaleDateString(),
        },
        ...comments,
      ]);
      setComment("");
    }
  };

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-20">
          <p className="text-center text-muted-foreground">Loading post...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Back Button */}
      <div className="bg-muted/50 py-4 border-b">
        <div className="container mx-auto px-4">
          <Link to="/blog" className="inline-flex items-center gap-2 text-primary hover:underline">
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>
        </div>
      </div>

      {/* Hero Image */}
      {post.image && (
        <div className="w-full h-96 bg-muted overflow-hidden">
          <img
            src={post.image}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Post Content */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Badge>{post.category}</Badge>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{post.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{post.author}</span>
              </div>
            </div>
          </div>

          {/* Post Body */}
          <div className="prose prose-lg dark:prose-invert max-w-none mb-8">
            {post.content.split("\n\n").map((paragraph, idx) => (
              <p key={idx} className="text-lg leading-relaxed text-foreground mb-4">
                {paragraph}
              </p>
            ))}
          </div>

          {/* Engagement Section */}
          <div className="flex flex-wrap items-center gap-4 py-6 border-y">
            <Button
              variant={liked ? "default" : "outline"}
              onClick={handleLike}
              className="gap-2"
            >
              <ThumbsUp className="w-4 h-4" />
              {likes} Likes
            </Button>
            <Button variant="outline" className="gap-2">
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>

          {/* Comments Section */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Comments ({comments.length})</h2>

            {/* Add Comment */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-lg">Leave a Comment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your thoughts on this post..."
                  className="w-full min-h-32 p-3 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button onClick={handleAddComment} className="w-full sm:w-auto">
                  Post Comment
                </Button>
              </CardContent>
            </Card>

            {/* Comments List */}
            {comments.length > 0 ? (
              <div className="space-y-4">
                {comments.map((cmt, idx) => (
                  <Card key={idx}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{cmt.author}</p>
                          <p className="text-sm text-muted-foreground">{cmt.date}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-foreground">{cmt.text}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No comments yet. Be the first to comment!
              </p>
            )}
          </div>

          {/* Related Posts */}
          <div className="mt-16 pt-8 border-t">
            <h2 className="text-2xl font-bold mb-6">Related Posts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Badge className="w-fit">Announcements</Badge>
                  <CardTitle className="text-lg mt-2">Church Community Service Day</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Join us as we gather to serve our local community and make a difference together.
                  </p>
                  <Link to="/blog" className="text-primary hover:underline">
                    Read More →
                  </Link>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Badge className="w-fit">Reflections</Badge>
                  <CardTitle className="text-lg mt-2">Finding Peace in Faith</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Discover how faith can bring peace and stability to your everyday life.
                  </p>
                  <Link to="/blog" className="text-primary hover:underline">
                    Read More →
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BlogDetail;
