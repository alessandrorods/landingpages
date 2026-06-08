# Períodos de Entrega no Banco — Plano de Implementação

## Contexto

`PERIODOS_ENTREGA` hoje vive em `src/constants/pedido.ts` como array estático — qualquer mudança exige deploy.
O objetivo é mover para a tabela `system_config` (já existente), seguindo o mesmo padrão de `deliveryRegions`.

Sem `CONFIG_DEFAULTS`: se não houver períodos configurados, a lista retorna vazia e o UI exibe estado vazio.

---

## O que muda no tipo `PeriodoEntrega`

Além dos campos existentes (`id`, `label`, `idOlist`), adicionar:

- `sortOrder: number` — ordem de exibição e ordenação da fila de despacho
- `deliveryLimitHour: string` — `HH:MM`, até que horas esse período entrega; usado pela fila de despacho
- `cutoffTime: string` — `HH:MM`, até que horas esse período fica disponível para compra; controla quais períodos aparecem no checkout conforme o horário atual

---

## Arquivos a alterar

```
src/
  constants/
    pedido.types.ts       alterar — adicionar sortOrder, deliveryLimitHour e cutoffTime em PeriodoEntrega
    pedido.ts             alterar — remover PERIODOS_ENTREGA; manter DATAS_ENTREGA e outras constantes

  domains/
    config/
      config.types.ts     alterar — nova ConfigKey deliveryPeriods, schema Zod Array<PeriodoEntrega>
    checkout/
      validate.ts         alterar — chama ConfigService diretamente em vez de importar constante

  clients/
    olist/
      client.ts           alterar — chama ConfigService diretamente em vez de importar constante

  app/
    api/
      periods/
        route.ts          criar — GET público (sem auth), devolve ConfigService.get('deliveryPeriods')

  components/
    checkout/
      DeliveryPicker.tsx  alterar — busca próprios períodos via hook usePeriodos
      StepResumo.tsx      alterar — busca próprios períodos via hook usePeriodos
    settings/
      PeriodosEditor.tsx  criar — gerencia o array de períodos; salva via PATCH /api/admin/config
```

---

## Hook `useDeliveryPeriods`

Criado em `src/hooks/useDeliveryPeriods.ts`.
Faz fetch em `/api/periods`, memoriza o resultado, expõe `{ periods, loading }`.
Consumido diretamente por `DeliveryPicker` e `StepResumo` — sem prop drilling.

---

## Impacto por consumidor

### Consumidores servidor (chamam ConfigService diretamente)

| Arquivo | O que muda |
|---|---|
| `domains/checkout/validate.ts` | substitui import da constante por `ConfigService.get('deliveryPeriods')` |
| `clients/olist/client.ts` | idem |

### Consumidores cliente (usam `usePeriodos`)

| Arquivo | O que muda |
|---|---|
| `components/checkout/DeliveryPicker.tsx` | substitui import da constante por `usePeriodos()` |
| `components/checkout/StepResumo.tsx` | idem |
| `app/admin/vendas/novo/page.tsx` | idem — componente inline substitui import da constante por `usePeriodos()` |

### Consumidores que só exibem o valor armazenado (sem lookup)

`OrderDrawer/OrderSections.tsx` e `OrderPrintContent.tsx` exibem `order.deliveryPeriod` diretamente — não importam a constante, não precisam mudar.

---

## Editor de períodos (`PeriodosEditor.tsx`)

Vive em `src/components/settings/PeriodosEditor.tsx`.
A tela de settings atual só gerencia campos numéricos via `ConfigField` genérico — não serve para array de objetos.

O editor gerencia seu próprio estado e requisições:

- Faz fetch dos períodos atuais no mount via `/api/admin/config`
- Lista os períodos com edição inline de todos os campos (`id`, `label`, `idOlist`, `sortOrder`, `deliveryLimitHour`, `cutoffTime`)
- Ações por item: editar e remover
- Ação global: adicionar novo período
- Salva o array inteiro via `PATCH /api/admin/config` com `key: 'deliveryPeriods'`

A `settings/page.tsx` apenas renderiza `<PeriodosEditor />` como seção separada.

---

## Seed inicial

Ao implementar, popular `system_config` com os períodos atuais de `pedido.ts` incluindo os novos campos.
Pode ser feito via script de seed ou manualmente pelo editor na tela de settings após o deploy.

---

## Fora do escopo deste plano

- Migração de `DATAS_ENTREGA` — segue ciclo de vida diferente (por campanha), não faz parte desta mudança
