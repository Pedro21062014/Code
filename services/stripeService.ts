declare global {
  interface Window {
    Stripe: any;
  }
}

const STRIPE_PK = 'pk_test_51RkYig2KmkAgJHb0Qb3OdzzJcbdW0fCJgdEAcxADul4kywAM2bZUiQI4F83IMfQimm0m9W9C8MQeWXo6JkIyFRYL00CnMwa0IF';

let stripeInstance: any | null = null;

const getStripe = () => {
  if (typeof window.Stripe === 'undefined') {
    console.error("Stripe.js has not loaded. Please check your internet connection and script tag.");
    return null;
  }
  if (!stripeInstance) {
    stripeInstance = window.Stripe(STRIPE_PK);
  }
  return stripeInstance;
};

export const handleCheckout = async (priceId: string) => {
  const stripe = getStripe();
  if (!stripe) {
    alert("O Stripe não está disponível. Por favor, verifique sua conexão.");
    return;
  }

  const baseUrl = `${window.location.origin.replace(/\/$/, '')}${window.location.pathname}`;

  const { error } = await stripe.redirectToCheckout({
    lineItems: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    successUrl: `${baseUrl}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: baseUrl,
  });

  if (error) {
    console.warn('Error redirecting to Stripe Checkout:', error);
    alert(`O pagamento falhou: ${error.message}`);
    throw error;
  }
};