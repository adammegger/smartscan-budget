// ⚠️ DEVELOPMENT ONLY - DO NOT USE IN PRODUCTION ⚠️
// This file contains direct Gemini API calls that expose the API key in the frontend.
// For production, use the Supabase Edge Function (scan-receipt) instead.
// The API key is now securely stored on the server side.
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const GOOGLE_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=" +
  GOOGLE_API_KEY;

export async function processReceipt(base64Image: string) {
  const maxRetries = 1;
  const retryDelay = 1000; // 1 second

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Prepare the request body in Google AI Studio v1 format
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
                  data: base64Image.split(",")[1], // Remove the data:image/...;base64, prefix
                },
              },
            ],
          },
        ],
      };

      // Make the API request to Google AI Studio v1
      const response = await fetch(GOOGLE_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      // Handle specific HTTP errors with meaningful messages
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
            errorMessage =
              "Access forbidden. Please check your API permissions.";
            break;
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Extract the response text
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error("No response text found in Google AI Studio response");
      }

      // Try to extract JSON from the response with improved parsing
      const jsonData = parseGeminiResponse(text);
      return jsonData;
    } catch (error) {
      console.error(
        `Error processing receipt with Google AI Studio (attempt ${attempt + 1}):`,
        error,
      );

      // Don't retry on certain errors
      if (error instanceof Error) {
        const message = error.message.toLowerCase();
        if (
          message.includes("invalid image format") ||
          message.includes("authentication failed") ||
          message.includes("access forbidden")
        ) {
          throw error;
        }
      }

      // Retry logic
      if (attempt < maxRetries) {
        console.log(`Retrying in ${retryDelay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        continue;
      }

      // If we've exhausted all retries, throw the original error
      throw error;
    }
  }
}

// Test function to verify Gemini API connection
export async function testGeminiConnection(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    // 1x1 pixel white PNG as base64
    const testImageBase64 =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: "Is this an image? Answer with just YES or NO",
            },
            {
              inlineData: {
                mimeType: "image/png",
                data: testImageBase64,
              },
            },
          ],
        },
      ],
    };

    const response = await fetch(GOOGLE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(
        `Test failed with status ${response.status}: ${response.statusText}`,
      );
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("No response text found in test");
    }

    console.log("Gemini test result:", text);

    // Check if response contains YES or NO (case insensitive)
    const responseText = text.trim().toUpperCase();
    if (responseText.includes("YES") || responseText.includes("NO")) {
      return {
        success: true,
        message: "Gemini API connection successful",
      };
    } else {
      return {
        success: false,
        message: `Unexpected response format: ${text}`,
      };
    }
  } catch (error) {
    console.error("Gemini connection test failed:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

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
