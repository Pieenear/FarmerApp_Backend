import "dotenv/config.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const adapter = new PrismaPg({ connectionString });

const prisma = new PrismaClient({ adapter });

// Optional: test connection safely
export async function connectDB() {
  try {
    console.log("Connecting to DB...");
    await prisma.$connect();
    console.log("✅ DB connected");
  } catch (err) {
    console.error("❌ DB connection failed:", err);
  }
}

export { prisma };