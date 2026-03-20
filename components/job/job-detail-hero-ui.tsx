import { type Job } from "@/lib/services/job-service";
import {
  BriefcaseBusiness,
  Link as LinkIcon,
  Mail,
  Phone,
  ShieldCheck,
  Tag,
} from "lucide-react-native";
import React from "react";
import { Image, Pressable, Text, View } from "react-native";

interface JobDetailHeroUIProps {
  job: Job;
  onPressApply?: (url: string) => void;
  onPressEmail?: (email: string) => void;
  onPressPhone?: (phone: string) => void;
}

const typeLabel: Record<Job["job_type"], string> = {
  government: "Government",
  public: "Public",
  private: "Private",
};

export default function JobDetailHeroUI({
  job,
  onPressApply,
  onPressEmail,
  onPressPhone,
}: JobDetailHeroUIProps) {
  const hasImage = !!job.image;
  const link = job.detail?.link;
  const email = job.detail?.email;
  const phone = job.detail?.phone_1 || job.detail?.phone_2 || null;

  return (
    <View className="mx-3 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <View className="h-52 bg-zinc-100 dark:bg-zinc-800 items-center justify-center">
        {hasImage ? (
          <Image
            source={{ uri: job.image! }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <BriefcaseBusiness size={44} color="#9CA3AF" />
        )}
      </View>

      <View className="p-4">
        <Text className="text-zinc-900 dark:text-zinc-100 text-xl font-semibold">
          {job.title}
        </Text>

        <View className="mt-3 flex-row flex-wrap">
          <View className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 mr-2 mb-2 flex-row items-center">
            <BriefcaseBusiness size={12} color="#9CA3AF" />
            <Text className="ml-1 text-xs text-zinc-700 dark:text-zinc-300">
              {typeLabel[job.job_type]}
            </Text>
          </View>

          {!!job.tag && (
            <View className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 mr-2 mb-2 flex-row items-center">
              <Tag size={12} color="#9CA3AF" />
              <Text className="ml-1 text-xs text-zinc-700 dark:text-zinc-300">
                {job.tag}
              </Text>
            </View>
          )}

          {job.is_active && (
            <View className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 mr-2 mb-2 flex-row items-center">
              <ShieldCheck size={12} color="#059669" />
              <Text className="ml-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                Active
              </Text>
            </View>
          )}
        </View>

        {!!job.detail?.description && (
          <Text className="mt-2 text-zinc-600 dark:text-zinc-300 leading-5">
            {job.detail.description}
          </Text>
        )}

        {!!job.qualifications?.length && (
          <View className="mt-4">
            <Text className="text-zinc-900 dark:text-zinc-100 font-semibold mb-2">
              Qualifications
            </Text>
            <View className="flex-row flex-wrap">
              {job.qualifications.map((q) => (
                <View
                  key={q.id}
                  className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 mr-2 mb-2"
                >
                  <Text className="text-xs text-blue-700 dark:text-blue-300">
                    {q.name ?? `Qualification #${q.id}`}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View className="mt-4">
          {!!link && (
            <Pressable
              onPress={() => onPressApply?.(link)}
              className="rounded-xl bg-blue-500 px-4 py-3 items-center flex-row justify-center mb-2"
            >
              <LinkIcon size={16} color="#fff" />
              <Text className="text-white font-semibold ml-2">Apply Now</Text>
            </Pressable>
          )}

          {!!email && (
            <Pressable
              onPress={() => onPressEmail?.(email)}
              className="rounded-xl bg-zinc-100 dark:bg-zinc-800 px-4 py-3 items-center flex-row justify-center mb-2"
            >
              <Mail size={16} color="#6B7280" />
              <Text className="text-zinc-800 dark:text-zinc-200 font-semibold ml-2">
                Email Recruiter
              </Text>
            </Pressable>
          )}

          {!!phone && (
            <Pressable
              onPress={() => onPressPhone?.(phone)}
              className="rounded-xl bg-zinc-100 dark:bg-zinc-800 px-4 py-3 items-center flex-row justify-center"
            >
              <Phone size={16} color="#6B7280" />
              <Text className="text-zinc-800 dark:text-zinc-200 font-semibold ml-2">
                Call Recruiter
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}
