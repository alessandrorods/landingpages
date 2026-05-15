-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('aberto', 'aprovado', 'preparando_envio', 'faturado', 'pronto_envio', 'enviado', 'entregue', 'nao_entregue', 'cancelado');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('pix', 'cartao', 'link_mp');

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "olist_id" INTEGER,
    "olist_numero" VARCHAR(50),
    "status" "OrderStatus" NOT NULL DEFAULT 'aberto',
    "pagamento" "PaymentMethod" NOT NULL,
    "frete" DECIMAL(10,2) NOT NULL,
    "obs" TEXT,
    "comprador_nome" VARCHAR(255) NOT NULL,
    "comprador_tel" VARCHAR(50) NOT NULL,
    "destinatario_nome" VARCHAR(255) NOT NULL,
    "destinatario_tel" VARCHAR(50) NOT NULL,
    "mensagem_cartao" TEXT,
    "cep" VARCHAR(10) NOT NULL,
    "logradouro" VARCHAR(255) NOT NULL,
    "numero" VARCHAR(20) NOT NULL,
    "complemento" VARCHAR(100),
    "bairro" VARCHAR(100) NOT NULL,
    "data_entrega" DATE NOT NULL,
    "periodo" VARCHAR(50) NOT NULL,
    "motoboy_nome" VARCHAR(100),
    "saida_entrega" TIMESTAMPTZ,
    "entregue_em" TIMESTAMPTZ,
    "recebido_por" VARCHAR(100),
    "mp_preferencia_id" VARCHAR(100),
    "origem" VARCHAR(20) NOT NULL DEFAULT 'admin',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "sku" VARCHAR(100),
    "nome" VARCHAR(255) NOT NULL,
    "preco" DECIMAL(10,2) NOT NULL,
    "quantidade" INTEGER NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "orders_olist_id_key" ON "orders"("olist_id");

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
