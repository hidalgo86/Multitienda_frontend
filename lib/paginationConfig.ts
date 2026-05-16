const parsePositiveInteger = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : fallback;
};

export const paginationConfig = {
  homeSectionLimit: parsePositiveInteger(
    process.env.NEXT_PUBLIC_HOME_SECTION_LIMIT,
    4,
  ),
  relatedProductsLimit: parsePositiveInteger(
    process.env.NEXT_PUBLIC_RELATED_PRODUCTS_LIMIT,
    5,
  ),
  productListLimit: parsePositiveInteger(
    process.env.NEXT_PUBLIC_PRODUCT_LIST_LIMIT,
    20,
  ),
  adminOrdersLimit: parsePositiveInteger(
    process.env.NEXT_PUBLIC_ADMIN_ORDERS_LIMIT,
    12,
  ),
  adminUsersLimit: parsePositiveInteger(
    process.env.NEXT_PUBLIC_ADMIN_USERS_LIMIT,
    20,
  ),
  adminAuditLimit: parsePositiveInteger(
    process.env.NEXT_PUBLIC_ADMIN_AUDIT_LIMIT,
    15,
  ),
};
