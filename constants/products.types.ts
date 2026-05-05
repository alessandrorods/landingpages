export type ProductBadge =
  | 'mais-vendido'
  | 'poucas-unidades'
  | 'exclusivo'
  | 'novidade'
  | 'oferta'

export type ProductCategory = 'flores' | 'girassois' | 'cafe-da-manha' | 'chocolates' | 'presentes' | 'orquideas' 

export interface Product {
  id: string
  sku: string
  name: string
  shortDescription: string
  /** Descrição completa exibida no modal de detalhes */
  description?: string
  price: number
  originalPrice?: number
  /**
   * Imagem principal. Deixe como string vazia para exibir o placeholder da categoria.
   */
  image: string
  /** Imagens adicionais exibidas na galeria do modal */
  images?: string[]
  category: ProductCategory
  badges: ProductBadge[]
  /** Marca o produto como destaque da categoria — exibido em card maior */
  isHighlight: boolean
  inStock: boolean
  /** Exibe contagem de estoque quando baixo — reforça urgência */
  stockCount?: number
}
