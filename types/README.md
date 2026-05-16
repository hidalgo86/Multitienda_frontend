# Types por capa

## Domain

Usa [types/domain/products/index.ts](types/domain/products/index.ts) para el modelo interno del frontend.

Ejemplos:

- Product
- VariantProduct
- Genre
- ProductState

## API

Usa [types/api/products/graphql.ts](types/api/products/graphql.ts) para contratos de transporte con el backend.

Ejemplos:

- CreateProductGraphqlInput
- UpdateProductGraphqlInput
- ProductByIdQueryResponse

Nota:
Los tipos de API pueden parecerse a los de domain, pero no se unifican si eso mezcla responsabilidades entre frontend y transporte.

## UI

Usa [types/ui/products/index.ts](types/ui/products/index.ts) y [types/ui/products/forms.ts](types/ui/products/forms.ts) para props de componentes, páginas y estado temporal de formularios.

Ejemplos:

- ProductCardPublicProps
- ProductPaginationProps
- ProductCreateFormState
- ProductVariantDraft
