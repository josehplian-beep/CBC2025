import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { Client } from "https://deno.land/x/mysql@v2.12.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MemberData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  date_of_birth: string | null;
  gender: string | null;
  baptized: boolean | null;
  department: string | null;
  position: string | null;
  service_year: string | null;
  profile_image_url: string | null;
  family_id: string | null;
  user_id: string | null;
  church_groups: string[] | null;
  created_at: string | null;
  updated_at: string | null;
}

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
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ success: false, error: 'No authorization header provided' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Invalid or expired token:', authError?.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`User authenticated: ${user.id}`);

    // Check if user has administrator role
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (rolesError) {
      console.error('Failed to fetch user roles:', rolesError.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to verify user permissions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isAdmin = roles?.some(r => r.role === 'administrator');
    if (!isAdmin) {
      console.error(`User ${user.id} is not an administrator. Roles: ${JSON.stringify(roles)}`);
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

    // Create members table in MySQL if it doesn't exist
    await mysqlClient.execute(`
      CREATE TABLE IF NOT EXISTS members (
        id VARCHAR(36) PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        address TEXT,
        date_of_birth DATE,
        gender TEXT,
        baptized BOOLEAN DEFAULT FALSE,
        department TEXT,
        position TEXT,
        service_year TEXT,
        profile_image_url TEXT,
        family_id VARCHAR(36),
        user_id VARCHAR(36),
        church_groups JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    console.log('Members table ready in MySQL');

    const { direction } = await req.json();

    if (direction === 'supabase-to-mysql' || direction === 'bidirectional') {
      // Sync from Supabase to MySQL
      console.log('Syncing from Supabase to MySQL...');
      
      const { data: members, error } = await supabaseAdmin
        .from('members')
        .select('*');

      if (error) {
        throw new Error(`Failed to fetch from Supabase: ${error.message}`);
      }

      console.log(`Found ${members?.length || 0} members in Supabase`);

      // Insert or update each member in MySQL
      for (const member of members || []) {
        const churchGroups = member.church_groups ? JSON.stringify(member.church_groups) : null;
        
        await mysqlClient.execute(`
          INSERT INTO members (
            id, name, email, phone, address, date_of_birth, gender, 
            baptized, department, position, service_year, profile_image_url,
            family_id, user_id, church_groups, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            email = VALUES(email),
            phone = VALUES(phone),
            address = VALUES(address),
            date_of_birth = VALUES(date_of_birth),
            gender = VALUES(gender),
            baptized = VALUES(baptized),
            department = VALUES(department),
            position = VALUES(position),
            service_year = VALUES(service_year),
            profile_image_url = VALUES(profile_image_url),
            family_id = VALUES(family_id),
            user_id = VALUES(user_id),
            church_groups = VALUES(church_groups),
            updated_at = CURRENT_TIMESTAMP
        `, [
          member.id,
          member.name,
          member.email,
          member.phone,
          member.address,
          member.date_of_birth,
          member.gender,
          member.baptized,
          member.department,
          member.position,
          member.service_year,
          member.profile_image_url,
          member.family_id,
          member.user_id,
          churchGroups,
          member.created_at,
          member.updated_at
        ]);
      }

      console.log('Sync from Supabase to MySQL completed');
    }

    if (direction === 'mysql-to-supabase' || direction === 'bidirectional') {
      // Sync from MySQL to Supabase
      console.log('Syncing from MySQL to Supabase...');
      
      const mysqlMembers = await mysqlClient.query('SELECT * FROM members');
      console.log(`Found ${mysqlMembers.length} members in MySQL`);

      for (const member of mysqlMembers) {
        const memberData: Partial<MemberData> = {
          id: member.id,
          name: member.name,
          email: member.email,
          phone: member.phone,
          address: member.address,
          date_of_birth: member.date_of_birth,
          gender: member.gender,
          baptized: member.baptized,
          department: member.department,
          position: member.position,
          service_year: member.service_year,
          profile_image_url: member.profile_image_url,
          family_id: member.family_id,
          user_id: member.user_id,
          church_groups: member.church_groups ? JSON.parse(member.church_groups) : null,
        };

        const { error } = await supabaseAdmin
          .from('members')
          .upsert(memberData, { onConflict: 'id' });

        if (error) {
          console.error(`Failed to upsert member ${member.id}:`, error);
        }
      }

      console.log('Sync from MySQL to Supabase completed');
    }

    await mysqlClient.close();

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sync completed successfully (${direction})`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Sync error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
