@AGENTS.md

# Arquitetura e Princípios de Desenvolvimento

## Como pensar antes de escrever código

### Onde cada coisa vive

Antes de criar ou editar um arquivo, identifique a qual camada ele pertence:

- **Comunicação com sistemas externos** (APIs de terceiros, ERPs, gateways de pagamento) — pertencem à camada de clients. Um client é responsável apenas por fazer a requisição HTTP e retornar o dado bruto. Nenhuma regra de negócio.

- **Regras de negócio, fluxos e transformações de domínio** — pertencem à camada de domains, organizada por domínio (`admin`, `checkout`, `pedidos`, `pagamentos`). Cada domínio tem seus próprios services, repositories e types. Domínios podem orquestrar clients, mas nunca o contrário.

- **Infraestrutura transversal** (banco de dados, cache, analytics, tracking) — pertence à camada de core. É compartilhada entre domínios, mas não contém regras de negócio.

- **Rotas, páginas e componentes Next.js** — pertencem a `src/app`. Route handlers são finos: autenticam, delegam a um service, retornam HTTP. Não têm lógica de negócio própria.

### Single Responsibility Principle

Cada arquivo deve ter uma única razão para mudar. Se você está escrevendo lógica de negócio dentro de um route handler, mova para um service. Se um service está fazendo requisições HTTP diretamente, extraia para um client. Se um componente está transformando dados de domínio, mova a transformação para o domain.

### Service-Repository

A camada de domain usa o padrão service-repository:
- O **repository** abstrai o acesso a dados (banco via Prisma, cache). Nenhuma regra de negócio.
- O **service** contém a lógica de negócio e orquestra repositories e clients.
- Route handlers chamam services, nunca repositories ou clients diretamente.

### Clients não vazam para a UI

Tipos e abstrações dos clients externos (Olist, MercadoPago) não devem aparecer nos componentes React nem nos route handlers. O domain traduz esses tipos para tipos próprios da aplicação.

### Organização de componentes por feature

Componentes ficam co-locados com a feature a que pertencem dentro de `src/app`. Componentes verdadeiramente globais (usados em múltiplas features) ficam em `src/app/components`. Quando em dúvida, prefira co-locar — a abstração prematura para "globais" é um custo.

### Constantes de domínio vs. configurações de UI

Valores que impactam regras de negócio (SKUs válidos, períodos de entrega, campanhas) ficam em `src/constants` e são importados tanto pelos domains quanto pela UI. Não duplicar esses valores.

### Sem lógica em arquivos de configuração

`prisma.config.ts`, `next.config.ts` e similares são configuração pura — nunca importam lógica de negócio.

## Convenções de escrita

### Idioma do código

Todo código é escrito em inglês: nomes de variáveis, funções, classes, interfaces, tipos, enums, constantes, parâmetros, comentários inline e mensagens de log. Não misturar idiomas dentro de um mesmo arquivo de código.

Exemplos do que é inglês: `orderStatus`, `createPaymentService`, `fetchDeliveryPeriods`, `// skip analytics on admin routes`.

Arquivos `.md` e documentação de apoio são escritos em português.

### Exceções aceitáveis

Strings exibidas ao usuário final (labels, mensagens de erro no front-end, textos de UI) ficam em português, pois são conteúdo — não código.
