import { prisma } from "../lib/prisma";

async function deleteUser(email: string) {
  try {
    console.log(`Looking for user with email: ${email}...`);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log(`⚠️  User not found: ${email}`);
      process.exit(0);
    }

    console.log(`Found user: ${user.name} (${user.email})`);
    console.log(`Deleting user and all related data...`);

    await prisma.user.delete({
      where: { email },
    });

    console.log("✅ User deleted successfully!");
  } catch (error: any) {
    console.error("❌ Error deleting user:", error.message || error);
  }

  await prisma.$disconnect();
  process.exit(0);
}

const email = process.argv[2];
if (!email) {
  console.error("❌ Please provide an email address");
  console.log("Usage: npx tsx scripts/delete-user.ts <email>");
  process.exit(1);
}

deleteUser(email);
