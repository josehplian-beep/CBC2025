import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Cake, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Member {
  id: string;
  name: string;
  date_of_birth: string;
}

interface BirthdayMember extends Member {
  daysUntil: number;
  dateDisplay: string;
}

export const UpcomingBirthdays = () => {
  const [birthdays, setBirthdays] = useState<BirthdayMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUpcomingBirthdays();
  }, []);

  const loadUpcomingBirthdays = async () => {
    try {
      const { data: members, error } = await supabase
        .from("members")
        .select("id, name, date_of_birth")
        .not("date_of_birth", "is", null);

      if (error) throw error;

      const today = new Date();
      const daysAhead = 30; // Show birthdays in next 30 days

      const upcomingBirthdays = members
        ?.map((member) => {
          const birthDate = new Date(member.date_of_birth);
          const thisYearBirthday = new Date(
            today.getFullYear(),
            birthDate.getMonth(),
            birthDate.getDate()
          );

          // If birthday already passed this year, check next year
          if (thisYearBirthday < today) {
            thisYearBirthday.setFullYear(today.getFullYear() + 1);
          }

          const daysUntil = Math.ceil(
            (thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );

          return {
            ...member,
            daysUntil,
            dateDisplay: thisYearBirthday.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
          };
        })
        .filter((member) => member.daysUntil >= 0 && member.daysUntil <= daysAhead)
        .sort((a, b) => a.daysUntil - b.daysUntil) || [];

      setBirthdays(upcomingBirthdays);
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

  const sendBirthdayReminders = async () => {
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("birthday-reminder", {
        body: {
          daysAhead: 7,
          sendToStaff: true,
          sendToMembers: false,
        },
      });

      if (error) throw error;

      toast({
        title: "Reminders Sent",
        description: `Birthday reminders sent for ${data.upcomingBirthdays} member(s)`,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cake className="h-5 w-5 text-primary" />
            Upcoming Birthdays
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Cake className="h-5 w-5 text-primary" />
            Upcoming Birthdays
          </CardTitle>
          <Button
            onClick={sendBirthdayReminders}
            disabled={sending || birthdays.length === 0}
            size="sm"
            variant="outline"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Send Reminders
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {birthdays.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">
              No upcoming birthdays in the next 30 days
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {birthdays.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 rounded-full p-2">
                    <Cake className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{member.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {member.dateDisplay}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={member.daysUntil === 0 ? "default" : "secondary"}
                >
                  {member.daysUntil === 0
                    ? "Today!"
                    : member.daysUntil === 1
                    ? "Tomorrow"
                    : `In ${member.daysUntil} days`}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
