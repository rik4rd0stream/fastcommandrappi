const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.1";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const FCM_SERVER_KEY = Deno.env.get("FCM_SERVER_KEY");
    if (!FCM_SERVER_KEY) {
      return new Response(
        JSON.stringify({ error: "FCM_SERVER_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { title, body, whatsappUrl, pedidoId, storeName, motoboyNome, motoboyId } = await req.json();

    if (!title || !body || !whatsappUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: title, body, whatsappUrl" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all registered FCM tokens from Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: tokens, error: tokensError } = await supabase
      .from("fcm_tokens")
      .select("token")
      .order("created_at", { ascending: false });

    if (tokensError || !tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ error: "No FCM tokens registered", details: tokensError }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send to all registered tokens
    const results = await Promise.allSettled(
      tokens.map(async ({ token }) => {
        const fcmResponse = await fetch("https://fcm.googleapis.com/fcm/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `key=${FCM_SERVER_KEY}`,
          },
          body: JSON.stringify({
            to: token,
            data: {
              title,
              body,
              whatsappUrl,
              pedidoId,
              storeName,
              motoboyNome,
              motoboyId,
            },
            // Use data-only message so the service worker handles display
            priority: "high",
          }),
        });
        return fcmResponse.json();
      })
    );

    return new Response(
      JSON.stringify({ success: true, sent: tokens.length, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
