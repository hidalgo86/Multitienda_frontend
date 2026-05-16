import type {
  CreateProduct,
  Size,
  UploadProduct,
} from "@/types/domain/products";

export const PRODUCT_FORM_MAX_IMAGES = 4;

export interface ProductVariantDraft {
  name: string;
  size: Size | "";
  stock: number | "";
  price: number | "";
}

export interface ProductVariantDraftErrors {
  name?: string;
  stock?: string;
  price?: string;
}

interface ProductVariantDraftValues {
  stock: string;
  price: string;
}

export type ProductVariantDraftValuesByIndex = Record<
  number,
  ProductVariantDraftValues
>;

export type ProductCreateFormState = Partial<CreateProduct>;

export type ProductEditFormState = Partial<UploadProduct>;
