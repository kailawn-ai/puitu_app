import { type Job } from "@/lib/services/job-service";
import { Calendar, Globe, Mail, Phone, ScrollText } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";

interface JobDetailUIProps {
  job: Job;
}

const formatDate = (date?: string) => {
  if (!date) return "Unknown";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Unknown";
  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const InfoRow = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}) => {
  if (!value) return null;

  return (
    <View className="flex-row items-start py-2.5">
      <View className="pt-0.5">{icon}</View>
      <View className="ml-2 flex-1">
        <Text className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {label}
        </Text>
        <Text className="mt-0.5 text-zinc-800 dark:text-zinc-200">{value}</Text>
      </View>
    </View>
  );
};

export default function JobDetailUI({ job }: JobDetailUIProps) {
  const detail = job.detail;

  return (
    <View className="mx-3 mt-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
      <Text className="text-zinc-900 dark:text-zinc-100 text-lg font-semibold">
        Job Details
      </Text>

      {!!detail?.description && (
        <View className="mt-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 p-3">
          <View className="flex-row items-center">
            <ScrollText size={14} color="#9CA3AF" />
            <Text className="ml-1.5 text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Description
            </Text>
          </View>
          <Text className="mt-2 text-zinc-700 dark:text-zinc-300 leading-6">
            {detail.description}
          </Text>
        </View>
      )}

      <View className="mt-3">
        <InfoRow
          icon={<Mail size={14} color="#9CA3AF" />}
          label="Email"
          value={detail?.email}
        />
        <InfoRow
          icon={<Phone size={14} color="#9CA3AF" />}
          label="Primary Phone"
          value={detail?.phone_1}
        />
        <InfoRow
          icon={<Phone size={14} color="#9CA3AF" />}
          label="Secondary Phone"
          value={detail?.phone_2}
        />
        <InfoRow
          icon={<Globe size={14} color="#9CA3AF" />}
          label="Application Link"
          value={detail?.link}
        />
        <InfoRow
          icon={<Calendar size={14} color="#9CA3AF" />}
          label="Posted"
          value={formatDate(job.created_at)}
        />
      </View>
    </View>
  );
}
