import { storage } from "./storage";
import bcrypt from "bcrypt";

// Bootstrap function to create initial admin user
export async function bootstrapAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@blueballot.com";
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  // SECURITY: Require explicit admin password to prevent default credentials
  if (!adminPassword) {
    console.error("FATAL: ADMIN_PASSWORD environment variable is required!");
    console.error("Set ADMIN_PASSWORD in your environment to create the admin account");
    console.error("Example: ADMIN_PASSWORD=your-secure-password npm run dev");
    process.exit(1);
  }

  // Enforce minimum password length
  if (adminPassword.length < 8) {
    console.error("FATAL: ADMIN_PASSWORD must be at least 8 characters long");
    process.exit(1);
  }
  
  // Check if admin already exists
  const existing = await storage.getUserByEmail(adminEmail);
  if (existing) {
    console.log("Admin user already exists");
    return;
  }

  // Create admin user
  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  const admin = await storage.createUser({
    email: adminEmail,
    password: hashedPassword,
    role: "admin",
    name: "System Administrator",
  });

  await storage.createAuditLog({
    userId: admin.id,
    action: "admin_bootstrapped",
    entityType: "user",
    entityId: admin.id,
  });

  console.log(`Admin user created: ${adminEmail}`);
  console.log("Admin password has been set from ADMIN_PASSWORD environment variable");
  console.log("IMPORTANT: Keep this password secure and change it regularly");
}
