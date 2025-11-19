import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PrayerRequestDialog from "@/components/PrayerRequestDialog";
import PrayerRequestCard from "@/components/PrayerRequestCard";
import { Button } from "@/components/ui/button";
import { Plus, Heart, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PrayerRequest {
  id: string;
  title: string;
  content: string;
  author_name: string;
  author_id: string;
  is_anonymous: boolean;
  is_answered: boolean;
  created_at: string;
}

const PrayerRequests = () => {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "answered">("all");

  useEffect(() => {
    checkAuth();
    fetchRequests();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("Please sign in to view prayer requests");
      navigate('/auth');
      return;
    }

    setCurrentUserId(user.id);

    // Check if user is admin
    const { data: adminCheck } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });
    setIsAdmin(adminCheck || false);
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('prayer_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching prayer requests:', error);
      }
      toast.error("Failed to load prayer requests");
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter(request => {
    if (filter === "active") return !request.is_answered;
    if (filter === "answered") return request.is_answered;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-24">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block p-3 rounded-full bg-primary/10 mb-4">
            <Heart className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Prayer Requests
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            Share your prayer needs with our community. We believe in the power of prayer and stand together in faith.
          </p>
          <Button size="lg" onClick={() => setDialogOpen(true)}>
            <Plus className="w-5 h-5 mr-2" />
            Submit Prayer Request
          </Button>
        </div>

        {/* Filters */}
        <div className="max-w-4xl mx-auto mb-8">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
              <TabsTrigger value="all">All ({requests.length})</TabsTrigger>
              <TabsTrigger value="active">
                Active ({requests.filter(r => !r.is_answered).length})
              </TabsTrigger>
              <TabsTrigger value="answered">
                Answered ({requests.filter(r => r.is_answered).length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Prayer Requests List */}
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-pulse space-y-4">
                <div className="h-48 bg-muted rounded-lg"></div>
                <div className="h-48 bg-muted rounded-lg"></div>
                <div className="h-48 bg-muted rounded-lg"></div>
              </div>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-block p-4 rounded-full bg-muted mb-4">
                <Heart className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Prayer Requests</h3>
              <p className="text-muted-foreground mb-6">
                {filter === "active" 
                  ? "All prayer requests have been answered. Praise God!"
                  : filter === "answered"
                  ? "No answered prayer requests yet."
                  : "Be the first to share a prayer request with the community."}
              </p>
              {filter === "all" && (
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Submit Prayer Request
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {filteredRequests.map((request) => (
                <PrayerRequestCard
                  key={request.id}
                  {...request}
                  currentUserId={currentUserId || undefined}
                  isAdmin={isAdmin}
                  onUpdate={fetchRequests}
                />
              ))}
            </div>
          )}
        </div>

        {/* Call to Action */}
        {!loading && filteredRequests.length > 0 && (
          <div className="max-w-2xl mx-auto mt-16 text-center bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-2xl p-8">
            <h3 className="text-2xl font-bold mb-3">Need Prayer?</h3>
            <p className="text-muted-foreground mb-6">
              Don't face your challenges alone. Share your prayer request and let our community pray with you.
            </p>
            <Button size="lg" onClick={() => setDialogOpen(true)}>
              <Plus className="w-5 h-5 mr-2" />
              Submit Prayer Request
            </Button>
          </div>
        )}
      </div>

      <PrayerRequestDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchRequests}
      />

      <Footer />
    </div>
  );
};

export default PrayerRequests;
