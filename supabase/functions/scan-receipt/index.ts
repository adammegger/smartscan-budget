import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const RECEIPT_SCAN_PROMPT = {
  role: "You are an expert receipt scanner for Polish grocery and retail stores.",

  output_format: {
    description:
      "Return ONLY a pure JSON object with no markdown, no code blocks, no explanation.",
    structure: {
      store_name: "string",
      date: "YYYY-MM-DD",
      total_amount: "number",
      saved_amount: "number",
      category: "string",
      items: [
        {
          name: "string – use the full product name as printed on the receipt",
          price: "number – unit price",
          category: "string",
          unit: "string",
          quantity: "number",
          brand: "string or null",
        },
      ],
    },
  },

  rules: {
    units: [
      "Use unit 'szt' and quantity 1 for all individually packaged beverages (water, juice, beer, soda, energy drinks, etc.), even if the label shows volume like '1.5l' or '500ml'.",
      "Use unit 'kg' or 'g' for loose/bulk items sold by weight (deli meat, vegetables, fruit, cheese at deli counter).",
      "Use unit 'l' or 'ml' only for items truly sold by volume measurement (e.g. fuel, bulk liquid).",
      "Parse quantity from product name text: '200g' → quantity: 0.2, unit: 'kg'. '2x' prefix → quantity: 2, unit: 'szt'.",
      "If no quantity or unit is detectable, default to unit: 'szt', quantity: 1.",
    ],
    names: [
      "Expand abbreviated product names to human-readable form. Receipt printers truncate names – your job is to reconstruct the full readable name based on context and visible characters.",
      "Examples of correct expansion: 'WodaNGaz Muszy1,5l' → 'Woda Niegazowana Muszynianka 1.5l', 'CzekoCoc85%Lindt10' → 'Czekolada Cocoa 85% Lindt 100g'.",
      "Keep the language of the receipt (Polish store receipts are in Polish – keep Polish product names in Polish).",
      "Include volume or weight info in the name if it helps identify the product (e.g. '1.5l', '100g').",
      "Only populate the brand field if the brand name is clearly identifiable in the receipt line (e.g. 'Lindt', 'Tymbark', 'Łaciate').",
    ],
    discounts: [
      "Pay special attention to item-level discounts. In Polish receipts (like Biedronka), discounts are often printed immediately below the item as 'Rabat' or 'Zniżka' with a negative value (e.g., '-1,11' or '-0,50'). You MUST sum ALL these negative discount values across the entire receipt and return the total absolute value as 'saved_amount'. For example, if you find 'Rabat -1,11' and 'Rabat -0,50', the 'saved_amount' must be 1.61. If there are no discounts, return 0. The 'price' for each item should be its final price after the discount.",
    ],
    duplicates: [
      "If two or more line items have identical names AND identical unit prices, merge them into one item and sum their quantities.",
      "Do NOT merge items with different names or different prices.",
    ],
    categories: {
      per_item:
        "Alkohol, Apteka, Dom, Edukacja, Elektronika, Inne, Jedzenie, Podróże, Prezenty, Rachunki, Restauracje, Rozrywka, Sport, Transport, Ubrania, Uroda, Zdrowie, Zwierzęta",
      per_receipt:
        "Alkohol, Apteka, Dom, Edukacja, Elektronika, Inne, Jedzenie, Podróże, Prezenty, Rachunki, Restauracje, Rozrywka, Sport, Transport, Ubrania, Uroda, Zdrowie, Zwierzęta",
    },
  },
};

// Build the prompt string from the config
function buildPrompt(config: typeof RECEIPT_SCAN_PROMPT): string {
  return `${config.role}

RULES:
${config.rules.units.map((r) => `- ${r}`).join("\n")}
${config.rules.names.map((r) => `- ${r}`).join("\n")}
${config.rules.duplicates.map((r) => `- ${r}`).join("\n")}
- Per item category, use one of: ${config.rules.categories.per_item}
- Overall receipt category: ${config.rules.categories.per_receipt}

${config.output_format.description}
JSON structure:
${JSON.stringify(config.output_format.structure, null, 2)}`;
}

serve(async (req: Request) => {
  // 1. Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // 2. Only accept POST requests
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Method not allowed",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 405,
      },
    );
  }

  try {
    // 3. Parse request body
    const body = await req.json();
    const { imageBase64 } = body;

    if (!imageBase64) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing imageBase64 in request body",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    // 4. Get Google API Key from environment
    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
    if (!GOOGLE_API_KEY) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Google API key not configured on server",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    // 5. Prepare Gemini API request
    const GOOGLE_API_URL =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
      GOOGLE_API_KEY;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: buildPrompt(RECEIPT_SCAN_PROMPT),
            },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: imageBase64.split(",")[1], // Remove the data:image/...;base64, prefix
              },
            },
          ],
        },
      ],
    };

    // 6. Make request to Gemini API with error handling
    const response = await fetch(GOOGLE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    // 7. Handle specific HTTP errors with meaningful messages
    // 7. Handle errors and read the REAL message from Google
    if (!response.ok) {
      // Próbujemy odczytać szczegółowy błąd od Google
      const errorData = await response.json().catch(() => ({}));
      console.error("Google API Raw Error:", errorData);

      const realErrorMessage = errorData?.error?.message || response.statusText;

      return new Response(
        JSON.stringify({
          success: false,
          error: `Gemini Error ${response.status}: ${realErrorMessage}`,
          fullError: errorData,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: response.status >= 500 ? 500 : response.status,
        },
      );
    }

    const data = await response.json();

    // 8. Extract the response text
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No response text found in Google AI Studio response",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    // 9. Parse Gemini response with robust JSON extraction
    const jsonData = parseGeminiResponse(text);

    // 10. Return success response with parsed JSON
    return new Response(
      JSON.stringify({
        success: true,
        data: jsonData,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error in scan-receipt function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});

// Helper function to parse Gemini response with robust JSON extraction
function parseGeminiResponse(text: string): {
  store_name: string;
  date: string;
  total_amount: number;
  category: string;
  items: Array<{
    name: string;
    price: number;
    category: string;
    unit: string;
    quantity: number;
    brand: string | null;
  }>;
} {
  try {
    // Remove markdown code blocks if present
    let cleanText = text.trim();

    // Handle ```json ... ``` blocks
    const jsonBlockMatch = cleanText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch) {
      cleanText = jsonBlockMatch[1].trim();
    } else {
      // Handle ``` ... ``` blocks (generic code blocks)
      const codeBlockMatch = cleanText.match(/```\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        cleanText = codeBlockMatch[1].trim();
      }
    }

    // Try to extract JSON object from the cleaned text
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("Could not extract JSON from Gemini response");
    }
  } catch (parseError) {
    console.error("Error parsing Gemini response:", parseError);
    throw new Error(
      "Failed to parse receipt data. Please try again with a clearer image.",
    );
  }
}
