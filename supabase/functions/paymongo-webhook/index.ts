import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    // Get the raw body text (needed for signature verification)
    const rawBody = await req.text();
    const event = JSON.parse(rawBody);

    const eventType = event.data?.attributes?.type;
    console.log("Received PayMongo event:", eventType);

    // We only care about successful checkout payments
    if (eventType === "checkout_session.payment.paid") {
      const checkoutSession = event.data.attributes.data;
      const userId = checkoutSession.attributes.metadata?.user_id;

      if (!userId) {
        console.error("No user_id found in metadata");
        return new Response(JSON.stringify({ error: "Missing user_id" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Use the service role key to bypass RLS and update the user's row
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          subscription_type: "Premium",
          subscription_status: "active",
        })
        .eq("id", userId);

      if (updateError) {
        console.error("Failed to update profile:", updateError);
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      console.log("Successfully upgraded user to premium:", userId);
    }

    // Always return 200 so PayMongo knows we received it
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});