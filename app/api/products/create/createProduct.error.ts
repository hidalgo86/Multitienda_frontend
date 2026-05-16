// src/app/api/products/create/createProduct.error.ts
export class CreateProductRouteError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "CreateProductRouteError";
  }
}
