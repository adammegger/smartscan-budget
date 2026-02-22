const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const GOOGLE_API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GOOGLE_API_KEY}`;

export async function processReceipt(base64Image: string) {
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

    if (!response.ok) {
      throw new Error(
        `Google AI Studio request failed with status ${response.status}: ${response.statusText}`,
      );
    }

    const data = await response.json();

    // Extract the response text
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("No response text found in Google AI Studio response");
    }

    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const jsonData = JSON.parse(jsonMatch[0]);
      return jsonData;
    } else {
      throw new Error("Could not extract JSON from Google AI Studio response");
    }
  } catch (error) {
    console.error("Error processing receipt with Google AI Studio:", error);
    throw error;
  }
}
