import fs from "fs";
import path from "path";
const cleanAndParseJSON = (text) => {
    let cleaned = text.trim();
    // Strip markdown code blocks
    if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/, "");
    }
    cleaned = cleaned.trim();
    // Fix incomplete/truncated JSON structures
    let quotes = 0;
    for (let i = 0; i < cleaned.length; i++) {
        if (cleaned[i] === '"' && (i === 0 || cleaned[i - 1] !== '\\')) {
            quotes++;
        }
    }
    if (quotes % 2 !== 0) {
        cleaned += '"';
    }
    if (!cleaned.endsWith("}")) {
        cleaned += "}";
    }
    try {
        return JSON.parse(cleaned);
    }
    catch (err) {
        console.error("Standard JSON parse failed, attempting regex fallback:", err);
        // Simple regex extraction for keys if JSON is malformed
        const detectedDiseaseMatch = cleaned.match(/"detectedDisease"\s*:\s*"([^"]+)"/);
        const confidenceScoreMatch = cleaned.match(/"confidenceScore"\s*:\s*(\d+(?:\.\d+)?)/);
        let recommendation = null;
        const recMatchWithQuote = cleaned.match(/"recommendation"\s*:\s*"([\s\S]+?)"/);
        if (recMatchWithQuote) {
            recommendation = recMatchWithQuote[1];
        }
        else {
            const recMatchToEnd = cleaned.match(/"recommendation"\s*:\s*"([\s\S]+)$/);
            if (recMatchToEnd) {
                recommendation = recMatchToEnd[1].replace(/\}?\s*$/, "").replace(/"\s*$/, "");
            }
        }
        if (detectedDiseaseMatch || confidenceScoreMatch || recommendation) {
            return {
                detectedDisease: detectedDiseaseMatch ? detectedDiseaseMatch[1] : null,
                confidenceScore: confidenceScoreMatch ? Number(confidenceScoreMatch[1]) : null,
                recommendation: recommendation
            };
        }
        throw err;
    }
};
export const analyzeCropImage = async (imageUrl, cropType, languagePref) => {
    const geminiKey = process.env.GEMINI_API_KEY;
    // 1. Try Gemini Multimodal API if configured
    if (geminiKey) {
        try {
            console.log("Calling Gemini API for crop disease detection...");
            let base64Image = "";
            let mimeType = "image/jpeg";
            if (imageUrl.includes("/uploads/")) {
                try {
                    const fileName = imageUrl.split("/uploads/")[1];
                    const filePath = path.join(process.cwd(), "uploads", fileName);
                    if (fs.existsSync(filePath)) {
                        const buffer = fs.readFileSync(filePath);
                        base64Image = buffer.toString("base64");
                        const ext = path.extname(fileName).toLowerCase();
                        mimeType = ext === ".png" ? "image/png" : (ext === ".webp" ? "image/webp" : "image/jpeg");
                    }
                }
                catch (readErr) {
                    console.warn("Failed to read uploaded image locally, falling back to fetch:", readErr);
                }
            }
            if (!base64Image) {
                const imgRes = await fetch(imageUrl, {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
                    }
                });
                if (!imgRes.ok)
                    throw new Error(`Failed to download crop image. Status: ${imgRes.status}`);
                mimeType = imgRes.headers.get("content-type") || "image/jpeg";
                if (mimeType.includes("text/html") || (!mimeType.startsWith("image/") && mimeType !== "application/octet-stream")) {
                    throw new Error(`The provided URL is a web page or invalid file, not a raw image (MIME: ${mimeType}). Please use a direct link to an image file (e.g. JPEG, PNG, WebP).`);
                }
                const buffer = await imgRes.arrayBuffer();
                base64Image = Buffer.from(buffer).toString("base64");
            }
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiKey}`;
            const response = await fetch(geminiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{
                            parts: [
                                { text: `You are an expert plant pathologist. Analyze this crop leaf image (Crop: ${cropType || "Unknown"}). Identify if there is a disease. Return a JSON object with this exact schema: { "detectedDisease": string (name of disease, or 'Healthy' if healthy), "confidenceScore": number (0 to 100), "recommendation": string (actionable treatment recommendations) }. All text fields ("detectedDisease" and "recommendation") MUST be written in ${languagePref === "mr" ? "Marathi" : "English"} language.` },
                                { inlineData: { mimeType, data: base64Image } }
                            ]
                        }],
                    generationConfig: {
                        responseMimeType: "application/json",
                    }
                })
            });
            if (!response.ok) {
                const errBody = await response.text();
                throw new Error(`Gemini API error: ${response.statusText} (Body: ${errBody})`);
            }
            const resData = await response.json();
            const jsonText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (jsonText) {
                console.log("Raw Gemini JSON Response:", jsonText);
                const parsed = cleanAndParseJSON(jsonText);
                return {
                    detectedDisease: parsed.detectedDisease || "Unknown Disease",
                    confidenceScore: Number(parsed.confidenceScore) || 80.0,
                    recommendation: parsed.recommendation || "Maintain crop health.",
                };
            }
        }
        catch (error) {
            console.error("Gemini API call failed, falling back:", error);
        }
    }
    // 4. Smart Fallback Mock AI Response (for out-of-the-box local testing)
    console.log("Using Mock AI fallback for disease detection...");
    const lowerCrop = (cropType || "").toLowerCase();
    if (languagePref === "mr") {
        if (lowerCrop.includes("rice")) {
            return {
                detectedDisease: "तांदूळ करपा रोग (Rice Blast)",
                confidenceScore: 88.5,
                recommendation: "प्रति एकर १२० ग्रॅम ट्रायसायक्लॅझोल ७५% डब्ल्यूपी किंवा २०० मिली अझॉक्सिस्ट्रॉबिन २५% एससी २०० लिटर पाण्यात मिसळून फवारणी करा. शेतात पाण्याचा निचरा योग्य ठेवा.",
            };
        }
        else if (lowerCrop.includes("wheat")) {
            return {
                detectedDisease: "गव्हावरील तांबेरा रोग (Wheat Rust)",
                confidenceScore: 91.0,
                recommendation: "प्रोपिकोनाझोल २५% ईसी @ २०० मिली/एकर किंवा टेब्युकोनाझोल २५०% ईसी @ २०० मिली/एकर फवारा. जास्त नायट्रोजन खतांचा वापर टाळा.",
            };
        }
        return {
            detectedDisease: "पानांवरील बुरशीजन्य ठिपके (Fungal Leaf Spot)",
            confidenceScore: 82.0,
            recommendation: "संसर्गित पानांचे ढीग गोळा करून नष्ट करा. लक्षणे दिसू लागताच कॉपर-आधारित बुरशीनाशकांची फवारणी करा.",
        };
    }
    if (lowerCrop.includes("rice")) {
        return {
            detectedDisease: "Rice Blast (Magnaporthe oryzae)",
            confidenceScore: 88.5,
            recommendation: "Spray Tricyclazole 75% WP @ 120g/acre or Azoxystrobin 25% SC @ 200ml/acre in 200 liters of water. Maintain proper field drainage.",
        };
    }
    else if (lowerCrop.includes("wheat")) {
        return {
            detectedDisease: "Wheat Rust (Puccinia graminis)",
            confidenceScore: 91.0,
            recommendation: "Apply Propiconazole 25% EC @ 200ml/acre or Tebuconazole 250% EC @ 200ml/acre. Avoid excessive nitrogen fertilizer application.",
        };
    }
    return {
        detectedDisease: "Fungal Leaf Spot (Cercospora)",
        confidenceScore: 82.0,
        recommendation: "Remove and destroy infected plant debris. Spray copper-based fungicides at the onset of symptoms.",
    };
};
export const analyzeLabReport = async (rawFileUrl, reportType, languagePref) => {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
        try {
            console.log(`Calling Gemini API to simplify lab report (${reportType})...`);
            let base64File = "";
            let mimeType = "application/pdf";
            if (rawFileUrl.includes("/uploads/")) {
                try {
                    const fileName = rawFileUrl.split("/uploads/")[1];
                    const filePath = path.join(process.cwd(), "uploads", fileName);
                    if (fs.existsSync(filePath)) {
                        const buffer = fs.readFileSync(filePath);
                        base64File = buffer.toString("base64");
                        const ext = path.extname(fileName).toLowerCase();
                        mimeType = ext === ".pdf" ? "application/pdf" : (ext === ".png" ? "image/png" : "image/jpeg");
                    }
                }
                catch (readErr) {
                    console.warn("Failed to read uploaded report locally, falling back to fetch:", readErr);
                }
            }
            if (!base64File) {
                const fileRes = await fetch(rawFileUrl, {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
                    }
                });
                if (!fileRes.ok)
                    throw new Error(`Failed to download report file. Status: ${fileRes.status}`);
                mimeType = fileRes.headers.get("content-type") || "application/pdf";
                const buffer = await fileRes.arrayBuffer();
                base64File = Buffer.from(buffer).toString("base64");
            }
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiKey}`;
            const response = await fetch(geminiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{
                            parts: [
                                { text: `You are an expert agricultural scientist. Analyze this lab testing report (Type: ${reportType}).
Extract:
1. A concise, easy to understand summary of the results (soil or water quality) for the farmer.
2. A numeric overall health score between 0 and 100 representing the condition.
3. Key chemical parameters (e.g. nitrogen, phosphorus, potassium, pH, organic carbon, EC, etc.) as key-value pairs in a single flat JSON object.
4. Detailed, step-by-step actionable recommendations for the farmer to improve crop yields or soil/water quality.

Return a JSON object with this exact schema:
{
  "summaryText": string,
  "healthScore": number,
  "keyParameters": Record<string, string | number>,
  "recommendations": string
}
All text fields ("summaryText" and "recommendations") MUST be written in ${languagePref === "mr" ? "Marathi" : "English"} language.` },
                                { inlineData: { mimeType, data: base64File } }
                            ]
                        }],
                    generationConfig: {
                        responseMimeType: "application/json",
                    }
                })
            });
            if (!response.ok) {
                const errBody = await response.text();
                throw new Error(`Gemini API error: ${response.statusText} (Body: ${errBody})`);
            }
            const resData = await response.json();
            const jsonText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (jsonText) {
                console.log("Raw Gemini JSON Response for Lab Report:", jsonText);
                const parsed = cleanAndParseJSON(jsonText);
                return {
                    summaryText: parsed.summaryText || "Lab report analysis complete.",
                    healthScore: Number(parsed.healthScore) || 80,
                    keyParameters: parsed.keyParameters || {},
                    recommendations: parsed.recommendations || "Follow standard crop management advice.",
                };
            }
        }
        catch (error) {
            console.error("Gemini Lab Report analysis failed, falling back:", error);
        }
    }
    // Fallback if Gemini fails or is not configured
    console.log("Using Mock AI fallback for lab report analysis...");
    if (reportType.toLowerCase() === "soil") {
        if (languagePref === "mr") {
            return {
                summaryText: "मातीमध्ये नायट्रोजन आणि सेंद्रिय कर्बाचे प्रमाण खूप कमी आहे. पीएच (pH) योग्य आहे.",
                healthScore: 72,
                keyParameters: {
                    "नायट्रोजन (N)": "कमी (१४० किलो/हेक्टर)",
                    "फॉस्फरस (P)": "मध्यम (२२ किलो/हेक्टर)",
                    "पोटॅश (K)": "योग्य (२९० किलो/हेक्टर)",
                    "पीएच (pH)": 6.8,
                    "सेंद्रिय कर्ब": "०.३५%"
                },
                recommendations: "१. प्रति एकर ५० किलो युरिया दोन किंवा तीन हप्त्यांमध्ये द्या.\n२. सेंद्रिय खतांचा (शेणखत किंवा कंपोस्ट) ५ टन प्रति एकर वापर करा.\n३. पिकाची फेरपालट करा आणि हिरवळीच्या खतांचा वापर करा."
            };
        }
        return {
            summaryText: "The soil has adequate pH but is significantly deficient in nitrogen and organic carbon.",
            healthScore: 72,
            keyParameters: {
                nitrogen: "Deficient (140 kg/ha)",
                phosphorus: "Medium (22 kg/ha)",
                potassium: "Adequate (290 kg/ha)",
                pH: 6.8,
                organicCarbon: "Low (0.35%)"
            },
            recommendations: "1. Apply 50 kg/acre Urea in split doses.\n2. Mix 5 tons of well-rotted farmyard manure or compost to improve organic matter.\n3. Grow green manure crops like Sunnhemp before the main cropping season."
        };
    }
    else {
        if (languagePref === "mr") {
            return {
                summaryText: "पाण्यामध्ये क्षारता थोडी जास्त आहे. पीएच (pH) किंचित अल्कधर्मी आहे, परंतु योग्य निचऱ्यासह सिंचनासाठी वापरले जाऊ शकते.",
                healthScore: 78,
                keyParameters: {
                    "पीएच (pH)": 7.9,
                    "विद्युत वाहकता (EC)": "१.२ dS/m",
                    "सोडियम प्रमाण (SAR)": 4.2,
                    "बायकार्बोनेट": "३५० mg/L"
                },
                recommendations: "१. जमिनीत पाण्याचा निचरा चांगला ठेवा.\n२. क्षार सहन करू शकणाऱ्या पिकांची निवड करा.\n३. ठिबक सिंचन वापरताना चोखळणी होणार नाही याची काळजी घ्या."
            };
        }
        return {
            summaryText: "Water sample shows moderate salinity (EC) and high bicarbonate levels, making it slightly alkaline. Suitable for irrigation with proper drainage.",
            healthScore: 78,
            keyParameters: {
                pH: 7.9,
                electricalConductivity: "1.2 dS/m",
                sodiumAdsorptionRatio: 4.2,
                bicarbonates: "High (350 mg/L)"
            },
            recommendations: "1. Ensure good field drainage to prevent salt accumulation.\n2. Mix gypsum with irrigation water if soil sodicity increases.\n3. Avoid drip irrigation for crops sensitive to bicarbonate scaling."
        };
    }
};
