import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { Client } from "https://deno.land/x/mysql@v2.12.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // ============ AUTHENTICATION CHECK ============
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'No authorization header provided' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has administrator role
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (rolesError) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to verify user permissions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isAdmin = roles?.some(r => r.role === 'administrator');
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: 'Access denied. Administrator role required.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Administrator access verified for user ${user.id}`);
    // ============ END AUTHENTICATION CHECK ============

    // MySQL connection configuration
    const mysqlClient = await new Client().connect({
      hostname: Deno.env.get('MYSQL_HOST')!,
      username: Deno.env.get('MYSQL_USER')!,
      password: Deno.env.get('MYSQL_PASSWORD')!,
      db: Deno.env.get('MYSQL_DATABASE')!,
    });

    console.log('Connected to MySQL database');

    // Get current count before deletion
    const countResult = await mysqlClient.query('SELECT COUNT(*) as count FROM members');
    const memberCount = countResult[0]?.count || 0;
    console.log(`Found ${memberCount} members in MySQL`);

    // Delete all members from MySQL
    await mysqlClient.execute('DELETE FROM members');
    console.log('All members deleted from MySQL');

    // Verify deletion
    const verifyResult = await mysqlClient.query('SELECT COUNT(*) as count FROM members');
    const remainingCount = verifyResult[0]?.count || 0;

    await mysqlClient.close();

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully deleted ${memberCount} members from MySQL database`,
        deleted_count: memberCount,
        remaining_count: remainingCount
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Delete error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to delete members from MySQL'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
