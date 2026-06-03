# Fila de Despacho — Plano de Implementação

## Contexto

Motor de agrupamento e ordenação de pedidos prontos para envio (`status = ready`, `pickup = false`).
Calculado 100% em runtime — zero banco, zero persistência.
A fila é somente-leitura: nenhuma ação de status acontece por ela.

---

## Arquitetura

```
ConfigService.get('deliveryRegions')  ← tabela de configurações (banco)
OrderDTO[] (do banco)
    ↓
buildDispatchQueue(orders, regions)   ← src/domains/orders/dispatch-queue.ts
    ↓
QueueGroup[]                          → client component em src/app/admin/fila/page.tsx
                                         com polling a cada 30s
```

---

## Pré-requisito: evoluir `PeriodoEntrega`

`pedido.types.ts` recebe dois novos campos:

- `sortOrder: number` — define a ordem dos períodos na fila (manhã antes de tarde, etc.)
- `deliveryLimitHour: string` — `HH:MM`, até que horas esse período entrega; exibido na UI e usado futuramente como deadline padrão do período quando o pedido não tiver deadline explícito

> `cutoffTime` será implementado junto com a migração dos períodos para o banco — controla até que horas o período fica disponível para compra no checkout.

---

## Arquivos a criar / alterar

```
src/
  constants/
    pedido.types.ts          alterar — adicionar sortOrder e deliveryLimitHour em PeriodoEntrega
    pedido.ts                alterar — preencher os novos campos em PERIODOS_ENTREGA

  domains/
    config/
      config.types.ts        alterar — adicionar ConfigKey deliveryRegions (sem CONFIG_DEFAULTS)

    orders/
      dispatch-queue.ts      criar   — função pura buildDispatchQueue(orders, regions): QueueGroup[]
      order.repository.ts    alterar — adicionar findReadyForDispatch()

  app/
    api/admin/orders/
      dispatch-queue/
        route.ts             criar   — GET autenticado, resolve regiões + pedidos, devolve ambos

    admin/fila/
      page.tsx               criar   — client component com polling
```

---

## Comportamento esperado

### Motor de fila (`buildDispatchQueue`)

Recebe `OrderDTO[]` e devolve grupos com a seguinte estrutura:

```
QueueGroup {
  key            — chave única do grupo
  date           — DD/MM/YYYY
  period         — id do período (ex: "manha")
  periodSortOrder — número para ordenação
  region         — slug da região (ex: "mogi-leste")
  orders         — pedidos do grupo, ordenados por createdAt ASC
}
```

Ordenação dos grupos: **data ASC → periodSortOrder ASC → região ASC**

### Regiões (tabela de configurações)

Nova `ConfigKey` em `config.types.ts`: `deliveryRegions`, com schema Zod validando `Array<{ prefix, region, label }>`.

Sem `CONFIG_DEFAULTS` para essa chave — se não houver regiões configuradas, retorna `[]` e a fila exibe tudo como "Região não identificada". O admin configura pela tela de settings.

Exemplo de estrutura:

| Prefixo CEP | Região        | Label         |
|-------------|---------------|---------------|
| 08730       | mogi-oeste    | Mogi Oeste    |
| 08710       | mogi-leste    | Mogi Leste    |
| 08780       | mogi-centro   | Mogi Centro   |
| 08760       | mogi-norte    | Mogi Norte    |

`buildDispatchQueue` recebe as regiões como parâmetro (função pura). A página ou o route handler resolve `ConfigService.get('deliveryRegions')` antes de chamar o motor.

### Página da fila

- **Client component** com polling a cada 30s no endpoint `/api/admin/orders/dispatch-queue`
- A cada resposta, recalcula `buildDispatchQueue(orders)` no cliente e re-renderiza
- Exibe grupos como seções: cabeçalho `{data} · {período} · {região}`, lista de cards de pedido abaixo
- Card mínimo: número do pedido, nome do destinatário, bairro/CEP
- Exibe contagem regressiva de atualização e botão para atualizar manualmente

---

## Extensão futura: `deliveryDeadline`

Quando o campo existir no pedido (deadline explícito por pedido, `HH:MM`), o sort interno dos grupos muda para: **deadline ASC NULLS LAST → createdAt ASC**. Nenhuma outra parte do sistema muda.

---

## Fora do escopo deste plano

- Definir qual pedido sai em qual coleta (decisão da expedição)
- Definir rota e ordem de visitas (decisão do motoboy)
- Implementar `deliveryDeadline` por pedido
- Implementar `cutoffTime` (disponibilidade do período para compra)
