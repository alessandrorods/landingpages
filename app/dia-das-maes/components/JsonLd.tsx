import { Product } from '@/constants/products'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mundoplanta.com.br'
const PAGE_URL = `${SITE_URL}/dia-das-maes`
const BRAND = 'Mundo Planta Flores e Presentes'

// Usar .replace(/</g, '\\u003c') previne XSS em valores de produto,
// conforme recomendado pelos docs do Next.js.
function safeJson(obj: unknown) {
  return JSON.stringify(obj).replace(/</g, '\\u003c')
}

function productSchema(p: Product) {
  return {
    '@type': 'Product',
    name: p.name,
    description: p.shortDescription,
    sku: p.sku,
    brand: { '@type': 'Brand', name: BRAND },
    offers: {
      '@type': 'Offer',
      price: p.price.toFixed(2),
      priceCurrency: 'BRL',
      availability: p.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: PAGE_URL,
      seller: { '@type': 'Organization', name: BRAND },
    },
  }
}

export default function JsonLd({ products }: { products: Product[] }) {
  const schemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: BRAND,
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Início', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Dia das Mães', item: PAGE_URL },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Especial Dia das Mães 2026',
      url: PAGE_URL,
      numberOfItems: products.length,
      itemListElement: products.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: productSchema(p),
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: `Especial Dia das Mães 2026 | ${BRAND}`,
      description: 'Flores frescas, plantas e presentes com entrega garantida para o Dia das Mães.',
      url: PAGE_URL,
      publisher: { '@type': 'Organization', name: BRAND },
      potentialAction: {
        '@type': 'OrderAction',
        target: PAGE_URL,
      },
    },
  ]

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJson(schema) }}
        />
      ))}
    </>
  )
}
