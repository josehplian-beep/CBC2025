import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BirthdayReminderRequest {
  daysAhead?: number; // Check for birthdays in the next X days (default: 7)
  sendToStaff?: boolean; // Send summary to staff/admins (default: true)
  sendToMembers?: boolean; // Send birthday wishes to members (default: false)
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Birthday reminder function invoked");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const requestBody = await req.json().catch(() => ({}));
    const {
      daysAhead = 7,
      sendToStaff = true,
      sendToMembers = false,
    }: BirthdayReminderRequest = requestBody;

    console.log(`Checking for birthdays in the next ${daysAhead} days`);

    // Fetch all members with birthdays
    const { data: members, error: membersError } = await supabaseClient
      .from("members")
      .select("id, name, email, date_of_birth")
      .not("date_of_birth", "is", null);

    if (membersError) {
      console.error("Error fetching members:", membersError);
      throw membersError;
    }

    console.log(`Found ${members?.length || 0} members with birthdays`);

    // Filter members with upcoming birthdays
    const today = new Date();
    const upcomingBirthdays = members?.filter((member) => {
      if (!member.date_of_birth) return false;

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

      const daysUntilBirthday = Math.ceil(
        (thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      return daysUntilBirthday >= 0 && daysUntilBirthday <= daysAhead;
    }) || [];

    console.log(`Found ${upcomingBirthdays.length} upcoming birthdays`);

    const emailsSent = [];

    // Send birthday wishes to members (if enabled and today is their birthday)
    if (sendToMembers) {
      const todayBirthdays = upcomingBirthdays.filter((member) => {
        const birthDate = new Date(member.date_of_birth!);
        const thisYearBirthday = new Date(
          today.getFullYear(),
          birthDate.getMonth(),
          birthDate.getDate()
        );
        const daysUntil = Math.ceil(
          (thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysUntil === 0;
      });

      for (const member of todayBirthdays) {
        if (member.email) {
          try {
            const { data, error } = await resend.emails.send({
              from: "CBC Church <onboarding@resend.dev>",
              to: [member.email],
              subject: "Happy Birthday! 🎉",
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h1 style="color: #333;">Happy Birthday, ${member.name}! 🎂</h1>
                  <p style="font-size: 16px; color: #666;">
                    On behalf of everyone at CBC Church, we wish you a wonderful birthday 
                    filled with joy, blessings, and celebration!
                  </p>
                  <p style="font-size: 16px; color: #666;">
                    May this year bring you closer to God's purpose for your life and 
                    be filled with His abundant blessings.
                  </p>
                  <p style="font-size: 14px; color: #999; margin-top: 30px;">
                    With love,<br>
                    CBC Church Family
                  </p>
                </div>
              `,
            });

            if (error) {
              console.error(`Error sending birthday email to ${member.name}:`, error);
            } else {
              console.log(`Birthday email sent to ${member.name}`);
              emailsSent.push({ to: member.email, type: "birthday" });
            }
          } catch (error) {
            console.error(`Failed to send birthday email to ${member.name}:`, error);
          }
        }
      }
    }

    // Send summary to staff/admins
    if (sendToStaff && upcomingBirthdays.length > 0) {
      // Fetch admin and staff emails
      const { data: staffUsers, error: staffError } = await supabaseClient
        .from("user_roles")
        .select("user_id, profiles!inner(email)")
        .in("role", ["admin", "staff"]);

      if (staffError) {
        console.error("Error fetching staff:", staffError);
      } else {
        const staffEmails = staffUsers
          ?.map((u: any) => u.profiles?.email)
          .filter(Boolean) || [];

        if (staffEmails.length > 0) {
          // Sort birthdays by date
          const sortedBirthdays = upcomingBirthdays.sort((a, b) => {
            const dateA = new Date(a.date_of_birth!);
            const dateB = new Date(b.date_of_birth!);
            const todayA = new Date(today.getFullYear(), dateA.getMonth(), dateA.getDate());
            const todayB = new Date(today.getFullYear(), dateB.getMonth(), dateB.getDate());
            return todayA.getTime() - todayB.getTime();
          });

          const birthdayList = sortedBirthdays
            .map((member) => {
              const birthDate = new Date(member.date_of_birth!);
              const thisYearBirthday = new Date(
                today.getFullYear(),
                birthDate.getMonth(),
                birthDate.getDate()
              );
              if (thisYearBirthday < today) {
                thisYearBirthday.setFullYear(today.getFullYear() + 1);
              }
              const daysUntil = Math.ceil(
                (thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
              );

              const dateStr = thisYearBirthday.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
              });

              let timing = "";
              if (daysUntil === 0) timing = "Today";
              else if (daysUntil === 1) timing = "Tomorrow";
              else timing = `In ${daysUntil} days`;

              return `
                <tr>
                  <td style="padding: 12px; border-bottom: 1px solid #eee;">${member.name}</td>
                  <td style="padding: 12px; border-bottom: 1px solid #eee;">${dateStr}</td>
                  <td style="padding: 12px; border-bottom: 1px solid #eee;"><strong>${timing}</strong></td>
                </tr>
              `;
            })
            .join("");

          try {
            const { data, error } = await resend.emails.send({
              from: "CBC Church <onboarding@resend.dev>",
              to: staffEmails,
              subject: `Upcoming Birthdays - Next ${daysAhead} Days 🎂`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
                  <h1 style="color: #333;">Upcoming Member Birthdays</h1>
                  <p style="font-size: 16px; color: #666;">
                    Here are the member birthdays in the next ${daysAhead} days:
                  </p>
                  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <thead>
                      <tr style="background-color: #f5f5f5;">
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Name</th>
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Birthday</th>
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Timing</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${birthdayList}
                    </tbody>
                  </table>
                  <p style="font-size: 14px; color: #999; margin-top: 30px;">
                    This is an automated reminder from the CBC Church member management system.
                  </p>
                </div>
              `,
            });

            if (error) {
              console.error("Error sending staff summary email:", error);
            } else {
              console.log(`Staff summary email sent to ${staffEmails.length} recipients`);
              emailsSent.push({ to: staffEmails, type: "summary" });
            }
          } catch (error) {
            console.error("Failed to send staff summary email:", error);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        upcomingBirthdays: upcomingBirthdays.length,
        emailsSent: emailsSent.length,
        birthdays: upcomingBirthdays.map((m) => ({
          name: m.name,
          date: m.date_of_birth,
        })),
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in birthday-reminder function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
