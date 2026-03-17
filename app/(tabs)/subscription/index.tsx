import { LinearGradient } from "expo-linear-gradient";
import {
  Calculator,
  Check,
  ChevronRight,
  Crown,
  History,
  ScanSearch,
  Sparkles,
  X,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useMemo, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const plans = [
  {
    id: "yearly",
    title: "Yearly",
    oldPrice: "$108",
    price: "$82.78",
    description: "One year access with a one-time payment.",
    badge: "3 Days Free Trial",
    savings: "Best Value",
    recommended: true,
  },
  {
    id: "weekly",
    title: "Weekly",
    oldPrice: "$20",
    price: "$12.78",
    description: "One week access with a one-time payment.",
    badge: "No Free Trial",
    savings: "Flexible",
    recommended: false,
  },
] as const;

const featurePills = [
  { label: "Scan & get Answer", icon: ScanSearch },
  { label: "Calculation History", icon: History },
  { label: "Unlimited Attempts", icon: Sparkles },
  { label: "Complex Calculations", icon: Calculator },
] as const;

export default function SubscriptionScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [selectedPlan, setSelectedPlan] = useState<(typeof plans)[number]["id"]>(
    "yearly",
  );

  const selectedPlanData = useMemo(
    () => plans.find((plan) => plan.id === selectedPlan) ?? plans[0],
    [selectedPlan],
  );

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
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 100,
        }}
      >
        <View className="px-4">
          <View className="relative overflow-hidden rounded-[36px] border border-black/5 bg-white/92 px-5 pb-6 pt-4 dark:border-white/10 dark:bg-[#0F172A]/92">
            <LinearGradient
              colors={
                isDark
                  ? ["rgba(34,197,94,0.16)", "rgba(245,158,11,0.12)", "rgba(255,255,255,0)"]
                  : ["rgba(34,197,94,0.20)", "rgba(251,191,36,0.14)", "rgba(255,255,255,0)"]
              }
              locations={[0, 0.38, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                height: 280,
              }}
            />

            <View className="flex-row items-center justify-between">
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => Alert.alert("Close", "This can dismiss the paywall when you wire that flow.")}
                className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-white/5"
              >
                <X size={18} color={isDark ? "#E5E7EB" : "#64748B"} />
              </TouchableOpacity>

              <View className="rounded-full bg-emerald-50 px-3 py-1.5 dark:bg-emerald-500/10">
                <Text className="text-[11px] font-bold uppercase tracking-[1.6px] text-emerald-700 dark:text-emerald-200">
                  Premium Access
                </Text>
              </View>

              <View className="h-10 w-10" />
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
                Best Rating Mobile Experience
              </Text>

              <View className="mt-3 flex-row items-center">
                {[0, 1, 2, 3, 4].map((star) => (
                  <Sparkles
                    key={star}
                    size={15}
                    color="#F59E0B"
                    fill="#FDE68A"
                    style={{ marginHorizontal: 3 }}
                  />
                ))}
              </View>

              <Text className="mt-7 text-center text-[19px] font-bold text-slate-900 dark:text-white">
                Unlock All
              </Text>
              <Text className="mt-1 text-center text-[34px] font-black leading-9 text-emerald-500">
                Premium
              </Text>
              <Text className="mt-1 text-center text-[19px] font-bold text-slate-800 dark:text-slate-100">
                Features
              </Text>
            </View>

            <View className="mt-6 flex-row flex-wrap justify-center">
              {featurePills.map((feature) => {
                const Icon = feature.icon;

                return (
                  <View
                    key={feature.label}
                    className="mb-3 mr-2 flex-row items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-white/10 dark:bg-white/5"
                  >
                    <Icon size={14} color={isDark ? "#A7F3D0" : "#059669"} />
                    <Text className="ml-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                      {feature.label}
                    </Text>
                  </View>
                );
              })}
            </View>

            <View className="mt-2 flex-row gap-3">
              {plans.map((plan) => {
                const active = selectedPlan === plan.id;

                return (
                  <TouchableOpacity
                    key={plan.id}
                    activeOpacity={0.92}
                    onPress={() => setSelectedPlan(plan.id)}
                    className={`flex-1 rounded-[28px] border px-4 py-4 ${
                      active
                        ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10"
                        : "border-slate-200 bg-white dark:border-white/10 dark:bg-white/5"
                    }`}
                  >
                    {plan.recommended ? (
                      <View className="mb-3 self-start rounded-full bg-emerald-500 px-3 py-1.5">
                        <Text className="text-[10px] font-bold uppercase tracking-[1.2px] text-white">
                          Most Popular
                        </Text>
                      </View>
                    ) : null}

                    <View className="flex-row items-start justify-between">
                      <View>
                        <Text className="text-lg font-bold text-slate-900 dark:text-white">
                          {plan.title}
                        </Text>
                        <Text className="mt-1 text-[11px] font-bold uppercase tracking-[1.4px] text-slate-400 dark:text-slate-500">
                          {plan.savings}
                        </Text>
                      </View>

                      <View
                        className={`h-6 w-6 items-center justify-center rounded-full ${
                          active
                            ? "bg-emerald-500"
                            : "bg-slate-100 dark:bg-white/10"
                        }`}
                      >
                        {active ? (
                          <Check size={14} color="#FFFFFF" strokeWidth={3} />
                        ) : (
                          <View className="h-3 w-3 rounded-full bg-slate-300 dark:bg-slate-500" />
                        )}
                      </View>
                    </View>

                    <Text className="mt-4 text-sm font-semibold text-slate-400 line-through dark:text-slate-500">
                      {plan.oldPrice}
                    </Text>
                    <Text className="mt-1 text-[34px] font-black tracking-[-1px] text-slate-950 dark:text-white">
                      {plan.price}
                    </Text>
                    <Text className="mt-2 min-h-[46px] text-xs leading-4 text-slate-600 dark:text-slate-300">
                      {plan.description}
                    </Text>

                    <View
                      className={`mt-4 self-start rounded-full px-3 py-2 ${
                        active
                          ? "bg-emerald-500"
                          : "bg-slate-200 dark:bg-white/10"
                      }`}
                    >
                      <Text
                        className={`text-[11px] font-bold ${
                          active
                            ? "text-white"
                            : "text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        {plan.badge}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              activeOpacity={0.92}
              onPress={() =>
                Alert.alert(
                  "Subscription",
                  `Start ${selectedPlanData.title.toLowerCase()} plan flow next.`,
                )
              }
              className="mt-6 overflow-hidden rounded-full"
            >
              <LinearGradient
                colors={isDark ? ["#2A2A2A", "#090909"] : ["#4B4B4B", "#222222"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="flex-row items-center justify-center px-5 py-4"
              >
                <Text className="text-base font-bold text-white">
                  Start with {selectedPlanData.badge}
                </Text>
                <View className="ml-3 flex-row items-center">
                  <ChevronRight size={18} color="#FFFFFF" />
                  <ChevronRight
                    size={18}
                    color="#FFFFFF"
                    style={{ marginLeft: -9 }}
                  />
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <Text className="mt-4 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
              No Commitment, Cancel Anytime
            </Text>

            <View className="mt-5 flex-row items-center justify-center">
              <Text className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Terms of Use
              </Text>
              <Text className="mx-3 text-slate-300 dark:text-slate-600">|</Text>
              <Text className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Privacy Policy
              </Text>
              <Text className="mx-3 text-slate-300 dark:text-slate-600">|</Text>
              <Text className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Restore
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}
