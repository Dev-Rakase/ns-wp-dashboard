import { auth } from "../lib/auth";

async function createAdminUser() {
  try {
    console.log("Creating admin user...");

    const result = await auth.api.signUpEmail({
      body: {
        email: "admin@gmail.com",
        password: "NSAI@2025#",
        name: "Admin",
      },
    });

    if (result) {
      console.log("✅ Admin user created successfully!");
      console.log("Email: admin@gmail.com");
      console.log("Password: NSAI@2025#");
      console.log("\nYou can now login with these credentials.");
    } else {
      console.error("❌ Failed to create admin user");
    }
  } catch (error: any) {
    if (
      error.message?.includes("already exists") ||
      error.message?.includes("Unique constraint")
    ) {
      console.log("⚠️  User already exists with email: admin@gmail.com");
      console.log(
        "If you need to reset the password, please delete the existing user first."
      );
    } else {
      console.error("❌ Error creating admin user:", error.message || error);
    }
  }

  process.exit(0);
}

createAdminUser();
