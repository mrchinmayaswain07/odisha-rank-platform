import { createClient } from "@supabase/supabase-js";

async function makeAdmin() {
  const email = process.argv[2];

  if (!email) {
    console.log("Usage: npx tsx scripts/set-admin.ts <user-email>");
    process.exit(1);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey || supabaseUrl.includes("placeholder")) {
    console.error("Error: Live SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required in environment.");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Find user by email
  const { data: usersData, error: userErr } = await supabase.auth.admin.listUsers();
  if (userErr || !usersData?.users) {
    console.error("Error fetching users:", userErr?.message);
    process.exit(1);
  }

  const user = usersData.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

  if (!user) {
    console.error(`User with email "${email}" not found. Please register on the website first.`);
    process.exit(1);
  }

  // Upsert into user_roles
  const { error: roleErr } = await supabase
    .from("user_roles")
    .upsert(
      {
        user_id: user.id,
        role: "admin",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (roleErr) {
    console.error("Error assigning admin role:", roleErr.message);
    process.exit(1);
  }

  console.log(`Successfully granted System Administrator privileges to ${email} (User ID: ${user.id}).`);
}

makeAdmin();
