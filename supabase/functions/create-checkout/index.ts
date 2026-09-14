import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    // 1. Identify the logged-in user from their auth token
    const authHeader = req.headers.get("Authorization")!;
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // 2. Create a PayMongo Checkout Session
    const paymongoSecretKey = Deno.env.get("PAYMONGO_SECRET_KEY")!;
    const authString = btoa(`${paymongoSecretKey}:`);

    const checkoutResponse = await fetch("https://api.paymongo.com/v1/checkout_sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${authString}`,
      },
      body: JSON.stringify({
        data: {
          attributes: {
            send_email_receipt: false,
            show_description: true,
            show_line_items: true,
            payment_method_types: ["card", "gcash", "paymaya"],
            line_items: [
              {
                currency: "PHP",
                amount: 29900,
                name: "SE Aware Premium",
                quantity: 1,
              },
            ],
            success_url: "https://nitroatomic.github.io/SE-AWARE/premium-success.html",
            cancel_url: "https://nitroatomic.github.io/SE-AWARE/go-premium.html",
            metadata: {
              user_id: user.id,
            },
          },
        },
      }),
    });

    const checkoutData = await checkoutResponse.json();

    if (!checkoutResponse.ok) {
      return new Response(JSON.stringify({ error: checkoutData }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const checkoutUrl = checkoutData.data.attributes.checkout_url;

    return new Response(JSON.stringify({ checkout_url: checkoutUrl }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});