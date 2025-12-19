import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const Resources = () => {
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    content: ""
  });

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
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 via-background to-primary/5 dark:from-background dark:via-background dark:to-primary/5">
      <Navigation />
      
      <div className="container mx-auto px-4 py-16 pt-24">
        {/* Prayer Room Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="text-6xl mb-6">🙏</div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Prayer Room
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            You are not alone. Share your heart with us, and we will pray for you.
          </p>
        </div>

        {/* Simple Prayer Form */}
        <div className="max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <Card className="border shadow-lg bg-card/95 backdrop-blur-sm">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">Share Your Prayer Request</CardTitle>
              <CardDescription className="text-base">
                Our church family is here to pray with you
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-base">Your Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    maxLength={100}
                    required
                    className="h-11"
                    placeholder="Enter your name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title" className="text-base">What can we pray for?</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    maxLength={100}
                    required
                    className="h-11"
                    placeholder="e.g., Healing, Guidance, Thanksgiving"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content" className="text-base">Your Prayer Request</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={6}
                    className="resize-none"
                    maxLength={1000}
                    required
                    placeholder="Share what's on your heart..."
                  />
                  <p className={cn(
                    "text-xs text-right transition-colors",
                    formData.content.length > 900 ? "text-destructive" : "text-muted-foreground"
                  )}>
                    {formData.content.length}/1000
                  </p>
                </div>

                {/* Privacy Note */}
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    🔒 Your request is confidential and will only be shared with our prayer team.
                  </p>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full text-lg h-12"
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                  {loading ? "Submitting..." : "Submit Prayer Request"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Encouraging Scripture */}
        <div className="max-w-xl mx-auto mt-12 text-center animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <div className="bg-card border rounded-xl p-8 shadow-sm">
            <p className="text-lg italic text-muted-foreground mb-3">
              "Cast all your anxiety on Him because He cares for you."
            </p>
            <p className="text-sm font-semibold text-primary">— 1 Peter 5:7</p>
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
