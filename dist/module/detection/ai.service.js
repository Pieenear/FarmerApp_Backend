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
        const detectedDiseaseMatch = cleaned.match(/"detectedDisease(?:En)?"\s*:\s*"([^"]+)"/);
        const confidenceScoreMatch = cleaned.match(/"confidenceScore"\s*:\s*(\d+(?:\.\d+)?)/);
        let recommendation = null;
        const recMatchWithQuote = cleaned.match(/"recommendation(?:En)?"\s*:\s*"([\s\S]+?)"/);
        if (recMatchWithQuote) {
            recommendation = recMatchWithQuote[1];
        }
        else {
            const recMatchToEnd = cleaned.match(/"recommendation(?:En)?"\s*:\s*"([\s\S]+)$/);
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
    if (geminiKey) {
        try {
            console.log("Calling Gemini API for crop disease detection (Bilingual EN & MR)...");
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
                                { text: `You are an expert plant pathologist. Analyze this crop leaf image (Crop: ${cropType || "Unknown"}). Identify if there is a disease. Return a JSON object containing both English and Marathi translations with this exact schema:
{
  "detectedDiseaseEn": string (name of disease in English, or 'Healthy' if healthy),
  "detectedDiseaseMr": string (name of disease in Marathi),
  "confidenceScore": number (0 to 100),
  "recommendationEn": string (actionable treatment recommendations in English),
  "recommendationMr": string (actionable treatment recommendations in Marathi)
}` },
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
                const diseaseEn = parsed.detectedDiseaseEn || parsed.detectedDisease || "Unknown Disease";
                const diseaseMr = parsed.detectedDiseaseMr || parsed.detectedDisease || "अज्ञात रोग";
                const recEn = parsed.recommendationEn || parsed.recommendation || "Maintain crop health.";
                const recMr = parsed.recommendationMr || parsed.recommendation || "पिकाचे आरोग्य सुस्थितीत ठेवा.";
                return {
                    detectedDisease: JSON.stringify({ en: diseaseEn, mr: diseaseMr }),
                    confidenceScore: Number(parsed.confidenceScore) || 80.0,
                    recommendation: JSON.stringify({ en: recEn, mr: recMr }),
                };
            }
        }
        catch (error) {
            console.error("Gemini API call failed, falling back:", error);
        }
    }
    // Fallback Mock AI Response (Bilingual EN & MR)
    console.log("Using Mock AI fallback for disease detection...");
    const lowerCrop = (cropType || "").toLowerCase();
    if (lowerCrop.includes("rice")) {
        return {
            detectedDisease: JSON.stringify({
                en: "Rice Blast (Magnaporthe oryzae)",
                mr: "तांदूळ करपा रोग (Rice Blast)"
            }),
            confidenceScore: 88.5,
            recommendation: JSON.stringify({
                en: "Spray Tricyclazole 75% WP @ 120g/acre or Azoxystrobin 25% SC @ 200ml/acre in 200 liters of water. Maintain proper field drainage.",
                mr: "प्रति एकर १२० ग्रॅम ट्रायसायक्लॅझोल ७५% डब्ल्यूपी किंवा २०० मिली अझॉक्सिस्ट्रॉबिन २५% एससी २०० लिटर पाण्यात मिसळून फवारणी करा. शेतात पाण्याचा निचरा योग्य ठेवा."
            }),
        };
    }
    else if (lowerCrop.includes("wheat")) {
        return {
            detectedDisease: JSON.stringify({
                en: "Wheat Rust (Puccinia graminis)",
                mr: "गव्हावरील तांबेरा रोग (Wheat Rust)"
            }),
            confidenceScore: 91.0,
            recommendation: JSON.stringify({
                en: "Apply Propiconazole 25% EC @ 200ml/acre or Tebuconazole 250% EC @ 200ml/acre. Avoid excessive nitrogen fertilizer application.",
                mr: "प्रोपिकोनाझोल २५% ईसी @ २०० मिली/एकर किंवा टेब्युकोनाझोल २५०% ईसी @ २०० मिली/एकर फवारा. जास्त नायट्रोजन खतांचा वापर टाळा."
            }),
        };
    }
    return {
        detectedDisease: JSON.stringify({
            en: "Fungal Leaf Spot (Cercospora)",
            mr: "पानांवरील बुरशीजन्य ठिपके (Fungal Leaf Spot)"
        }),
        confidenceScore: 82.0,
        recommendation: JSON.stringify({
            en: "Remove and destroy infected plant debris. Spray copper-based fungicides at the onset of symptoms.",
            mr: "संसर्गित पानांचे ढीग गोळा करून नष्ट करा. लक्षणे दिसू लागताच कॉपर-आधारित बुरशीनाशकांची फवारणी करा."
        }),
    };
};
export const analyzeLabReport = async (rawFileUrl, reportType, languagePref) => {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
        try {
            console.log(`Calling Gemini API to simplify lab report (${reportType}) in EN & MR...`);
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
Return a JSON object containing both English and Marathi translations with this exact schema:
{
  "summaryTextEn": string (summary in English),
  "summaryTextMr": string (summary in Marathi),
  "healthScore": number (0 to 100),
  "keyParameters": Record<string, string | number>,
  "recommendationsEn": string (step-by-step recommendations in English),
  "recommendationsMr": string (step-by-step recommendations in Marathi)
}` },
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
                const summaryEn = parsed.summaryTextEn || parsed.summaryText || "Lab report analysis complete.";
                const summaryMr = parsed.summaryTextMr || parsed.summaryText || "प्रयोगशाळा अहवाल विश्लेषण पूर्ण झाले.";
                const recEn = parsed.recommendationsEn || parsed.recommendations || "Follow standard crop management advice.";
                const recMr = parsed.recommendationsMr || parsed.recommendations || "मानक पीक व्यवस्थापन सल्ल्याचे पालन करा.";
                return {
                    summaryText: JSON.stringify({ en: summaryEn, mr: summaryMr }),
                    healthScore: Number(parsed.healthScore) || 80,
                    keyParameters: parsed.keyParameters || {},
                    recommendations: JSON.stringify({ en: recEn, mr: recMr }),
                };
            }
        }
        catch (error) {
            console.error("Gemini Lab Report analysis failed, falling back:", error);
        }
    }
    // Fallback if Gemini fails or is not configured
    console.log("Using Mock AI fallback for lab report analysis (Bilingual EN & MR)...");
    if (reportType.toLowerCase() === "soil") {
        return {
            summaryText: JSON.stringify({
                en: "The soil has adequate pH but is significantly deficient in nitrogen and organic carbon.",
                mr: "मातीमध्ये नायट्रोजन आणि सेंद्रिय कर्बाचे प्रमाण खूप कमी आहे. पीएच (pH) योग्य आहे."
            }),
            healthScore: 72,
            keyParameters: {
                "nitrogen": "Deficient (140 kg/ha)",
                "phosphorus": "Medium (22 kg/ha)",
                "potassium": "Adequate (290 kg/ha)",
                "pH": 6.8,
                "organicCarbon": "Low (0.35%)"
            },
            recommendations: JSON.stringify({
                en: "1. Apply 50 kg/acre Urea in split doses.\n2. Mix 5 tons of well-rotted farmyard manure or compost to improve organic matter.\n3. Grow green manure crops like Sunnhemp before the main cropping season.",
                mr: "१. प्रति एकर ५० किलो युरिया दोन किंवा तीन हप्त्यांमध्ये द्या.\n२. सेंद्रिय खतांचा (शेणखत किंवा कंपोस्ट) ५ टन प्रति एकर वापर करा.\n३. पिकाची फेरपालट करा आणि हिरवळीच्या खतांचा वापर करा."
            })
        };
    }
    else {
        return {
            summaryText: JSON.stringify({
                en: "Water sample shows moderate salinity (EC) and high bicarbonate levels, making it slightly alkaline. Suitable for irrigation with proper drainage.",
                mr: "पाण्यामध्ये क्षारता थोडी जास्त आहे. पीएच (pH) किंचित अल्कधर्मी आहे, परंतु योग्य निचऱ्यासह सिंचनासाठी वापरले जाऊ शकते."
            }),
            healthScore: 78,
            keyParameters: {
                pH: 7.9,
                electricalConductivity: "1.2 dS/m",
                sodiumAdsorptionRatio: 4.2,
                bicarbonates: "High (350 mg/L)"
            },
            recommendations: JSON.stringify({
                en: "1. Ensure good field drainage to prevent salt accumulation.\n2. Mix gypsum with irrigation water if soil sodicity increases.\n3. Avoid drip irrigation for crops sensitive to bicarbonate scaling.",
                mr: "१. जमिनीत पाण्याचा निचरा चांगला ठेवा.\n२. क्षार सहन करू शकणाऱ्या पिकांची निवड करा.\n३. ठिबक सिंचन वापरताना चोखळणी होणार नाही याची काळजी घ्या."
            })
        };
    }
};
