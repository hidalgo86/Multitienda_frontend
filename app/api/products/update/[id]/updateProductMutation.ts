import type {
  GraphqlError,
  UpdateProductGraphqlInput,
  UpdateProductMutationResponse,
} from "@/types/api/products/graphql";
import type { Product } from "@/types/domain/products";
import { normalizeProduct } from "../../normalizeProduct";
import { UpdateProductRouteError } from "./updateProduct.error";

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

export const updateProductInBackend = async (
  id: string,
  input: UpdateProductGraphqlInput,
  authorization?: string | null,
): Promise<Product> => {
  const apiUrl = process.env.API_URL?.trim();
  if (!apiUrl) {
    throw new UpdateProductRouteError(
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
        mutation UpdateProduct($id: String!, $input: UpdateProductInput!) {
          updateProduct(id: $id, input: $input) {
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
      variables: { id, input },
    }),
  });

  const backendData =
    (await backendRes.json()) as UpdateProductMutationResponse;
  if (!backendRes.ok || backendData.errors) {
    const message = getGraphqlErrorMessage(backendData.errors);
    const status = backendRes.ok
      ? isAuthGraphqlError(message)
        ? 401
        : 400
      : backendRes.status || 500;

    throw new UpdateProductRouteError(
      message,
      status,
    );
  }

  if (!backendData.data?.updateProduct) {
    throw new UpdateProductRouteError("Respuesta inválida del backend", 500);
  }

  return normalizeProduct(backendData.data.updateProduct);
};

const mutateProductStateInBackend = async (
  mutationName: "deleteProduct" | "restoreProduct",
  id: string,
  authorization?: string | null,
): Promise<Product> => {
  const apiUrl = process.env.API_URL?.trim();
  if (!apiUrl) {
    throw new UpdateProductRouteError(
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
        mutation ChangeProductState($id: String!) {
          ${mutationName}(id: $id) {
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
      variables: { id },
    }),
  });

  const backendData = (await backendRes.json()) as {
    data?: Record<typeof mutationName, unknown>;
    errors?: GraphqlError[];
  };

  if (!backendRes.ok || backendData.errors) {
    const message = getGraphqlErrorMessage(backendData.errors);
    const status = backendRes.ok
      ? isAuthGraphqlError(message)
        ? 401
        : 400
      : backendRes.status || 500;

    throw new UpdateProductRouteError(
      message,
      status,
    );
  }

  const product = backendData.data?.[mutationName];
  if (!product) {
    throw new UpdateProductRouteError("Respuesta invalida del backend", 500);
  }

  return normalizeProduct(product);
};

export const deleteProductInBackend = async (
  id: string,
  authorization?: string | null,
): Promise<Product> => mutateProductStateInBackend("deleteProduct", id, authorization);

export const restoreProductInBackend = async (
  id: string,
  authorization?: string | null,
): Promise<Product> => mutateProductStateInBackend("restoreProduct", id, authorization);
