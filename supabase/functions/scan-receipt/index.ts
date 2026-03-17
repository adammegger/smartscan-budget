import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
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
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=" +
      GOOGLE_API_KEY;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: 'You are a receipt scanner. Extract: store_name, date (YYYY-MM-DD), total_amount (numeric), and items (array of objects with name, price, category, unit (like "kg", "g", "l", "ml", "szt"), quantity (numeric), and brand if detectable). Parse quantities from text like "200g" -> quantity: 0.2, unit: "kg". For items without unit/quantity, use unit: "szt", quantity: 1. Assign a category to each item based on its name. Categories: Food, Transport, Home, Health, Entertainment, Other. Also assign a category to the entire receipt based on the store and items. Return only pure JSON with this structure: {"store_name": "string", "date": "YYYY-MM-DD", "total_amount": number, "category": "string", "items": [{"name": "string", "price": number, "category": "string", "unit": "string", "quantity": number, "brand": "string|null"}]}',
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
    if (!response.ok) {
      let errorMessage = `Google AI Studio request failed with status ${response.status}: ${response.statusText}`;

      switch (response.status) {
        case 400:
          errorMessage =
            "Invalid image format or request. Please try again with a clear receipt image.";
          break;
        case 429:
          errorMessage =
            "Too many requests. Please wait a moment before trying again.";
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          errorMessage =
            "Gemini API is temporarily unavailable. Please try again in a moment.";
          break;
        case 401:
          errorMessage =
            "Authentication failed. Please check your API key configuration.";
          break;
        case 403:
          errorMessage = "Access forbidden. Please check your API permissions.";
          break;
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
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
