-- Rename OrderStatus enum values to English
ALTER TYPE "OrderStatus" RENAME VALUE 'aberto' TO 'pending';
ALTER TYPE "OrderStatus" RENAME VALUE 'aprovado' TO 'approved';
ALTER TYPE "OrderStatus" RENAME VALUE 'preparando_envio' TO 'preparing';
ALTER TYPE "OrderStatus" RENAME VALUE 'faturado' TO 'invoiced';
ALTER TYPE "OrderStatus" RENAME VALUE 'pronto_envio' TO 'ready';
ALTER TYPE "OrderStatus" RENAME VALUE 'enviado' TO 'dispatched';
ALTER TYPE "OrderStatus" RENAME VALUE 'entregue' TO 'delivered';
ALTER TYPE "OrderStatus" RENAME VALUE 'nao_entregue' TO 'undelivered';
ALTER TYPE "OrderStatus" RENAME VALUE 'cancelado' TO 'cancelled';

-- Rename PaymentMethod enum values to English
ALTER TYPE "PaymentMethod" RENAME VALUE 'cartao' TO 'card';
ALTER TYPE "PaymentMethod" RENAME VALUE 'link_mp' TO 'mp_link';

-- Rename orders columns to English
ALTER TABLE "orders" RENAME COLUMN "pagamento" TO "payment";
ALTER TABLE "orders" RENAME COLUMN "frete" TO "freight";
ALTER TABLE "orders" RENAME COLUMN "obs" TO "notes";
ALTER TABLE "orders" RENAME COLUMN "comprador_nome" TO "buyer_name";
ALTER TABLE "orders" RENAME COLUMN "comprador_tel" TO "buyer_phone";
ALTER TABLE "orders" RENAME COLUMN "destinatario_nome" TO "recipient_name";
ALTER TABLE "orders" RENAME COLUMN "destinatario_tel" TO "recipient_phone";
ALTER TABLE "orders" RENAME COLUMN "mensagem_cartao" TO "card_message";
ALTER TABLE "orders" RENAME COLUMN "cep" TO "zip_code";
ALTER TABLE "orders" RENAME COLUMN "logradouro" TO "street";
ALTER TABLE "orders" RENAME COLUMN "numero" TO "street_number";
ALTER TABLE "orders" RENAME COLUMN "complemento" TO "complement";
ALTER TABLE "orders" RENAME COLUMN "bairro" TO "neighborhood";
ALTER TABLE "orders" RENAME COLUMN "data_entrega" TO "delivery_date";
ALTER TABLE "orders" RENAME COLUMN "periodo" TO "delivery_period";
ALTER TABLE "orders" RENAME COLUMN "motoboy_nome" TO "courier_name";
ALTER TABLE "orders" RENAME COLUMN "saida_entrega" TO "dispatched_at";
ALTER TABLE "orders" RENAME COLUMN "entregue_em" TO "delivered_at";
ALTER TABLE "orders" RENAME COLUMN "recebido_por" TO "received_by";
ALTER TABLE "orders" RENAME COLUMN "mp_preferencia_id" TO "mp_preference_id";
ALTER TABLE "orders" RENAME COLUMN "origem" TO "source";

-- Rename order_items columns to English
ALTER TABLE "order_items" RENAME COLUMN "nome" TO "name";
ALTER TABLE "order_items" RENAME COLUMN "preco" TO "price";
ALTER TABLE "order_items" RENAME COLUMN "quantidade" TO "quantity";
