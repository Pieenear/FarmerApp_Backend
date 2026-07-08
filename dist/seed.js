import bcrypt from "bcryptjs";
import { prisma } from "./lib/prisma.js";
import { Role } from "./generated/prisma/client.js";
async function main() {
    console.log("🌱 Starting database seeding...");
    // 1. Seed Areas
    const areasData = [
        { name: "Pune Rural", taluka: "Haveli", district: "Pune", state: "Maharashtra", pincode: "411041" },
        { name: "Nashik Valley", taluka: "Niphad", district: "Nashik", state: "Maharashtra", pincode: "422303" },
        { name: "Nagpur North", taluka: "Katol", district: "Nagpur", state: "Maharashtra", pincode: "441302" },
        { name: "Satara Heights", taluka: "Karad", district: "Satara", state: "Maharashtra", pincode: "415110" },
    ];
    console.log("Seeding Areas...");
    const seededAreas = [];
    for (const area of areasData) {
        const existing = await prisma.area.findFirst({
            where: { name: area.name },
        });
        if (!existing) {
            const newArea = await prisma.area.create({ data: area });
            seededAreas.push(newArea);
            console.log(`Created Area: ${area.name} (ID: ${newArea.id})`);
        }
        else {
            seededAreas.push(existing);
            console.log(`Area already exists: ${area.name} (ID: ${existing.id})`);
        }
    }
    // 2. Seed default admin if not present
    const adminPhone = "9999999999";
    const existingAdmin = await prisma.user.findUnique({
        where: { phone: adminPhone },
    });
    if (!existingAdmin) {
        console.log("Creating default Admin...");
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash("Admin@123", salt);
        const admin = await prisma.user.create({
            data: {
                phone: adminPhone,
                passwordHash,
                name: "System Admin",
                email: "admin@farmerapp.com",
                role: Role.admin,
                isActive: true,
                isVerified: true,
            },
        });
        console.log(`Created Admin user: ${admin.name} (Phone: ${admin.phone})`);
    }
    else {
        console.log(`Admin user already exists (Phone: ${existingAdmin.phone})`);
    }
    console.log("✅ Seeding completed successfully!");
}
main()
    .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
