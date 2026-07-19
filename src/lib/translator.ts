const offlineDictionary: Record<string, string> = {
  "heavy rainfall warning": "मुसळधार पाऊस इशारा",
  "storm warning": "वादळ इशारा",
  "heatwave warning": "उष्णतेची लाट इशारा",
  "frost warning": "धुक्याची आणि गोठण बिंदूची चेतावणी",
  "high temperature warning": "उच्च तापमान इशारा",
  "pest alert": "कीड व रोग प्रादुर्भाव चेतावणी",
  "flood alert": "पूर चेतावणी",
  "drought advisory": "दुष्काळ सल्ला",
  "thunderstorm warning": "विजांसह पावसाचा इशारा",
  "unseasonal rain warning": "अवकाळी पाऊस इशारा",
  "weather alert": "हवामान चेतावणी",
  "agri news": "कृषी बातम्या",
  "prevention tip": "रोग प्रतिबंधक सल्ला",
  "farming tip": "शेती सल्ला"
};

export const translateText = async (text: string, targetLang: string = "mr"): Promise<string> => {
  if (!text) return text;

  // Check offline dictionary first if exact or lower match
  const lower = text.trim().toLowerCase();
  if (targetLang === "mr" && offlineDictionary[lower]) {
    return offlineDictionary[lower];
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    return offlineDictionary[lower] || text;
  }

  try {
    const langName = targetLang === "mr" ? "Marathi" : "English";
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiKey}`;
    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: `Translate the following text into ${langName}. Return ONLY the direct translation without any commentary, markdown blocks, quotes, or explanations.\n\nText: ${text}` }
          ]
        }]
      })
    });

    if (!response.ok) {
      console.warn("Gemini translate error status:", response.statusText);
      return offlineDictionary[lower] || text;
    }

    const resData: any = await response.json();
    const translated = resData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (translated) {
      return translated.trim();
    }
  } catch (error) {
    console.error("Gemini translation helper failed:", error);
  }

  return offlineDictionary[lower] || text;
};

