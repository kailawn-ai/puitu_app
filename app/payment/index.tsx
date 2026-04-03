import { BackButton } from "@/components/ui/back-button";
import {
  Product,
  ProductService,
  ResolveProductParams,
} from "@/lib/services/product-service";
import {
  CourseProductOptionProduct,
  CourseProductOptionsData,
  SubscriptionService,
} from "@/lib/services/subscription-service";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Check, ShieldCheck, Sparkles, Wallet } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type PaymentChoice = "razorpay" | "points";
type OptionLevel = "course" | "section" | "media";

type SelectableOption = {
  key: string;
  level: OptionLevel;
  productId: number;
  itemId?: number;
  sectionId?: number;
  title: string;
  subtitle: string;
  product: CourseProductOptionProduct;
  isPurchased: boolean;
};

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

const parseCourseIdFromReturnTo = (returnTo?: string): string | undefined => {
  if (!returnTo) return undefined;

  const queryString = returnTo.split("?")[1];
  if (!queryString) return undefined;

  const searchParams = new URLSearchParams(queryString);
  const courseId = searchParams.get("courseId");

  return courseId ? String(courseId) : undefined;
};

const toPurchaseProduct = (product: CourseProductOptionProduct): Product => ({
  id: product.id,
  productable_id: 0,
  productable_type: "",
  name: product.name,
  description: product.description ?? null,
  price: product.price ?? null,
  allow_points: Boolean(product.allow_points),
  points_price: product.points_price ?? null,
  discount_price: product.discount_price ?? null,
  device_increment: product.device_increment ?? null,
  access_duration_days: product.access_duration_days ?? null,
  category: product.category ?? null,
  is_active: true,
  is_featured: Boolean(product.is_featured),
});

const PaymentScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const params = useLocalSearchParams<{
    productId?: string;
    courseId?: string;
    modelType?: ResolveProductParams["model_type"];
    modelId?: string;
    title?: string;
    returnTo?: string;
  }>();

  const [product, setProduct] = useState<Product | null>(null);
  const [courseOptions, setCourseOptions] =
    useState<CourseProductOptionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paymentChoice, setPaymentChoice] = useState<PaymentChoice>("razorpay");
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);

  const resolvedCourseId = useMemo(
    () => params.courseId || parseCourseIdFromReturnTo(params.returnTo),
    [params.courseId, params.returnTo],
  );

  const resolvedTitle = useMemo(() => {
    if (courseOptions?.course?.title) {
      return courseOptions.course.title;
    }

    return params.title || product?.name || "Premium Content";
  }, [courseOptions?.course?.title, params.title, product?.name]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (router.canGoBack()) {
          router.back();
          return true;
        }

        if (params.returnTo) {
          router.replace(params.returnTo as never);
          return true;
        }

        return false;
      },
    );

    return () => backHandler.remove();
  }, [params.returnTo, router]);

  useEffect(() => {
    const productId = params.productId;
    const modelType = params.modelType;
    const modelId = params.modelId;
    const shouldUseCourseOptions =
      !!resolvedCourseId && modelType !== "old-question";

    if (!productId && (!modelType || !modelId) && !shouldUseCourseOptions) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      if (shouldUseCourseOptions) {
        const options =
          await SubscriptionService.getCourseProductOptions(resolvedCourseId);
        setCourseOptions(options);
        setProduct(null);
        return;
      }

      const nextProduct = productId
        ? await ProductService.getById(productId)
        : await ProductService.resolveByContent({
            model_type: modelType!,
            model_id: modelId!,
          });

      setProduct(nextProduct);
      setCourseOptions(null);
    };

    loadData()
      .catch(async (error) => {
        console.log("Payment load failed:", error);

        if (shouldUseCourseOptions && (productId || (modelType && modelId))) {
          try {
            const fallbackProduct = productId
              ? await ProductService.getById(productId)
              : await ProductService.resolveByContent({
                  model_type: modelType!,
                  model_id: modelId!,
                });

            setProduct(fallbackProduct);
            setCourseOptions(null);
            return;
          } catch (fallbackError) {
            console.log("Payment fallback failed:", fallbackError);
          }
        }

        Alert.alert(
          "Unable to load payment",
          "We could not find the product options for this content.",
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [params.modelId, params.modelType, params.productId, resolvedCourseId]);

  const availablePoints = courseOptions?.pointsSummary?.available_points ?? 0;

  const selectableOptions = useMemo(() => {
    if (!courseOptions) return [];

    const options: SelectableOption[] = [];

    if (courseOptions.course.course_product) {
      options.push({
        key: `course:${courseOptions.course.course_product.id}`,
        level: "course",
        productId: courseOptions.course.course_product.id,
        itemId: courseOptions.course.id,
        title: `Full course: ${courseOptions.course.title}`,
        subtitle: "Unlock the entire course in one purchase.",
        product: courseOptions.course.course_product,
        isPurchased: courseOptions.course.is_purchased,
      });
    }

    courseOptions.sections.forEach((section) => {
      if (section.product) {
        options.push({
          key: `section:${section.product.id}`,
          level: "section",
          itemId: section.id,
          sectionId: section.id,
          productId: section.product.id,
          title: section.title,
          subtitle: "Unlock this full section.",
          product: section.product,
          isPurchased: section.is_purchased,
        });
      }

      [
        ...section.videos,
        ...section.audios,
        ...section.documents,
        ...section.images,
      ]
        .filter((item) => item.product)
        .forEach((item) => {
          options.push({
            key: `${item.type}:${item.product!.id}`,
            level: "media",
            itemId: item.id,
            sectionId: section.id,
            productId: item.product!.id,
            title: item.title ?? `${item.type} ${item.id}`,
            subtitle: `Unlock this ${item.type}.`,
            product: item.product!,
            isPurchased: item.is_purchased,
          });
        });
    });

    return options;
  }, [courseOptions]);

  const optionMap = useMemo(
    () =>
      new Map(
        selectableOptions.map((option) => [option.productId, option] as const),
      ),
    [selectableOptions],
  );

  const courseOption = useMemo(
    () => selectableOptions.find((option) => option.level === "course") ?? null,
    [selectableOptions],
  );

  const selectedOptions = useMemo(
    () =>
      selectedProductIds
        .map((productId) => optionMap.get(productId))
        .filter((option): option is SelectableOption => Boolean(option)),
    [optionMap, selectedProductIds],
  );

  useEffect(() => {
    if (selectableOptions.length === 0) {
      if (product) {
        setSelectedProductIds([product.id]);
      }
      return;
    }

    const lockedProductId = Number(params.productId);
    const modelId = Number(params.modelId);
    const modelType = params.modelType;
    const preferredOption = Number.isFinite(lockedProductId)
      ? selectableOptions.find((option) => option.productId === lockedProductId)
      : null;
    const entryOption =
      Number.isFinite(modelId) && modelType
        ? (selectableOptions.find((option) => {
            if (modelType === "course") {
              return option.level === "course" && option.itemId === modelId;
            }

            if (modelType === "course-section") {
              return option.level === "section" && option.itemId === modelId;
            }

            if (modelType === "course-video") {
              return (
                option.key.startsWith("video:") && option.itemId === modelId
              );
            }

            if (modelType === "course-audio") {
              return (
                option.key.startsWith("audio:") && option.itemId === modelId
              );
            }

            if (modelType === "course-document") {
              return (
                option.key.startsWith("document:") && option.itemId === modelId
              );
            }

            if (modelType === "course-image") {
              return (
                option.key.startsWith("image:") && option.itemId === modelId
              );
            }

            return false;
          }) ?? null)
        : null;
    const firstAvailableOption = selectableOptions.find(
      (option) => !option.isPurchased,
    );

    setSelectedProductIds((current) => {
      const stillValid = current.filter((productId) =>
        optionMap.has(productId),
      );

      if (stillValid.length > 0) {
        return stillValid;
      }

      if (entryOption && !entryOption.isPurchased) {
        return [entryOption.productId];
      }

      if (preferredOption && !preferredOption.isPurchased) {
        return [preferredOption.productId];
      }

      if (firstAvailableOption) {
        return [firstAvailableOption.productId];
      }

      return [];
    });
  }, [
    optionMap,
    params.modelId,
    params.modelType,
    params.productId,
    product,
    selectableOptions,
  ]);

  const totalAmount = useMemo(() => {
    if (selectedOptions.length === 0) {
      return Number(product?.discount_price ?? product?.price ?? 0);
    }

    return selectedOptions.reduce((sum, option) => {
      return (
        sum +
        Number(
          option.product.final_price ??
            option.product.discount_price ??
            option.product.price ??
            0,
        )
      );
    }, 0);
  }, [product, selectedOptions]);

  const totalPointsNeeded = useMemo(() => {
    return selectedOptions.reduce((sum, option) => {
      return sum + Number(option.product.points_price ?? 0);
    }, 0);
  }, [selectedOptions]);

  const pointsEligible =
    selectedOptions.length > 0 &&
    selectedOptions.every(
      (option) =>
        option.product.allow_points &&
        Number(option.product.points_price ?? 0) > 0,
    );

  const canUsePoints =
    pointsEligible &&
    availablePoints >= totalPointsNeeded &&
    totalPointsNeeded > 0;

  useEffect(() => {
    if (paymentChoice === "points" && !canUsePoints) {
      setPaymentChoice("razorpay");
    }
  }, [canUsePoints, paymentChoice]);

  const toggleSelection = (option: SelectableOption) => {
    if (option.isPurchased) return;

    setSelectedProductIds((current) => {
      const currentSet = new Set(current);
      const exists = currentSet.has(option.productId);

      if (exists) {
        currentSet.delete(option.productId);
        return Array.from(currentSet);
      }

      if (option.level === "course") {
        return [option.productId];
      }

      const next = current.filter((productId) => {
        const item = optionMap.get(productId);

        if (!item) return false;
        if (item.level === "course") return false;
        if (option.level === "section" && item.sectionId === option.sectionId) {
          return item.level !== "media";
        }
        if (option.level === "media" && item.sectionId === option.sectionId) {
          return item.level !== "section";
        }

        return true;
      });

      return [...next, option.productId];
    });
  };

  const handlePay = async () => {
    const productsToBuy =
      selectedOptions.length > 0
        ? selectedOptions.map((option) => toPurchaseProduct(option.product))
        : product
          ? [product]
          : [];

    if (productsToBuy.length === 0 || paying) return;

    setPaying(true);

    let completedCount = 0;

    try {
      for (const nextProduct of productsToBuy) {
        await SubscriptionService.purchaseProduct({
          product: nextProduct,
          paymentMethod:
            paymentChoice === "points" && canUsePoints ? "points" : "razorpay",
        });
        completedCount += 1;
      }

      Alert.alert(
        paymentChoice === "points"
          ? "Purchase completed"
          : "Payment successful",
        completedCount > 1
          ? `${completedCount} items have been activated on your account.`
          : "Your purchase has been activated.",
        [
          {
            text: "Continue",
            onPress: () => {
              if (router.canGoBack()) {
                router.back();
                return;
              }

              if (params.returnTo) {
                router.replace(params.returnTo as never);
                return;
              }
            },
          },
        ],
      );
    } catch (error: any) {
      console.log("Payment flow failed:", error);

      Alert.alert(
        paymentChoice === "points" ? "Purchase failed" : "Payment fail",
        completedCount > 0
          ? `${completedCount} item(s) completed before the flow stopped. ${error?.description || error?.message || "Please review your selection and try again."}`
          : error?.description ||
              error?.message ||
              "We could not complete your payment.",
      );
    } finally {
      setPaying(false);
    }
  };

  const renderOptionCard = (option: SelectableOption) => {
    const isSelected = selectedProductIds.includes(option.productId);
    const disabled = option.isPurchased;
    const priceLabel = formatCurrency(
      option.product.final_price ??
        option.product.discount_price ??
        option.product.price,
    );

    return (
      <TouchableOpacity
        key={option.key}
        activeOpacity={0.92}
        disabled={disabled}
        onPress={() => toggleSelection(option)}
        className={`rounded-[24px] border px-4 py-4 ${
          isSelected
            ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10"
            : "border-slate-200 bg-slate-50 dark:border-zinc-700 dark:bg-zinc-950"
        } ${disabled ? "opacity-60" : ""}`}
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-base font-bold text-slate-900 dark:text-white">
              {option.title}
            </Text>
            <Text className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300">
              {option.subtitle}
            </Text>
            <Text className="mt-3 text-lg font-bold text-slate-900 dark:text-white">
              {priceLabel}
            </Text>
            {option.product.allow_points && option.product.points_price ? (
              <Text className="mt-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
                {option.product.points_price} points available
              </Text>
            ) : null}
          </View>

          <View
            className={`h-8 w-8 items-center justify-center rounded-full ${
              disabled || isSelected
                ? "bg-emerald-500"
                : "bg-slate-200 dark:bg-zinc-800"
            }`}
          >
            {disabled || isSelected ? (
              <Check size={16} color="#FFFFFF" strokeWidth={3} />
            ) : null}
          </View>
        </View>

        {disabled ? (
          <View className="mt-3 self-start rounded-full bg-slate-900 px-3 py-1.5 dark:bg-white">
            <Text className="text-[10px] font-bold uppercase tracking-[1px] text-white dark:text-slate-900">
              Already active
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>
    );
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
      <View className="absolute z-10 top-12 mb-3 px-4">
        <BackButton onPress={() => router.back()} />
      </View>
      <View className="flex-1">
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 10,
            paddingVertical: 10,
            paddingBottom: insets.bottom + 28,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View className="rounded-[32px] mt-8 border border-slate-200 bg-white/95 px-6 py-7 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <Text className="mt-10 text-3xl font-bold text-slate-900 dark:text-white">
              Buy premium access
            </Text>
            <Text className="mt-2 leading-6 text-slate-600 dark:text-slate-300">
              Choose whole course, section access, or individual media. You can
              also pick multiple media items in one visit.
            </Text>
          </View>

          {loading ? (
            <View className="items-center justify-center py-12">
              <ActivityIndicator size="small" color="#7A25FF" />
              <Text className="mt-3 text-slate-500 dark:text-slate-400">
                Loading purchase options...
              </Text>
            </View>
          ) : !courseOptions && !product ? (
            <View className="mt-6 rounded-2xl bg-rose-50 px-4 py-5 dark:bg-rose-950/30">
              <Text className="font-semibold text-rose-700 dark:text-rose-300">
                Product details unavailable
              </Text>
              <Text className="mt-1 text-rose-600 dark:text-rose-200">
                We could not resolve the product for this content.
              </Text>
            </View>
          ) : (
            <>
              <View className="mt-7 rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-zinc-800 dark:bg-zinc-950">
                <Text className="text-xs uppercase tracking-[1px] text-slate-500 dark:text-slate-400">
                  Selection
                </Text>
                <Text className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
                  {resolvedTitle}
                </Text>
                {courseOptions?.course?.summary ? (
                  <Text className="mt-2 leading-6 text-slate-600 dark:text-slate-300">
                    {courseOptions.course.summary}
                  </Text>
                ) : product?.description ? (
                  <Text className="mt-2 leading-6 text-slate-600 dark:text-slate-300">
                    {product.description}
                  </Text>
                ) : null}

                <View className="mt-5 flex-row items-end justify-between">
                  <View>
                    <Text className="text-xs uppercase tracking-[1px] text-slate-500 dark:text-slate-400">
                      Total
                    </Text>
                    <Text className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
                      {formatCurrency(totalAmount)}
                    </Text>
                  </View>

                  {courseOptions ? (
                    <View className="rounded-full bg-amber-100 px-3 py-2 dark:bg-amber-950/40">
                      <View className="flex-row items-center">
                        <Wallet size={14} color="#B45309" />
                        <Text className="ml-2 text-xs font-semibold text-amber-800 dark:text-amber-300">
                          {availablePoints} points
                        </Text>
                      </View>
                    </View>
                  ) : null}
                </View>
              </View>

              {courseOptions ? (
                <>
                  <View className="mt-6 gap-4">
                    {courseOption ? renderOptionCard(courseOption) : null}

                    {courseOptions.sections.map((section) => {
                      const sectionOption = selectableOptions.find(
                        (option) =>
                          option.level === "section" &&
                          option.sectionId === section.id,
                      );
                      const mediaOptions = selectableOptions.filter(
                        (option) =>
                          option.level === "media" &&
                          option.sectionId === section.id,
                      );

                      return (
                        <View
                          key={section.id}
                          className="rounded-[28px] border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
                        >
                          <Text className="text-lg font-bold text-slate-900 dark:text-white">
                            {section.title}
                          </Text>

                          {sectionOption ? (
                            <View className="mt-4">
                              {renderOptionCard(sectionOption)}
                            </View>
                          ) : null}

                          {mediaOptions.length > 0 ? (
                            <View className="mt-4 gap-3">
                              <Text className="text-xs font-bold uppercase tracking-[1px] text-slate-500 dark:text-slate-400">
                                Single media or multiple media
                              </Text>
                              {mediaOptions.map(renderOptionCard)}
                            </View>
                          ) : null}
                        </View>
                      );
                    })}
                  </View>

                  <View className="mt-6 rounded-[28px] border border-slate-200 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
                    <Text className="text-[11px] font-bold uppercase tracking-[1.4px] text-slate-500 dark:text-slate-400">
                      Payment method
                    </Text>

                    <View className="mt-4 flex-row gap-3">
                      <TouchableOpacity
                        activeOpacity={0.92}
                        onPress={() => setPaymentChoice("razorpay")}
                        className={`flex-1 rounded-[22px] border px-4 py-3 ${
                          paymentChoice === "razorpay"
                            ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10"
                            : "border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
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
                            : "border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
                        } ${!canUsePoints ? "opacity-50" : ""}`}
                      >
                        <Text className="text-sm font-bold text-slate-900 dark:text-white">
                          Use points
                        </Text>
                        <Text className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                          {pointsEligible
                            ? `${totalPointsNeeded} needed`
                            : "Not available for all selections"}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {selectedOptions.length > 1 &&
                    paymentChoice === "razorpay" ? (
                      <Text className="mt-3 text-xs font-medium text-amber-700 dark:text-amber-300">
                        Multiple Razorpay selections will run one checkout per
                        item with the current backend flow.
                      </Text>
                    ) : null}
                  </View>
                </>
              ) : null}

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
                disabled={
                  paying ||
                  (courseOptions ? selectedOptions.length === 0 : !product)
                }
                className={`mt-8 h-14 items-center justify-center rounded-2xl ${
                  paying ? "bg-primary-400" : "bg-primary-500"
                } ${
                  courseOptions && selectedOptions.length === 0
                    ? "opacity-60"
                    : ""
                }`}
              >
                {paying ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-base font-bold text-white">
                    {paymentChoice === "points" && canUsePoints
                      ? `Purchase with ${totalPointsNeeded} points`
                      : courseOptions && selectedOptions.length > 1
                        ? `Buy ${selectedOptions.length} items`
                        : "Pay with Razorpay"}
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>
    </LinearGradient>
  );
};

export default PaymentScreen;
