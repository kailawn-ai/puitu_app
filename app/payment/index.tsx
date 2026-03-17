import { BackButton } from "@/components/ui/back-button";
import { OrderService } from "@/lib/services/order-service";
import {
  Product,
  ProductService,
  ResolveProductParams,
} from "@/lib/services/product-service";
import { RazorpayService } from "@/lib/services/razorpay-service";
import { getStoredAuthUser } from "@/lib/utils/auth-user-store";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CreditCard, ShieldCheck, Sparkles } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PaymentScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const params = useLocalSearchParams<{
    productId?: string;
    modelType?: ResolveProductParams["model_type"];
    modelId?: string;
    title?: string;
    returnTo?: string;
  }>();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const resolvedTitle = useMemo(
    () => params.title || product?.name || "Premium Content",
    [params.title, product?.name],
  );

  useEffect(() => {
    const productId = params.productId;
    const modelType = params.modelType;
    const modelId = params.modelId;

    console.log("Product ID:", productId);
    console.log("Model Type:", modelType);
    console.log("Model ID:", modelId);

    if (!productId && (!modelType || !modelId)) {
      setLoading(false);
      return;
    }

    const loadProduct = async () => {
      if (productId) {
        return ProductService.getById(productId);
      }

      return ProductService.resolveByContent({
        model_type: modelType!,
        model_id: modelId!,
      });
    };

    loadProduct()
      .then(setProduct)
      .catch((error) => {
        console.log("Resolve product failed:", error);
        Alert.alert("Unable to load payment", "We could not find the product.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [params.modelId, params.modelType, params.productId]);

  const handlePay = async () => {
    if (!product || paying) return;

    setPaying(true);

    try {
      const authUser = await getStoredAuthUser();
      const orderResponse = await OrderService.createOrder({
        product_id: product.id,
        payment_method: "razorpay",
      });

      if (!orderResponse.razorpay_order) {
        throw new Error("Razorpay order was not returned by the backend.");
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

      Alert.alert("Payment successful", "Your purchase has been activated.", [
        {
          text: "Continue",
          onPress: () => {
            if (params.returnTo) {
              router.replace(params.returnTo as never);
              return;
            }

            router.back();
          },
        },
      ]);
    } catch (error: any) {
      console.log("Payment flow failed:", error);
      Alert.alert(
        "Payment failed",
        error?.description ||
          error?.message ||
          "We could not complete your payment.",
      );
    } finally {
      setPaying(false);
    }
  };

  return (
    <LinearGradient
      colors={
        colorScheme === "dark" ? ["#101014", "#171717"] : ["#F8FAFC", "#E2E8F0"]
      }
      locations={[0, 1]}
      start={{ x: 0.5, y: 1 }}
      end={{ x: 0.5, y: 0 }}
      style={{ flex: 1 }}
    >
      <View className="flex-1" style={{ paddingTop: insets.top + 4 }}>
        <View className="px-4 mb-3">
          <BackButton onPress={() => router.back()} />
        </View>

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 28,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View className="rounded-[32px] bg-white/95 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-6 py-7 shadow-xl">
            <View className="w-14 h-14 rounded-2xl bg-primary-500/10 items-center justify-center mb-5">
              <CreditCard size={26} color="#7A25FF" />
            </View>

            <Text className="text-3xl font-bold text-slate-900 dark:text-white">
              Buy this content
            </Text>
            <Text className="mt-2 text-slate-600 dark:text-slate-300 leading-6">
              Unlock your content securely with Razorpay. One payment, immediate
              access.
            </Text>

            {loading ? (
              <View className="py-12 items-center justify-center">
                <ActivityIndicator size="small" color="#7A25FF" />
                <Text className="mt-3 text-slate-500 dark:text-slate-400">
                  Loading product details...
                </Text>
              </View>
            ) : !product ? (
              <View className="mt-6 rounded-2xl bg-rose-50 dark:bg-rose-950/30 px-4 py-5">
                <Text className="text-rose-700 dark:text-rose-300 font-semibold">
                  Product details unavailable
                </Text>
                <Text className="mt-1 text-rose-600 dark:text-rose-200">
                  We could not resolve the product for this content.
                </Text>
              </View>
            ) : (
              <>
                <View className="mt-7 rounded-3xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 p-5">
                  <Text className="text-xs uppercase tracking-[1px] text-slate-500 dark:text-slate-400">
                    Product
                  </Text>
                  <Text className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
                    {resolvedTitle}
                  </Text>
                  {!!product.description && (
                    <Text className="mt-2 text-slate-600 dark:text-slate-300 leading-6">
                      {product.description}
                    </Text>
                  )}

                  <View className="mt-5 flex-row items-end justify-between">
                    <View>
                      <Text className="text-xs uppercase tracking-[1px] text-slate-500 dark:text-slate-400">
                        Amount
                      </Text>
                      <Text className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
                        Rs. {product.discount_price ?? product.price ?? 0}
                      </Text>
                    </View>

                    {!!product.allow_points && !!product.points_price && (
                      <View className="px-3 py-2 rounded-full bg-amber-100 dark:bg-amber-950/40">
                        <Text className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                          Points available
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <View className="mt-6 gap-3">
                  <View className="flex-row items-center">
                    <ShieldCheck size={18} color="#16A34A" />
                    <Text className="ml-3 text-slate-700 dark:text-slate-200">
                      Secure payment verification on backend
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Sparkles size={18} color="#7A25FF" />
                    <Text className="ml-3 text-slate-700 dark:text-slate-200">
                      Access unlocks immediately after verification
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handlePay}
                  disabled={paying}
                  className={`mt-8 h-14 rounded-2xl items-center justify-center ${
                    paying ? "bg-primary-400" : "bg-primary-500"
                  }`}
                >
                  {paying ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text className="text-white text-base font-bold">
                      Pay with Razorpay
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </View>
    </LinearGradient>
  );
};

export default PaymentScreen;
