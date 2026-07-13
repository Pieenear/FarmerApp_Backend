export const translateText = async (text: string, targetLang: string = "mr"): Promise<string> => {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey || !text) {
    return text;
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
      return text;
    }

    const resData: any = await response.json();
    const translated = resData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (translated) {
      return translated.trim();
    }
  } catch (error) {
    console.error("Gemini translation helper failed:", error);
  }

  return text;
};
