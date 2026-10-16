"use client";

// Razorpay's Checkout script, loaded once, only when someone pays.
type CheckoutResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type CheckoutOptions = {
  key: string;
  order_id: string;
  amount: number;
  currency: "INR";
  name: string;
  description: string;
  prefill: { name: string; email: string };
  theme: { color: string };
  handler: (response: CheckoutResponse) => void;
  modal: { ondismiss: () => void };
};
declare global {
  interface Window {
    Razorpay?: new (options: CheckoutOptions) => { open: () => void };
  }
}

let loading: Promise<void> | null = null;

export function loadCheckout() {
  loading ??= new Promise<void>((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loading = null; // allow another try
      reject(new Error("Couldn't load Razorpay Checkout"));
    };
    document.head.appendChild(script);
  });
  return loading;
}

export function openCheckout(options: CheckoutOptions) {
  if (!window.Razorpay) throw new Error("Checkout isn't loaded");
  new window.Razorpay(options).open();
}
