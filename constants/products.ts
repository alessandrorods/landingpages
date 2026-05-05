export type { ProductBadge, ProductCategory, Product } from './products.types'
import type { ProductBadge, Product } from './products.types'

export { CATEGORY_LABELS, CATEGORY_GRADIENT, FILTER_ALL } from './categories'

export const BADGE_CONFIG: Record<ProductBadge, { label: string; className: string }> = {
  'mais-vendido':    { label: '🏆 Mais Vendido',    className: 'bg-amber-500 text-white' },
  'poucas-unidades': { label: '🔥 Poucas Unidades', className: 'bg-red-500 text-white' },
  'exclusivo':       { label: '⭐ Exclusivo',        className: 'bg-purple-600 text-white' },
  'novidade':        { label: '✨ Novidade',         className: 'bg-blue-500 text-white' },
  'oferta':          { label: '🏷️ Oferta',           className: 'bg-orange-500 text-white' },
}

export const PRODUCTS: Product[] = [
  // ── FLORES DO CAMPO ────────────────────────────────────────────────────────────────
  {
    id: 'bq60',
    sku: 'bq60',
    name: 'Buquê Mix Delicadeza Floral',
    shortDescription: 'Flores do campo em uma composição linda e delicada',
    description:
      'Um buquê encantador com flores do campo cuidadosamente selecionadas',
    price: 119.90,
    originalPrice: 149.90,
    image: 'https://cdn.awsli.com.br/600x700/399/399569/produto/362984931/10-9kj7yh0b8l.png',
    images: [
      'https://cdn.awsli.com.br/600x700/399/399569/produto/362984931/2-9htx7ncjla.png',
      'https://cdn.awsli.com.br/600x700/399/399569/produto/362984931/3-0qyx58pwkp.png',
      'https://cdn.awsli.com.br/600x700/399/399569/produto/362984931/6-qqy7vsqtex.png',
      'https://cdn.awsli.com.br/600x700/399/399569/produto/362984931/8-7kd5z1s57r.png'
    ],
    category: 'flores',
    badges: ['mais-vendido', 'poucas-unidades'],
    isHighlight: true,
    inStock: true,
    stockCount: 4,
  },
  {
    id: 'BQ17',
    sku: 'BQ17',
    name: 'Buquê Mix de Flores',
    shortDescription: 'Mix colorido de flores da estação em uma embalagem rústica',
    description: 'Mix colorido de flores da estação em uma embalagem rústica',
    price: 154.90,
    originalPrice: 159.90,
    image: 'https://cdn.awsli.com.br/600x700/399/399569/produto/138905825/054b3042f7.jpg',
    images: [
      'https://cdn.awsli.com.br/600x700/399/399569/produto/138905825/d9b6a83933.jpg',
      'https://cdn.awsli.com.br/600x700/399/399569/produto/138905825/7eec8f144b.jpg',
      'https://cdn.awsli.com.br/600x700/399/399569/produto/138905825/1000c53de1.jpg'
    ],
    category: 'flores',
    badges: ['oferta', 'exclusivo'],
    isHighlight: false,
    inStock: true,
    stockCount: 12,
  },
  {
    id: 'AR15',
    sku: 'AR15',
    name: 'Arranjo Mix Vermelho e Rosé em Cachepo de Madeira com Balão e Pelúcia',
    shortDescription: 'Rosas vermelhas e cor de rosa, para encantar',
    description: 'Rosas vermelhas e cor de rosa, para encantar',
    price: 144.90,
    originalPrice: 159.90,
    image: 'https://cdn.awsli.com.br/600x700/399/399569/produto/182942135/1-7ny3ga2rvf.png',
    images: [
      'https://cdn.awsli.com.br/600x700/399/399569/produto/182942135/1-cbrdxh1yim.png',
      'https://cdn.awsli.com.br/600x700/399/399569/produto/182942135/7-9sbuco44oa.png',
      'https://cdn.awsli.com.br/600x700/399/399569/produto/182942135/9-0kicu8hm24.png',
      'https://cdn.awsli.com.br/600x700/399/399569/produto/182942135/5-napmjhjlio.png'
    ],
    category: 'flores',
    badges: ['oferta', 'exclusivo'],
    isHighlight: false,
    inStock: true,
    stockCount: 12,
  },

  // ── GIRASSÓIS ───────────────────────────────────────────────────────────────
  {
    id: 'BQ11',
    sku: 'BQ11',
    name: 'Buquê de Girassóis e Astromélias',
    shortDescription: 'Linda e delicada composição de girassóis com astromélias',
    description: 'Linda e delicada composição de girassóis com astromélias',
    price: 119.90,
    originalPrice: 139.90,
    image: 'https://cdn.awsli.com.br/600x700/399/399569/produto/138891127/7096bb0732.jpg',
    images: [
      'https://cdn.awsli.com.br/600x700/399/399569/produto/138891127/b2f2458a6f.jpg',
      'https://cdn.awsli.com.br/600x700/399/399569/produto/138891127/47faed2aef.jpg',
      'https://cdn.awsli.com.br/600x700/399/399569/produto/138891127/02b57fbe1f.jpg'
    ],
    category: 'girassois',
    badges: ['mais-vendido', 'oferta'],
    isHighlight: true,
    inStock: true,
    stockCount: 15,
  },
  {
    id: 'CH13',
    sku: 'CH13',
    name: 'Cesta de Girassóis com Chocolates e Pelúcia',
    shortDescription: 'Um lindo arranjo de girassóis em uma cesta de chocolates com um ursinho de pelúcia',
    description: 'Um lindo arranjo de girassóis em uma cesta de chocolates com um ursinho de pelúcia',
    price: 192.90,
    originalPrice: 199.90,
    image: 'https://cdn.awsli.com.br/600x700/399/399569/produto/320731281/1-71b9o43ntc.png',
    images: [
      'https://cdn.awsli.com.br/600x700/399/399569/produto/320731281/2-x806p8g44d.png',
      'https://cdn.awsli.com.br/600x700/399/399569/produto/320731281/3-btwb9ek1eq.png'
    ],
    category: 'girassois',
    badges: ['mais-vendido', 'oferta'],
    isHighlight: false,
    inStock: true,
    stockCount: 15,
  },
  {
    id: 'AR04',
    sku: 'AR04',
    name: 'Arranjo de Girassóis em Cachepô Rústico de Madeira',
    shortDescription: 'Um lindo arranjo de girassóis em um cachepô rústico de madeira',
    description: 'Um lindo arranjo de girassóis em um cachepô rústico de madeira',
    price: 109.90,
    originalPrice: 129.90,
    image: 'https://cdn.awsli.com.br/600x700/399/399569/produto/132521518/64d331661d.jpg',
    images: [
      'https://cdn.awsli.com.br/600x700/399/399569/produto/132521518/410a48bd0c.jpg',
      'https://cdn.awsli.com.br/600x700/399/399569/produto/132521518/5b168c7350.jpg'
    ],
    category: 'girassois',
    badges: ['poucas-unidades', 'oferta'],
    isHighlight: false,
    inStock: true,
    stockCount: 4,
  },

  // ── CAFÉ DA MANHÃ ────────────────────────────────────────────────────────────────
  {
    id: 'CF09',
    sku: 'CF09',
    name: 'Doce Despertar – Pelúcia, Flores e Delícias em um Só Presente',
    shortDescription: 'Café da manhã especial com flores e ursinho de pelúcia',
    description: 'Café da manhã especial com flores e ursinho de pelúcia',
    price: 199.90,
    originalPrice: 204.90,
    image: 'https://cdn.awsli.com.br/600x700/399/399569/produto/123534938/bq37---quatro-rosas-gazbb90m51.png',
    images: [
      'https://cdn.awsli.com.br/600x700/399/399569/produto/123534938/bq37---quatro-rosas--2--wwq41q20l8.png',
      'https://cdn.awsli.com.br/600x700/399/399569/produto/123534938/bq37---quatro-rosas--3--00q0h0bhmo.png',
      'https://cdn.awsli.com.br/600x700/399/399569/produto/123534938/bq37---quatro-rosas--4--samth9qzox.png',
      'https://cdn.awsli.com.br/600x700/399/399569/produto/123534938/bq37---quatro-rosas--1--tuvirm08lz.png'
    ],
    category: 'cafe-da-manha',
    badges: ['mais-vendido', 'exclusivo', 'poucas-unidades'],
    isHighlight: true,
    inStock: true,
    stockCount: 7,
  },
  {
    id: 'B13',
    sku: 'B13',
    name: 'Baú Flor e Sabor - Café da Manhã com Amor para Mães Inesquecíveis',
    shortDescription: 'Rosas + chocolates finos + vinho rosé + cartão personalizado',
    description:
      'A cesta mais completa e apaixonante da coleção. Reúne um buquê de rosas frescas, chocolates finos belgas, uma garrafa de vinho rosé selecionado, sachês perfumados e cartão personalizado com a sua mensagem de amor. Tudo embalado com fita e papel de seda em cesta vime artesanal. Um presente que diz tudo sem precisar de palavras.',
    price: 189.90,
    originalPrice: 199.00,
    image: 'https://cdn.awsli.com.br/600x700/399/399569/produto/346751358/kit-2-26nxtaxr1n.png',
    images: ['https://cdn.awsli.com.br/600x700/399/399569/produto/346751358/kit-2--1--41zfy7vsaf.png', 'https://cdn.awsli.com.br/600x700/399/399569/produto/346751358/kit-2-j68b6dwa9a.png'],
    category: 'cafe-da-manha',
    badges: ['mais-vendido', 'poucas-unidades'],
    isHighlight: false,
    inStock: true,
    stockCount: 4,
  },
  {
    id: 'B10',
    sku: 'B10',
    name: 'Baú da Mamãe – Surpresa com Afeto e Delícias',
    shortDescription: 'Delícias para um café da manhã especial',
    description: 'Delícias para um café da manhã especial',
    price: 129.90,
    originalPrice: 139.90,
    image: 'https://cdn.awsli.com.br/600x700/399/399569/produto/346588730/kit-3-fa6b8hupm0.png',
    images: [
      'https://cdn.awsli.com.br/600x700/399/399569/produto/346588730/kit-3-detalhes-4icvyrwwsg.png'
    ],
    category: 'cafe-da-manha',
    badges: ['oferta'],
    isHighlight: false,
    inStock: true,
    stockCount: 9,
  },

  // ── CHOCOLATES ─────────────────────────────────────────────────────────────
  {
    id: 'CH04',
    sku: 'CH04',
    name: 'Cesta de Chocolates com Pelúcia e Arranjo de Rosas',
    shortDescription: 'Uma cesta muito mais que especial, com arranjo de rosas, pelúcia e chocolates',
    description: 'Uma cesta muito mais que especial, com arranjo de rosas, pelúcia e chocolates',
    price: 259.90,
    originalPrice: 269.90,
    image: 'https://cdn.awsli.com.br/600x700/399/399569/produto/123534929/11-tmt1mavmob.png',
    images: [
      'https://cdn.awsli.com.br/600x700/399/399569/produto/123534929/4-gyymbsmkxt.png',
      'https://cdn.awsli.com.br/600x700/399/399569/produto/123534929/7-4yoyjymbx4.png',
      'https://cdn.awsli.com.br/600x700/399/399569/produto/123534929/10-t7wd1fznup.png',

    ],
    category: 'chocolates',
    badges: ['mais-vendido', 'oferta', 'poucas-unidades'],
    isHighlight: true,
    inStock: true,
    stockCount: 3,
  },
  {
    id: 'CH11',
    sku: 'CH11',
    name: 'Mimos & Chocolate – Um Coração Rosa Cheio de Amor',
    shortDescription: 'Chocolates, um ursinho de pelúcia e um lindo vaso de flor',
    description: 'Chocolates, um ursinho de pelúcia e um lindo vaso de flor',
    price: 199.90,
    originalPrice: 219.90,
    image: 'https://cdn.awsli.com.br/600x700/399/399569/produto/351277337/122-rte9n21o3h.png',
    images: [
      'https://cdn.awsli.com.br/600x700/399/399569/produto/351277337/125-0v0itqey98.png',
      'https://cdn.awsli.com.br/600x700/399/399569/produto/351277337/bq37---quatro-rosas-lv1pwdx39a.png',
      'https://cdn.awsli.com.br/600x700/399/399569/produto/351277337/bq37---quatro-rosas--2--hbp7y0ipv7.png'
    ],
    category: 'chocolates',
    badges: ['exclusivo', 'oferta'],
    isHighlight: false,
    inStock: true,
    stockCount: 8,
  },
  {
    id: 'CH18',
    sku: 'CH18',
    name: 'Cesta de Rosas com Chocolate Ferrero Rocher',
    shortDescription: 'Arranjo de rosas vermelhos e um Ferrero Rocher, em uma linda cesta',
    description: 'Arranjo de rosas vermelhos e um Ferrero Rocher, em uma linda cesta',
    price: 189.90,
    originalPrice: 199.90,
    image: 'https://cdn.awsli.com.br/600x700/399/399569/produto/320728576/1-sih3qr9go8.png',
    images: [
      'https://cdn.awsli.com.br/600x700/399/399569/produto/320728576/3-gehvasvj9x.png',
      'https://cdn.awsli.com.br/600x700/399/399569/produto/320728576/2-g1vtxnjk8z.png',
      'https://cdn.awsli.com.br/600x700/399/399569/produto/320728576/4-z220n3y4z7.png'
    ],
    category: 'chocolates',
    badges: ['mais-vendido', 'exclusivo'],
    isHighlight: false,
    inStock: true,
    stockCount: 12,
  },

  // ── ORQUÍDEAS ─────────────────────────────────────────────────────────────
  {
    id: 'fl23',
    sku: 'fl23',
    name: 'Orquídea Branca 1 Haste',
    shortDescription: 'Linda orquídea branca em uma embalagem especial',
    description: 'Linda orquídea branca em uma embalagem especial',
    price: 179.90,
    originalPrice: 199.90,
    image: 'https://cdn.awsli.com.br/600x700/399/399569/produto/362718693/1-8chlfljx3n.png',
    images: [
      'https://cdn.awsli.com.br/600x700/399/399569/produto/362718693/3-a5rlua1aln.png',
      'https://cdn.awsli.com.br/600x700/399/399569/produto/362718693/4-rmtvnnslph.png'
    ],
    category: 'orquideas',
    badges: ['mais-vendido', 'oferta', 'poucas-unidades'],
    isHighlight: true,
    inStock: true,
    stockCount: 3,
  },
  {
    id: 'FL20',
    sku: 'FL20',
    name: 'Orquídea Lilás 1 Haste com Caneca e Ferrero Rocher',
    shortDescription: 'Chocolates, uma caneca especial e uma orquídea linda',
    description: 'Chocolates, uma caneca especial e uma orquídea linda',
    price: 224.90,
    originalPrice: 229.90,
    image: 'https://cdn.awsli.com.br/600x700/399/399569/produto/362715772/2-sg2d2i3pz6.png',
    images: [
      'https://cdn.awsli.com.br/600x700/399/399569/produto/362715772/5-68mrmw6mqm.png',
      'https://cdn.awsli.com.br/600x700/399/399569/produto/362715772/3-b0v2gv330h.png',
      'https://cdn.awsli.com.br/600x700/399/399569/produto/362715772/4-qsj11plbbc.png'
    ],
    category: 'orquideas',
    badges: ['exclusivo', 'poucas-unidades'],
    isHighlight: false,
    inStock: true,
    stockCount: 4,
  },
  {
    id: 'FL21',
    sku: 'FL21',
    name: 'Orquídea Branca 1 Haste Com Vinho e Ferrero Rocher',
    shortDescription: 'Orquídea branca em um cachepo rústico com uma garrafa de vinho, Ferrero Rocher e um chaveiro de pelúcia',
    description: 'Orquídea branca em um cachepo rústico com uma garrafa de vinho, Ferrero Rocher e um chaveiro de pelúcia',
    price: 284.90,
    originalPrice: 299.90,
    image: 'https://cdn.awsli.com.br/600x700/399/399569/produto/362712625/1-qxkybuidwh.png',
    images: [
      'https://cdn.awsli.com.br/600x700/399/399569/produto/362712625/4-k47l2ltmq4.png',
      'https://cdn.awsli.com.br/600x700/399/399569/produto/362712625/3-09eqs84hys.png',
      'https://cdn.awsli.com.br/600x700/399/399569/produto/362712625/5-xvpgt4klao.png',
      'https://cdn.awsli.com.br/600x700/399/399569/produto/362712625/6-srdhj7yr4l.png'
    ],
    category: 'orquideas',
    badges: ['poucas-unidades', 'exclusivo'],
    isHighlight: false,
    inStock: true,
    stockCount: 2,
  },
]
