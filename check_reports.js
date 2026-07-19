import { prisma } from "./dist/lib/prisma.js";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const reports = await prisma.labReport.findMany({
    include: {
      simplifiedReport: true,
      request: true,
    }
  });
  console.log("Found lab reports count:", reports.length);
  for (const r of reports) {
    console.log(`Report ID: ${r.id}, Request ID: ${r.requestId}, Type: ${r.reportType}`);
    console.log(`Raw File URL: ${r.rawFileUrl}`);
    console.log(`Simplified Report:`, JSON.stringify(r.simplifiedReport, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value, 2));
    console.log("-----------------------------------------");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
