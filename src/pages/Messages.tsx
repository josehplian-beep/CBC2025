import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Inbox, Send, Trash2, Mail, MailOpen, Lock, Loader2, ArrowLeft, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string;
  body: string;
  read: boolean;
  created_at: string;
  sender_name?: string;
  recipient_name?: string;
}

const Messages = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [receivedMessages, setReceivedMessages] = useState<Message[]>([]);
  const [sentMessages, setSentMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
  const [activeTab, setActiveTab] = useState("received");
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    checkAccessAndLoadMessages();
  }, []);

  const checkAccessAndLoadMessages = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      // Check if user has member, staff, or admin role
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);

      const hasRequiredRole = roles?.some(r => r.role === 'staff' || r.role === 'admin' || r.role === 'member');
      
      if (!hasRequiredRole) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      setHasAccess(true);
      setCurrentUserId(session.user.id);
      await loadMessages(session.user.id);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (userId: string) => {
    try {
      // Load received messages
      const { data: received, error: receivedError } = await supabase
        .from('messages')
        .select('*')
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false });

      if (receivedError) throw receivedError;

      // Get sender names for received messages
      const receivedWithNames = await Promise.all(
        (received || []).map(async (msg) => {
          const { data: memberData } = await supabase
            .from('members')
            .select('name')
            .eq('user_id', msg.sender_id)
            .single();
          
          return {
            ...msg,
            sender_name: memberData?.name || 'Unknown Member',
          };
        })
      );

      setReceivedMessages(receivedWithNames);
      setUnreadCount(receivedWithNames.filter(m => !m.read).length);

      // Load sent messages
      const { data: sent, error: sentError } = await supabase
        .from('messages')
        .select('*')
        .eq('sender_id', userId)
        .order('created_at', { ascending: false });

      if (sentError) throw sentError;

      // Get recipient names for sent messages
      const sentWithNames = await Promise.all(
        (sent || []).map(async (msg) => {
          const { data: memberData } = await supabase
            .from('members')
            .select('name')
            .eq('user_id', msg.recipient_id)
            .single();
          
          return {
            ...msg,
            recipient_name: memberData?.name || 'Unknown Member',
          };
        })
      );

      setSentMessages(sentWithNames);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: "Error",
        description: `Failed to load messages: ${message}`,
        variant: "destructive",
      });
    }
  };

  const handleMessageClick = async (message: Message) => {
    setSelectedMessage(message);
    
    // Mark as read if it's a received message and not already read
    if (message.recipient_id === currentUserId && !message.read) {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', message.id);

      if (!error) {
        setReceivedMessages(prev =>
          prev.map(m => m.id === message.id ? { ...m, read: true } : m)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    }
  };

  const handleDeleteMessage = async () => {
    if (!messageToDelete) return;

    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageToDelete.id);

      if (error) throw error;

      // Remove from appropriate list
      if (messageToDelete.recipient_id === currentUserId) {
        setReceivedMessages(prev => prev.filter(m => m.id !== messageToDelete.id));
        if (!messageToDelete.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      } else {
        setSentMessages(prev => prev.filter(m => m.id !== messageToDelete.id));
      }

      toast({
        title: "Message Deleted",
        description: "The message has been deleted successfully",
      });

      if (selectedMessage?.id === messageToDelete.id) {
        setSelectedMessage(null);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: "Error",
        description: `Failed to delete message: ${message}`,
        variant: "destructive",
      });
    } finally {
      setMessageToDelete(null);
    }
  };

  const renderMessageList = (messages: Message[], isSent: boolean) => {
    if (messages.length === 0) {
      return (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {isSent ? "No sent messages" : "No messages in your inbox"}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
              !message.read && !isSent ? 'bg-primary/5 border-primary/20' : 'bg-background'
            }`}
            onClick={() => handleMessageClick(message)}
          >
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {!message.read && !isSent && (
                    <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                  )}
                  {message.read && !isSent && (
                    <MailOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                  <p className="font-semibold truncate">
                    {isSent ? `To: ${message.recipient_name}` : `From: ${message.sender_name}`}
                  </p>
                  {!message.read && !isSent && (
                    <Badge variant="default" className="ml-auto flex-shrink-0">New</Badge>
                  )}
                </div>
                <p className="font-medium truncate">{message.subject}</p>
                <p className="text-sm text-muted-foreground truncate">{message.body}</p>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <p className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMessageToDelete(message);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-20">
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              You need to be logged in as a member to view messages.
            </AlertDescription>
          </Alert>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-20">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">Messages</h1>
            <p className="text-muted-foreground">
              Communicate privately with other church members
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/members')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Members
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="received" className="relative">
              <Inbox className="mr-2 h-4 w-4" />
              Inbox
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent">
              <Send className="mr-2 h-4 w-4" />
              Sent
            </TabsTrigger>
          </TabsList>

          <TabsContent value="received" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Inbox ({receivedMessages.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {renderMessageList(receivedMessages, false)}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sent" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Sent Messages ({sentMessages.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {renderMessageList(sentMessages, true)}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Message Detail Dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedMessage?.subject}</DialogTitle>
            <DialogDescription>
              {selectedMessage?.recipient_id === currentUserId
                ? `From: ${selectedMessage?.sender_name}`
                : `To: ${selectedMessage?.recipient_name}`}
              {' • '}
              {selectedMessage && formatDistanceToNow(new Date(selectedMessage.created_at), { addSuffix: true })}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="whitespace-pre-wrap text-foreground">
              {selectedMessage?.body}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!messageToDelete} onOpenChange={() => setMessageToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMessage}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
};

export default Messages;
