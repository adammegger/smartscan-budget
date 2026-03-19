import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "npm:stripe@^14.0.0";
import { createClient } from "npm:@supabase/supabase-js@^2.39.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
  try {
    const signature = req.headers.get("Stripe-Signature");

    // Ensure we get the raw text body for signature verification
    const body = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!signature || !webhookSecret) {
      return new Response("Missing signature or secret", { status: 400 });
    }

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret,
      );
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.client_reference_id;
        if (userId) {
          const { error } = await supabase
            .from("profiles")
            .update({
              subscription_tier: "pro",
              stripe_customer_id: session.customer,
              stripe_subscription_id: session.subscription,
            })
            .eq("id", userId);
          if (error) throw error;
          console.log(`Upgraded user ${userId} to pro`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        console.log(
          "subscription.deleted fired, subscription.id:",
          subscription.id,
        );

        const { data, error } = await supabase
          .from("profiles")
          .update({ subscription_tier: "free" })
          .eq("stripe_subscription_id", subscription.id)
          .select(); // add .select() to see what was updated

        console.log(
          "Update result - data:",
          JSON.stringify(data),
          "error:",
          JSON.stringify(error),
        );
        if (error) throw error;
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        if (
          subscription.status === "canceled" ||
          subscription.status === "unpaid" ||
          subscription.status === "past_due"
        ) {
          const { error } = await supabase
            .from("profiles")
            .update({ subscription_tier: "free" })
            .eq("stripe_subscription_id", subscription.id);
          if (error) throw error;
          console.log(
            `Downgraded user to free due to status: ${subscription.status}`,
          );
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        // Only downgrade if all retries exhausted (next_payment_attempt is null)
        if (!invoice.next_payment_attempt) {
          const { error } = await supabase
            .from("profiles")
            .update({ subscription_tier: "free" })
            .eq("stripe_customer_id", invoice.customer);
          if (error) throw error;
          console.log(
            `Downgraded user to free after payment failure, customer: ${invoice.customer}`,
          );
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error(`Error processing webhook: ${err.message}`);
    return new Response(err.message, { status: 500 });
  }
});
