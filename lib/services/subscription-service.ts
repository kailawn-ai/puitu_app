import { apiClient } from "@/lib/api/api-client";
import { OrderService, type OrderPaymentMethod } from "@/lib/services/order-service";
import {
  type Product,
} from "@/lib/services/product-service";
import {
  type UserPurchaseItem,
} from "@/lib/services/purchase-service";
import { RazorpayService } from "@/lib/services/razorpay-service";
import { getStoredAuthUser } from "@/lib/utils/auth-user-store";

export interface PremiumPointsSummary {
  available_points: number;
  total_earned_points: number;
  total_spent_points: number;
  lifetime_points: number;
}

export interface PremiumResponseData {
  products: Product[];
  purchases: UserPurchaseItem[];
  pointsSummary: PremiumPointsSummary | null;
}

export interface CourseProductOptionPurchase {
  id: number;
  product_id: number;
  payment_method: string;
  access_start?: string | null;
  access_end?: string | null;
  status: string;
}

export interface CourseProductOptionProduct {
  id: number;
  name: string;
  description?: string | null;
  price?: string | number | null;
  discount_price?: string | number | null;
  final_price?: number | null;
  allow_points?: boolean;
  points_price?: number | null;
  device_increment?: number | null;
  access_duration_days?: number | null;
  category?: string | null;
  is_featured?: boolean;
}

export interface CourseProductOptionItem {
  id: number;
  type: "course" | "section" | "video" | "audio" | "document" | "image";
  title?: string | null;
  position: number;
  is_free_preview: boolean;
  is_purchased: boolean;
  product: CourseProductOptionProduct | null;
  purchase: CourseProductOptionPurchase | null;
}

export interface CourseProductOptionSection {
  id: number;
  title: string;
  position: number;
  is_purchased: boolean;
  has_purchased_content: boolean;
  product: CourseProductOptionProduct | null;
  videos: CourseProductOptionItem[];
  audios: CourseProductOptionItem[];
  documents: CourseProductOptionItem[];
  images: CourseProductOptionItem[];
}

export interface CourseProductOptionsData {
  course: {
    id: number;
    title: string;
    summary?: string | null;
    thumbnail_url?: string | null;
    language?: string | null;
    level?: string | null;
    course_product: CourseProductOptionProduct | null;
    is_purchased: boolean;
  };
  sections: CourseProductOptionSection[];
  pointsSummary: PremiumPointsSummary | null;
}

export interface PurchaseProductParams {
  product: Product;
  paymentMethod: Extract<OrderPaymentMethod, "razorpay" | "points">;
}

export interface PurchaseProductResult {
  orderId: number;
  paymentMethod: PurchaseProductParams["paymentMethod"];
}

interface PremiumDashboardResponse {
  products: Product[];
  purchases: UserPurchaseItem[];
  points_summary: PremiumPointsSummary;
}

interface CourseProductOptionsResponse {
  course: {
    id: number;
    title: string;
    summary?: string | null;
    thumbnail_url?: string | null;
    language?: string | null;
    level?: string | null;
    course_product: CourseProductOptionProduct | null;
    is_purchased: boolean;
  };
  sections: CourseProductOptionSection[];
  points_summary: PremiumPointsSummary;
}

const createSuccessfulOrder = async (productId: number) => {
  const orderResponse = await OrderService.createOrder({
    product_id: productId,
    payment_method: "points",
  });

  return orderResponse.order;
};

export const SubscriptionService = {
  async getPremiumResponse(): Promise<PremiumResponseData> {
    const res = await apiClient.get<PremiumDashboardResponse>("/premium/response");

    return {
      products: res.data.products ?? [],
      purchases: res.data.purchases ?? [],
      pointsSummary: res.data.points_summary ?? null,
    };
  },

  async loadDashboard(): Promise<PremiumResponseData> {
    return this.getPremiumResponse();
  },

  async getCourseProductOptions(
    courseId: number | string,
  ): Promise<CourseProductOptionsData> {
    const res = await apiClient.get<CourseProductOptionsResponse>(
      `/premium/course-products/${courseId}`,
    );

    return {
      course: res.data.course,
      sections: res.data.sections ?? [],
      pointsSummary: res.data.points_summary ?? null,
    };
  },

  async purchaseProduct({
    product,
    paymentMethod,
  }: PurchaseProductParams): Promise<PurchaseProductResult> {
    if (paymentMethod === "points") {
      const order = await createSuccessfulOrder(product.id);

      return {
        orderId: order.id,
        paymentMethod,
      };
    }

    const authUser = await getStoredAuthUser();
    const orderResponse = await OrderService.createOrder({
      product_id: product.id,
      payment_method: "razorpay",
    });

    if (!orderResponse.razorpay_order) {
      return {
        orderId: orderResponse.order.id,
        paymentMethod,
      };
    }

    const checkoutResult = await RazorpayService.openCheckout({
      order: orderResponse.order,
      razorpayOrder: orderResponse.razorpay_order,
      title: product.name,
      description:
        product.description ?? "Secure checkout powered by Razorpay",
      prefill: {
        email: authUser?.email ?? undefined,
        contact: authUser?.phone ?? undefined,
        name: authUser?.name ?? undefined,
      },
    });

    await OrderService.verifyPayment({
      order_id: orderResponse.order.id,
      razorpay_order_id: checkoutResult.razorpay_order_id,
      razorpay_payment_id: checkoutResult.razorpay_payment_id,
      razorpay_signature: checkoutResult.razorpay_signature,
    });

    return {
      orderId: orderResponse.order.id,
      paymentMethod,
    };
  },
};

export default SubscriptionService;
