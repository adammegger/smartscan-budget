// Supabase Edge Function to fetch product data from OpenFoodFacts API
// This avoids CORS issues when calling OpenFoodFacts from the frontend

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get the product name from request body
    const { productName } = await req.json();

    if (!productName) {
      return new Response(
        JSON.stringify({ error: "productName is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Fetch product data from OpenFoodFacts API
    const url = new URL("https://world.openfoodfacts.org/cgi/search.pl");
    url.searchParams.set("search_terms", productName);
    url.searchParams.set("search_simple", "1");
    url.searchParams.set("action", "process");
    url.searchParams.set("json", "1");
    url.searchParams.set("page_size", "1");
    url.searchParams.set(
      "fields",
      "product_name,brands,nutrition_grades,nutriments,additives_tags,labels_tags,ingredients_text,allergens_tags",
    );

    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "Paragonly/1.0 (Smart Budget App)",
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: "OpenFoodFacts API error",
          status: response.status,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const data = await response.json();

    if (data.products && data.products.length > 0) {
      return new Response(JSON.stringify(data.products[0]), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // No product found
    return new Response(JSON.stringify(null), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
