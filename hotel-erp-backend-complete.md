# 🏗️ HOTEL ERP — BACKEND TO'LIQ TEXNIK SPESIFIKATSIYASI

**Maqsad**: `hotel-erp-panel-functions-explained.md` hujjatida tasvirlangan barcha 7 panel (Reception, Housekeeping, Bellboy, Manager, Procurement, Admin, Guest) va ularning har bir tugmasi ishlashi uchun zarur bo'lgan ma'lumotlar bazasi modellari, API endpointlari, real-time hodisalar va biznes-qoidalarni bir joyda beradi. Ikkala hujjat BIRGALIKDA o'qilishi kerak: panel-hujjati "nima ko'rinishi va NEGA kerakligini", bu hujjat "qanday saqlanishi va QANDAY ishlashini" belgilaydi.

**Qaror qilingan texnologik stack** (ochiq savollar hal qilindi):
- Backend: Node.js + Express.js, PostgreSQL + Prisma ORM, JWT (staff va guest uchun ALOHIDA middleware), Socket.io
- Frontend: React + Vite + **Tailwind CSS** (Vanilla CSS emas — 7 panelli ERP uchun izchillik va tezlik muhimroq), **Zustand** (Redux Toolkit emas — loyiha hajmi uchun yetarli)
- Eski loyiha (`D:\Loyihalar\Hotel`) bilan munosabat: 8-bo'limga qarang — Antigravity avval o'sha loyihani ko'rib chiqib, qayta ishlatish mumkin bo'lgan qismlarni aniqlashi kerak.

---

## 1. UMUMIY ARXITEKTURA VA XAVFSIZLIK TALABLARI (invariant qoidalar)

Bu qoidalar HAR BIR API endpoint yozilganda majburiy ravishda amal qilishi kerak:

1. **Ikki alohida autentifikatsiya tizimi**: `staffAuthMiddleware` (User + Role uchun) va `guestAuthMiddleware` (Guest uchun) — bir-biridan mustaqil, bir xil JWT secret yoki bir xil middleware ishlatilmaydi. Staff token qisqa muddatli (masalan 8 soat) + refresh token; Guest token uzunroq (masalan 7 kun) + ixtiyoriy 2FA.
2. **Maxfiy kalitlar faqat muhit o'zgaruvchisidan**: `JWT_SECRET`, `CLICK_SECRET_KEY`, `PAYME_SECRET_KEY` va h.k. kodda hech qanday standart (fallback) qiymatga ega bo'lmaydi. Agar muhit o'zgaruvchisi sozlanmagan bo'lsa, server ishga tushishda xato berib to'xtaydi (ishga tushib, xavfsiz bo'lmagan holatda ishlashda davom etmaydi).
3. **To'lov summasi hech qachon client so'rovidan ishonib olinmaydi** — server har doim `Booking.total_price` (bazadagi haqiqiy qiymat) asosida to'lov so'rovi yaratadi.
4. **Webhook imzosi tekshiruvi hech qachon chetlab o'tilmaydi** — agar gateway kaliti sozlanmagan bo'lsa, webhook so'rovi 500/401 bilan rad etiladi, "tekshirilmagan holda muvaffaqiyatli" deb qabul qilinmaydi.
5. **O'chirish emas, status o'zgartirish**: Booking, Payment, AuditLog kabi moliyaviy/audit ahamiyatga ega yozuvlar HECH QACHON `DELETE` bilan bazadan olib tashlanmaydi — faqat status maydoni o'zgaradi (masalan `status = 'Cancelled'`). `AuditLog` esa umuman UPDATE/DELETE qilinmaydi (append-only).
6. **RBAC har bir route'da middleware darajasida tekshiriladi**, faqat frontendda tugmani yashirish yetarli emas — masalan Housekeeping xodimining tokeni bilan `/api/reception/payments`ga so'rov yuborilsa, backend 403 qaytarishi shart.
7. **Socket.io autentifikatsiyasi**: har bir socket ulanishi JWT orqali tasdiqlanadi va foydalanuvchi roli/guest ID'siga qarab faqat tegishli "room"larga (Socket.io room, ma'lumotlar bazasi bilan bog'liq emas) obuna bo'ladi — masalan bitta Guest faqat o'z bron yangilanishlarini oladi, Reception xodimlari umumiy "staff-updates" kanaliga obuna bo'ladi.
8. **`.env` versiyaga tushmaydi**: `.gitignore`da `.env`, `node_modules`, DB fayllari ko'rsatiladi; `.env.example` haqiqiy qiymatlarsiz namuna sifatida qo'shiladi.
9. **Bron identifikatori**: har bir Booking yaratilganda yagona, o'zgarmas `booking_code` (format: `BKG-YYYY-NNNNN`) generatsiya qilinadi — barcha panellarda faqat shu maydon orqali qidiriladi, ichki raqamli `id` frontendga chiqarilmaydi.

---

## 2. MA'LUMOTLAR BAZASI MODELLARI

### 2.1 Foydalanuvchi va ruxsatlar

| Model | Asosiy maydonlar | Izoh |
|---|---|---|
| **User** (xodim) | id, full_name, email (unique), phone, password_hash, role_id → Role, status (Active/Inactive), created_at | Reception, Housekeeping, Bellboy, Manager, Procurement, Admin xodimlari shu modelda, `role_id` orqali farqlanadi |
| **Role** | id, name (Admin/Manager/Reception/Housekeeping/HousekeepingSupervisor/Bellboy/Procurement), description | |
| **Permission** | id, role_id → Role, module (masalan "bookings", "payments"), can_view, can_create, can_edit, can_delete | Admin 6.3-bo'limidagi RBAC uchun; o'zgarganda tegishli rol foydalanuvchilarining aktiv sessiyasiga real-time ta'sir qiladi (Socket.io orqali) |
| **Guest** (mehmon) | id, full_name, phone (unique), email, password_hash, birthday, passport_id, id_proof_type, address, language (EN/UZ/RU), two_fa_enabled, notif_settings (json), created_at | Staff'dan butunlay alohida jadval va auth oqimi |

### 2.2 Xonalar va narxlar

| Model | Asosiy maydonlar | Izoh |
|---|---|---|
| **RoomType** | id, name (Standard/Deluxe/Suite), base_price, capacity, amenities (json), description | |
| **Room** | id, room_number (unique), floor, room_type_id → RoomType, reception_status (Available/Occupied/Cleaning/Maintenance), housekeeping_status (VacantClean/VacantDirty/OccupiedClean/OccupiedDirty/OutOfService), notes | Ikki alohida status maydoni bor: Reception va Housekeeping bir-biriga bog'liq, lekin farqli nuqtai nazardan ko'radi (panel-hujjat 1.4 va 2.3) |
| **SeasonalRate** | id, room_type_id → RoomType, start_date, end_date, price_override | Manager 4.8-bo'limi uchun |

### 2.3 Bron, to'lov, chek

| Model | Asosiy maydonlar | Izoh |
|---|---|---|
| **Booking** | id, **booking_code** (unique), guest_id → Guest, room_id → Room, created_by_user_id → User (nullable — Reception yaratgan bo'lsa), check_in_date, check_out_date, status (PendingPayment/Upcoming/Active/Completed/Cancelled), total_price, special_requests, id_proof_verified (bool), created_at | `PendingPayment` statusidagi bron 15 daqiqada to'lanmasa avtomatik `Cancelled`ga o'tadi (cron/scheduled job) |
| **BookingExtraCharge** | id, booking_id → Booking, description (Minibar/RoomService/DamageFee), amount | Check-out (1.3) uchun |
| **Payment** | id, booking_id → Booking (nullable), guest_id → Guest (nullable), amount, method (Cash/Card/Online), gateway_name (Click/Payme/null), transaction_id, status (Pending/Completed/Failed), collected_by_user_id → User (nullable), created_at | |
| **PaymentGatewayConfig** | id, name (Click/Payme/Stripe/PayPal/Uzum), merchant_id, api_key_encrypted, api_secret_encrypted, is_active | Admin 6.4; frontendga faqat oxirgi 4 belgi qaytariladi |
| **CashRegisterSession** | id, user_id → User, opened_at, closed_at, opening_balance, closing_balance, z_report_data (json) | Reception 1.8 kassa smenasi |
| **Receipt** | id, booking_id → Booking, payment_id → Payment, receipt_number (unique), issued_at | |
| **ReceiptItem** | id, receipt_id → Receipt, description, amount | |

### 2.4 Housekeeping

| Model | Asosiy maydonlar | Izoh |
|---|---|---|
| **HousekeepingTask** | id, room_id → Room, assigned_to_user_id → User, priority (Urgent/High/Normal), checklist (json: [{item, done}]), status (Pending/InProgress/Completed), before_photo_url, after_photo_url, created_at, completed_at | Checklist to'liq bajarilmasa "Mark Complete"da frontend ogohlantiradi (2.2) |
| **MaintenanceRequest** ⭐ | id, room_id → Room, reported_by_user_id → User, description, photo_url, status (New/InProgress/Resolved), assigned_to (text yoki User FK), created_at, resolved_at | Yangi — Manager 4.6 bilan bog'liq |
| **LostFoundItem** | id, room_id → Room, description, photo_url, found_by_user_id → User, status (Stored/Returned), returned_at | |
| **SupplyItem** | id, name, current_stock, min_level | |
| **SupplyRequest** | id, supply_item_id → SupplyItem, requested_by_user_id → User, quantity, status (Pending/Fulfilled), created_at | Procurement'ga avtomatik yo'naladi |

### 2.5 Bellboy

| Model | Asosiy maydonlar | Izoh |
|---|---|---|
| **BellboyTask** | id, guest_id → Guest (nullable), room_id → Room, task_type (Escort/Luggage/Other), priority, status (Assigned/Accepted/Declined/InProgress/Completed), assigned_to_user_id → User, started_at, completed_at, guest_rating (1-5, nullable) | |
| **GuestRequest** | id, guest_id → Guest, room_id → Room, request_type, status (Pending/Accepted/Completed), created_at | |
| **LuggageItem** | id, tag_id (unique, format `LTG-YYYY-NNNNN`), guest_id → Guest, description, status (Stored/Delivered), stored_at, delivered_at | |

### 2.6 Procurement

| Model | Asosiy maydonlar | Izoh |
|---|---|---|
| **Vendor** | id, name, category, contact_info, rating, status (Active/Inactive), login_user_id (nullable — vendor portal) | |
| **PurchaseOrder** | id, po_number (unique), vendor_id → Vendor, status (Pending/Approved/Received), created_by_user_id → User, created_at | |
| **PurchaseOrderItem** | id, purchase_order_id → PurchaseOrder, product_name, quantity, unit, unit_price | |
| **InventoryItem** | id, name, category, current_quantity, min_level, max_level | |
| **Invoice** | id, vendor_id → Vendor, purchase_order_id → PurchaseOrder (nullable), amount, due_date, status (Pending/Approved/Rejected/Paid), rejection_reason | |
| **VendorPayment** | id, invoice_id → Invoice, amount, method (BankTransfer/Cash/Check), paid_at | |

### 2.7 Admin va tizim

| Model | Asosiy maydonlar | Izoh |
|---|---|---|
| **AuditLog** | id, user_id → User (nullable), action, entity_type, entity_id, metadata (json), created_at | Append-only, API darajasida UPDATE/DELETE endpoint umuman yaratilmaydi |
| **HotelSettings** | id (singleton), name, address, logo_url, social_links (json), theme_color, enabled_languages (json) | |
| **Integration** | id, type (BookingCom/SMTP/SMS/KeyCardSystem), config (json, maxfiy qismlari shifrlangan), status, last_sync_at | Key Card/Door Lock tizimi shu yerda — Reception check-in (1.2) shunga tayanadi |
| **BackupRecord** | id, file_url, size, created_at, type (Manual/Scheduled) | |
| **Notification** | id, user_id → User (nullable), guest_id → Guest (nullable), type, message, is_read, created_at | |
| **SupportRequest** | id, guest_id → Guest, subject, message, status (Open/Resolved), created_at | Guest 7.8 |

### 2.8 Hisoblanadigan (computed) ko'rinish — jadval emas

**GuestLedger** — real jadval emas, so'rov orqali hisoblanadi: `total_bookings = count(Booking)`, `total_stays = sum(nights)`, `total_spent = sum(Payment.amount WHERE status=Completed)`, `balance = sum(Booking.total_price) - total_spent`. Reception 1.11-bo'limi shu hisobni qaytaradi.

---

## 3. RO'LLAR VA API PREFIKSLARI

Har bir rolning API'lari o'z prefiksida joylashadi va tegishli `staffAuthMiddleware(role)` bilan himoyalanadi:

| Rol | Prefiks | Middleware |
|---|---|---|
| Reception | `/api/reception/*` | staff, role IN (Reception, Manager, Admin) — ko'rish darajasi rolga qarab farqlanadi |
| Housekeeping | `/api/housekeeping/*` | staff, role IN (Housekeeping, HousekeepingSupervisor, Manager, Admin) |
| Bellboy | `/api/bellboy/*` | staff, role IN (Bellboy, Manager, Admin) |
| Manager | `/api/manager/*` | staff, role IN (Manager, Admin) |
| Procurement | `/api/procurement/*` | staff, role IN (Procurement, Admin) |
| Admin | `/api/admin/*` | staff, role = Admin |
| Guest | `/api/guest/*` | guestAuthMiddleware |
| Umumiy | `/api/users/settings` (shaxsiy sozlamalar), `/api/payments/{gateway}/*` (to'lov gateway callback/webhook) | staff YOKI guest (ikkalasiga ham ochiq, token turiga qarab) |

---

## 4. TO'LIQ API ENDPOINT RO'YXATI

### 4.1 Reception

| Method | Path | Vazifa |
|---|---|---|
| GET | `/api/reception/dashboard` | 1.1 — kunlik statistikalar |
| POST | `/api/reception/check-in` | 1.2 — check-in yakunlash |
| GET | `/api/reception/check-in/validate/{booking_code}` | 1.2 — bron ma'lumotini tekshirish |
| POST | `/api/reception/check-out` | 1.3 — check-out yakunlash |
| GET | `/api/reception/check-out/calculate/{booking_code}` | 1.3 — yakuniy summani hisoblash |
| GET | `/api/reception/rooms` | 1.4 — barcha xonalar holati |
| POST | `/api/reception/rooms/{id}/change-status` | 1.4 — qo'lda status o'zgartirish |
| GET | `/api/reception/bookings/search` | 1.5 — bron qidirish |
| POST | `/api/reception/bookings` | 1.5/1.6 — yangi bron yaratish |
| PATCH | `/api/reception/bookings/{booking_code}/cancel` | 1.5 — bekor qilish (status o'zgarishi, DELETE emas) |
| GET | `/api/reception/rooms/available-for-dates` | 1.6 — bo'sh xonalarni tekshirish |
| POST | `/api/reception/guests` | 1.7 — yangi mehmon qo'shish |
| POST | `/api/reception/payments` | 1.8 — to'lov qabul qilish |
| POST | `/api/reception/cash-register/open` | 1.8 — kassa ochish |
| POST | `/api/reception/cash-register/close` | 1.8 — kassa yopish, Z-report |
| GET | `/api/reception/receipts/{id}` | 1.9 — chekni ko'rish |
| POST | `/api/reception/receipts/{id}/print` | 1.9 — chop etish |
| GET | `/api/reception/reports/generate` | 1.10 — hisobot (query: from, to) |
| GET | `/api/reception/guests/{id}/ledger` | 1.11 — Guest Ledger |

### 4.2 Housekeeping

| Method | Path | Vazifa |
|---|---|---|
| GET | `/api/housekeeping/dashboard` | 2.1 |
| GET | `/api/housekeeping/tasks` | 2.2 — vazifalar ro'yxati |
| POST | `/api/housekeeping/tasks/{id}/complete` | 2.2 — yakunlash |
| POST | `/api/housekeeping/tasks/{id}/mark-issues` | 2.2 — muammo xabar qilish → MaintenanceRequest yaratadi |
| PUT | `/api/housekeeping/rooms/{id}/status` | 2.3 — tozalik statusi |
| GET | `/api/housekeeping/rooms/by-floor/{floor}` | 2.4 |
| POST | `/api/housekeeping/lost-items` | 2.5 |
| POST | `/api/housekeeping/supplies/request` | 2.6 |
| GET | `/api/housekeeping/reports` | 2.7 |
| GET | `/api/housekeeping/staff` | 2.8 — faqat supervisor |
| POST | `/api/housekeeping/tasks/{id}/reassign` | 2.8 |

### 4.3 Bellboy

| Method | Path | Vazifa |
|---|---|---|
| GET | `/api/bellboy/dashboard` | 3.1 |
| GET | `/api/bellboy/tasks` | 3.2 (query `?status=completed` → 3.5) |
| POST | `/api/bellboy/tasks/{id}/start` | 3.2 |
| POST | `/api/bellboy/tasks/{id}/complete` | 3.2 |
| GET | `/api/bellboy/guest-requests` | 3.3 |
| POST | `/api/bellboy/luggage/store` | 3.4 |
| POST | `/api/bellboy/luggage/{id}/deliver` | 3.4 |

### 4.4 Manager

| Method | Path | Vazifa |
|---|---|---|
| GET | `/api/manager/dashboard` | 4.1 |
| GET | `/api/manager/analytics/revenue` | 4.1 |
| GET | `/api/manager/analytics/occupancy` | 4.1 |
| GET | `/api/manager/staff` | 4.2 |
| GET | `/api/manager/staff/{id}/performance` | 4.2 |
| GET | `/api/manager/analytics/room-performance` | 4.3 |
| GET | `/api/manager/bookings` | 4.4 |
| PATCH | `/api/manager/bookings/{booking_code}/cancel` | 4.4 — override |
| GET | `/api/manager/lost-items` | 4.5 |
| POST | `/api/manager/lost-items/{id}/return` | 4.5 |
| GET | `/api/manager/maintenance-requests` | 4.6 ⭐ |
| POST | `/api/manager/maintenance-requests/{id}/assign` | 4.6 ⭐ |
| POST | `/api/manager/maintenance-requests/{id}/resolve` | 4.6 ⭐ |
| GET | `/api/manager/reports/daily` | 4.7 |
| GET | `/api/manager/reports/monthly` | 4.7 |
| PUT | `/api/manager/settings/rates` | 4.8 |

### 4.5 Procurement

| Method | Path | Vazifa |
|---|---|---|
| GET | `/api/procurement/dashboard` | 5.1 |
| POST | `/api/procurement/vendors` | 5.2 |
| PUT | `/api/procurement/vendors/{id}` | 5.2 |
| POST | `/api/procurement/purchase-orders` | 5.3 |
| POST | `/api/procurement/purchase-orders/{id}/receive` | 5.3 / 5.5 |
| GET | `/api/procurement/inventory` | 5.4 |
| POST | `/api/procurement/inventory/reorder` | 5.4 |
| POST | `/api/procurement/invoices/{id}/approve` | 5.6 |
| POST | `/api/procurement/invoices/{id}/reject` | 5.6 |
| POST | `/api/procurement/payments` | 5.7 |
| GET | `/api/procurement/reports` | 5.8 |

### 4.6 Admin

| Method | Path | Vazifa |
|---|---|---|
| GET | `/api/admin/dashboard` | 6.1 |
| GET | `/api/admin/system/health` | 6.1 |
| POST | `/api/admin/users` | 6.2 |
| PUT | `/api/admin/users/{id}` | 6.2 |
| DELETE | `/api/admin/users/{id}` | 6.2 — faqat User (xodim) uchun ruxsat etiladi, moliyaviy yozuvlar emas |
| PUT | `/api/admin/roles/{id}/permissions` | 6.3 |
| GET | `/api/admin/settings/payment-gateways` | 6.4 |
| PUT | `/api/admin/settings/payment-gateways/{id}` | 6.4 |
| PUT | `/api/admin/settings` | 6.5 |
| GET | `/api/admin/audit-logs` | 6.6 — faqat GET, boshqa method yo'q |
| GET | `/api/admin/financial/dashboard` | 6.7 |
| POST | `/api/admin/backup/create` | 6.8 |
| POST | `/api/admin/backup/{id}/restore` | 6.8 |
| GET | `/api/admin/integrations` | 6.9 |
| POST | `/api/admin/integrations/booking-com/sync` | 6.9 |
| PUT | `/api/admin/integrations/key-card-system` | 6.9 |

### 4.7 Guest

| Method | Path | Vazifa |
|---|---|---|
| POST | `/api/guest/register` | 7.1 |
| POST | `/api/guest/login` | 7.1 |
| POST | `/api/guest/verify-otp` | 7.1 |
| GET | `/api/guest/rooms/available` | 7.2 |
| POST | `/api/guest/bookings/draft` | 7.3 |
| GET | `/api/guest/bookings` | 7.5 |
| PATCH | `/api/guest/bookings/{booking_code}/cancel` | 7.5 |
| GET | `/api/guest/receipts/{id}` | 7.6 |
| PUT | `/api/guest/settings` | 7.7 |
| POST | `/api/guest/support-requests` | 7.8 |

### 4.8 Umumiy (staff + guest)

| Method | Path | Vazifa |
|---|---|---|
| PUT | `/api/users/settings` | Shaxsiy sozlamalar (staff) |
| POST | `/api/payments/{gateway}/create-url` | To'lov havolasi yaratish (Reception 1.8 va Guest 7.4 ikkalasi ham ishlatadi) |
| POST | `/api/payments/{gateway}/webhook` | Gateway'dan kelgan tasdiqlash — signature majburiy tekshiriladi |

---

## 5. REAL-TIME (SOCKET.IO) HODISALAR

| Hodisa | Qachon yuboriladi | Kim qabul qiladi |
|---|---|---|
| `new-arrival` | Yangi bron/check-in kutilayotgan mehmon qo'shilganda | Reception |
| `room-status-changed` / `room-status-update` | Har qanday xona statusi o'zgarganda (Reception yoki Housekeeping tomonidan) | Reception, Housekeeping, Manager |
| `new-maintenance-request` | Housekeeping "Report Issues" yuborganda | Manager |
| `new-bellboy-task` | Reception/Guest so'rov yaratganda | Bellboy |
| `booking-payment-confirmed` | Gateway webhook muvaffaqiyatli kelganda | Tegishli Guest (faqat o'ziniki), Reception |
| `permissions-updated` | Admin biror rol ruxsatini o'zgartirganda | Shu rolga tegishli barcha aktiv sessiyalar (6.3-bo'lim qoidasi) |

---

## 6. KONSOLIDATSIYALANGAN BIZNES-QOIDALAR (validation checklist)

- Check-in: hujjat (ID Proof) tasdiqlanmaguncha "Check-in Guest" tugmasi backend darajasida ham rad etiladi (`id_proof_verified = false` bo'lsa 422 qaytariladi).
- Check-out: yakunlanmaguncha xona "Occupied" statusida qoladi.
- Payments: har bir muvaffaqiyatli to'lov MAJBURIY Receipt yaratadi; Receipt yaratilmasdan Payment "Completed" statusiga o'tmaydi (bitta DB tranzaksiyasi ichida).
- Bron bekor qilish: har doim status o'zgarishi, hech qachon DELETE emas.
- Housekeeping checklist to'liq emasligini backend ham biladi — "Complete" so'rovida `force=true` bo'lmasa va checklist to'liq bo'lmasa, ogohlantirish javobi qaytaradi (frontend shu asosda dialog ko'rsatadi).
- Guest Ledger: `balance < 0` bo'lsa, yangi bron yaratishda (`POST /api/reception/bookings`) javobga ogohlantirish flag qo'shiladi.
- Payment gateway: summasi har doim `Booking.total_price`dan olinadi, so'rovdan emas.
- Webhook: imzo noto'g'ri yoki kalit sozlanmagan bo'lsa — so'rov rad etiladi, hech qachon "default true" qaytarilmaydi.
- Audit Log: yozuvlar hech qachon o'zgartirilmaydi/o'chirilmaydi — buni ta'minlash uchun DB darajasida ham (masalan trigger yoki faqat INSERT huquqi bilan alohida DB roli) qo'shimcha himoya ko'rib chiqilsin.
- "Pending Payment" bron: 15 daqiqada to'lanmasa avtomatik "Cancelled"ga o'tadi (scheduled job/queue).

---

## 7. TEST TALABLARI (Verification Plan'ga qo'shimcha)

Oldingi rejadagi "Jest bilan asosiy API" tavsifi quyidagilar bilan aniqlashtiriladi:

1. **RBAC salbiy testlar**: har bir rol uchun "boshqa rolga tegishli endpoint'ga so'rov yuborilsa 403 qaytishi" avtomatik tekshiriladi (masalan Housekeeping tokeni bilan `/api/reception/payments`).
2. **Webhook idempotentligi**: bitta `transaction_id` bilan webhook ikki marta kelsa, Payment ikki marta yaratilmasligi/summasi ikki marta qo'shilmasligi tekshiriladi.
3. **Narx firibgarligi testi**: `POST /api/payments/{gateway}/create-url`ga bazadagidan farqli summa yuborilsa, server o'zining bazadagi summasidan foydalanishi (client summasi e'tiborga olinmasligi) tekshiriladi.
4. **Booking cancel — DELETE emasligi**: bekor qilingan bron bazada saqlanib qolishini va faqat status o'zgarganini tekshiruvchi test.
5. **Guest/Staff auth izolyatsiyasi**: Guest tokeni bilan staff endpoint'ga, staff tokeni bilan guest endpoint'ga kirish urinishi 401/403 bilan rad etilishi.

---

## 8. ESKI LOYIHA (`D:\Loyihalar\Hotel`) BILAN MUNOSABAT

Ishga tushirishdan oldin Antigravity avval `D:\Loyihalar\Hotel` papkasidagi mavjud loyihani (Node/Express + Prisma/SQLite backend, React/Vite/Tailwind frontend) ko'rib chiqishi va quyidagilarni baholashi kerak:

- Qayta ishlatsa bo'ladigan qismlar: umumiy loyiha strukturasi (`src/controllers`, `src/routes`, `src/middleware`), Tailwind konfiguratsiyasi, autentifikatsiya oqimining umumiy g'oyasi.
- QAYTA ISHLATILMASLIGI KERAK bo'lgan qismlar (avvalgi auditda aniqlangan real xatolar): Prisma schema (controllerlar bilan mos emas — `booking_ref` vs `booking_code`, `Guest.password` maydoni yo'q va h.k.), `paymentController.js`dagi hardcoded fallback secret va webhook imzo tekshiruvini chetlab o'tish, `clickGateway.js`/`paymeGateway.js` metod nomlari mos kelmasligi, `backend/prisma/fix_user.js` (DROP TABLE ishlatadi — umuman ko'chirilmasin), turli debug/seed skriptlari (`test-prisma.js`, `seed.js` vs `prisma/seed.js` nomuvofiqligi).
- Xulosa: eski loyihadan **kod emas, faqat tuzilma va konfiguratsiya g'oyasi** olinishi tavsiya etiladi — bu hujjatdagi (bo'lim 2) yangi, to'g'ri schema asosida bazani noldan qurish kerak.

---

**STATUS**: Ushbu hujjat `hotel-erp-panel-functions-explained.md` bilan birga to'liq backend spesifikatsiyani tashkil qiladi. Ikkalasini birga o'qib, Bosqich 1 (Backend poydevori)dan boshlash mumkin.
