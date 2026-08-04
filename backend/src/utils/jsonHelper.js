/**
 * JSON Field Helper — SQLite uchun JSON serializatsiya/deserializatsiya
 * 
 * SQLite Json turini qo'llab-quvvatlamaydi, shuning uchun schema'da String ishlatiladi.
 * Bu utility controller'larda toza obyekt bilan ishlash imkonini beradi.
 * 
 * Production'da PostgreSQL'ga o'tganingizda:
 * 1. schema.prisma'da String → Json ga o'zgartiring
 * 2. Bu faylni o'chirib, import'larni olib tashlang
 * 3. Hammasi shu — Prisma Json'ni o'zi seriyalashtiradi
 */

// Obyektni saqlash uchun stringify (agar kerak bo'lsa)
const toJson = (obj) => {
  if (obj === null || obj === undefined) return null;
  if (typeof obj === 'string') return obj; // Allaqachon string
  return JSON.stringify(obj);
};

// Bazadan o'qiganda parse (agar kerak bo'lsa)
const fromJson = (str) => {
  if (str === null || str === undefined) return null;
  if (typeof str === 'object') return str; // Allaqachon obyekt (PostgreSQL Json)
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
};

module.exports = { toJson, fromJson };
