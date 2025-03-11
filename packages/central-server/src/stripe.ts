import Config from "config";
import Stripe from "stripe";

const stripe = new Stripe(Config.get("stripe.secret_key"));

export { stripe as Stripe };
