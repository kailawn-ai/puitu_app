import type { AppOrder, RazorpayOrder } from "@/lib/services/order-service";

type RazorpayCheckoutModule = {
  open: (options: RazorpayCheckoutOptions) => Promise<RazorpaySuccessResponse>;
};

export interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  image?: string;
  order_id: string;
  prefill?: {
    email?: string;
    contact?: string;
    name?: string;
  };
  theme?: {
    color?: string;
  };
  notes?: Record<string, string>;
}

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface StartCheckoutParams {
  order: AppOrder;
  razorpayOrder: RazorpayOrder;
  title: string;
  description?: string;
  image?: string;
  prefill?: {
    email?: string | null;
    contact?: string | null;
    name?: string | null;
  };
  notes?: Record<string, string>;
}

const getCheckoutModule = (): RazorpayCheckoutModule => {
  try {
    const module = require("react-native-razorpay").default as
      | RazorpayCheckoutModule
      | undefined;

    if (!module?.open) {
      throw new Error("Razorpay module is not available.");
    }

    return module;
  } catch {
    throw new Error(
      "Razorpay SDK is not installed. Add `react-native-razorpay` and rebuild the native app.",
    );
  }
};

const getPublicKey = (): string => {
  const key = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID;

  if (!key) {
    throw new Error(
      "Missing EXPO_PUBLIC_RAZORPAY_KEY_ID in the app environment.",
    );
  }

  return key;
};

export const RazorpayService = {
  async openCheckout(
    params: StartCheckoutParams,
  ): Promise<RazorpaySuccessResponse> {
    const RazorpayCheckout = getCheckoutModule();

    const options: RazorpayCheckoutOptions = {
      key: getPublicKey(),
      amount: params.razorpayOrder.amount,
      currency: params.razorpayOrder.currency,
      name: params.title,
      description: params.description,
      image: params.image,
      order_id: params.razorpayOrder.id,
      prefill: {
        email: params.prefill?.email ?? undefined,
        contact: params.prefill?.contact ?? undefined,
        name: params.prefill?.name ?? undefined,
      },
      notes: {
        app_order_id: String(params.order.id),
        product_id: String(params.order.product_id),
        ...(params.notes ?? {}),
      },
      theme: {
        color: "#7A25FF",
      },
    };

    return RazorpayCheckout.open(options);
  },
};

export default RazorpayService;
