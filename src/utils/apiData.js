export const getRecordId = (record) => record?.id ?? record?._id ?? "";

export const sameRecordId = (record, id) =>
  String(getRecordId(record)) === String(id);

export const normalizeCollection = (data, keys = []) => {
  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.data)) return data.data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }

  return [];
};

export const normalizeResource = (data, keys = []) => {
  for (const key of keys) {
    if (data?.[key]) return data[key];
  }

  return data ?? null;
};

export const DEFAULT_PAGINATION = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPrevPage: false,
};

export const normalizePagination = (data, fallback = DEFAULT_PAGINATION) => {
  const pagination = data?.pagination;

  if (!pagination) return fallback;

  return {
    page: Number(pagination.page) || fallback.page,
    limit: Number(pagination.limit) || fallback.limit,
    total: Number(pagination.total) || 0,
    totalPages: Number(pagination.totalPages) || 0,
    hasNextPage: Boolean(pagination.hasNextPage),
    hasPrevPage: Boolean(pagination.hasPrevPage),
  };
};

export const createPaginationParams = ({
  page = 1,
  limit = 10,
  search,
  ...params
} = {}) => ({
  page,
  limit,
  ...(search ? { search } : {}),
  ...Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== "")
  ),
});
