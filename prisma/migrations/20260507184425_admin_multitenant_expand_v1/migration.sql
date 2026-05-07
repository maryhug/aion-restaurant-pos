-- CreateEnum
CREATE TYPE "theme_mode" AS ENUM ('light', 'dark', 'system');

-- CreateEnum
CREATE TYPE "order_type" AS ENUM ('salon', 'reserva', 'domicilio', 'recoger');

-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('pending', 'paid', 'refunded', 'partial');

-- CreateEnum
CREATE TYPE "payment_method_v2" AS ENUM ('cash', 'card', 'transfer', 'wallet');

-- CreateEnum
CREATE TYPE "employee_status" AS ENUM ('active', 'inactive', 'suspended');

-- CreateEnum
CREATE TYPE "contract_type" AS ENUM ('fijo', 'indefinido', 'prestacion', 'temporal');

-- CreateEnum
CREATE TYPE "cash_shift_status" AS ENUM ('open', 'closed', 'cancelled');

-- CreateEnum
CREATE TYPE "cash_closure_status" AS ENUM ('cuadrado', 'sobrante', 'faltante');

-- CreateEnum
CREATE TYPE "cash_movement_type" AS ENUM ('opening', 'sale_cash', 'other_income', 'withdrawal', 'expense', 'adjustment', 'closing');

-- CreateEnum
CREATE TYPE "reservation_source" AS ENUM ('walk_in', 'web', 'phone', 'whatsapp', 'app');

-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "branch_id" UUID;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "assigned_employee_id" UUID,
ADD COLUMN     "branch_id" UUID,
ADD COLUMN     "cancelled_at" TIMESTAMPTZ(6),
ADD COLUMN     "cash_shift_id" UUID,
ADD COLUMN     "customer_name" TEXT,
ADD COLUMN     "customer_phone" TEXT,
ADD COLUMN     "delivered_at" TIMESTAMPTZ(6),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "order_type" "order_type",
ADD COLUMN     "paid_at" TIMESTAMPTZ(6),
ADD COLUMN     "payment_method_v2" "payment_method_v2",
ADD COLUMN     "payment_status" "payment_status" DEFAULT 'pending',
ADD COLUMN     "placed_by_user_id" UUID,
ADD COLUMN     "restaurant_id" UUID;

-- AlterTable
ALTER TABLE "reservations" ADD COLUMN     "branch_id" UUID,
ADD COLUMN     "customer_email" TEXT,
ADD COLUMN     "customer_name" TEXT,
ADD COLUMN     "customer_phone" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "restaurant_id" UUID,
ADD COLUMN     "source" "reservation_source";

-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "branch_id" UUID,
ADD COLUMN     "cash_shift_id" UUID,
ADD COLUMN     "payment_method_v2" "payment_method_v2",
ADD COLUMN     "payment_status" "payment_status" DEFAULT 'paid',
ADD COLUMN     "processed_by_employee_id" UUID;

-- AlterTable
ALTER TABLE "tables" ADD COLUMN     "branch_id" UUID,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "zone" TEXT;

-- CreateTable
CREATE TABLE "branches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "restaurant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "address" TEXT,
    "city" TEXT,
    "phone" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "restaurant_id" UUID NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'COP',
    "timezone" TEXT NOT NULL DEFAULT 'America/Bogota',
    "tax_rate" DECIMAL(5,2),
    "tip_suggested_pct" DECIMAL(5,2),
    "cancellation_policy" TEXT,
    "reservation_tolerance_min" INTEGER DEFAULT 15,
    "reservation_max_minutes" INTEGER DEFAULT 120,
    "default_order_type" TEXT,
    "enabled_payment_methods" JSONB,
    "shift_config" JSONB,
    "invoice_config" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "restaurant_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_branding" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "restaurant_id" UUID NOT NULL,
    "primary_color" TEXT NOT NULL DEFAULT '#581c22',
    "secondary_color" TEXT NOT NULL DEFAULT '#7b4b52',
    "accent_color" TEXT NOT NULL DEFAULT '#d97706',
    "background_color" TEXT NOT NULL DEFAULT '#ffe5e5',
    "logo_url" TEXT,
    "favicon_url" TEXT,
    "default_theme_mode" "theme_mode" NOT NULL DEFAULT 'light',
    "use_aion_defaults" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "restaurant_branding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_integrations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "restaurant_id" UUID NOT NULL,
    "payment_gateway" TEXT,
    "whatsapp_number" TEXT,
    "smtp_from" TEXT,
    "smtp_host" TEXT,
    "thermal_printer" JSONB,
    "api_keys" JSONB,
    "webhooks" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "restaurant_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_feature_flags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "restaurant_id" UUID NOT NULL,
    "enable_multi_branch" BOOLEAN NOT NULL DEFAULT false,
    "enable_cash_closure" BOOLEAN NOT NULL DEFAULT true,
    "enable_payroll" BOOLEAN NOT NULL DEFAULT true,
    "enable_admin_chatbot" BOOLEAN NOT NULL DEFAULT false,
    "flags" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "restaurant_feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "restaurant_id" UUID NOT NULL,
    "branch_id" UUID,
    "user_id" UUID,
    "full_name" TEXT NOT NULL,
    "document_number" TEXT,
    "role_title" TEXT NOT NULL,
    "contract_type" "contract_type",
    "salary" DECIMAL(12,2),
    "status" "employee_status" NOT NULL DEFAULT 'active',
    "hired_at" DATE,
    "ended_at" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "restaurant_id" UUID NOT NULL,
    "branch_id" UUID,
    "employee_id" UUID NOT NULL,
    "period_start" DATE,
    "period_end" DATE,
    "gross_amount" DECIMAL(12,2) NOT NULL,
    "deductions_amount" DECIMAL(12,2),
    "net_amount" DECIMAL(12,2) NOT NULL,
    "payment_date" DATE,
    "payment_method" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_registers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "restaurant_id" UUID NOT NULL,
    "branch_id" UUID,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_registers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_shifts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "restaurant_id" UUID NOT NULL,
    "branch_id" UUID,
    "cash_register_id" UUID NOT NULL,
    "opened_by_employee_id" UUID,
    "closed_by_employee_id" UUID,
    "opened_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMPTZ(6),
    "opening_balance" DECIMAL(12,2) NOT NULL,
    "expected_cash" DECIMAL(12,2),
    "counted_cash" DECIMAL(12,2),
    "difference" DECIMAL(12,2),
    "status" "cash_shift_status" NOT NULL DEFAULT 'open',
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_movements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "restaurant_id" UUID NOT NULL,
    "branch_id" UUID,
    "cash_shift_id" UUID NOT NULL,
    "cash_register_id" UUID NOT NULL,
    "created_by_employee_id" UUID,
    "movement_type" "cash_movement_type" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "category" TEXT,
    "reference_type" TEXT,
    "reference_id" UUID,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_closures" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "restaurant_id" UUID NOT NULL,
    "branch_id" UUID,
    "cash_shift_id" UUID NOT NULL,
    "closed_by_employee_id" UUID,
    "total_sales_cash" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_sales_card" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_sales_transfer" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_other_income" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_withdrawals" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_cash_expenses" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "expected_cash" DECIMAL(12,2) NOT NULL,
    "counted_cash" DECIMAL(12,2) NOT NULL,
    "difference" DECIMAL(12,2) NOT NULL,
    "status" "cash_closure_status" NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_closures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "restaurant_id" UUID NOT NULL,
    "branch_id" UUID,
    "actor_user_id" UUID,
    "actor_employee_id" UUID,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" UUID,
    "metadata" JSONB,
    "ip" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "branches_restaurant_id_is_active_idx" ON "branches"("restaurant_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "branches_restaurant_id_name_key" ON "branches"("restaurant_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_settings_restaurant_id_key" ON "restaurant_settings"("restaurant_id");

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_branding_restaurant_id_key" ON "restaurant_branding"("restaurant_id");

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_integrations_restaurant_id_key" ON "restaurant_integrations"("restaurant_id");

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_feature_flags_restaurant_id_key" ON "restaurant_feature_flags"("restaurant_id");

-- CreateIndex
CREATE UNIQUE INDEX "employees_user_id_key" ON "employees"("user_id");

-- CreateIndex
CREATE INDEX "employees_restaurant_id_status_idx" ON "employees"("restaurant_id", "status");

-- CreateIndex
CREATE INDEX "employees_branch_id_status_idx" ON "employees"("branch_id", "status");

-- CreateIndex
CREATE INDEX "employee_payments_restaurant_id_payment_date_idx" ON "employee_payments"("restaurant_id", "payment_date");

-- CreateIndex
CREATE INDEX "employee_payments_employee_id_payment_date_idx" ON "employee_payments"("employee_id", "payment_date");

-- CreateIndex
CREATE INDEX "cash_registers_restaurant_id_is_active_idx" ON "cash_registers"("restaurant_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "cash_registers_restaurant_id_name_key" ON "cash_registers"("restaurant_id", "name");

-- CreateIndex
CREATE INDEX "cash_shifts_restaurant_id_opened_at_idx" ON "cash_shifts"("restaurant_id", "opened_at");

-- CreateIndex
CREATE INDEX "cash_shifts_restaurant_id_status_opened_at_idx" ON "cash_shifts"("restaurant_id", "status", "opened_at");

-- CreateIndex
CREATE INDEX "cash_shifts_cash_register_id_status_idx" ON "cash_shifts"("cash_register_id", "status");

-- CreateIndex
CREATE INDEX "cash_movements_restaurant_id_created_at_idx" ON "cash_movements"("restaurant_id", "created_at");

-- CreateIndex
CREATE INDEX "cash_movements_cash_shift_id_created_at_idx" ON "cash_movements"("cash_shift_id", "created_at");

-- CreateIndex
CREATE INDEX "cash_movements_movement_type_created_at_idx" ON "cash_movements"("movement_type", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "cash_closures_cash_shift_id_key" ON "cash_closures"("cash_shift_id");

-- CreateIndex
CREATE INDEX "cash_closures_restaurant_id_created_at_idx" ON "cash_closures"("restaurant_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_restaurant_id_created_at_idx" ON "audit_logs"("restaurant_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entity_id_idx" ON "audit_logs"("entity", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_created_at_idx" ON "audit_logs"("action", "created_at");

-- CreateIndex
CREATE INDEX "expenses_restaurant_id_date_idx" ON "expenses"("restaurant_id", "date");

-- CreateIndex
CREATE INDEX "expenses_branch_id_date_idx" ON "expenses"("branch_id", "date");

-- CreateIndex
CREATE INDEX "menu_items_restaurant_id_available_category_idx" ON "menu_items"("restaurant_id", "available", "category");

-- CreateIndex
CREATE INDEX "orders_restaurant_id_status_created_at_idx" ON "orders"("restaurant_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "orders_branch_id_status_created_at_idx" ON "orders"("branch_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "orders_cash_shift_id_idx" ON "orders"("cash_shift_id");

-- CreateIndex
CREATE INDEX "reservations_restaurant_id_date_status_idx" ON "reservations"("restaurant_id", "date", "status");

-- CreateIndex
CREATE INDEX "reservations_branch_id_date_time_idx" ON "reservations"("branch_id", "date", "time");

-- CreateIndex
CREATE INDEX "sales_restaurant_id_created_at_idx" ON "sales"("restaurant_id", "created_at");

-- CreateIndex
CREATE INDEX "sales_branch_id_created_at_idx" ON "sales"("branch_id", "created_at");

-- CreateIndex
CREATE INDEX "sales_payment_method_v2_created_at_idx" ON "sales"("payment_method_v2", "created_at");

-- CreateIndex
CREATE INDEX "sales_cash_shift_id_created_at_idx" ON "sales"("cash_shift_id", "created_at");

-- CreateIndex
CREATE INDEX "tables_restaurant_id_status_idx" ON "tables"("restaurant_id", "status");

-- CreateIndex
CREATE INDEX "tables_branch_id_status_idx" ON "tables"("branch_id", "status");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_cash_shift_id_fkey" FOREIGN KEY ("cash_shift_id") REFERENCES "cash_shifts"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_assigned_employee_id_fkey" FOREIGN KEY ("assigned_employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_placed_by_user_id_fkey" FOREIGN KEY ("placed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_cash_shift_id_fkey" FOREIGN KEY ("cash_shift_id") REFERENCES "cash_shifts"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_processed_by_employee_id_fkey" FOREIGN KEY ("processed_by_employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tables" ADD CONSTRAINT "tables_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "restaurant_settings" ADD CONSTRAINT "restaurant_settings_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "restaurant_branding" ADD CONSTRAINT "restaurant_branding_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "restaurant_integrations" ADD CONSTRAINT "restaurant_integrations_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "restaurant_feature_flags" ADD CONSTRAINT "restaurant_feature_flags_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "employee_payments" ADD CONSTRAINT "employee_payments_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "employee_payments" ADD CONSTRAINT "employee_payments_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "employee_payments" ADD CONSTRAINT "employee_payments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cash_registers" ADD CONSTRAINT "cash_registers_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cash_registers" ADD CONSTRAINT "cash_registers_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cash_shifts" ADD CONSTRAINT "cash_shifts_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cash_shifts" ADD CONSTRAINT "cash_shifts_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cash_shifts" ADD CONSTRAINT "cash_shifts_cash_register_id_fkey" FOREIGN KEY ("cash_register_id") REFERENCES "cash_registers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cash_shifts" ADD CONSTRAINT "cash_shifts_opened_by_employee_id_fkey" FOREIGN KEY ("opened_by_employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cash_shifts" ADD CONSTRAINT "cash_shifts_closed_by_employee_id_fkey" FOREIGN KEY ("closed_by_employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cash_movements" ADD CONSTRAINT "cash_movements_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cash_movements" ADD CONSTRAINT "cash_movements_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cash_movements" ADD CONSTRAINT "cash_movements_cash_shift_id_fkey" FOREIGN KEY ("cash_shift_id") REFERENCES "cash_shifts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cash_movements" ADD CONSTRAINT "cash_movements_cash_register_id_fkey" FOREIGN KEY ("cash_register_id") REFERENCES "cash_registers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cash_movements" ADD CONSTRAINT "cash_movements_created_by_employee_id_fkey" FOREIGN KEY ("created_by_employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cash_closures" ADD CONSTRAINT "cash_closures_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cash_closures" ADD CONSTRAINT "cash_closures_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cash_closures" ADD CONSTRAINT "cash_closures_cash_shift_id_fkey" FOREIGN KEY ("cash_shift_id") REFERENCES "cash_shifts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cash_closures" ADD CONSTRAINT "cash_closures_closed_by_employee_id_fkey" FOREIGN KEY ("closed_by_employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_employee_id_fkey" FOREIGN KEY ("actor_employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
