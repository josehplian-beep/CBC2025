import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, User, Link2, Unlink, Check, Mail, Phone, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Member {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  user_id: string | null;
  profile_image_url: string | null;
}

interface MemberLinkingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
  onLinkComplete: () => void;
}

export function MemberLinkingDialog({ 
  isOpen, 
  onClose, 
  userId, 
  userEmail,
  onLinkComplete 
}: MemberLinkingDialogProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [linkedMember, setLinkedMember] = useState<Member | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchMembers();
    }
  }, [isOpen, userId]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      // First check if user is already linked to a member
      const { data: linkedData, error: linkedError } = await supabase
        .from('members')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (linkedError) throw linkedError;
      if (linkedData) {
        setLinkedMember(linkedData);
      } else {
        setLinkedMember(null);
      }

      // Fetch all members that are not linked to any user
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .is('user_id', null)
        .order('name');

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load members",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLinkMember = async (memberId: string) => {
    setLinking(true);
    try {
      const { error } = await supabase
        .from('members')
        .update({ user_id: userId })
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User linked to member profile successfully",
      });
      
      onLinkComplete();
      fetchMembers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to link user to member profile",
        variant: "destructive",
      });
    } finally {
      setLinking(false);
    }
  };

  const handleUnlinkMember = async () => {
    if (!linkedMember) return;
    setLinking(true);
    try {
      const { error } = await supabase
        .from('members')
        .update({ user_id: null })
        .eq('id', linkedMember.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User unlinked from member profile",
      });
      
      setLinkedMember(null);
      onLinkComplete();
      fetchMembers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unlink user from member profile",
        variant: "destructive",
      });
    } finally {
      setLinking(false);
    }
  };

  const filteredMembers = members.filter(member => 
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate match score for suggested matches
  const getSuggestedMatches = () => {
    if (!userEmail) return [];
    
    const emailUsername = userEmail.split('@')[0].toLowerCase();
    const emailParts = emailUsername.split(/[._-]/);
    
    return members
      .map(member => {
        let score = 0;
        const nameParts = member.name.toLowerCase().split(' ');
        
        // Email match (highest priority)
        if (member.email?.toLowerCase() === userEmail.toLowerCase()) {
          score += 100;
        } else if (member.email?.toLowerCase().includes(emailUsername)) {
          score += 50;
        }
        
        // Name parts match email parts
        for (const namePart of nameParts) {
          for (const emailPart of emailParts) {
            if (namePart.includes(emailPart) || emailPart.includes(namePart)) {
              score += 20;
            }
          }
        }
        
        return { member, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  };

  const suggestedMatches = getSuggestedMatches();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Link User to Member Profile
          </DialogTitle>
          <DialogDescription>
            Connect the user <strong>{userEmail}</strong> to their member profile. 
            This allows them to edit their own profile information.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : linkedMember ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="font-medium text-green-800 dark:text-green-200 flex items-center gap-2 mb-3">
                <Check className="w-5 h-5" />
                Currently Linked to Member Profile
              </p>
              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {linkedMember.profile_image_url ? (
                      <img 
                        src={linkedMember.profile_image_url} 
                        alt={linkedMember.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{linkedMember.name}</h4>
                    {linkedMember.email && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {linkedMember.email}
                      </p>
                    )}
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={handleUnlinkMember}
                    disabled={linking}
                  >
                    {linking ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Unlink className="w-4 h-4 mr-2" />
                        Unlink
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Suggested Matches */}
            {suggestedMatches.length > 0 && (
              <div>
                <Label className="text-sm font-semibold mb-2 block">Suggested Matches</Label>
                <div className="space-y-2">
                  {suggestedMatches.map(({ member, score }) => (
                    <Card key={member.id} className="border-primary/30 bg-primary/5">
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                          {member.profile_image_url ? (
                            <img 
                              src={member.profile_image_url} 
                              alt={member.name} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium truncate">{member.name}</h4>
                            <Badge variant="secondary" className="text-xs">
                              {score >= 100 ? 'Email match' : score >= 50 ? 'Likely match' : 'Possible match'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {member.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" /> {member.email}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => handleLinkMember(member.id)}
                          disabled={linking}
                        >
                          {linking ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Link2 className="w-4 h-4 mr-1" />
                              Link
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Search */}
            <div>
              <Label className="text-sm font-semibold mb-2 block">Search All Members</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Member List */}
            <ScrollArea className="h-[300px] border rounded-lg">
              {filteredMembers.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <User className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">No unlinked members found</p>
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {filteredMembers.map((member) => (
                    <Card key={member.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                          {member.profile_image_url ? (
                            <img 
                              src={member.profile_image_url} 
                              alt={member.name} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{member.name}</h4>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            {member.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" /> {member.email}
                              </span>
                            )}
                            {member.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" /> {member.phone}
                              </span>
                            )}
                            {member.date_of_birth && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> {new Date(member.date_of_birth).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => handleLinkMember(member.id)}
                          disabled={linking}
                        >
                          {linking ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Link2 className="w-4 h-4 mr-1" />
                              Link
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}