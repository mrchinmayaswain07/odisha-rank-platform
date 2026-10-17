import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

function loadEnv() {
  if (fs.existsSync(".env.local")) {
    const content = fs.readFileSync(".env.local", "utf-8");
    content.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const idx = trimmed.indexOf("=");
        if (idx > 0) {
          const key = trimmed.substring(0, idx).trim();
          const val = trimmed.substring(idx + 1).trim();
          process.env[key] = val;
        }
      }
    });
  }
}

loadEnv();

const ROOT_ADMIN_EMAIL = "mrchinmayaswain07@gmail.com";

async function sanitizeAdmins() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing SUPABASE credentials in .env.local");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("1. Fetching all users from Supabase Auth...");
  const { data: usersData, error: userErr } = await supabase.auth.admin.listUsers();
  if (userErr || !usersData?.users) {
    console.error("Error fetching users:", userErr?.message);
    process.exit(1);
  }

  const rootUser = usersData.users.find(
    (u) => u.email?.toLowerCase() === ROOT_ADMIN_EMAIL.toLowerCase()
  );

  console.log(`Found ${usersData.users.length} registered users:`);
  usersData.users.forEach((u) => console.log(` - ${u.id}: ${u.email}`));

  console.log("\n2. Fetching user_roles table records...");
  const { data: currentRoles, error: rolesErr } = await supabase.from("user_roles").select("*");
  if (rolesErr) {
    console.error("Error reading user_roles:", rolesErr.message);
  } else {
    console.log("Current user_roles:", currentRoles);
  }

  // Ensure root admin has role = 'admin'
  if (rootUser) {
    console.log(`\nEnsuring ${ROOT_ADMIN_EMAIL} (${rootUser.id}) has admin role...`);
    const { error: rootErr } = await supabase.from("user_roles").upsert(
      {
        user_id: rootUser.id,
        role: "admin",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
    if (rootErr) console.error("Error upserting root admin role:", rootErr.message);
    else console.log(`✓ Root admin ${ROOT_ADMIN_EMAIL} confirmed as 'admin'.`);
  } else {
    console.warn(`⚠️ Warning: ${ROOT_ADMIN_EMAIL} not found in Supabase Auth yet.`);
  }

  // Remove everyone else from admin role
  if (currentRoles && currentRoles.length > 0) {
    for (const record of currentRoles) {
      if (rootUser && record.user_id === rootUser.id) {
        continue; // Keep root admin
      }
      if (record.role === "admin") {
        console.log(`Revoking admin from user_id: ${record.user_id}...`);
        const { error: updateErr } = await supabase
          .from("user_roles")
          .update({ role: "student", updated_at: new Date().toISOString() })
          .eq("user_id", record.user_id);

        if (updateErr) {
          console.error(`Failed to demote ${record.user_id}:`, updateErr.message);
        } else {
          console.log(`✓ Demoted ${record.user_id} to student.`);
        }
      }
    }
  }

  // Also update profiles table if role column exists
  console.log("\n3. Ensuring profiles table reflects admin role correctly...");
  if (rootUser) {
    await supabase.from("profiles").update({ role: "admin" }).eq("id", rootUser.id);
  }
  if (currentRoles && currentRoles.length > 0) {
    for (const record of currentRoles) {
      if (rootUser && record.user_id !== rootUser.id) {
        await supabase.from("profiles").update({ role: "student" }).eq("id", record.user_id);
      }
    }
  }

  console.log("\n4. Verifying updated user_roles...");
  const { data: verifiedRoles } = await supabase.from("user_roles").select("*");
  console.log("Verified user_roles in database:", verifiedRoles);
}

sanitizeAdmins().catch(console.error);
