const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding procurement data...");

  // 1. Create Vendors
  const vendorsData = [
    { name: 'Fresh Foods Co.', category: 'Food & Beverage', contact_info: '+998901234567', rating: 4.8 },
    { name: 'CleanPro Supplies', category: 'Housekeeping', contact_info: '+998912345678', rating: 4.5 },
    { name: 'Tech Solutions LLC', category: 'Electronics', contact_info: 'tech@example.com', rating: 4.2 }
  ];

  for (const v of vendorsData) {
    await prisma.vendor.upsert({
      where: { id: 0 }, // fake where just to create if not exist logic
      update: {},
      create: v
    }).catch(async () => {
       await prisma.vendor.create({ data: v });
    });
  }

  // 2. Create Inventory Items
  const inventoryData = [
    { name: 'Towels (Large)', category: 'Linens', current_quantity: 50, min_level: 100, max_level: 500 },
    { name: 'Shampoo 50ml', category: 'Amenities', current_quantity: 120, min_level: 200, max_level: 1000 },
    { name: 'Coffee Beans', category: 'F&B', current_quantity: 15, min_level: 20, max_level: 100 },
    { name: 'Bed Sheets (Queen)', category: 'Linens', current_quantity: 210, min_level: 150, max_level: 400 },
    { name: 'Water Bottles (0.5L)', category: 'F&B', current_quantity: 500, min_level: 300, max_level: 1500 }
  ];

  for (const item of inventoryData) {
    const existing = await prisma.inventoryItem.findUnique({ where: { name: item.name } });
    if (!existing) {
      await prisma.inventoryItem.create({ data: item });
    }
  }

  // 3. Create a Purchase Order
  const vendor = await prisma.vendor.findFirst({ where: { name: 'Fresh Foods Co.' } });
  const creator = await prisma.user.findFirst(); // Just get any user

  if (vendor && creator) {
    const existingPO = await prisma.purchaseOrder.findUnique({ where: { po_number: 'PO-2026-001' } });
    if (!existingPO) {
      await prisma.purchaseOrder.create({
        data: {
          po_number: 'PO-2026-001',
          vendor_id: vendor.id,
          created_by_user_id: creator.id,
          status: 'Pending',
          items: {
            create: [
              { product_name: 'Coffee Beans', quantity: 50, unit: 'kg', unit_price: 15.00 },
              { product_name: 'Sugar', quantity: 100, unit: 'kg', unit_price: 1.50 }
            ]
          }
        }
      });
      console.log("Created Purchase Order PO-2026-001");
    }
  }

  console.log("Seeding complete!");
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
