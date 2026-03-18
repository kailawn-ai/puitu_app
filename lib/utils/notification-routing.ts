const pathByType: Record<string, string> = {
  course: "/course",
  new_course: "/course",
  job: "/job",
  old_question: "/old-question",
  oldquestion: "/old-question",
};

const supportedInternalPaths = ["/course/", "/job/", "/old-question/"];

type Primitive = string | number | boolean | null | undefined;

export interface NotificationRoutePayload {
  type?: Primitive;
  action_url?: Primitive;
  link?: Primitive;
  content_type?: Primitive;
  content_id?: Primitive;
  reference_type?: Primitive;
  reference_id?: Primitive;
  route?: Primitive;
  path?: Primitive;
  screen?: Primitive;
  course_id?: Primitive;
  job_id?: Primitive;
  old_question_id?: Primitive;
}

const getString = (...values: Primitive[]): string | null => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
};

const toRouteId = (value: Primitive): string | null => {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
};

const normalizeInternalRoute = (value: string | null): string | null => {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (supportedInternalPaths.some((path) => trimmed.startsWith(path))) {
    return trimmed;
  }

  const schemeMatch = trimmed.match(/^[a-z]+:\/\/([^/]+)\/(.+)$/i);
  if (schemeMatch) {
    return `/${schemeMatch[1]}/${schemeMatch[2]}`;
  }

  return null;
};

const buildRouteFromType = (
  type: Primitive,
  id: Primitive,
): string | null => {
  const normalizedType =
    typeof type === "string" && type.trim() ? type.trim().toLowerCase() : null;
  const normalizedId = toRouteId(id);

  if (!normalizedType || !normalizedId) {
    return null;
  }

  const basePath = pathByType[normalizedType];
  if (!basePath) {
    return null;
  }

  return `${basePath}/${normalizedId}`;
};

export const resolveNotificationRoute = (
  payload?: NotificationRoutePayload | null,
): string | null => {
  if (!payload) return null;

  const routeFromData = normalizeInternalRoute(
    getString(payload.route, payload.path, payload.screen),
  );
  if (routeFromData) {
    return routeFromData;
  }

  const actionUrlRoute = normalizeInternalRoute(getString(payload.action_url));
  if (actionUrlRoute) {
    return actionUrlRoute;
  }

  const linkRoute = normalizeInternalRoute(getString(payload.link));
  if (linkRoute) {
    return linkRoute;
  }

  const candidates: Array<[Primitive, Primitive]> = [
    [payload.content_type, payload.content_id],
    [payload.reference_type, payload.reference_id],
    [payload.type, payload.course_id],
    [payload.type, payload.job_id],
    [payload.type, payload.old_question_id],
  ];

  for (const [type, id] of candidates) {
    const route = buildRouteFromType(type, id);
    if (route) {
      return route;
    }
  }

  return null;
};
