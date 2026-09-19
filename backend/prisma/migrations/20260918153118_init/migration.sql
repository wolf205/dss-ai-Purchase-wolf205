-- CreateTable
CREATE TABLE "categories" (
    "id" BIGSERIAL NOT NULL,
    "category_code" VARCHAR(50) NOT NULL,
    "category_name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" BIGSERIAL NOT NULL,
    "sku_code" VARCHAR(50) NOT NULL,
    "product_name" VARCHAR(255) NOT NULL,
    "barcode" VARCHAR(50),
    "unit" VARCHAR(30) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'Active',
    "current_inventory" INTEGER NOT NULL DEFAULT 0,
    "on_order_quantity" INTEGER NOT NULL DEFAULT 0,
    "category_id" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" BIGSERIAL NOT NULL,
    "supplier_code" VARCHAR(50) NOT NULL,
    "supplier_name" VARCHAR(255) NOT NULL,
    "contact_person" VARCHAR(100),
    "phone_number" VARCHAR(50),
    "email" VARCHAR(100),
    "address" TEXT,
    "committed_lead_time_days" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'Active',
    "performance_score" DECIMAL(5,4) NOT NULL DEFAULT 0.8000,
    "all_time_performance_score" DECIMAL(5,4) NOT NULL DEFAULT 0.8000,
    "completed_order_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supply_conditions" (
    "id" BIGSERIAL NOT NULL,
    "product_id" BIGINT NOT NULL,
    "supplier_id" BIGINT NOT NULL,
    "purchase_price" DECIMAL(15,2) NOT NULL,
    "moq" INTEGER NOT NULL DEFAULT 1,
    "status" VARCHAR(20) NOT NULL DEFAULT 'Active',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supply_conditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_records" (
    "id" BIGSERIAL NOT NULL,
    "product_id" BIGINT NOT NULL,
    "sale_date" DATE NOT NULL,
    "quantity_sold" INTEGER NOT NULL,
    "revenue" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_snapshots" (
    "id" BIGSERIAL NOT NULL,
    "product_id" BIGINT NOT NULL,
    "snapshot_date" DATE NOT NULL,
    "counted_quantity" INTEGER NOT NULL,
    "counted_by" VARCHAR(100),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dss_configurations" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "price_weight" DECIMAL(5,4) NOT NULL DEFAULT 0.4000,
    "lead_time_weight" DECIMAL(5,4) NOT NULL DEFAULT 0.2000,
    "moq_weight" DECIMAL(5,4) NOT NULL DEFAULT 0.1500,
    "history_weight" DECIMAL(5,4) NOT NULL DEFAULT 0.2500,
    "target_service_level" DECIMAL(5,4) NOT NULL DEFAULT 0.9500,
    "z_factor" DECIMAL(4,2) NOT NULL DEFAULT 1.65,
    "review_period_days" INTEGER NOT NULL DEFAULT 7,
    "updated_by" VARCHAR(100) NOT NULL DEFAULT 'Store Manager',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dss_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendation_sessions" (
    "id" BIGSERIAL NOT NULL,
    "session_code" VARCHAR(50) NOT NULL,
    "category_id" BIGINT,
    "scope" VARCHAR(100) NOT NULL DEFAULT 'All Categories',
    "status" VARCHAR(20) NOT NULL DEFAULT 'Draft',
    "total_suggested_amount" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "total_approved_amount" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "created_by" VARCHAR(100) NOT NULL,
    "approved_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommendation_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendation_items" (
    "id" BIGSERIAL NOT NULL,
    "session_id" BIGINT NOT NULL,
    "product_id" BIGINT NOT NULL,
    "forecasted_demand" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "daily_forecasts" JSONB,
    "snapshot_current_inventory" INTEGER NOT NULL DEFAULT 0,
    "snapshot_on_order_quantity" INTEGER NOT NULL DEFAULT 0,
    "safety_stock" INTEGER NOT NULL DEFAULT 0,
    "reorder_point" INTEGER NOT NULL DEFAULT 0,
    "abc_xyz_group" VARCHAR(2) NOT NULL,
    "stock_risk_status" VARCHAR(30) NOT NULL,
    "suggested_quantity" INTEGER NOT NULL DEFAULT 0,
    "suggested_supplier_wsm_score" DECIMAL(5,4),
    "suggested_supplier_id" BIGINT,
    "supplier_rankings" JSONB,
    "approved_quantity" INTEGER NOT NULL DEFAULT 0,
    "approved_supplier_id" BIGINT,
    "is_overridden" BOOLEAN NOT NULL DEFAULT false,
    "why_buy_explanation" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommendation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" BIGSERIAL NOT NULL,
    "po_number" VARCHAR(50) NOT NULL,
    "supplier_id" BIGINT NOT NULL,
    "session_id" BIGINT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'Approved',
    "approval_date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "historical_lead_time_days" INTEGER NOT NULL,
    "expected_delivery_date" DATE NOT NULL,
    "total_amount" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "cancellation_reason" VARCHAR(255),
    "cancelled_at" TIMESTAMPTZ,
    "last_exported_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "po_line_items" (
    "id" BIGSERIAL NOT NULL,
    "po_id" BIGINT NOT NULL,
    "product_id" BIGINT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "historical_unit_price" DECIMAL(15,2) NOT NULL,
    "historical_moq" INTEGER NOT NULL DEFAULT 1,
    "line_total" DECIMAL(15,2),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "po_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goods_receipts" (
    "id" BIGSERIAL NOT NULL,
    "receipt_number" VARCHAR(50) NOT NULL,
    "po_id" BIGINT NOT NULL,
    "actual_delivery_date" DATE NOT NULL,
    "days_late" INTEGER NOT NULL,
    "on_time_factor" DECIMAL(5,4) NOT NULL,
    "overall_fulfillment_rate" DECIMAL(5,4) NOT NULL,
    "order_performance_score" DECIMAL(5,4) NOT NULL,
    "notes" TEXT,
    "received_by" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goods_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipt_line_items" (
    "id" BIGSERIAL NOT NULL,
    "receipt_id" BIGINT NOT NULL,
    "po_line_item_id" BIGINT NOT NULL,
    "product_id" BIGINT NOT NULL,
    "ordered_quantity" INTEGER NOT NULL,
    "received_quantity" INTEGER NOT NULL,
    "historical_unit_price" DECIMAL(15,2) NOT NULL,
    "line_received_total" DECIMAL(15,2),
    "item_fulfillment_rate" DECIMAL(5,4),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receipt_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'Active',
    "last_login_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "client_ip" VARCHAR(50),
    "user_agent" TEXT,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "revoked_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT,
    "username" VARCHAR(50) NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_category_code_key" ON "categories"("category_code");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_code_key" ON "products"("sku_code");

-- CreateIndex
CREATE UNIQUE INDEX "products_barcode_key" ON "products"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_supplier_code_key" ON "suppliers"("supplier_code");

-- CreateIndex
CREATE UNIQUE INDEX "supply_conditions_product_id_supplier_id_key" ON "supply_conditions"("product_id", "supplier_id");

-- CreateIndex
CREATE UNIQUE INDEX "sales_records_product_id_sale_date_key" ON "sales_records"("product_id", "sale_date");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_snapshots_product_id_snapshot_date_key" ON "inventory_snapshots"("product_id", "snapshot_date");

-- CreateIndex
CREATE UNIQUE INDEX "recommendation_sessions_session_code_key" ON "recommendation_sessions"("session_code");

-- CreateIndex
CREATE UNIQUE INDEX "recommendation_items_session_id_product_id_key" ON "recommendation_items"("session_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_po_number_key" ON "purchase_orders"("po_number");

-- CreateIndex
CREATE UNIQUE INDEX "po_line_items_po_id_product_id_key" ON "po_line_items"("po_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "goods_receipts_receipt_number_key" ON "goods_receipts"("receipt_number");

-- CreateIndex
CREATE UNIQUE INDEX "goods_receipts_po_id_key" ON "goods_receipts"("po_id");

-- CreateIndex
CREATE UNIQUE INDEX "receipt_line_items_po_line_item_id_key" ON "receipt_line_items"("po_line_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supply_conditions" ADD CONSTRAINT "supply_conditions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supply_conditions" ADD CONSTRAINT "supply_conditions_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_records" ADD CONSTRAINT "sales_records_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_snapshots" ADD CONSTRAINT "inventory_snapshots_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_sessions" ADD CONSTRAINT "recommendation_sessions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_items" ADD CONSTRAINT "recommendation_items_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "recommendation_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_items" ADD CONSTRAINT "recommendation_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_items" ADD CONSTRAINT "recommendation_items_suggested_supplier_id_fkey" FOREIGN KEY ("suggested_supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_items" ADD CONSTRAINT "recommendation_items_approved_supplier_id_fkey" FOREIGN KEY ("approved_supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "recommendation_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "po_line_items" ADD CONSTRAINT "po_line_items_po_id_fkey" FOREIGN KEY ("po_id") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "po_line_items" ADD CONSTRAINT "po_line_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_po_id_fkey" FOREIGN KEY ("po_id") REFERENCES "purchase_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipt_line_items" ADD CONSTRAINT "receipt_line_items_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "goods_receipts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipt_line_items" ADD CONSTRAINT "receipt_line_items_po_line_item_id_fkey" FOREIGN KEY ("po_line_item_id") REFERENCES "po_line_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipt_line_items" ADD CONSTRAINT "receipt_line_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

