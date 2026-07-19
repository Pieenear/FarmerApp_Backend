import { prisma } from "./dist/lib/prisma.js";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const users = await prisma.user.findMany({
    include: {
      farmerProfile: true,
    }
  });
  console.log("Registered Users:");
  for (const u of users) {
    console.log(`User ID: ${u.id}, Name: ${u.name}, Phone: ${u.phone}, Role: ${u.role}`);
  }

  const requests = await prisma.serviceRequest.findMany({
    include: {
      farmer: true,
      labReports: true,
    }
  });
  console.log("\nService Requests:");
  for (const req of requests) {
    console.log(`Request ID: ${req.id}, Farmer: ${req.farmer.name} (${req.farmer.phone}), Type: ${req.requestType}, Status: ${req.status}, Reports Count: ${req.labReports.length}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
