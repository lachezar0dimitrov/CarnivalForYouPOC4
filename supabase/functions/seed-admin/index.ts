import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ADMIN_EMAIL = "valeriya@carnicalforyou.com";
const ADMIN_PASSWORD = "Bogomil";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Check if user already exists
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existing = existingUsers?.users?.find(
      (u) => u.email === ADMIN_EMAIL
    );

    let userId: string;

    if (existing) {
      // Reset password and confirm email for existing user
      const { data, error } = await adminClient.auth.admin.updateUserById(
        existing.id,
        {
          password: ADMIN_PASSWORD,
          email_confirm: true,
        }
      );
      if (error) throw error;
      userId = data.user.id;
    } else {
      // Create new admin user with confirmed email
      const { data, error } = await adminClient.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
      });
      if (error) throw error;
      userId = data.user.id;
    }

    // Ensure profile has admin role
    const { error: profileError } = await adminClient
      .from("profiles")
      .upsert({ id: userId, role: "admin" }, { onConflict: "id" });

    if (profileError) {
      // Non-fatal — trigger may have already created the profile
      console.warn("Profile upsert warning:", profileError.message);
    }

    return new Response(
      JSON.stringify({ success: true, userId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
