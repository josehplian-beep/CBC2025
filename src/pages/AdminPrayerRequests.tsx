import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Calendar, User, CheckCircle, Trash2, Mail } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface PrayerRequest {
  id: string;
  title: string;
  content: string;
  author_name: string;
  author_id: string | null;
  is_anonymous: boolean;
  is_answered: boolean;
  created_at: string;
}

const AdminPrayerRequests = () => {
  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "answered">("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

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

  const handleMarkAnswered = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('prayer_requests')
        .update({ is_answered: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      
      toast.success(currentStatus ? "Marked as unanswered" : "Marked as answered");
      fetchRequests();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error updating prayer request:', error);
      }
      toast.error("Failed to update request");
    }
  };

  const handleDelete = async () => {
    if (!selectedRequest) return;

    try {
      const { error } = await supabase
        .from('prayer_requests')
        .delete()
        .eq('id', selectedRequest);

      if (error) throw error;
      
      toast.success("Prayer request deleted");
      setDeleteDialogOpen(false);
      setSelectedRequest(null);
      fetchRequests();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error deleting prayer request:', error);
      }
      toast.error("Failed to delete request");
    }
  };

  const filteredRequests = requests.filter(request => {
    if (filter === "active") return !request.is_answered;
    if (filter === "answered") return request.is_answered;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Heart className="w-8 h-8 text-primary" />
            Prayer Requests
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage and respond to prayer requests from the community
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Heart className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requests.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Prayers</CardTitle>
            <Heart className="w-4 h-4 text-primary fill-current" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requests.filter(r => !r.is_answered).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Answered Prayers</CardTitle>
            <CheckCircle className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requests.filter(r => r.is_answered).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
        <TabsList>
          <TabsTrigger value="all">All ({requests.length})</TabsTrigger>
          <TabsTrigger value="active">
            Active ({requests.filter(r => !r.is_answered).length})
          </TabsTrigger>
          <TabsTrigger value="answered">
            Answered ({requests.filter(r => r.is_answered).length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Prayer Requests List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-32 bg-muted" />
            </Card>
          ))}
        </div>
      ) : filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Prayer Requests</h3>
            <p className="text-muted-foreground">
              {filter === "active" 
                ? "All prayer requests have been answered!"
                : filter === "answered"
                ? "No answered prayer requests yet."
                : "No prayer requests have been submitted yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{request.title}</h3>
                      {request.is_answered && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Answered
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{request.author_name}</span>
                        {!request.author_id && (
                          <Badge variant="outline" className="ml-2">Visitor</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{format(new Date(request.created_at), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap mb-4">
                  {request.content}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMarkAnswered(request.id, request.is_answered)}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {request.is_answered ? "Mark Unanswered" : "Mark Answered"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setSelectedRequest(request.id);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Prayer Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this prayer request? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPrayerRequests;
