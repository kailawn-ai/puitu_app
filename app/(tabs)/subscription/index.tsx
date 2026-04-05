import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import {
  BadgeIndianRupee,
  Check,
  ChevronRight,
  CircleDot,
  Clock3,
  Crown,
  History,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LottieView from "lottie-react-native";

import {
  SubscriptionService,
  type PremiumResponseData,
} from "@/lib/services/subscription-service";
import type { Product } from "@/lib/services/product-service";

type PaymentChoice = "razorpay" | "points";

const formatCurrency = (value?: string | number | null) => {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount)) {
    return "INR 0";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
};

const formatDate = (value?: string | null) => {
  if (!value) return "Lifetime access";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Active access";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
};

const formatDuration = (days?: number | null) => {
  if (!days) return "Lifetime";
  if (days % 365 === 0) return `${days / 365} year access`;
  if (days % 30 === 0) return `${days / 30} month access`;
  return `${days} day access`;
};

const getProductPrice = (product: Product) =>
  product.discount_price ?? product.price ?? 0;

const parseDate = (value?: string | null) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const getPurchaseTimeline = (purchase: {
  access_start?: string | null;
  access_end?: string | null;
  created_at?: string;
}) => {
  const now = Date.now();
  const startDate = parseDate(
    purchase.access_start ?? purchase.created_at ?? null,
  );
  const endDate = parseDate(purchase.access_end ?? null);

  if (!endDate) {
    return {
      startLabel: startDate ? formatDate(startDate.toISOString()) : "Started",
      endLabel: "Lifetime",
      progressPercent: 100,
      statusLabel: "Lifetime access",
      isExpired: false,
    };
  }

  const startMs = startDate?.getTime() ?? endDate.getTime();
  const endMs = endDate.getTime();
  const totalMs = Math.max(endMs - startMs, 1);
  const elapsedMs = Math.min(Math.max(now - startMs, 0), totalMs);
  const progressPercent = Math.round((elapsedMs / totalMs) * 100);
  const remainingDays = Math.ceil((endMs - now) / (1000 * 60 * 60 * 24));
  const isExpired = remainingDays <= 0;

  return {
    startLabel: startDate ? formatDate(startDate.toISOString()) : "Started",
    endLabel: formatDate(endDate.toISOString()),
    progressPercent,
    statusLabel: isExpired
      ? "Expired"
      : remainingDays === 1
        ? "1 day left"
        : `${remainingDays} days left`,
    isExpired,
  };
};

export default function SubscriptionScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [premiumResponse, setPremiumResponse] =
    React.useState<PremiumResponseData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [purchasing, setPurchasing] = React.useState(false);
  const [selectedProductId, setSelectedProductId] = React.useState<
    number | null
  >(null);
  const [paymentChoice, setPaymentChoice] =
    React.useState<PaymentChoice>("razorpay");

  const loadPremiumResponse = React.useCallback(async () => {
    const nextResponse = await SubscriptionService.getPremiumResponse();
    setPremiumResponse(nextResponse);

    setSelectedProductId((current) => {
      if (
        current &&
        nextResponse.products.some((product) => product.id === current)
      ) {
        return current;
      }

      return nextResponse.products[0]?.id ?? null;
    });
  }, []);

  React.useEffect(() => {
    loadPremiumResponse()
      .catch((error: any) => {
        Alert.alert(
          "Unable to load premium",
          error?.message ?? "We could not load your purchase data.",
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [loadPremiumResponse]);

  useFocusEffect(
    React.useCallback(() => {
      loadPremiumResponse().catch(() => undefined);
    }, [loadPremiumResponse]),
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);

    try {
      await loadPremiumResponse();
    } catch (error: any) {
      Alert.alert(
        "Refresh failed",
        error?.message ?? "We could not refresh your purchases.",
      );
    } finally {
      setRefreshing(false);
    }
  }, [loadPremiumResponse]);

  const products = premiumResponse?.products ?? [];
  const purchases = premiumResponse?.purchases ?? [];
  const availablePoints = premiumResponse?.pointsSummary?.available_points ?? 0;
  const ownedProductIds = React.useMemo(
    () => new Set(purchases.map((purchase) => purchase.product_id)),
    [purchases],
  );

  const selectedProduct =
    products.find((product) => product.id === selectedProductId) ?? null;
  const selectedProductOwned = selectedProduct
    ? ownedProductIds.has(selectedProduct.id)
    : false;
  const pointsPrice = Number(selectedProduct?.points_price ?? 0);
  const canUsePoints = Boolean(
    selectedProduct?.allow_points &&
    pointsPrice > 0 &&
    availablePoints >= pointsPrice,
  );
  const pointsAvailableForProduct = Boolean(
    selectedProduct?.allow_points && pointsPrice > 0,
  );

  React.useEffect(() => {
    if (!pointsAvailableForProduct && paymentChoice === "points") {
      setPaymentChoice("razorpay");
    }

    if (pointsAvailableForProduct && canUsePoints) {
      return;
    }

    if (paymentChoice === "points") {
      setPaymentChoice("razorpay");
    }
  }, [canUsePoints, paymentChoice, pointsAvailableForProduct]);

  const handlePurchase = React.useCallback(async () => {
    if (!selectedProduct || selectedProductOwned || purchasing) return;

    const method: PaymentChoice =
      paymentChoice === "points" && canUsePoints ? "points" : "razorpay";

    setPurchasing(true);

    try {
      await SubscriptionService.purchaseProduct({
        product: selectedProduct,
        paymentMethod: method,
      });

      await loadPremiumResponse();

      Alert.alert(
        method === "points" ? "Purchase completed" : "Payment successful",
        `${selectedProduct.name} is now active on your account.`,
      );
    } catch (error: any) {
      Alert.alert(
        method === "points" ? "Purchase failed" : "Payment failed",
        error?.description ||
          error?.message ||
          "We could not complete your purchase.",
      );
    } finally {
      setPurchasing(false);
    }
  }, [
    canUsePoints,
    loadPremiumResponse,
    paymentChoice,
    purchasing,
    selectedProduct,
    selectedProductOwned,
  ]);

  return (
    <LinearGradient
      colors={
        isDark
          ? ["#030712", "#0B1220", "#111827"]
          : ["#F8FCFA", "#F5FBF7", "#EAF8F0"]
      }
      locations={[0, 0.45, 1]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{
          paddingTop: insets.top + 1,
          paddingBottom: insets.bottom + 100,
        }}
      >
        <View className="">
          <View className="relative overflow-hidden border border-black/5 bg-white/92 px-5 pb-6 pt-4 dark:border-white/10 dark:bg-[#0F172A]/92">
            <LinearGradient
              colors={
                isDark
                  ? [
                      "rgba(34,197,94,0.16)",
                      "rgba(245,158,11,0.12)",
                      "rgba(255,255,255,0)",
                    ]
                  : [
                      "rgba(34,197,94,0.20)",
                      "rgba(251,191,36,0.14)",
                      "rgba(255,255,255,0)",
                    ]
              }
              locations={[0, 0.38, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                height: 320,
              }}
            />

            <View className="flex-row items-center justify-between">
              <View className="rounded-full bg-emerald-50 px-3 py-1.5 dark:bg-emerald-500/10">
                <Text className="text-[11px] font-bold uppercase tracking-[1.6px] text-emerald-700 dark:text-emerald-200">
                  Premium Access
                </Text>
              </View>

              <View className="rounded-full bg-slate-100 px-3 py-1.5 dark:bg-white/5">
                <Text className="text-[11px] font-bold uppercase tracking-[1.2px] text-slate-600 dark:text-slate-300">
                  {purchases.length} active
                </Text>
              </View>
            </View>

            <View className="items-center pt-4">
              <View className="flex-row items-center justify-center">
                <View className="mr-3 h-16 w-16 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10">
                  <Sparkles size={28} color="#10B981" />
                </View>

                <View className="h-24 w-24 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-500/10">
                  <Crown size={54} color="#EAB308" />
                </View>

                <View className="ml-3 h-16 w-16 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10">
                  <Sparkles size={28} color="#10B981" />
                </View>
              </View>

              <Text className="mt-5 text-center text-[18px] font-bold text-slate-500 dark:text-slate-300">
                Manage your premium products
              </Text>

              <Text className="mt-7 text-center text-[19px] font-bold text-slate-900 dark:text-white">
                Unlock and manage
              </Text>
              <Text className="mt-1 text-center text-[34px] font-black leading-9 text-emerald-500">
                Live Purchases
              </Text>
              <Text className="mt-1 text-center text-[19px] font-bold text-slate-800 dark:text-slate-100">
                in one place
              </Text>
            </View>

            <View className="mt-2 flex-row gap-3">
              <View className="flex-1 rounded-[28px] border border-slate-200 bg-white px-4 py-4 dark:border-white/10 dark:bg-white/5">
                <View className="flex-row items-center justify-between">
                  <Text className="text-lg font-bold text-slate-900 dark:text-white">
                    Wallet
                  </Text>
                  <Wallet size={18} color={isDark ? "#FCD34D" : "#D97706"} />
                </View>
                <Text className="mt-4 text-[30px] font-black tracking-[-1px] text-slate-950 dark:text-white">
                  {availablePoints} points
                </Text>
                <Text className="mt-2 text-xs leading-4 text-slate-600 dark:text-slate-300">
                  Available points for point-enabled purchases.
                </Text>
              </View>
            </View>
          </View>

          {loading ? (
            <View className="items-center justify-center py-20">
              <LottieView
                source={require("../../../assets/icons/loader.json")}
                autoPlay
                loop
                style={{ width: 84, height: 84 }}
              />
              <Text className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-300">
                Loading your purchase dashboard...
              </Text>
            </View>
          ) : (
            <>
              <View className="mt-6 rounded-[30px] border border-black/5 bg-white/90 p-5 dark:border-white/10 dark:bg-[#0F172A]/90">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-[11px] font-bold uppercase tracking-[1.4px] text-emerald-600 dark:text-emerald-300">
                      Active Purchases
                    </Text>
                    <Text className="mt-1 text-2xl font-black text-slate-950 dark:text-white">
                      Manage Access
                    </Text>
                  </View>
                  <Clock3 size={20} color={isDark ? "#A7F3D0" : "#059669"} />
                </View>

                {purchases.length === 0 ? (
                  <View className="mt-5 rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-4 py-5 dark:border-white/10 dark:bg-white/5">
                    <Text className="text-base font-semibold text-slate-900 dark:text-white">
                      No active purchases yet
                    </Text>
                    <Text className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      Pick a product below to unlock your first premium access.
                    </Text>
                  </View>
                ) : (
                  <View className="mt-5 gap-3">
                    {purchases.map((purchase) => {
                      const timeline = getPurchaseTimeline(purchase);

                      return (
                        <View
                          key={purchase.id}
                          className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 dark:border-white/10 dark:bg-white/5"
                        >
                          <View className="flex-row items-start justify-between">
                            <View className="flex-1 pr-3">
                              <Text className="text-lg font-bold text-slate-900 dark:text-white">
                                {purchase.product?.name ??
                                  `Product #${purchase.product_id}`}
                              </Text>
                              <Text className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                {purchase.product?.description ||
                                  "Premium access is active on this account."}
                              </Text>
                            </View>

                            <View
                              className={`rounded-full px-3 py-1.5 ${
                                timeline.isExpired
                                  ? "bg-rose-500"
                                  : "bg-emerald-500"
                              }`}
                            >
                              <Text className="text-[11px] font-bold uppercase tracking-[1.2px] text-white">
                                {timeline.isExpired ? "Expired" : "Active"}
                              </Text>
                            </View>
                          </View>

                          <View className="mt-4 rounded-xl border border-slate-200 bg-white px-3 py-3 dark:border-white/10 dark:bg-slate-900">
                            <View className="flex-row items-center justify-between">
                              <Text className="text-[11px] font-bold uppercase tracking-[1.1px] text-slate-500 dark:text-slate-400">
                                Validity timeline
                              </Text>
                              <Text
                                className={`text-xs font-bold ${
                                  timeline.isExpired
                                    ? "text-rose-600 dark:text-rose-300"
                                    : "text-emerald-600 dark:text-emerald-300"
                                }`}
                              >
                                {timeline.statusLabel}
                              </Text>
                            </View>

                            <View className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                              <View
                                className={`h-full rounded-full ${
                                  timeline.isExpired
                                    ? "bg-rose-500"
                                    : "bg-emerald-500"
                                }`}
                                style={{
                                  width: `${timeline.progressPercent}%`,
                                }}
                              />
                            </View>

                            <View className="mt-2 flex-row items-center justify-between">
                              <Text className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                                Start {timeline.startLabel}
                              </Text>
                              <Text className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                                End {timeline.endLabel}
                              </Text>
                            </View>
                          </View>

                          <View className="mt-4 flex-row flex-wrap gap-2">
                            <View className="rounded-full bg-white px-3 py-2 dark:bg-slate-900">
                              <Text className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                                {purchase.access_end
                                  ? `Ends ${formatDate(purchase.access_end)}`
                                  : "Lifetime access"}
                              </Text>
                            </View>
                            <View className="rounded-full bg-white px-3 py-2 dark:bg-slate-900">
                              <Text className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                                {purchase.device_increment ?? 0} device
                                increment
                              </Text>
                            </View>
                            <View className="rounded-full bg-white px-3 py-2 dark:bg-slate-900">
                              <Text className="text-xs font-semibold capitalize text-slate-700 dark:text-slate-200">
                                {purchase.payment_method.replace("_", " ")}
                              </Text>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>

              <View className="mt-6 rounded-[30px] border border-black/5 bg-white/90 p-5 dark:border-white/10 dark:bg-[#0F172A]/90">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-[11px] font-bold uppercase tracking-[1.4px] text-emerald-600 dark:text-emerald-300">
                      Buy New
                    </Text>
                    <Text className="mt-1 text-2xl font-black text-slate-950 dark:text-white">
                      Available Products
                    </Text>
                  </View>
                  <BadgeIndianRupee
                    size={20}
                    color={isDark ? "#FDE68A" : "#D97706"}
                  />
                </View>

                {products.length === 0 ? (
                  <View className="mt-5 rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-4 py-5 dark:border-white/10 dark:bg-white/5">
                    <Text className="text-base font-semibold text-slate-900 dark:text-white">
                      No products available
                    </Text>
                    <Text className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      Add products in the backend and they will show up here.
                    </Text>
                  </View>
                ) : (
                  <>
                    <View className="mt-5 gap-3">
                      {products.map((product) => {
                        const active = product.id === selectedProductId;
                        const alreadyOwned = ownedProductIds.has(product.id);
                        const displayPrice = getProductPrice(product);

                        return (
                          <TouchableOpacity
                            key={product.id}
                            activeOpacity={0.92}
                            onPress={() => setSelectedProductId(product.id)}
                            className={`rounded-[28px] border px-4 py-4 ${
                              active
                                ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10"
                                : "border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5"
                            }`}
                          >
                            <View className="flex-row items-start justify-between">
                              <View className="flex-1 pr-3">
                                <View className="flex-row flex-wrap items-center gap-2">
                                  <Text className="text-lg font-bold text-slate-900 dark:text-white">
                                    {product.name}
                                  </Text>
                                  {product.is_featured ? (
                                    <View className="rounded-full bg-emerald-500 px-2.5 py-1">
                                      <Text className="text-[10px] font-bold uppercase tracking-[1px] text-white">
                                        Featured
                                      </Text>
                                    </View>
                                  ) : null}
                                  {alreadyOwned ? (
                                    <View className="rounded-full bg-slate-900 px-2.5 py-1 dark:bg-white">
                                      <Text className="text-[10px] font-bold uppercase tracking-[1px] text-white dark:text-slate-900">
                                        Owned
                                      </Text>
                                    </View>
                                  ) : null}
                                </View>
                              </View>

                              <View
                                className={`h-7 w-7 items-center justify-center rounded-full ${
                                  active
                                    ? "bg-emerald-500"
                                    : "bg-slate-200 dark:bg-white/10"
                                }`}
                              >
                                {active ? (
                                  <Check
                                    size={15}
                                    color="#FFFFFF"
                                    strokeWidth={3}
                                  />
                                ) : (
                                  <CircleDot
                                    size={14}
                                    color={isDark ? "#94A3B8" : "#64748B"}
                                  />
                                )}
                              </View>
                            </View>

                            <View className="mt-4 flex-row items-end justify-between">
                              <View>
                                {product.discount_price ? (
                                  <Text className="text-sm font-semibold text-slate-400 line-through dark:text-slate-500">
                                    {formatCurrency(product.price)}
                                  </Text>
                                ) : null}
                                <Text className="mt-1 text-[30px] font-black tracking-[-1px] text-slate-950 dark:text-white">
                                  {formatCurrency(displayPrice)}
                                </Text>
                              </View>

                              <View className="items-end">
                                <Text className="text-xs font-semibold uppercase tracking-[1.2px] text-slate-400 dark:text-slate-500">
                                  {formatDuration(product.access_duration_days)}
                                </Text>
                                <Text className="mt-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                                  {product.device_increment ?? 0} device
                                  increment
                                </Text>
                              </View>
                            </View>

                            {product.allow_points && product.points_price ? (
                              <View className="mt-4 self-start rounded-full bg-amber-100 px-3 py-2 dark:bg-amber-500/10">
                                <Text className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
                                  Also available for {product.points_price}{" "}
                                  points
                                </Text>
                              </View>
                            ) : null}
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {selectedProduct ? (
                      <View className="mt-5 rounded-[28px] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                        <Text className="text-[11px] font-bold uppercase tracking-[1.4px] text-slate-500 dark:text-slate-400">
                          Selected Plan
                        </Text>
                        <Text className="mt-2 text-xl font-bold text-slate-950 dark:text-white">
                          {selectedProduct.name}
                        </Text>
                        <Text className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                          {selectedProductOwned
                            ? "This product is already active on your account."
                            : "Choose how you want to unlock this product."}
                        </Text>

                        <View className="mt-4 flex-row gap-3">
                          <TouchableOpacity
                            activeOpacity={0.92}
                            onPress={() => setPaymentChoice("razorpay")}
                            className={`flex-1 rounded-[22px] border px-4 py-3 ${
                              paymentChoice === "razorpay"
                                ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10"
                                : "border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900"
                            }`}
                          >
                            <Text className="text-sm font-bold text-slate-900 dark:text-white">
                              Pay online
                            </Text>
                            <Text className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                              Razorpay checkout
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            activeOpacity={0.92}
                            disabled={!canUsePoints}
                            onPress={() => {
                              if (canUsePoints) {
                                setPaymentChoice("points");
                              }
                            }}
                            className={`flex-1 rounded-[22px] border px-4 py-3 ${
                              paymentChoice === "points"
                                ? "border-amber-400 bg-amber-50 dark:bg-amber-500/10"
                                : "border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900"
                            } ${!canUsePoints ? "opacity-50" : ""}`}
                          >
                            <Text className="text-sm font-bold text-slate-900 dark:text-white">
                              Use points
                            </Text>
                            <Text className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                              {pointsAvailableForProduct
                                ? `${pointsPrice} needed`
                                : "Not available"}
                            </Text>
                          </TouchableOpacity>
                        </View>

                        {!canUsePoints && pointsAvailableForProduct ? (
                          <Text className="mt-3 text-xs font-medium text-amber-700 dark:text-amber-300">
                            You need{" "}
                            {Math.max(pointsPrice - availablePoints, 0)} more
                            points to buy this one with points.
                          </Text>
                        ) : null}

                        <TouchableOpacity
                          activeOpacity={0.92}
                          disabled={selectedProductOwned || purchasing}
                          onPress={handlePurchase}
                          className={`mt-5 overflow-hidden rounded-full ${
                            selectedProductOwned || purchasing
                              ? "opacity-70"
                              : ""
                          }`}
                        >
                          <LinearGradient
                            colors={
                              isDark
                                ? ["#5a3ec0", "#5a3ec0"]
                                : ["#4B4B4B", "#222222"]
                            }
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            className="flex-row items-center justify-center px-5 py-4"
                          >
                            {purchasing ? (
                              <LottieView
                                source={require("../../../assets/icons/loader.json")}
                                autoPlay
                                loop
                                style={{ width: 32, height: 32 }}
                              />
                            ) : (
                              <>
                                <Text className="text-base font-bold text-white">
                                  {selectedProductOwned
                                    ? "Already Active"
                                    : paymentChoice === "points" && canUsePoints
                                      ? `Purchase with ${pointsPrice} points`
                                      : `Purchase`}
                                </Text>
                                {!selectedProductOwned ? (
                                  <View className="ml-3 flex-row items-center">
                                    <ChevronRight size={18} color="#FFFFFF" />
                                    <ChevronRight size={18} color="#FFFFFF" />
                                  </View>
                                ) : null}
                              </>
                            )}
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </>
                )}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}
