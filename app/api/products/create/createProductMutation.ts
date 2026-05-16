// src/app/api/products/create/createProductMutation.ts
import type {
  CreateProductGraphqlInput,
  CreateProductMutationResponse,
  GraphqlError,
} from "@/types/api/products/graphql";
import type { Product } from "@/types/domain/products";
import { normalizeProduct } from "../normalizeProduct";
import { CreateProductRouteError } from "./createProduct.error";

const getGraphqlErrorMessage = (errors?: GraphqlError[]): string => {
  const message = errors
    ?.find((error) => error.message?.trim())
    ?.message?.trim();
  return message || "Error del backend";
};

const isAuthGraphqlError = (message: string): boolean => {
  const normalized = message.trim().toLowerCase();
  return (
    normalized.includes("unauthorized") ||
    normalized.includes("no autenticado") ||
    normalized.includes("debes iniciar sesion") ||
    normalized.includes("debes iniciar sesión") ||
    normalized.includes("token") ||
    normalized.includes("jwt") ||
    normalized.includes("sesion") ||
    normalized.includes("sesión")
  );
};

export const createProductInBackend = async (
  input: CreateProductGraphqlInput,
  authorization?: string | null,
): Promise<Product> => {
  const apiUrl = process.env.API_URL?.trim();
  if (!apiUrl) {
    throw new CreateProductRouteError(
      "Falta API_URL en variables de entorno",
      500,
    );
  }

  const backendRes = await fetch(`${apiUrl}/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authorization ? { Authorization: authorization } : {}),
    },
    body: JSON.stringify({
      query: `
        mutation CreateProduct($input: CreateProductInput!) {
          createProduct(input: $input) {
            id
            sku
            slug
            categoryId
            name
            description
            brand
            thumbnail
            genre
            images { url publicId }
            variants { name stock price image }
            stock
            price
            state
            availability
            stats { views favorites cartAdds purchases searches }
            createdAt
            updatedAt
          }
        }
      `,
      variables: { input },
    }),
  });

  const backendData =
    (await backendRes.json()) as CreateProductMutationResponse;
  if (!backendRes.ok || backendData.errors) {
    const message = getGraphqlErrorMessage(backendData.errors);
    const status = backendRes.ok
      ? isAuthGraphqlError(message)
        ? 401
        : 400
      : backendRes.status || 500;

    throw new CreateProductRouteError(
      message,
      status,
    );
  }

  if (!backendData.data?.createProduct) {
    throw new CreateProductRouteError("Respuesta inválida del backend", 500);
  }

  return normalizeProduct(backendData.data.createProduct);
};
