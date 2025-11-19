import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, BookOpen, Users, Mail, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const Resources = () => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    title: "",
    content: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.title.trim() || !formData.content.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('prayer_requests')
        .insert({
          title: formData.title.trim(),
          content: formData.content.trim(),
          author_name: formData.name.trim(),
          author_id: user?.id || null,
          is_anonymous: false,
        });

      if (error) throw error;

      toast.success("Prayer request submitted successfully! Our team will pray for you.");
      setFormData({ name: "", email: "", title: "", content: "" });
      setSubmitted(true);
      
      setTimeout(() => setSubmitted(false), 5000);
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('Error submitting prayer request:', error);
      }
      toast.error("Failed to submit prayer request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resourceCards = [
    {
      icon: BookOpen,
      title: "Bible Study Resources",
      description: "Access sermon notes, study guides, and devotional materials to deepen your faith journey.",
      link: "/beliefs/the-bible",
    },
    {
      icon: Users,
      title: "Get Involved",
      description: "Discover opportunities to serve, connect with others, and make a difference in our community.",
      link: "/get-involved",
    },
    {
      icon: Mail,
      title: "Contact Us",
      description: "Have questions? Reach out to our church office and we'll be happy to help.",
      link: "/about",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-24">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-block p-3 rounded-full bg-primary/10 mb-4">
            <Heart className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Church Resources
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore resources to strengthen your faith and connect with our community
          </p>
        </div>

        {/* Resource Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {resourceCards.map((resource, index) => (
            <Link key={index} to={resource.link}>
              <Card className="h-full hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer">
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <resource.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle>{resource.title}</CardTitle>
                  <CardDescription>{resource.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>

        {/* Prayer Request Form */}
        <div className="max-w-3xl mx-auto">
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-full bg-primary/10">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-3xl">Prayer Request</CardTitle>
              </div>
              <CardDescription className="text-base">
                Share your prayer needs with us. Our church family is here to pray with you and support you.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submitted ? (
                <div className="text-center py-12">
                  <div className="inline-block p-4 rounded-full bg-primary/10 mb-4">
                    <CheckCircle className="w-12 h-12 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Thank You!</h3>
                  <p className="text-muted-foreground mb-6">
                    Your prayer request has been received. Our church community will be praying for you.
                  </p>
                  <Button onClick={() => setSubmitted(false)}>
                    Submit Another Request
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Your Name *</Label>
                      <Input
                        id="name"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        maxLength={100}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email (optional)</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        maxLength={255}
                      />
                      <p className="text-xs text-muted-foreground">
                        We'll only use this to follow up on your request
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Prayer Request Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Health, Family, Guidance"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      maxLength={100}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">Your Prayer Request *</Label>
                    <Textarea
                      id="content"
                      placeholder="Share what you would like us to pray for..."
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      rows={8}
                      className="resize-none"
                      maxLength={1000}
                      required
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {formData.content.length}/1000
                    </p>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">
                      <strong>Privacy Note:</strong> Your prayer request will be shared with our church leadership and prayer team. 
                      We treat all requests with confidentiality and care.
                    </p>
                  </div>

                  <Button type="submit" size="lg" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                    {loading ? "Submitting..." : "Submit Prayer Request"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Additional Info */}
        <div className="max-w-3xl mx-auto mt-12 text-center">
          <p className="text-muted-foreground">
            "The prayer of a righteous person is powerful and effective." - James 5:16
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Resources;
