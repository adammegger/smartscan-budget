import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // 1. OBSŁUGA PREFLIGHT (KLUCZOWE!)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { productName } = await req.json();
    const response = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${productName}&json=1`,
    );
    const data = await response.json();

    // Detailed logging for debugging
    console.log("--- OPEN FOOD FACTS RESPONSE ---");
    console.log("Product:", productName);
    console.log(
      "Full Data Sample:",
      JSON.stringify(data.products?.[0], null, 2),
    );

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
