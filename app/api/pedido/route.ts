import { PRODUCTS } from '@/constants/products'
import { CAMPANHA_ECOMMERCE, CAMPANHA_MARCADOR, FRETE_VALOR, FRETE_POR_CONTA, PERIODOS_ENTREGA } from '@/constants/pedido'

interface PedidoBody {
  sku: string
  endereco: {
    cep: string
    logradouro: string
    numero: string
    complemento?: string
    bairro: string
    dataEntrega: string
    periodoEntrega: string
  }
  destinatario: {
    paraOutraPessoa: boolean
    nome: string
    telefone: string
    mensagemCartao?: string
  }
  comprador: {
    nome: string
    telefone: string
  }
}

interface TinyResponse {
  retorno?: {
    status?: string
    erros?: Array<{ erro: string }>
    registros?: {
      registro?: { id: number; numero: string; status?: string }
    }
  }
}

export async function POST(request: Request) {
  const token = process.env.TINY_TOKEN
  if (!token) {
    return Response.json({ error: 'Token não configurado' }, { status: 500 })
  }

  let body: PedidoBody
  try {
    body = (await request.json()) as PedidoBody
  } catch {
    return Response.json({ error: 'Corpo inválido' }, { status: 400 })
  }

  const product = PRODUCTS.find((p) => p.sku === body.sku)
  if (!product) {
    return Response.json({ error: 'Produto não encontrado' }, { status: 400 })
  }

  const mensagem = body.destinatario.mensagemCartao?.trim() ?? ''
  const formaFrete = PERIODOS_ENTREGA.find(p => p.id === body.endereco.periodoEntrega)?.idOlist

  const pedido = {
    pedido: {
      situacao: 'aberto',
      data_prevista: body.endereco.dataEntrega,
      ecommerce: CAMPANHA_ECOMMERCE,
      marcadores: [{ marcador: { descricao: CAMPANHA_MARCADOR } }],
      valor_frete: FRETE_VALOR,
      frete_por_conta: FRETE_POR_CONTA,
      ...(formaFrete && { forma_frete: formaFrete }),
      ...(mensagem && { obs_internas: mensagem }),
      forma_envio: 'T',
      cliente: {
        nome: body.comprador.nome,
        fone: body.comprador.telefone,
      },
      endereco_entrega: {
        nome_destinatario: body.destinatario.paraOutraPessoa ? body.destinatario.nome : body.comprador.nome,
        fone: body.destinatario.paraOutraPessoa ? body.destinatario.telefone : body.comprador.telefone,
        endereco: body.endereco.logradouro,
        numero: body.endereco.numero,
        complemento: body.endereco.complemento ?? '',
        bairro: body.endereco.bairro,
        cep: body.endereco.cep.replace(/\D/g, ''),
        cidade: 'Mogi das Cruzes',
        uf: 'SP',
      },
      itens: [
        {
          item: {
            descricao: product.name,
            unidade: 'UN',
            quantidade: 1,
            valor_unitario: product.price,
          },
        },
      ],
    },
  }

  const formBody = new URLSearchParams({
    token,
    pedido: JSON.stringify(pedido),
    formato: 'JSON',
  })

  let tinyRes: Response
  try {
    tinyRes = await fetch('https://api.tiny.com.br/api2/pedido.incluir.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formBody.toString(),
    })
  } catch {
    return Response.json({ error: 'Falha ao conectar com Tiny ERP' }, { status: 502 })
  }

  if (!tinyRes.ok) {
    return Response.json({ error: 'Erro na resposta do Tiny ERP' }, { status: 502 })
  }

  const data = (await tinyRes.json()) as TinyResponse

  if (data.retorno?.status !== 'OK') {
    const erros = (data.retorno?.erros ?? []).map((e) => e.erro).join('; ')
    return Response.json(
      { error: 'Erro ao criar pedido no Tiny', detalhes: erros || 'Sem detalhes' },
      { status: 422 },
    )
  }

  const registro = data.retorno?.registros?.registro

  console.log("Pedido criado", JSON.stringify(data))
  return Response.json({ id: registro?.id, numero: registro?.numero })
}
