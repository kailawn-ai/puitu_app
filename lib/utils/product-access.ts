const toNumericProductId = (value: unknown): string | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (/^\d+$/.test(trimmed)) {
      return trimmed;
    }
  }

  return undefined;
};

export const extractDeniedProductId = (data: unknown): string | undefined => {
  if (!data || typeof data !== "object") {
    return undefined;
  }

  const rawProductId =
    (data as { product_id?: unknown; prroduct_id?: unknown }).product_id ??
    (data as { product_id?: unknown; prroduct_id?: unknown }).prroduct_id;

  const directId = toNumericProductId(rawProductId);
  if (directId) {
    return directId;
  }

  if (Array.isArray(rawProductId)) {
    for (const item of rawProductId) {
      const nestedId = toNumericProductId(item);
      if (nestedId) {
        return nestedId;
      }
    }
  }

  return undefined;
};
