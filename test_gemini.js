import { analyzeLabReport } from "./dist/module/detection/ai.service.js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const sampleUrl = "https://pdfobject.com/pdf/sample.pdf";
  const localPath = path.join(process.cwd(), "uploads", "sample.pdf");
  
  if (!fs.existsSync(path.dirname(localPath))) {
    fs.mkdirSync(path.dirname(localPath), { recursive: true });
  }

  console.log("Downloading sample PDF...");
  try {
    const res = await fetch(sampleUrl);
    if (!res.ok) throw new Error(`HTTP status ${res.status}`);
    const buffer = await res.arrayBuffer();
    fs.writeFileSync(localPath, Buffer.from(buffer));
    console.log("Sample PDF saved to", localPath);
    
    console.log("Analyzing sample PDF with Gemini...");
    const result = await analyzeLabReport("http://localhost:5000/uploads/sample.pdf", "soil", "en");
    console.log("Success! Gemini Result:", result);
  } catch (err) {
    console.error("Test failed:", err);
  }
}

main();
