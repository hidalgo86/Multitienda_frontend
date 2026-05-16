# Chikitoslandia

## Environment

Create a local environment file from [.env.example](.env.example) and complete at least these values:

- `API_URL`
- `NEXT_PUBLIC_SITE_URL`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `NEXT_PUBLIC_CATEGORY_ID_ROPA`
- `NEXT_PUBLIC_CATEGORY_ID_JUGUETE`
- `NEXT_PUBLIC_CATEGORY_ID_ACCESORIO`
- `NEXT_PUBLIC_CATEGORY_ID_ALIMENTACION`

The product forms and category label helpers use those `NEXT_PUBLIC_CATEGORY_ID_*` values to infer the visual category from `categoryId`.

Cloudinary credentials are server-only variables. Do not add `NEXT_PUBLIC_` to them.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
