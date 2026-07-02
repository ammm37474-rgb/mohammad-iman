exports.handler = async function (event) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders, body: "" };
  }
  let system, message;
  try {
    const body = JSON.parse(event.body || "{}");
    system = body.system || "";
    message = body.message || "";
  } catch (e) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: "JSON نامعتبر" }) };
  }
  if (!message) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: "پیام ارسال نشده" }) };
  }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: "کلید API تنظیم نشده" }) };
  }
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: message }] }],
        }),
      }
    );
    const data = await response.json();
    if (!response.ok) {
      return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: "خطای Gemini", details: data }) };
    }
    const answer = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("\n").trim();
    return { statusCode: 200, headers: { "Content-Type": "application/json", ...corsHeaders }, body: JSON.stringify({ answer }) };
  } catch (err) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: "خطای سرور: " + String(err) }) };
  }
};
