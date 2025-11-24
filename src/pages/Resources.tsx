import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Heart, BookOpen, Users, Mail, Loader2, CheckCircle, Sparkles, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
const PRAYER_CATEGORIES = [{
  id: "health",
  label: "Health",
  icon: "💚"
}, {
  id: "family",
  label: "Family",
  icon: "👨‍👩‍👧‍👦"
}, {
  id: "guidance",
  label: "Guidance",
  icon: "🧭"
}, {
  id: "church",
  label: "Church",
  icon: "⛪"
}, {
  id: "thanksgiving",
  label: "Thanksgiving",
  icon: "🙏"
}, {
  id: "personal",
  label: "Personal Struggle",
  icon: "💪"
}];
const ENCOURAGING_MESSAGES = ["God is near to the brokenhearted.", "You are not alone.", "Your church family cares for you.", "Cast all your anxiety on Him because He cares for you.", "The Lord is close to all who call on Him."];
const SCRIPTURE_VERSES = [{
  text: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.",
  reference: "Philippians 4:6"
}, {
  text: "The Lord is close to the brokenhearted and saves those who are crushed in spirit.",
  reference: "Psalm 34:18"
}, {
  text: "Cast all your anxiety on him because he cares for you.",
  reference: "1 Peter 5:7"
}];
const Resources = () => {
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    title: "",
    content: ""
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [urgency, setUrgency] = useState<"normal" | "urgent" | "critical">("normal");
  const [visibility, setVisibility] = useState<"team" | "public">("team");
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex(prev => (prev + 1) % ENCOURAGING_MESSAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);
  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]);
  };
  const getCharacterCountColor = () => {
    const percentage = formData.content.length / 1000 * 100;
    if (percentage >= 95) return "text-destructive";
    if (percentage >= 80) return "text-yellow-600";
    return "text-muted-foreground";
  };
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
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      const {
        error
      } = await supabase.from('prayer_requests').insert({
        title: formData.title.trim(),
        content: formData.content.trim(),
        author_name: formData.name.trim(),
        author_id: user?.id || null,
        is_anonymous: false
      });
      if (error) throw error;
      toast.success("Prayer request submitted successfully! Our team will pray for you.");
      setFormData({
        name: "",
        email: "",
        title: "",
        content: ""
      });
      setSelectedCategories([]);
      setUrgency("normal");
      setVisibility("team");
      setShowSuccessModal(true);
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('Error submitting prayer request:', error);
      }
      toast.error("Failed to submit prayer request. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  const resourceCards = [{
    icon: BookOpen,
    title: "Bible Study Resources",
    description: "Access sermon notes, study guides, and devotional materials to deepen your faith journey.",
    link: "/beliefs/the-bible"
  }, {
    icon: Users,
    title: "Get Involved",
    description: "Discover opportunities to serve, connect with others, and make a difference in our community.",
    link: "/get-involved"
  }, {
    icon: Mail,
    title: "Contact Us",
    description: "Have questions? Reach out to our church office and we'll be happy to help.",
    link: "/about"
  }];
  return <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <Navigation />
      
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16 space-y-4 animate-fade-in">
          <div className="inline-block p-3 rounded-full bg-primary/10 mb-4 relative">
            <Heart className="w-12 h-12 text-primary" />
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" style={{
            animationDuration: "2s"
          }} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Submit a Prayer Request
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We would be honored to pray for you. Share your request below, and know that you are not alone.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-primary animate-fade-in" style={{
          animationDelay: "0.3s"
        }}>
            <Sparkles className="w-4 h-4" />
            <span className="italic transition-opacity duration-500">
              {ENCOURAGING_MESSAGES[currentMessageIndex]}
            </span>
          </div>
        </div>

        {/* Resource Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16 animate-fade-in" style={{
        animationDelay: "0.2s"
      }}>
          {resourceCards.map((resource, index) => <Link key={index} to={resource.link}>
              <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full border-2">
                <CardHeader>
                  <div className="p-3 rounded-full bg-primary/10 w-fit mb-3 group-hover:bg-primary/20 transition-colors">
                    <resource.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {resource.title}
                  </CardTitle>
                  <CardDescription>{resource.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>)}
        </div>

        {/* Prayer Request Form */}
        <div className="max-w-5xl mx-auto animate-fade-in" style={{
        animationDelay: "0.4s"
      }}>
          <Card className="border-2 shadow-xl backdrop-blur-sm bg-card/95">
            <CardHeader className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-3xl">Your Prayer Request</CardTitle>
                  <CardDescription className="text-base mt-1">
                    Our church family is here to pray with you and support you
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Two Column Layout */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-base font-semibold">Your Name *</Label>
                      <Input id="name" value={formData.name} onChange={e => setFormData({
                      ...formData,
                      name: e.target.value
                    })} maxLength={100} required className="h-11" placeholder="e.g., Min" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-base font-semibold">
                        Email <span className="text-muted-foreground font-normal">(optional)</span>
                      </Label>
                      <Input id="email" type="email" value={formData.email} onChange={e => setFormData({
                      ...formData,
                      email: e.target.value
                    })} maxLength={255} className="h-11" placeholder="Min@example.com" />
                      <p className="text-xs text-muted-foreground">
                        For follow-up communication only
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-base font-semibold">Prayer Request Title *</Label>
                      <Input id="title" placeholder="e.g., Healing for my mother" value={formData.title} onChange={e => setFormData({
                      ...formData,
                      title: e.target.value
                    })} maxLength={100} required className="h-11" />
                    </div>

                    {/* Prayer Categories */}
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">
                        Categories <span className="text-muted-foreground font-normal">(optional)</span>
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {PRAYER_CATEGORIES.map(category => <Badge key={category.id} variant={selectedCategories.includes(category.id) ? "default" : "outline"} className={cn("cursor-pointer px-3 py-1.5 text-sm transition-all hover:scale-105", selectedCategories.includes(category.id) && "shadow-md")} onClick={() => toggleCategory(category.id)}>
                            <span className="mr-1">{category.icon}</span>
                            {category.label}
                          </Badge>)}
                      </div>
                    </div>

                    {/* Urgency Marker */}
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Prayer Urgency</Label>
                      <div className="flex gap-2">
                        {[{
                        value: "normal",
                        label: "Normal",
                        color: "bg-primary/10 text-primary border-primary/20"
                      }, {
                        value: "urgent",
                        label: "Urgent",
                        color: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20"
                      }, {
                        value: "critical",
                        label: "Critical",
                        color: "bg-destructive/10 text-destructive border-destructive/20"
                      }].map(option => <Button key={option.value} type="button" variant="outline" size="sm" className={cn("transition-all", urgency === option.value && option.color)} onClick={() => setUrgency(option.value as typeof urgency)}>
                            {option.label}
                          </Button>)}
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="content" className="text-base font-semibold">Your Prayer Request *</Label>
                      <Textarea id="content" placeholder="Share what you would like us to pray for. Be as open and detailed as you feel comfortable..." value={formData.content} onChange={e => setFormData({
                      ...formData,
                      content: e.target.value
                    })} rows={12} className="resize-none" maxLength={1000} required />
                      <p className={cn("text-xs text-right font-medium transition-colors", getCharacterCountColor())}>
                        {formData.content.length}/1000 characters
                      </p>
                    </div>

                    {/* Visibility Options */}
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Who can see this?</Label>
                      <div className="space-y-2">
                        <Button type="button" variant={visibility === "team" ? "default" : "outline"} className="w-full justify-start" onClick={() => setVisibility("team")}>
                          <Users className="w-4 h-4 mr-2" />
                          Prayer Team Only (Private)
                        </Button>
                        <Button type="button" variant={visibility === "public" ? "default" : "outline"} className="w-full justify-start" onClick={() => setVisibility("public")}>
                          <Heart className="w-4 h-4 mr-2" />
                          Church Community (Public)
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Privacy Notice */}
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold mb-1">Privacy & Confidentiality</p>
                    <p className="text-sm text-muted-foreground">
                      Your prayer request will be shared with our church leadership and prayer team. 
                      We treat all requests with the utmost confidentiality, care, and respect.
                    </p>
                  </div>
                </div>

                {/* Submit Button */}
                <Button type="submit" size="lg" className="w-full text-lg h-12 shadow-lg hover:shadow-xl transition-all" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                  {loading ? "Submitting Your Request..." : "Submit Prayer Request"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Scripture Encouragement Section */}
        <div className="max-w-5xl mx-auto mt-16 animate-fade-in" style={{
        animationDelay: "0.6s"
      }}>
          <h3 className="text-2xl font-bold text-center mb-8">God's Promise About Prayer</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {SCRIPTURE_VERSES.map((verse, index) => <Card key={index} className="border-primary/20 hover:border-primary/40 transition-colors">
                <CardContent className="pt-6">
                  <BookOpen className="w-8 h-8 text-primary mb-4" />
                  <p className="text-sm italic mb-4 leading-relaxed">&ldquo;{verse.text}&rdquo;</p>
                  <p className="text-xs font-semibold text-primary">— {verse.reference}</p>
                </CardContent>
              </Card>)}
          </div>
        </div>

        {/* Footer Quote */}
        <div className="max-w-3xl mx-auto mt-12 text-center">
          <p className="text-lg italic text-muted-foreground">
            &ldquo;The prayer of a righteous person is powerful and effective.&rdquo;
          </p>
          <p className="text-sm font-semibold text-primary mt-2">— James 5:16</p>
        </div>
      </div>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="p-4 rounded-full bg-primary/10">
                  <CheckCircle className="w-16 h-16 text-primary" />
                </div>
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
              </div>
            </div>
            <DialogTitle className="text-2xl text-center">Thank You for Sharing</DialogTitle>
            <DialogDescription className="text-center space-y-4 pt-4">
              <p className="text-base">
                Your prayer request has been received. Our church community will be lifting you up in prayer.
              </p>
              <div className="bg-primary/5 rounded-lg p-4 space-y-2">
                <p className="font-semibold text-foreground">God hears your prayers</p>
                <p className="text-sm italic">
                  &ldquo;Cast all your anxiety on him because he cares for you.&rdquo; — 1 Peter 5:7
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Would you like someone from our team to follow up with you? We're here for you.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setShowSuccessModal(false)}>
              Close
            </Button>
            <Button className="flex-1" onClick={() => setShowSuccessModal(false)}>
              Submit Another Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>;
};
export default Resources;