import "dotenv/config";
import prisma from "../src/lib/prisma";

async function run() {
  console.log("Iniciando backfill multitenant admin...");

  await prisma.$transaction(async (tx: any) => {   // ← cambia (tx) por (tx: any)
    // 1) Crear sede principal por restaurante si no existe.
    await tx.$executeRawUnsafe(`
      INSERT INTO branches (id, restaurant_id, name, code, is_active, created_at)
      SELECT gen_random_uuid(), r.id, 'Sede Principal', 'MAIN', true, now()
      FROM restaurants r
      WHERE NOT EXISTS (
        SELECT 1 FROM branches b WHERE b.restaurant_id = r.id
      );
    `);

    // 2) Backfill de restaurant_id en reservations.
    await tx.$executeRawUnsafe(`
      UPDATE reservations r
      SET restaurant_id = t.restaurant_id
      FROM tables t
      WHERE r.table_id = t.id
        AND r.restaurant_id IS NULL;
    `);

    // 3) Backfill de restaurant_id en orders desde table.
    await tx.$executeRawUnsafe(`
      UPDATE orders o
      SET restaurant_id = t.restaurant_id
      FROM tables t
      WHERE o.table_id = t.id
        AND o.restaurant_id IS NULL;
    `);

    // 4) Backfill de restaurant_id en orders desde reservation.
    await tx.$executeRawUnsafe(`
      UPDATE orders o
      SET restaurant_id = r.restaurant_id
      FROM reservations r
      WHERE o.reservation_id = r.id
        AND o.restaurant_id IS NULL
        AND r.restaurant_id IS NOT NULL;
    `);

    // 5) Backfill branch_id en tables.
    await tx.$executeRawUnsafe(`
      UPDATE tables t
      SET branch_id = b.id
      FROM branches b
      WHERE b.restaurant_id = t.restaurant_id
        AND t.branch_id IS NULL
        AND b.code = 'MAIN';
    `);

    // 6) Backfill branch_id en reservations.
    await tx.$executeRawUnsafe(`
      UPDATE reservations r
      SET branch_id = t.branch_id
      FROM tables t
      WHERE r.table_id = t.id
        AND r.branch_id IS NULL
        AND t.branch_id IS NOT NULL;
    `);
    await tx.$executeRawUnsafe(`
      UPDATE reservations r
      SET branch_id = b.id
      FROM branches b
      WHERE r.restaurant_id = b.restaurant_id
        AND r.branch_id IS NULL
        AND b.code = 'MAIN';
    `);

    // 7) Backfill branch_id en orders.
    await tx.$executeRawUnsafe(`
      UPDATE orders o
      SET branch_id = t.branch_id
      FROM tables t
      WHERE o.table_id = t.id
        AND o.branch_id IS NULL
        AND t.branch_id IS NOT NULL;
    `);
    await tx.$executeRawUnsafe(`
      UPDATE orders o
      SET branch_id = b.id
      FROM branches b
      WHERE o.restaurant_id = b.restaurant_id
        AND o.branch_id IS NULL
        AND b.code = 'MAIN';
    `);

    // 8) Backfill restaurant_id y branch_id en sales.
    await tx.$executeRawUnsafe(`
      UPDATE sales s
      SET restaurant_id = o.restaurant_id
      FROM orders o
      WHERE s.order_id = o.id
        AND s.restaurant_id IS NULL
        AND o.restaurant_id IS NOT NULL;
    `);
    await tx.$executeRawUnsafe(`
      UPDATE sales s
      SET restaurant_id = t.restaurant_id
      FROM tables t
      WHERE s.table_id = t.id
        AND s.restaurant_id IS NULL;
    `);
    await tx.$executeRawUnsafe(`
      UPDATE sales s
      SET branch_id = o.branch_id
      FROM orders o
      WHERE s.order_id = o.id
        AND s.branch_id IS NULL
        AND o.branch_id IS NOT NULL;
    `);
    await tx.$executeRawUnsafe(`
      UPDATE sales s
      SET branch_id = b.id
      FROM branches b
      WHERE s.restaurant_id = b.restaurant_id
        AND s.branch_id IS NULL
        AND b.code = 'MAIN';
    `);

    // 9) Backfill branch_id en expenses.
    await tx.$executeRawUnsafe(`
      UPDATE expenses e
      SET branch_id = b.id
      FROM branches b
      WHERE e.restaurant_id = b.restaurant_id
        AND e.branch_id IS NULL
        AND b.code = 'MAIN';
    `);

    // 10) Bootstrap de configuración por tenant.
    await tx.$executeRawUnsafe(`
      INSERT INTO restaurant_settings (
        id, restaurant_id, currency, timezone, reservation_tolerance_min, reservation_max_minutes, created_at, updated_at
      )
      SELECT gen_random_uuid(), r.id, 'COP', 'America/Bogota', 15, 120, now(), now()
      FROM restaurants r
      ON CONFLICT (restaurant_id) DO NOTHING;
    `);
    await tx.$executeRawUnsafe(`
      INSERT INTO restaurant_branding (
        id, restaurant_id, primary_color, secondary_color, accent_color, background_color, default_theme_mode, use_aion_defaults, created_at, updated_at
      )
      SELECT gen_random_uuid(), r.id, '#581c22', '#7b4b52', '#d97706', '#ffe5e5', 'light', true, now(), now()
      FROM restaurants r
      ON CONFLICT (restaurant_id) DO NOTHING;
    `);
    await tx.$executeRawUnsafe(`
      INSERT INTO restaurant_integrations (
        id, restaurant_id, created_at, updated_at
      )
      SELECT gen_random_uuid(), r.id, now(), now()
      FROM restaurants r
      ON CONFLICT (restaurant_id) DO NOTHING;
    `);
    await tx.$executeRawUnsafe(`
      INSERT INTO restaurant_feature_flags (
        id, restaurant_id, enable_multi_branch, enable_cash_closure, enable_payroll, enable_admin_chatbot, created_at, updated_at
      )
      SELECT gen_random_uuid(), r.id, false, true, true, false, now(), now()
      FROM restaurants r
      ON CONFLICT (restaurant_id) DO NOTHING;
    `);
  });

  console.log("Backfill completado.");
}

run()
  .catch((error) => {
    console.error("Backfill falló:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
