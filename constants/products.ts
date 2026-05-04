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
  // ── FLORES ────────────────────────────────────────────────────────────────
  {
    id: 'fl-001',
    sku: 'bq60',
    name: 'Buquê Mix Delicadeza Floral',
    shortDescription: 'Flores do campo em uma composição linda e delicada',
    description:
      'Um buquê encantador com flores do campo cuidadosamente selecionadas — rosas, gérberas, alstromérias e folhagens verdes em uma composição que transmite leveza e carinho. Entregue em papel kraft com fita de cetim e cartão personalizado com sua mensagem. Flores frescas, cortadas no dia da entrega, com duração média de 7 a 10 dias.',
    price: 119.90,
    originalPrice: 149.90,
    image: 'https://cdn.awsli.com.br/600x600/399/399569/produto/362984931/10-9kj7yh0b8l.png',
    category: 'flores',
    badges: ['mais-vendido', 'poucas-unidades'],
    isHighlight: true,
    inStock: true,
    stockCount: 8,
  },
  {
    id: 'fl-002',
    sku: 'AR06',
    name: 'Arranjo Mix de Flores com Ferrero Rocher',
    shortDescription: 'Lindas flores do campo em uma base que mantém as flores hidratadas',
    description:
      'Arranjo deslumbrante com flores frescas do campo montadas em base d\'água para manter a hidratação e prolongar a beleza. Acompanha uma caixa de Ferrero Rocher, tornando o presente ainda mais especial e saboroso. Ideal para surpreender e emocionar — combina o melhor das flores com o prazer do chocolate.',
    price: 169.90,
    image: 'https://cdn.awsli.com.br/2500x2500/399/399569/produto/138917319/74e43d00d0.jpg',
    images: ["https://cdn.awsli.com.br/2500x2500/399/399569/produto/138917319/a17823feec.jpg"],
    category: 'flores',
    badges: ['novidade'],
    isHighlight: false,
    inStock: true,
    stockCount: 15,
  },
  {
    id: 'BQ17',
    sku: 'BQ17',
    name: 'Buquê Mix de Flores',
    shortDescription: 'Mix colorido de flores da estação em vaso decorativo',
    description:
      'Explosão de cores e alegria! Este arranjo reúne as flores mais vibrantes da estação — lírios, rosas, margaridas e folhagens tropicais — em um vaso decorativo de cerâmica que pode ser reutilizado. Um presente que embeleza a casa e fica na memória muito depois que as flores secarem.',
    price: 154.90,
    originalPrice: 159.90,
    image: 'https://cdn.awsli.com.br/600x700/399/399569/produto/138905825/054b3042f7.jpg',
    images: ['https://cdn.awsli.com.br/600x700/399/399569/produto/138905825/7eec8f144b.jpg', 'https://cdn.awsli.com.br/600x700/399/399569/produto/138905825/d9b6a83933.jpg'],
    category: 'flores',
    badges: ['oferta'],
    isHighlight: false,
    inStock: true,
    stockCount: 12,
  },

  // ── PLANTAS ───────────────────────────────────────────────────────────────
  {
    id: 'pl-001',
    sku: 'MP-PL-001',
    name: 'Orquídea Phalaenopsis Dupla Haste',
    shortDescription: 'Elegância florida em vaso decorativo exclusivo',
    description:
      'A rainha das plantas ornamentais. Esta orquídea Phalaenopsis com dupla haste chega em plena floração, em vaso de cerâmica decorativo exclusivo. Flores que duram de 2 a 3 meses com cuidado simples — rega a cada 7 dias e luminosidade indireta. Um presente elegante, sofisticado e de longa duração que simboliza amor duradouro.',
    price: 129.90,
    image: '',
    category: 'plantas',
    badges: ['mais-vendido', 'poucas-unidades'],
    isHighlight: true,
    inStock: true,
    stockCount: 5,
  },
  {
    id: 'pl-002',
    sku: 'MP-PL-002',
    name: 'Kit Suculentas Trio',
    shortDescription: '3 suculentas em vasos de cerâmica personalizáveis',
    description:
      'Trio de suculentas selecionadas a dedo, cada uma em um vaso de cerâmica artesanal. Plantas de baixíssima manutenção — perfeitas para quem não tem muito tempo, mas quer ter verde e vida em casa. Os vasos podem ser personalizados com o nome ou uma mensagem especial. Acompanha guia de cuidados ilustrado.',
    price: 59.90,
    image: '',
    category: 'plantas',
    badges: ['novidade'],
    isHighlight: false,
    inStock: true,
    stockCount: 20,
  },
  {
    id: 'pl-003',
    sku: 'MP-PL-003',
    name: 'Samambaia Decorativa Premium',
    shortDescription: 'Verde e exuberante em cachepot premium',
    description:
      'Samambaia frondosa e exuberante, com folhagem densa e viçosa, entregue em cachepot premium de madeira natural. Uma planta que purifica o ar, traz frescor ao ambiente e prospera com cuidado simples. Indicada para ambientes internos com boa luminosidade indireta. Um presente vivo que cresce junto com o carinho de quem recebe.',
    price: 79.90,
    image: '',
    category: 'plantas',
    badges: [],
    isHighlight: false,
    inStock: true,
  },

  // ── CESTAS ────────────────────────────────────────────────────────────────
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
    category: 'cestas',
    badges: ['mais-vendido', 'poucas-unidades'],
    isHighlight: true,
    inStock: true,
    stockCount: 4,
  },
  {
    id: 'cs-002',
    sku: 'MP-CS-002',
    name: 'Cesta Mimosa com Rosas',
    shortDescription: 'Mini buquê + bombons artesanais + chá premium',
    description:
      'Delicada e cheia de sabor. Esta cesta reúne um mini buquê de rosas coloridas, uma seleção de bombons artesanais feitos à mão e uma caixa de chá premium com ervas selecionadas. Perfeita para mães que apreciam os pequenos prazeres do dia a dia. Embalagem presente inclusa.',
    price: 189.90,
    image: '',
    category: 'cestas',
    badges: ['oferta'],
    isHighlight: false,
    inStock: true,
    stockCount: 9,
  },
  {
    id: 'cs-003',
    sku: 'MP-CS-003',
    name: 'Cesta Jardim Secreto',
    shortDescription: 'Orquídea mini + chocolates belgas + colônia floral exclusiva',
    description:
      'Uma experiência sensorial completa. Esta cesta exclusiva combina uma orquídea mini em vaso decorativo, chocolates belgas importados e uma colônia floral de edição limitada com notas de jasmim e magnólia. Para a mãe que merece algo verdadeiramente especial e incomum. Apresentação luxuosa em caixa-presente.',
    price: 229.90,
    originalPrice: 259.90,
    image: '',
    category: 'cestas',
    badges: ['exclusivo'],
    isHighlight: false,
    inStock: true,
    stockCount: 7,
  },

  // ── PRESENTES ─────────────────────────────────────────────────────────────
  {
    id: 'pr-001',
    sku: 'MP-PR-001',
    name: 'Kit Aromaterapia Floral',
    shortDescription: 'Difusor + 3 óleos essenciais + vela aromática + sais de banho',
    description:
      'Um kit completo de bem-estar e relaxamento para mimar quem você ama. Inclui difusor de aromas de madeira, três óleos essenciais com fragrâncias florais (lavanda, jasmim e rosa), vela aromática de 180g com 45h de queima e sais de banho efervescentes. Tudo em caixa-presente premium com fita artesanal. Para a mãe que merece um momento só para ela.',
    price: 159.90,
    originalPrice: 199.90,
    image: '',
    category: 'presentes',
    badges: ['mais-vendido', 'oferta'],
    isHighlight: true,
    inStock: true,
    stockCount: 6,
  },
  {
    id: 'pr-002',
    sku: 'MP-PR-002',
    name: 'Vaso Personalizado com Planta',
    shortDescription: 'Vaso de cerâmica artesanal com nome gravado + planta à escolha',
    description:
      'Um presente único, literalmente com o nome dela. Vaso de cerâmica artesanal produzido à mão com nome ou frase especial gravada a laser, acompanhado de planta à sua escolha: suculenta, cacto, pothos ou peperômia. Um presente que ela vai ver todo dia e se lembrar de você com carinho. Informe o nome ou mensagem no campo de observações do pedido.',
    price: 99.90,
    image: '',
    category: 'presentes',
    badges: ['exclusivo', 'novidade'],
    isHighlight: false,
    inStock: true,
    stockCount: 11,
  },
  {
    id: 'pr-003',
    sku: 'MP-PR-003',
    name: 'Caixinha Surpresa Floral',
    shortDescription: 'Flores preservadas + doces artesanais + cartão com sua mensagem',
    description:
      'Uma caixinha cheia de amor e surpresas. Flores preservadas que duram mais de um ano sem água — lindas para sempre, assim como o seu carinho. Acompanha uma seleção de doces artesanais feitos com ingredientes naturais e cartão manuscrito com a sua mensagem. Uma experiência de unboxing inesquecível que ela vai querer mostrar para todo mundo.',
    price: 139.90,
    image: '',
    category: 'presentes',
    badges: ['poucas-unidades'],
    isHighlight: false,
    inStock: true,
    stockCount: 3,
  },
  {
    id: 'T01',
    sku: 'T01',
    name: 'Botão de rosa',
    shortDescription: 'Flores preservadas + doces artesanais + cartão com sua mensagem',
    description:
      'Uma caixinha cheia de amor e surpresas. Flores preservadas que duram mais de um ano sem água — lindas para sempre, assim como o seu carinho. Acompanha uma seleção de doces artesanais feitos com ingredientes naturais e cartão manuscrito com a sua mensagem. Uma experiência de unboxing inesquecível que ela vai querer mostrar para todo mundo.',
    price: 1.90,
    image: '',
    category: 'orquideas',
    badges: ['poucas-unidades'],
    isHighlight: false,
    inStock: true,
    stockCount: 3,
  }
]
