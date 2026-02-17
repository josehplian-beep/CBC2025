import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, CheckCircle, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ENCOURAGING_MESSAGES = [
  "God is near to the brokenhearted. — Psalm 34:18",
  "You are not alone. He is with you always. — Matthew 28:20",
  "Your church family cares for you.",
  "Cast all your anxiety on Him because He cares for you. — 1 Peter 5:7",
  "The Lord is close to all who call on Him. — Psalm 145:18",
  "Come to me, all who are weary, and I will give you rest. — Matthew 11:28",
  "Be strong and courageous. Do not be afraid. — Joshua 1:9",
  "I can do all things through Christ who strengthens me. — Philippians 4:13",
  "The Lord is my shepherd; I shall not want. — Psalm 23:1",
  "Peace I leave with you; my peace I give you. — John 14:27",
  "For I know the plans I have for you, plans to prosper you. — Jeremiah 29:11",
  "The Lord will fight for you; you need only to be still. — Exodus 14:14"
];

const Resources = () => {
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    content: ""
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % ENCOURAGING_MESSAGES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.title.trim() || !formData.content.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('prayer_requests').insert({
        title: formData.title.trim(),
        content: formData.content.trim(),
        author_name: formData.name.trim(),
        author_id: user?.id || null,
        is_anonymous: false
      });

      if (error) throw error;

      toast.success("Prayer request submitted!");
      setFormData({ name: "", title: "", content: "" });
      setShowSuccessModal(true);
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('Error submitting prayer request:', error);
      }
      toast.error("Failed to submit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black relative overflow-hidden">
      {/* Ambient Glow Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Warm center glow - candle light */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-amber-500/25 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: "3s" }} />
        {/* Soft side glows */}
        <div className="absolute top-1/3 left-1/4 w-[200px] h-[200px] bg-orange-500/15 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: "4s", animationDelay: "0.5s" }} />
        <div className="absolute top-1/2 right-1/4 w-[180px] h-[180px] bg-amber-400/15 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: "5s", animationDelay: "1s" }} />
        {/* Bottom warm glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px] bg-gradient-to-t from-amber-600/15 to-transparent blur-[80px]" />
      </div>

      <Navigation />
      
      <div className="container mx-auto px-4 py-16 pt-24 relative z-10">
        {/* Prayer Room Header */}
        <div className="text-center mb-12 animate-fade-in">
          {/* Candle Icon with Glow */}
          <div className="relative inline-block mb-6">
            <div className="text-6xl relative z-10">🕯️</div>
            <div className="absolute inset-0 w-20 h-20 mx-auto -mt-2 bg-amber-400/50 rounded-full blur-2xl animate-pulse" style={{ animationDuration: "2s" }} />
            <div className="absolute inset-0 w-32 h-32 mx-auto -mt-4 -ml-4 bg-orange-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "3s", animationDelay: "0.5s" }} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-amber-50 mb-4">
            Prayer Room
          </h1>
          <p className="text-lg text-amber-100/70 max-w-xl mx-auto mb-4">
            You are not alone. Share your heart with us, and we will pray for you.
          </p>
          {/* Rotating Encouraging Messages */}
          <div className="flex items-center justify-center gap-2 text-sm text-amber-300">
            <Sparkles className="w-4 h-4" />
            <span className="italic transition-opacity duration-500">
              {ENCOURAGING_MESSAGES[currentMessageIndex]}
            </span>
          </div>
        </div>

        {/* Simple Prayer Form */}
        <div className="max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <Card className="border-amber-900/30 shadow-2xl bg-slate-900/80 backdrop-blur-md">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl text-amber-50">Share Your Prayer Request</CardTitle>
              <CardDescription className="text-base text-amber-100/60">
                Our church family is here to pray with you
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-base text-amber-100/80">Your Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    maxLength={100}
                    required
                    className="h-11 bg-slate-800/50 border-amber-900/30 text-amber-50 placeholder:text-amber-100/30 focus:border-amber-500/50"
                    placeholder="Enter your name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title" className="text-base text-amber-100/80">What can we pray for?</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    maxLength={100}
                    required
                    className="h-11 bg-slate-800/50 border-amber-900/30 text-amber-50 placeholder:text-amber-100/30 focus:border-amber-500/50"
                    placeholder="e.g., Healing, Guidance, Thanksgiving"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content" className="text-base text-amber-100/80">Your Prayer Request</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={6}
                    className="resize-none bg-slate-800/50 border-amber-900/30 text-amber-50 placeholder:text-amber-100/30 focus:border-amber-500/50"
                    maxLength={1000}
                    required
                    placeholder="Share what is on your heart..."
                  />
                  <p className={cn(
                    "text-xs text-right transition-colors",
                    formData.content.length > 900 ? "text-red-400" : "text-amber-100/50"
                  )}>
                    {formData.content.length}/1000
                  </p>
                </div>

                {/* Privacy Note */}
                <div className="bg-amber-900/20 border border-amber-800/30 rounded-lg p-4 text-center">
                  <p className="text-sm text-amber-100/70">
                    🔒 Your request is confidential and will only be shared with our prayer team.
                  </p>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full text-lg h-12 bg-amber-600 hover:bg-amber-500 text-white"
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                  {loading ? "Submitting..." : "Submit Prayer Request"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Prayer Service Schedule */}
        <div className="max-w-2xl mx-auto mt-12 animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <Card className="border-amber-900/30 shadow-2xl bg-slate-900/80 backdrop-blur-md overflow-hidden">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-600/10 via-orange-500/10 to-amber-600/10" />
              <CardHeader className="text-center relative z-10 pb-4">
                <div className="text-4xl mb-2">🙏</div>
                <CardTitle className="text-2xl text-amber-50">Weekly Prayer Service</CardTitle>
                <CardDescription className="text-amber-100/60 text-base">
                  Join us in prayer every week
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10 space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <div className="flex items-center gap-3 bg-amber-900/30 border border-amber-800/30 rounded-lg px-5 py-3">
                    <span className="text-2xl">📅</span>
                    <div>
                      <p className="text-sm text-amber-100/60">Every</p>
                      <p className="text-lg font-semibold text-amber-50">Saturday</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-amber-900/30 border border-amber-800/30 rounded-lg px-5 py-3">
                    <span className="text-2xl">🕘</span>
                    <div>
                      <p className="text-sm text-amber-100/60">Time</p>
                      <p className="text-lg font-semibold text-amber-50">9:00 AM – 12:00 PM</p>
                    </div>
                  </div>
                </div>
                <p className="text-center text-sm text-amber-100/50 pt-2">
                  Everyone is welcome. Come as you are.
                </p>
              </CardContent>
            </div>
          </Card>
        </div>

        {/* Encouraging Scripture */}
        <div className="max-w-xl mx-auto mt-12 text-center animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <div className="bg-slate-900/60 border border-amber-900/30 rounded-xl p-8 backdrop-blur-sm">
            <p className="text-lg italic text-amber-100/70 mb-3">
              "Cast all your anxiety on Him because He cares for you."
            </p>
            <p className="text-sm font-semibold text-amber-400">— 1 Peter 5:7</p>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-primary/10">
                <CheckCircle className="w-12 h-12 text-primary" />
              </div>
            </div>
            <DialogTitle className="text-2xl text-center">Thank You 🙏</DialogTitle>
            <DialogDescription className="text-center space-y-4 pt-4">
              <p className="text-base">
                Your prayer request has been received. Our church family will be praying for you.
              </p>
              <div className="bg-primary/5 rounded-lg p-4">
                <p className="text-sm italic">
                  "The Lord is close to the brokenhearted and saves those who are crushed in spirit."
                </p>
                <p className="text-xs font-semibold text-primary mt-2">— Psalm 34:18</p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setShowSuccessModal(false)} className="mt-4">
            Close
          </Button>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Resources;
