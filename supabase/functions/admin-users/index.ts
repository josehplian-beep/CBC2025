import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface UserWithRoles {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string;
  roles: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify the requesting user is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isAdministrator = roles?.some((r) => r.role === "administrator");
    if (!isAdministrator) {
      throw new Error("Unauthorized - Administrator only");
    }

    const url = new URL(req.url);
    let action = url.searchParams.get("action");

    // Also check body for action (for supabase.functions.invoke)
    let body: Record<string, unknown> = {};
    if (req.method === "POST") {
      try {
        body = await req.json();
        if (body.action && !action) {
          action = body.action as string;
        }
      } catch {
        // No body or invalid JSON
      }
    }

    // Handle create user action
    if (action === "create_user" && req.method === "POST") {
      const { email, password, role } = body as { email: string; password: string; role: string };
      
      if (!email || !password || !role) {
        return new Response(
          JSON.stringify({ error: "Email, password, and role are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate role
      const validRoles = ["staff", "admin", "viewer", "member", "editor", "teacher", "administrator"];
      if (!validRoles.includes(role)) {
        return new Response(
          JSON.stringify({ error: "Invalid role specified" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create user with admin API
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (createError) {
        console.error("Error creating user:", createError);
        return new Response(
          JSON.stringify({ error: createError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!newUser.user) {
        return new Response(
          JSON.stringify({ error: "Failed to create user" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Assign role to the new user
      const { error: roleInsertError } = await supabaseAdmin
        .from("user_roles")
        .insert([{ user_id: newUser.user.id, role }]);

      if (roleInsertError) {
        console.error("Error assigning role:", roleInsertError);
        await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
        return new Response(
          JSON.stringify({ error: "Failed to assign role: " + roleInsertError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`User created successfully: ${email} with role ${role}`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          user: { id: newUser.user.id, email: newUser.user.email },
          message: `User created with ${role} role`
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle password reset action
    if (action === "reset_password" && req.method === "POST") {
      const { userId } = body as { userId: string };
      
      const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: userId,
      });

      if (error) throw error;

      const resetUrl = data.properties?.action_link;
      
      return new Response(
        JSON.stringify({ success: true, resetUrl }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Handle role update action
    if (action === "update_role" && req.method === "POST") {
      const { userId, role } = body as { userId: string; role: string };
      
      const { error: deleteError } = await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      const { error: insertError } = await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: userId, role });

      if (insertError) throw insertError;

      return new Response(
        JSON.stringify({ success: true }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Handle delete user action
    if (action === "delete_user" && req.method === "POST") {
      const { userId } = body as { userId: string };
      
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Get all users
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

    if (usersError) throw usersError;

    // Get roles for all users
    const { data: allRoles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role");

    // Combine users with their roles
    const usersWithRoles: UserWithRoles[] = users.map((user) => ({
      id: user.id,
      email: user.email || "",
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at || "",
      roles: allRoles?.filter((r) => r.user_id === user.id).map((r) => r.role) || [],
    }));

    return new Response(
      JSON.stringify({ users: usersWithRoles }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
