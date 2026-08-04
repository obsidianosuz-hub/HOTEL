# 🏨 HOTEL ERP — PANEL BO'LIMLARI VA FUNKSIONALLIK QO'LLANMASI
**Maqsad**: Har bir panel, har bir bo'lim, har bir tugma nima uchun kerakligini va qanday ishlashini AI agent to'liq tushunishi uchun.
**Qamrov**: Reception, Housekeeping, Bellboy, Manager, Procurement, Admin, Guest Panel — barcha 7 panel shu hujjatda

---

## 🏗️ DASTUR ARXITEKTURASI (Umumiy Ko'rinish)

```
┌─────────────────────────────────────────────────────────────┐
│                     HOTEL ERP TIZIMI                          │
└─────────────────────────────────────────────────────────────┘

MIJOZ TOMONI (Frontend):
├── Guest Portal          → Mehmon o'zi foydalanadi (quyida 7-panel sifatida yoritilgan)
├── Reception Panel        → Qabul xodimi ishlaydi
├── Housekeeping Panel     → Farrosh ishlaydi
├── Bellboy Panel          → Yuk tashuvchi ishlaydi
├── Manager Panel          → Menejer nazorat qiladi
├── Procurement Panel      → Ta'minot menejeri ishlaydi
└── Admin Panel            → Tizim administratori boshqaradi

MA'LUMOT OQIMI MANTIG'I:
Guest bron qiladi → Reception tasdiqlaydi/check-in qiladi →
Housekeeping xonani tayyorlaydi → Bellboy mehmonni kuzatadi →
Manager barcha jarayonni kuzatadi → Procurement resurslarni ta'minlaydi →
Admin butun tizimni boshqaradi

NEGA BUNDAY BO'LINGAN:
- Har bir xodim FAQAT o'z ishiga tegishli ma'lumotni ko'radi (xavfsizlik)
- Har bir panel FAQAT o'z vazifasi uchun zarur tugmalarni ko'rsatadi (soddalik)
- Barcha panellar BITTA umumiy database'dan foydalanadi (ma'lumot yagona manba)
- Real-time yangilanish: bitta panelda o'zgarish → boshqa panellarda darhol ko'rinadi
  (masalan: Reception check-in qilsa → Housekeeping darhol "xona band" ko'radi)
```

---

## 🔑 UMUMIY QOIDALAR (barcha panellar uchun amal qiladi)

**Bron identifikatori**: Har bir bronga tizim yaratilishda yagona, o'zgarmas `booking_code` beriladi (masalan `BKG-2026-00123`). Ushbu kod barcha panellarda (Reception, Manager, Guest Ledger, cheklar) mehmonni/bronni qidirish va bog'lash uchun ISHLATILADIGAN YAGONA identifikator — hujjat davomida "Booking ID", "bron ID", "{ref}", "{booking_id}" kabi turli nomlar emas, faqat `booking_code` ishlatiladi.

**Shaxsiy sozlamalar (Account Settings)**: Har bir panelning header qismida umumiy profil menyusi (avatar/ism ustiga bosilganda ochiladi) bo'ladi — u orqali parol o'zgartirish, interfeys tilini tanlash (EN/UZ/RU) va bildirishnoma sozlamalarini boshqarish barcha rollar (Reception, Housekeeping, Bellboy, Manager, Procurement, Admin) uchun BIR XIL komponent orqali amalga oshiriladi (`PUT /api/users/settings`). To'liq tugma tavsifi 1.12-bo'limda (Reception) berilgan, boshqa panellarda alohida takrorlanmaydi — faqat shu umumiy komponentga murojaat qilinadi.

**Ruxsatlar (RBAC) ta'siri**: Admin panelidagi 6.3 Permissions bo'limida bir rol uchun o'zgartirilgan ruxsat — shu rolga tegishli BARCHA xodimlarning barcha panellaridagi tugma/bo'lim ko'rinishiga real-time ta'sir qiladi (masalan Reception rolidan "Payments" ruxsati olib tashlansa, Reception xodimining paneli darhol shu bo'limni yashiradi).

**Texnik integratsiyalar bog'liqligi**: Check-in paytida ishlatiladigan kalit-karta faollashtirish tizimi, SMS/email yuborish va Booking.com sinxronizatsiyasi — barchasi Admin panelining 6.9 Integrations bo'limida sozlanadigan tashqi ulanishlarga tayanadi (Key Card/Door Lock tizimi shu bo'limga kiritilgan, pastga qarang).

---

# 1️⃣ RECEPTION PANEL

**Umumiy vazifasi**: Mehmonlar bilan bevosita ishlaydigan xodim — kelish, ketish, to'lov, xona holatini boshqaradi. Bu **eng ko'p ishlatiladigan panel**, chunki mehmonxonaning "old eshigi" shu yerda.

---

## 1.1 DASHBOARD (Bosh sahifa)

**🎯 Maqsad**: Xodim ish kunini boshlaganda birinchi ko'radigan ekran — kunlik holatni bir qarashda tushunish uchun.

**⚙️ Qanday ishlaydi**:
- Sahifa ochilganda backend'dan bugungi statistikalar so'raladi
- WebSocket orqali har bir yangi bron/check-in/check-out real-time yangilanadi
- Rangli kartochkalar orqali muhim raqamlar ko'rsatiladi

**🔘 Tugmalar va elementlar**:
| Element | Vazifasi |
|---------|----------|
| **"Today's Arrivals" kartochkasi** | Bugun kelishi kutilayotgan mehmonlar sonini ko'rsatadi. Bosilsa — to'liq ro'yxatga o'tadi |
| **"Today's Departures" kartochkasi** | Bugun ketishi kerak bo'lgan mehmonlar soni. Bosilsa — check-out kutayotganlar ro'yxati |
| **"In House Guests" kartochkasi** | Hozir mehmonxonada turgan mehmonlar soni |
| **"Available Rooms" kartochkasi** | Bo'sh xonalar soni. Bosilsa — Room Status bo'limiga o'tadi |
| **Room Status Overview (Donut chart)** | Occupied/Available/Cleaning/Maintenance foizlarini vizual ko'rsatadi |
| **"Today's Arrivals" jadvali** | Har bir mehmon: ism, xona, kelish vaqti, status. "View All" tugmasi to'liq ro'yxatga olib boradi |
| **Notifications paneli** | Muhim ogohlantirishlar (masalan "Room 305 ready for check-in"). Bosilsa tegishli bo'limga o'tadi |

**👤 Kim foydalanadi**: Reception xodimi, Manager (ko'rish huquqi bilan)

**🔗 API**: `GET /api/reception/dashboard`, WebSocket event: `room-status-changed`, `new-arrival`

---

## 1.2 CHECK-IN

**🎯 Maqsad**: Kelgan mehmonni tizimga rasmiylashtirish va xonaga joylashtirish.

**⚙️ Qanday ishlaydi (qadam-baqadam)**:
1. Xodim mehmon ismi yoki bron ID'sini qidiradi
2. Tizim bron ma'lumotlarini ko'rsatadi (xona turi, sanalar, narx)
3. Xodim mehmon hujjatini (pasport) tekshiradi/skanerlaydi
4. Xona biriktiriladi (agar hali biriktirilmagan bo'lsa)
5. Kalit-karta faollashtiriladi
6. To'lov holati tekshiriladi (agar to'lanmagan bo'lsa — to'lov qabul qilinadi)
7. "Check-in Guest" tugmasi bosiladi → xona holati "Occupied" ga o'zgaradi

**🔘 Tugmalar va elementlar**:
| Element | Vazifasi |
|---------|----------|
| **Qidiruv maydoni** | Booking ID yoki mehmon ismi bo'yicha qidirish |
| **Guest Name, Room, Check-in Date maydonlari** | Bron ma'lumotlari — avtomatik to'ldiriladi, tahrirlash mumkin emas (faqat ko'rish) |
| **"ID Proof" dropdown** | Hujjat turini tanlash (Passport, ID Card, Driving License) |
| **Pasport skanerlash tugmasi** | Kamera orqali hujjat rasmini olish yoki fayl yuklash |
| **"Special Requests" maydoni** | Mehmonning maxsus istaklarini ko'rish (masalan "yuqori qavat") |
| **"Check-in Guest" tugmasi** | Barcha ma'lumotlarni tasdiqlab, check-in jarayonini yakunlaydi. Bu bosilgach: xona statusi o'zgaradi, kalit-karta faollashadi, welcome SMS/email yuboriladi |
| **"Cancel" tugmasi** | Jarayonni bekor qiladi, hech narsa saqlanmaydi |

**👤 Kim foydalanadi**: Reception xodimi

**🔗 API**: `POST /api/reception/check-in`, `GET /api/reception/check-in/validate/{booking_code}`

**⚠️ Muhim biznes-qoida**: Agar mehmon hujjati tasdiqlanmasa, "Check-in Guest" tugmasi bosilmaydi (disabled holatda turadi) — bu xavfsizlik talabi.

---

## 1.3 CHECK-OUT

**🎯 Maqsad**: Ketayotgan mehmonning hisob-kitobini yakunlash va xonani bo'shatish.

**⚙️ Qanday ishlaydi**:
1. Xodim booking ID orqali mehmonni topadi
2. Tizim avtomatik hisoblaydi: xona narxi + qo'shimcha xizmatlar (minibar, room service) + soliq
3. Agar xonada shikastlanish bo'lsa — xodim buni belgilaydi (damage fee qo'shiladi)
4. Yakuniy summa ko'rsatiladi
5. To'lov qabul qilinadi (agar qoldiq bo'lsa)
6. "Check-out Guest" tugmasi bosiladi → xona holati "Cleaning" ga o'tadi (Housekeeping'ga avtomatik vazifa yaratiladi)

**🔘 Tugmalar va elementlar**:
| Element | Vazifasi |
|---------|----------|
| **Booking ID, Guest Name maydonlari** | Avtomatik to'ldiriladi (faqat ko'rish) |
| **"Extra Charges" ro'yxati** | Minibar, room service kabi qo'shimcha xarajatlar — har birini qo'shish/o'chirish mumkin |
| **"Room Condition" dropdown** | Clean / Minor Damage / Major Damage — tanlansa, damage fee maydoni ochiladi |
| **"Total Payable" ko'rsatkichi** | Real-time hisoblanadi: barcha xarajatlar yig'indisi + soliq |
| **"Check-out Guest" tugmasi** | Jarayonni yakunlaydi: to'lov yopiladi, kalit-karta o'chiriladi, xona "Cleaning" statusiga o'tadi, chek generatsiya qilinadi |

**👤 Kim foydalanadi**: Reception xodimi

**🔗 API**: `POST /api/reception/check-out`, `GET /api/reception/check-out/calculate/{booking_code}`

**⚠️ Muhim biznes-qoida**: Check-out yakunlanmaguncha xona "Occupied" statusida qoladi — bu boshqa mehmonga tasodifan bron qilinishini oldini oladi.

---

## 1.4 ROOM STATUS

**🎯 Maqsad**: Barcha xonalarning joriy holatini bir ekranda ko'rish va tezkor boshqarish ("shaxmat taxtasi").

**⚙️ Qanday ishlaydi**:
- Har xona rangli kartochka: 🟢 Available, 🔴 Occupied, 🟡 Cleaning, 🟠 Maintenance
- Xonaga bosilganda tezkor amallar menyusi ochiladi

**🔘 Tugmalar va elementlar**:
| Element | Vazifasi |
|---------|----------|
| **Floor filter tugmalari (Floor 3, 4, 5...)** | Faqat shu qavatdagi xonalarni ko'rsatadi |
| **Xona kartochkasi** | Bosilganda: xona raqami, joriy mehmon, check-in/out sana ko'rinadi |
| **Status o'zgartirish tugmasi (xona ichida)** | Manual ravishda holatni o'zgartirish (masalan tozalangandan keyin "Available" qilish) |
| **"Assign Guest" tezkor tugmasi** | Bo'sh xonaga to'g'ridan-to'g'ri mehmon biriktirish |

**👤 Kim foydalanadi**: Reception, Manager, Housekeeping (ko'rish uchun)

**🔗 API**: `GET /api/reception/rooms`, `POST /api/reception/rooms/{id}/change-status`, WebSocket: `room-status-update`

---

## 1.5 BOOKINGS

**🎯 Maqsad**: Barcha bronlarni (kelgusi, joriy, tugagan, bekor qilingan) ko'rish va boshqarish.

**⚙️ Qanday ishlaydi**:
- Tab'lar orqali filtrlash: All / Upcoming / Completed / Cancelled
- Har bir bron ustiga bosilsa — to'liq tafsilot ochiladi

**🔘 Tugmalar va elementlar**:
| Element | Vazifasi |
|---------|----------|
| **"Upcoming / Completed / Cancelled" tab'lari** | Bronlarni statusi bo'yicha filtrlaydi |
| **"+ New Booking" tugmasi** | Yangi bron yaratish formasi ochiladi (telefon orqali kelgan buyurtmalar uchun) |
| **Bron qatoridagi "..." menyu** | Tahrirlash, bekor qilish, chek ko'rish variantlari |
| **Qidiruv maydoni** | Bron ID yoki mehmon ismi bo'yicha qidirish |

**👤 Kim foydalanadi**: Reception xodimi, Manager

**🔗 API**: `GET /api/reception/bookings/search`, `POST /api/reception/bookings`, `PATCH /api/reception/bookings/{booking_code}/cancel`

**⚠️ Muhim biznes-qoida**: Bron "bekor qilish" hech qachon yozuvni bazadan butunlay o'chirmaydi (DELETE emas) — faqat statusi "Cancelled"ga o'zgaradi. Sabab: moliyaviy audit va Audit Logs (6.6-bo'lim) talabiga ko'ra hech qanday tranzaksiyaga aloqador yozuv yo'qolmasligi kerak.

---

## 1.6 NEW BOOKING (Modal oyna — "Bookings" ichida)

**🎯 Maqsad**: Telefon qo'ng'irog'i yoki resepshenga bevosita kelgan mehmon uchun bron yaratish.

**🔘 Tugmalar va elementlar**:
| Element | Vazifasi |
|---------|----------|
| **Phone Number maydoni** | Kiritilishi bilan tizim shu raqam bo'yicha mavjud mehmonni avtomatik qidiradi (agar topilsa — ism/ma'lumotlar avtomatik to'ldiriladi; topilmasa — "Add Guest" oynasi taklif qilinadi) |
| **Guest Name maydoni** | Mavjud mehmon topilganda avtomatik to'ldiriladi, aks holda qo'lda kiritiladi |
| **Check-in Date / Check-out Date** | Kalendar orqali sana tanlash |
| **Room Type dropdown** | Standard/Deluxe/Suite tanlash |
| **"Check Availability" tugmasi** | Tanlangan sanalarda shu turdagi bo'sh xonalarni tekshiradi |
| **"Save Booking" tugmasi** | Bronni yaratadi, yagona `booking_code` generatsiya qiladi (masalan `BKG-2026-00123`) |

**👤 Kim foydalanadi**: Reception xodimi

**🔗 API**: `GET /api/reception/rooms/available-for-dates`, `POST /api/reception/bookings`

---

## 1.7 ADD GUEST (Modal oyna)

**🎯 Maqsad**: Tizimda mavjud bo'lmagan yangi mehmonni ro'yxatga qo'shish (odatda New Booking ichida ishlatiladi).

**🔘 Tugmalar va elementlar**:
| Element | Vazifasi |
|---------|----------|
| **Full Name, Phone, Email maydonlari** | Asosiy kontakt ma'lumotlari |
| **ID Proof dropdown + Address** | Hujjat turi va manzil |
| **"Save Guest" tugmasi** | Mehmonni guests jadvaliga qo'shadi, keyingi bronlar uchun tarixi saqlanadi |

**👤 Kim foydalanadi**: Reception xodimi

**🔗 API**: `POST /api/reception/guests`

---

## 1.8 PAYMENTS

**🎯 Maqsad**: Barcha qabul qilingan to'lovlarni ko'rish, yangi to'lov qabul qilish, kassa nazorati.

**⚙️ Qanday ishlaydi**:
- Jadval: Receipt ID, Guest Name, Amount, Method, Date, Status
- Yangi to'lov qabul qilish uchun alohida forma

**🔘 Tugmalar va elementlar**:
| Element | Vazifasi |
|---------|----------|
| **Payment usuli tanlash (Cash/Card/Online)** | To'lov qanday amalga oshirilganini belgilaydi |
| **"Online" tanlansa — gateway tanlash dropdown** | Faqat Admin panelida (6.4-bo'lim) "Active" qilib yoqilgan to'lov tizimlari ro'yxati ko'rsatiladi (masalan Click, Payme) — ro'yxat qattiq yozilmagan, Admin sozlamasidan dinamik olinadi |
| **Tanlangan gateway'ga so'rov yuborish** | Tizim tegishli gateway'ga (Click yoki Payme) so'rov yuboradi, to'lov linki/QR generatsiya qiladi |
| **"Collect Payment" tugmasi** | To'lovni yakunlaydi, chek avtomatik yaratiladi |
| **Status badge (Paid/Pending)** | To'lov holatini rangli ko'rsatadi |
| **Cash Register "Open/Close" tugmalari** | Kunlik kassa smenasini ochish/yopish (Z-report yaratiladi) |

**👤 Kim foydalanadi**: Reception xodimi

**🔗 API**: `POST /api/reception/payments`, `POST /api/reception/cash-register/open`, `POST /api/reception/cash-register/close`

**⚠️ Muhim biznes-qoida**: Har bir qabul qilingan to'lov — **majburiy ravishda chek (receipt) yaratadi**. Chek yaratilmasdan to'lov "completed" statusiga o'tmaydi.

---

## 1.9 RECEIPTS

**🎯 Maqsad**: Berilgan barcha cheklarni arxiv sifatida ko'rish, qayta chop etish, qayta yuborish.

**🔘 Tugmalar va elementlar**:
| Element | Vazifasi |
|---------|----------|
| **"Filter by Date" dropdown** | Sanalar oralig'ida cheklarni filtrlash |
| **👁️ (Ko'rish) ikonkasi** | Chekni preview qiladi (yangi oynada) |
| **⬇️ (Yuklab olish) ikonkasi** | PDF formatda chekni yuklab oladi |
| **"Print" tugmasi (chek ichida)** | Printerga yuboradi |
| **"Download" tugmasi (chek ichida)** | PDF saqlaydi |

**👤 Kim foydalanadi**: Reception xodimi, Manager

**🔗 API**: `GET /api/reception/receipts/{id}`, `POST /api/reception/receipts/{id}/print`

---

## 1.10 REPORTS

**🎯 Maqsad**: Kunlik/haftalik operatsion hisobotlarni tezkor olish (Manager panelidagi chuqur analitikadan farqli — bu yerda tezkor, sodda hisobotlar).

**🔘 Tugmalar va elementlar**:
| Element | Vazifasi |
|---------|----------|
| **From Date / To Date** | Hisobot davri tanlanadi |
| **"Generate" tugmasi** | Tanlangan davr uchun hisobotni yaratadi |
| **Statistika kartochkalari** | Total Bookings, Total Revenue, Total Check-ins/outs, Occupancy Rate, ADR (o'rtacha kunlik narx) |

**👤 Kim foydalanadi**: Reception xodimi (kunlik), Manager (nazorat uchun)

**🔗 API**: `GET /api/reception/reports/generate?from={date}&to={date}`

---

## 1.11 GUEST LEDGER ⭐ (Muhim — avval tushib qolgan edi)

**🎯 Maqsad**: Har bir mehmonning **butun moliyaviy tarixini** bir joyda ko'rsatish — nechta marta kelgan, jami qancha sarflagan, joriy balansi bormi.

**⚙️ Qanday ishlaydi**:
1. Xodim mehmon ismini qidiradi
2. Tizim ushbu mehmonga tegishli BARCHA bronlar va to'lovlarni yig'adi
3. Jami statistika hisoblanadi: Total Bookings, Total Stays, Total Spent, Balance

**🔘 Tugmalar va elementlar**:
| Element | Vazifasi |
|---------|----------|
| **Qidiruv maydoni** | Mehmon ismi bo'yicha qidirish |
| **Jadval qatorlari** | Guest Name, Total Bookings, Total Stays, Total Spent, Balance |
| **Balance ustuni (qizil/yashil)** | Agar qarzdorlik bo'lsa qizil rangda ko'rsatiladi — muhim ogohlantirish |
| **Qator ustiga bosish** | Ushbu mehmonning to'liq tarixi va har bir bron tafsilotiga o'tadi |

**👤 Kim foydalanadi**: Reception xodimi (VIP mehmonni tanish uchun), Manager

**🧮 Balance hisoblanishi**: `Balance = (mehmonning barcha bronlari bo'yicha jami summasi) − (mehmonning barcha tasdiqlangan to'lovlari jami)`. Natija musbat bo'lsa — mehmonning ortiqcha to'lagan/depozit puli bor; manfiy bo'lsa — mehmon qarzdor.

**🔗 API**: `GET /api/reception/guests/{id}/ledger` — bu **YANGI endpoint**, avvalgi promptda yo'q edi

**⚠️ Muhim biznes-qoida**: Agar mehmon balansi manfiy (qarzdor) bo'lsa, yangi bron yaratishda ogohlantirish chiqishi kerak.

---

## 1.12 SETTINGS (barcha panellar uchun umumiy komponent)

**🎯 Maqsad**: Xodim o'zining shaxsiy sozlamalarini boshqarishi (parol, til, bildirishnoma). Bu komponent faqat Reception'ga xos emas — barcha 6 ta panelning header'idagi profil menyusida bir xil ko'rinishda mavjud (tepaga qarang, "Umumiy qoidalar").

**🔘 Tugmalar va elementlar**:
| Element | Vazifasi |
|---------|----------|
| **"Change Password"** | Parolni yangilash |
| **Til tanlash (EN/UZ/RU)** | Interfeys tilini o'zgartirish |
| **Notification toggle'lari** | Qaysi hodisalarda bildirishnoma kelishini yoqish/o'chirish |

**👤 Kim foydalanadi**: Reception xodimi

**🔗 API**: `PUT /api/users/settings`

---

# 2️⃣ HOUSEKEEPING PANEL

**Umumiy vazifasi**: Xonalarni tozalash va texnik holatini nazorat qilish. Bu panel ko'proq **mobil qurilmada** ishlatiladi (farrosh telefon bilan yuradi).

---

## 2.1 DASHBOARD

**🎯 Maqsad**: Farroshning kunlik ish hajmini bir qarashda ko'rsatish.

**🔘 Tugmalar va elementlar**:
| Element | Vazifasi |
|---------|----------|
| **"Today's Tasks" kartochkasi** | Bugungi jami vazifalar soni |
| **"In Progress" kartochkasi** | Hozir bajarilayotgan vazifalar |
| **"Completed" kartochkasi** | Tugallangan vazifalar |
| **"Urgent" kartochkasi** | Tezkor e'tibor talab qiladigan vazifalar (qizil rangda) |

**👤 Kim foydalanadi**: Housekeeping xodimi

**🔗 API**: `GET /api/housekeeping/dashboard`

---

## 2.2 MY TASKS

**🎯 Maqsad**: Farroshga tayinlangan barcha tozalash vazifalarini ko'rish va bajarish.

**⚙️ Qanday ishlaydi (qadam-baqadam)**:
1. Vazifa ro'yxati ochiladi (priority bo'yicha tartiblangan — Urgent birinchi)
2. Xodim vazifani ochadi → checklist ko'rinadi
3. Har bir checklist punktini bajargach belgilaydi (choyshab almashtirish, sanuzel tozalash va h.k.)
4. Agar muammo topilsa — "Report Issue" orqali fotosurat bilan xabar beradi
5. Barcha punktlar bajarilgach — "Mark Complete" bosiladi

**🔘 Tugmalar va elementlar**:
| Element | Vazifasi |
|---------|----------|
| **Vazifa kartochkasi (Room 305, High priority)** | Bosilsa — to'liq checklist ochiladi |
| **Checklist checkbox'lari** | Har biri: "Sheets changed", "Bathroom sanitized", "Minibar refilled" va h.k. — belgilash bilan progress % oshadi |
| **📷 "Add Photo" tugmasi** | Oldin/keyin fotosuratlarini yuklash (sifat nazorati uchun) |
| **"Report Issues" tugmasi** | Muammo topilsa (masalan, konditsioner ishlamayapti) — Manager'ga avtomatik maintenance report yuboriladi |
| **"Mark Complete" tugmasi** | Vazifani yakunlaydi, xona statusini "Available/Clean" ga o'zgartiradi, Reception darhol ko'radi |

**👤 Kim foydalanadi**: Housekeeping xodimi

**🔗 API**: `GET /api/housekeeping/tasks`, `POST /api/housekeeping/tasks/{id}/complete`, `POST /api/housekeeping/tasks/{id}/mark-issues`

**⚠️ Muhim biznes-qoida**: Checklist to'liq bajarilmasa (masalan 6 tadan 4 tasi belgilangan), "Mark Complete" tugmasi bosilganda ogohlantirish chiqadi: "2 ta punkt bajarilmagan, davom etasizmi?"

---

## 2.3 ROOM STATUS (Housekeeping ko'rinishi)

**🎯 Maqsad**: Barcha xonalarning tozalik holatini ko'rish (Reception'dagi Room Status'dan farqi — bu yerda faqat tozalik nuqtai nazaridan).

**🔘 Tugmalar va elementlar**:
| Element | Vazifasi |
|---------|----------|
| **Status dropdown (xona ichida)** | Vacant Clean / Vacant Dirty / Occupied Clean / Occupied Dirty / Out of Service |
| **"Update Status" tugmasi** | Manual holat o'zgartirish (agar avtomatik yangilanmagan bo'lsa) |
| **Notes maydoni** | Xona haqida qisqa izoh qoldirish |

**👤 Kim foydalanadi**: Housekeeping xodimi, supervisor

**🔁 Real-time bog'liqlik**: Bu ro'yxat statik emas — Reception tomonidan check-out qilingan xona shu yerda avtomatik "Occupied Dirty" statusida WebSocket orqali darhol paydo bo'ladi (xodim sahifani yangilashi shart emas), va Housekeeping "Mark Complete" bosgach — xona statusi Reception'ning Room Status (1.4) va Dashboard'ida ham darhol "Available" bo'lib ko'rinadi.

**🔗 API**: `PUT /api/housekeeping/rooms/{id}/status`, WebSocket: `room-status-update`

---

## 2.4 FLOOR OVERVIEW

**🎯 Maqsad**: Qavat bo'yicha barcha xonalarni umumiy ko'rish — qaysi qavatda ko'proq ish borligini aniqlash.

**🔘 Tugmalar va elementlar**:
| Element | Vazifasi |
|---------|----------|
| **Qavat tab'lari (3rd Floor, 4th Floor)** | Har bir qavatni alohida ko'rsatadi |
| **Xona ranglar** | Yashil=Clean, Sariq=In Progress, Qizil=Dirty |

**👤 Kim foydalanadi**: Housekeeping xodimi, supervisor

**🔗 API**: `GET /api/housekeeping/rooms/by-floor/{floor}`

---

## 2.5 LOST & FOUND

**🎯 Maqsad**: Xonadan topilgan buyumlarni ro'yxatga olish — bu ma'lumot Manager panelida ham ko'rinadi.

**⚙️ Qanday ishlaydi**:
1. Farrosh xonani tozalayotganda buyum topadi
2. "Add Found Item" orqali fotosurat, tavsif, xona raqamini kiritadi
3. Manager panelida bu ma'lumot avtomatik ko'rinadi

**🔘 Tugmalar va elementlar**:
| Element | Vazifasi |
|---------|----------|
| **"+ Add Found Item" tugmasi** | Yangi topilma qo'shish formasi |
| **📷 Foto yuklash** | Buyum rasmini olish |
| **Room Number, Description maydonlari** | Qaysi xonadan va nima topilgani |
| **"Submit" tugmasi** | Manager'ga yuboriladi, saqlash joyi belgilanadi |

**👤 Kim foydalanadi**: Housekeeping xodimi (qo'shadi), Manager (ko'radi, egasiga qaytaradi)

**🔗 API**: `POST /api/housekeeping/lost-items`

---

## 2.6 SUPPLIES

**🎯 Maqsad**: Tozalash vositalarining zaxirasini ko'rish va yetishmovchilikni bildirish.

**🔘 Tugmalar va elementlar**:
| Element | Vazifasi |
|---------|----------|
| **Mahsulot ro'yxati (Toilet Paper, Soap, Shampoo)** | Joriy zaxira miqdori ko'rsatiladi |
| **"Request Supplies" tugmasi** | Procurement panelga avtomatik so'rov yuboradi (agar kam qolgan bo'lsa) |

**👤 Kim foydalanadi**: Housekeeping supervisor

**🔗 API**: `POST /api/housekeeping/supplies/request`

---

## 2.7 REPORTS

**🎯 Maqsad**: Farroshning shaxsiy ish statistikasi (necha xona tozalandi, o'rtacha vaqt).

**🔘 Tugmalar va elementlar**:
| Element | Vazifasi |
|---------|----------|
| **Davr tanlash (Bugun/Hafta/Oy)** | Statistika davrini belgilaydi |
| **"Download Report" tugmasi** | PDF/Excel formatda yuklab olish |

**👤 Kim foydalanadi**: Housekeeping xodimi, Manager

**🔗 API**: `GET /api/housekeeping/reports`

---

## 2.8 STAFF (faqat supervisor uchun)

**🎯 Maqsad**: Housekeeping supervisor uchun — barcha farroshlarning kunlik ish taqsimotini ko'rish.

**🔘 Tugmalar va elementlar**:
| Element | Vazifasi |
|---------|----------|
| **Xodimlar ro'yxati** | Har biriga tayinlangan xonalar soni |
| **"Reassign Task" tugmasi** | Vazifani boshqa xodimga o'tkazish |

**👤 Kim foydalanadi**: Housekeeping supervisor, Manager

**🔗 API**: `GET /api/housekeeping/staff`, `POST /api/housekeeping/tasks/{id}/reassign`

---

# 3️⃣ BELLBOY PANEL

**Umumiy vazifasi**: Mehmonlarni xonagacha kuzatish, yuklarini tashish, kichik xizmatlarni bajarish.

---

## 3.1 DASHBOARD

**🎯 Maqsad**: Bellboyning kunlik vazifalari statistikasi.

**🔘 Tugmalar va elementlar**:
| Element | Vazifasi |
|---------|----------|
| **"Today's Tasks" kartochkasi** | Jami vazifalar |
| **"In Progress" / "Completed" kartochkalari** | Holat bo'yicha son |
| **"Tips Earned" kartochkasi** | Bugungi choy pul yig'indisi |

**👤 Kim foydalanadi**: Bellboy

**🔗 API**: `GET /api/bellboy/dashboard`

---

## 3.2 MY TASKS

**🎯 Maqsad**: Tayinlangan barcha vazifalarni ko'rish va bajarish (yuk tashish, kuzatib qo'yish, va h.k.)

**⚙️ Qanday ishlaydi**:
1. Yangi vazifa kelganda push-notification keladi
2. Bellboy vazifani ochadi — mehmon, xona, yuk soni ko'rinadi
3. "Start Task" bosiladi (vaqt hisoblanishni boshlaydi)
4. Vazifa bajarilgach "Complete" bosiladi, guest rating so'raladi

**🔘 Tugmalar va elementlar**:
| Element | Vazifasi |
|---------|----------|
| **Vazifa kartochkasi** | Guest name, room, task type, priority |
| **"Accept" / "Decline" tugmalari** | Vazifani qabul qilish yoki rad etish (band bo'lsa) |
| **"Start Task" tugmasi** | Vazifa boshlanganini belgilaydi, vaqt sanog'i ishga tushadi |
| **"Complete" tugmasi** | Vazifani yakunlaydi |
| **Guest rating yulduzchalari** | Mehmon tomonidan berilgan baho (agar mavjud bo'lsa) |

**👤 Kim foydalanadi**: Bellboy

**🔗 API**: `GET /api/bellboy/tasks`, `POST /api/bellboy/tasks/{id}/start`, `POST /api/bellboy/tasks/{id}/complete`

---

## 3.3 GUEST REQUESTS

**🎯 Maqsad**: Mehmonlarning maxsus so'rovlarini ko'rish (qo'shimcha sochiq, yostiq, va h.k.)

**🔘 Tugmalar va elementlar**:
| Element | Vazifasi |
|---------|----------|
| **So'rov kartochkasi** | Guest name, room, request type, requested time |
| **"Accept" tugmasi** | So'rovni qabul qilib, bajarishni boshlaydi |
| **"Complete" tugmasi** | Bajarilgach belgilaydi |

**👤 Kim foydalanadi**: Bellboy

**🔗 API**: `GET /api/bellboy/guest-requests`

---

## 3.4 LUGGAGE TRACKING

**🎯 Maqsad**: Mehmonlarning yuklarini kuzatib borish — ayniqsa erta kelgan yoki kech ketadigan mehmonlar uchun (yuk saqlashda).

**🔘 Tugmalar va elementlar**:
| Element | Vazifasi |
|---------|----------|
| **"+ Store Luggage" tugmasi** | Yangi yukni saqlashga qabul qilish |
| **Tag ID (LTG-2026-00045)** | Har bir yukka noyob raqam beriladi (kvitansiya sifatida) |
| **"Delivered" status tugmasi** | Yuk mehmonga topshirilganda belgilanadi |

**👤 Kim foydalanadi**: Bellboy

**🔗 API**: `POST /api/bellboy/luggage/store`, `POST /api/bellboy/luggage/{id}/deliver`

---

## 3.5 COMPLETED (Tarix)

**🎯 Maqsad**: Bajarilgan barcha vazifalar tarixi.

**🔘 Tugmalar va elementlar**:
| Element | Vazifasi |
|---------|----------|
| **Sana bo'yicha filtr** | Ma'lum kun/hafta vazifalarini ko'rish |
| **Vazifa qatoriga bosish** | To'liq tafsilot, mehmon feedback'i |

**👤 Kim foydalanadi**: Bellboy, Manager

**🔗 API**: `GET /api/bellboy/tasks?status=completed`

---

# 4️⃣ MANAGER PANEL

**Umumiy vazifasi**: Butun mehmonxona faoliyatini nazorat qilish, xodimlarni boshqarish, moliyaviy holatni kuzatish.

---

## 4.1 DASHBOARD / ANALYTICS

**🎯 Maqsad**: Menejer uchun "qush parvozi" ko'rinishi — bir necha soniyada butun holatni tushunish.

**🔘 Tugmalar va elementlar**:
| Element | Vazifasi |
|---------|----------|
| **"Total Revenue" kartochkasi** | Tanlangan davr uchun jami daromad, o'sish foizi bilan |
| **"Occupancy Rate" kartochkasi** | Band xonalar foizi |
| **"ADR" (Average Daily Rate)** | O'rtacha kunlik xona narxi |
| **"RevPAR" kartochkasi** | Har bir mavjud xona uchun daromad (asosiy moliyaviy ko'rsatkich) |
| **"Revenue Overview" grafigi** | Kunlar bo'yicha daromad chizig'i |
| **"Occupancy Overview" donut chart** | Band/Bo'sh/Ta'mirlashdagi xonalar nisbati |
| **Davr tanlash dropdown (This Week/Month)** | Barcha grafiklarni tanlangan davrga moslaydi |

**👤 Kim foydalanadi**: Manager, Admin

**🔗 API**: `GET /api/manager/dashboard`, `GET /api/manager/analytics/revenue`, `GET /api/manager/analytics/occupancy`

---

## 4.2 STAFF PERFORMANCE

**🎯 Maqsad**: Har bir xodimning ish sifatini baholash va nazorat qilish.

**🔘 Tugmalar va elementlar**:
| Element | Vazifasi |
|---------|----------|
| **Xodimlar ro'yxati (rating bilan)** | Ism, rol, rating (yulduzcha), bajargan vazifalar soni |
| **Xodim qatoriga bosish** | To'liq performance tarixi ochiladi |
| **"Assign Schedule" tugmasi** | Farroshlarga kunlik ish rejasini belgilash |

**👤 Kim foydalanadi**: Manager

**🔗 API**: `GET /api/manager/staff`, `GET /api/manager/staff/{id}/performance`

---

## 4.3 TOP ROOM TYPES / TOP REVENUE SOURCES

**🎯 Maqsad**: Qaysi xona turlari eng ko'p daromad keltirayotganini ko'rish — narx siyosatini to'g'irlash uchun.

**🔘 Tugmalar va elementlar**:
| Element | Vazifasi |
|---------|----------|
| **Ro'yxat (Deluxe Room $68,340)** | Har bir xona turi bo'yicha daromad |
| **Sortlash strelkasi** | Eng yuqori/past daromad bo'yicha tartiblash |

**👤 Kim foydalanadi**: Manager

**🔗 API**: `GET /api/manager/analytics/room-performance`

---

## 4.4 BOOKINGS (Manager ko'rinishi)

**🎯 Maqsad**: Barcha bronlarni nazorat qilish (Reception qilgan ishlarni tekshirish uchun) — faqat ko'rish emas, kerak bo'lganda aralashish huquqi bilan.

**🔘 Tugmalar va elementlar**:
| Element | Vazifasi |
|---------|----------|
| **Filtr tab'lari (All/Upcoming/Completed/Cancelled)** | Reception'dagi kabi, lekin barcha xodimlarning bronlarini birgalikda ko'rsatadi |
| **"Created By" ustuni** | Bronni qaysi Reception xodimi yaratganini ko'rsatadi (nazorat uchun) |
| **Bron qatoriga bosish** | To'liq tafsilot: mehmon, xona, narx, to'lov holati, o'zgarishlar tarixi |
| **"Override Cancel" tugmasi** | Manager huquqi bilan Reception yarata olmaydigan holatlarda ham bronni bekor qilish (statusni "Cancelled"ga o'zgartiradi, DELETE emas — 1.5-bo'limdagi qoida shu yerda ham amal qiladi) |

**👤 Kim foydalanadi**: Manager

**🔗 API**: `GET /api/manager/bookings`, `PATCH /api/manager/bookings/{booking_code}/cancel`

---

## 4.5 LOST & FOUND (Manager ko'rinishi)

**🎯 Maqsad**: Housekeeping tomonidan topilgan buyumlarni ko'rish va egasiga qaytarish jarayonini boshqarish.

**🔘 Tugmalar va elementlar**:
| Element | Vazifasi |
|---------|----------|
| **Topilma ro'yxati (foto bilan)** | Har biri: room, date, description, status |
| **"Mark as Returned" tugmasi** | Egasiga qaytarilgach belgilanadi, arxivga o'tadi |

**👤 Kim foydalanadi**: Manager

**🔗 API**: `GET /api/manager/lost-items`, `POST /api/manager/lost-items/{id}/return`

---

## 4.6 MAINTENANCE REQUESTS ⭐ (Yangi — Housekeeping'dan kelgan muammolarni yopish uchun)

**🎯 Maqsad**: Housekeeping xodimi "Report Issues" (2.2-bo'lim) orqali yuborgan texnik muammolarni (konditsioner ishlamayapti, santexnika buzilgan va h.k.) qabul qilish, ustaga topshirish va yopilishini nazorat qilish. Bu bo'lim bo'lmasa, Housekeeping'dan kelgan xabarlar hech qayerda ko'rinmay qolar edi.

**⚙️ Qanday ishlaydi**:
1. Housekeeping xodimi muammoni fotosurat bilan yuboradi → shu yerda "New" statusida paydo bo'ladi
2. Manager muammoni ko'rib, ustaga (ichki xodim yoki tashqi pudratchi) tayinlaydi
3. Agar xona vaqtincha ishlatib bo'lmasa — xona statusi "Maintenance"ga o'tkaziladi (Room Status'da ham ko'rinadi)
4. Ish tugagach — "Resolved" deb belgilanadi, xona yana "Available"ga qaytadi

**🔘 Tugmalar va elementlar**:
| Element | Vazifasi |
|---------|----------|
| **Status tab'lari (New/In Progress/Resolved)** | Muammolarni holati bo'yicha filtrlaydi |
| **Muammo kartochkasi (xona raqami, foto, tavsif)** | Housekeeping yuborgan asl xabar |
| **"Assign to Technician" tugmasi** | Muammoni mas'ul xodim/pudratchiga biriktiradi |
| **"Mark Room as Under Maintenance" tugmasi** | Xona statusini "Maintenance"ga o'zgartiradi (Reception va Housekeeping'da darhol ko'rinadi) |
| **"Resolve" tugmasi** | Muammoni yopiladi deb belgilaydi, xonani "Available" statusiga qaytaradi |

**👤 Kim foydalanadi**: Manager

**🔗 API**: `GET /api/manager/maintenance-requests`, `POST /api/manager/maintenance-requests/{id}/assign`, `POST /api/manager/maintenance-requests/{id}/resolve`

---

## 4.7 REPORTS

**🎯 Maqsad**: Chuqur moliyaviy va operatsion hisobotlar (Reception'dagi tezkor hisobotdan farqli — bu yerda batafsil, eksport qilinadigan).

**🔘 Tugmalar va elementlar**:
| Element | Vazifasi |
|---------|----------|
| **"Daily Report" / "Monthly Report" tugmalari** | Turli davr hisobotlari |
| **"Generate Report" tugmasi** | PDF/Excel formatda hisobot yaratadi |
| **"Export" tugmasi** | Buxgalteriya tizimiga yuborish uchun eksport |

**👤 Kim foydalanadi**: Manager, Admin

**🔗 API**: `GET /api/manager/reports/daily`, `GET /api/manager/reports/monthly`

---

## 4.8 SETTINGS (Manager darajasida)

**🎯 Maqsad**: Xona turlari, narxlar, mavsumiy tariflarni boshqarish.

**🔘 Tugmalar va elementlar**:
| Element | Vazifasi |
|---------|----------|
| **"Room Types" boshqaruvi** | Yangi xona turi qo'shish, narxini o'zgartirish |
| **"Seasonal Rates" jadvali** | Mavsumga qarab narx belgilash (yozgi, qishki tarif) |

**👤 Kim foydalanadi**: Manager

**🔗 API**: `PUT /api/manager/settings/rates`

---

# 5️⃣ PROCUREMENT PANEL

**Umumiy vazifasi**: Mehmonxonaga kerakli mahsulotlarni ta'minlash — ta'minotchilar bilan ishlash, buyurtma berish, ombor nazorati.

---

## 5.1 DASHBOARD

**🎯 Maqsad**: Ta'minot holatini bir qarashda ko'rish.

**🔘 Tugmalar va elementlar**:
| Element | Vazifasi |
|---------|----------|
| **"Active PO" kartochkasi** | Jarayondagi buyurtmalar soni |
| **"Pending Invoices" kartochkasi** | Tasdiqlanishi kerak bo'lgan hisob-fakturalar |
| **"Low Stock Items" kartochkasi** | Zaxirasi kam qolgan mahsulotlar (qizil ogohlantirish) |
| **"Total Spend" kartochkasi** | Tanlangan davr uchun jami xarajat |
| **"Top Categories" donut chart** | Qaysi kategoriyaga ko'proq pul ketayotgani |

**👤 Kim foydalanadi**: Procurement Manager

**🔗 API**: `GET /api/procurement/dashboard`

---

## 5.2 VENDORS

**🎯 Maqsad**: Ta'minotchilar ro'yxatini boshqarish.

**⚙️ Qanday ishlaydi**:
1. "+ Add Vendor" orqali yangi ta'minotchi qo'shiladi
2. Har bir ta'minotchiga login/parol beriladi (o'z paneliga kirishi uchun)
3. Ta'minotchi faoliyati (rating, on-time delivery) kuzatiladi

**🔘 Tugmalar va elementlar**:
| Element | Vazifasi |
|---------|----------|
| **"+ Add Vendor" tugmasi** | Yangi ta'minotchi qo'shish formasi (nomi, aloqa, kategoriya) |
| **Vendor ro'yxati (rating bilan)** | Har biri: nomi, kategoriya, rating, holat (Active/Inactive) |
| **"Edit" tugmasi** | Ta'minotchi ma'lumotlarini tahrirlash |
| **"Deactivate" tugmasi** | Shartnoma tugagan ta'minotchini faolsizlantirish (o'chirmasdan) |

**👤 Kim foydalanadi**: Procurement Manager

**🔗 API**: `POST /api/procurement/vendors`, `PUT /api/procurement/vendors/{id}`

---

## 5.3 PURCHASE ORDERS

**🎯 Maqsad**: Ta'minotchilarga buyurtma yaratish va yuborish.

**⚙️ Qanday ishlaydi (qadam-baqadam)**:
1. "Create PO" bosiladi
2. Kerakli mahsulotlar va miqdori kiritiladi
3. Tizim tegishli ta'minotchiga avtomatik yo'naltiradi (kategoriya bo'yicha)
4. Ta'minotchi narxni kiritadi (o'z panelidan)
5. Procurement Manager narxlarni solishtiradi va tasdiqlaydi
6. Mahsulot yetib kelgach — "Receive" bosiladi, ombor yangilanadi

**🔘 Tugmalar va elementlar**:
| Element | Vazifasi |
|---------|----------|
| **"Create Purchase Order" tugmasi** | Yangi PO formasi ochiladi |
| **Vendor tanlash dropdown** | Kategoriya bo'yicha filtrlangan ta'minotchilar |
| **Mahsulot qo'shish qatorlari** | Har bir mahsulot: nomi, miqdori, birligi |
| **"Send to Vendor" tugmasi** | PO'ni ta'minotchiga yuboradi (email + panel notification) |
| **Status badge (Pending/Approved/Received)** | PO joriy holati |
| **"Receive" tugmasi** | Mahsulot yetib kelganda bosiladi — ombor miqdori avtomatik oshadi |

**👤 Kim foydalanadi**: Procurement Manager

**🔗 API**: `POST /api/procurement/purchase-orders`, `POST /api/procurement/purchase-orders/{id}/receive`

---

## 5.4 INVENTORY

**🎯 Maqsad**: Ombordagi barcha mahsulotlarning joriy miqdorini kuzatish.

**🔘 Tugmalar va elementlar**:
| Element | Vazifasi |
|---------|----------|
| **Mahsulot ro'yxati (miqdor bilan)** | Har biri: nomi, joriy miqdor, min/max daraja |
| **Qizil ogohlantirish belgisi** | Agar miqdor min darajadan past bo'lsa |
| **"Reorder" tugmasi** | Avtomatik PO yaratadi (agar kam qolgan bo'lsa) |
| **"Adjust Quantity" tugmasi** | Manual tuzatish (masalan, shikastlangan mahsulot chiqarib tashlash) |

**👤 Kim foydalanadi**: Procurement Manager

**🔗 API**: `GET /api/procurement/inventory`, `POST /api/procurement/inventory/reorder`

---

## 5.5 GOODS RECEIVED

**🎯 Maqsad**: Yetib kelgan mahsulotlarni tasdiqlash va sifatini tekshirish.

**🔘 Tugmalar va elementlar**:
| Element | Vazifasi |
|---------|----------|
| **PO ro'yxati (kutilayotgan)** | Yetib kelishi kerak bo'lgan buyurtmalar |
| **"Confirm Delivery" tugmasi** | Mahsulot soni va sifatini tasdiqlash |
| **📷 Foto yuklash** | Shikastlangan mahsulot bo'lsa dalil sifatida |

**👤 Kim foydalanadi**: Procurement Manager

**🔗 API**: `POST /api/procurement/purchase-orders/{id}/receive`

---

## 5.6 INVOICES

**🎯 Maqsad**: Ta'minotchilardan kelgan hisob-fakturalarni tasdiqlash.

**🔘 Tugmalar va elementlar**:
| Element | Vazifasi |
|---------|----------|
| **Invoice ro'yxati** | Vendor, summa, muddat, holat |
| **"Approve" tugmasi** | Hisob-fakturani tasdiqlaydi, to'lovga tayyorlaydi |
| **"Reject" tugmasi** | Nomuvofiqlik bo'lsa rad etadi, sababini yozadi |

**👤 Kim foydalanadi**: Procurement Manager

**🔗 API**: `POST /api/procurement/invoices/{id}/approve`

---

## 5.7 PAYMENTS (Procurement)

**🎯 Maqsad**: Ta'minotchilarga to'lovlarni amalga oshirish.

**🔘 Tugmalar va elementlar**:
| Element | Vazifasi |
|---------|----------|
| **"Pay Now" tugmasi** | Bank o'tkazmasi yoki naqd to'lovni belgilaydi |
| **To'lov usuli tanlash** | Bank Transfer / Cash / Check |
| **Chek/kvitansiya generatsiyasi** | To'lov yakunlangach avtomatik yaratiladi |

**👤 Kim foydalanadi**: Procurement Manager

**🔗 API**: `POST /api/procurement/payments`

---

## 5.8 REPORTS (Procurement)

**🎯 Maqsad**: Xarajatlar tahlili — qaysi ta'minotchiga qancha pul ketgani, qaysi mahsulot ko'p sarflangani.

**👤 Kim foydalanadi**: Procurement Manager, Admin

**🔗 API**: `GET /api/procurement/reports`

---

# 6️⃣ ADMIN PANEL

**Umumiy vazifasi**: Butun tizimning texnik va moliyaviy nazorati. Eng yuqori huquqga ega panel.

---

## 6.1 DASHBOARD

**🎯 Maqsad**: Tizimning umumiy holatini ko'rish — foydalanuvchilar, daromad, tizim salomatligi.

**🔘 Tugmalar va elementlar**:
| Element | Vazifasi |
|---------|----------|
| **"Total Users" kartochkasi** | Tizimdagi barcha xodimlar soni |
| **"Active Users" kartochkasi** | Hozir tizimga kirgan foydalanuvchilar |
| **"Total Revenue" kartochkasi** | Umumiy daromad (barcha manbalardan) |
| **"System Uptime" kartochkasi** | Server ishlash foizi (99.9%) |
| **"Database Status" indikatori** | Healthy/Warning/Error — texnik holat |
| **"Backup Status" kartochkasi** | Oxirgi zaxira nusxa qachon olingani |

**👤 Kim foydalanadi**: Admin (Super Admin)

**🔗 API**: `GET /api/admin/dashboard`, `GET /api/admin/system/health`

---

## 6.2 USERS & ROLES

**🎯 Maqsad**: Barcha xodimlarni boshqarish — qo'shish, o'chirish, rolini o'zgartirish.

**⚙️ Qanday ishlaydi**:
1. "+ Add User" bosiladi
2. Ism, email, rol tanlanadi
3. Tizim avtomatik login ma'lumotlarini email orqali yuboradi
4. Admin istalgan vaqtda xodim rolini o'zgartirishi yoki bloklashi mumkin

**🔘 Tugmalar va elementlar**:
| Element | Vazifasi |
|---------|----------|
| **"Users" / "Roles" tab'lari** | Foydalanuvchilar ro'yxati yoki rollar ro'yxati |
| **"+ Add User" tugmasi** | Yangi xodim qo'shish formasi |
| **Rol badge (Manager/Staff)** | Har bir xodimning rolini rangli ko'rsatadi |
| **"..." menyu (har foydalanuvchi qatorida)** | Edit / Deactivate / Reset Password variantlari |

**👤 Kim foydalanadi**: Admin

**🔗 API**: `POST /api/admin/users`, `PUT /api/admin/users/{id}`, `DELETE /api/admin/users/{id}`

---

## 6.3 PERMISSIONS (RBAC)

**🎯 Maqsad**: Har bir rol nimani ko'ra olishi/qila olishini nozik sozlash.

**⚙️ Qanday ishlaydi**:
1. Rol tanlanadi (masalan "Reception Manager")
2. Har bir modul uchun (Dashboard, Bookings, Payments) toggle switch orqali ruxsat beriladi/olib tashlanadi

**🔘 Tugmalar va elementlar**:
| Element | Vazifasi |
|---------|----------|
| **"Select Role" dropdown** | Qaysi rol uchun sozlanayotgani |
| **Modul toggle switch'lari** | Har bir bo'lim uchun: View / Create / Edit / Delete ruxsatlari alohida-alohida |
| **"Save Permissions" tugmasi** | O'zgarishlarni saqlaydi, darhol kuchga kiradi |

**👤 Kim foydalanadi**: Admin

**🔗 API**: `PUT /api/admin/roles/{id}/permissions`

**⚠️ Muhim biznes-qoida**: Permissions o'zgartirilgach, agar xodim tizimga kirgan bo'lsa — uning sessiyasi darhol yangi huquqlar bilan yangilanadi (real-time, qayta login talab qilinmaydi).

---

## 6.4 PAYMENT GATEWAYS

**🎯 Maqsad**: To'lov tizimlarini (Click, Payme, Stripe, PayPal, Uzum) sozlash va faollashtirish.

**🔘 Tugmalar va elementlar**:
| Element | Vazifasi |
|---------|----------|
| **"+ Add Gateway" tugmasi** | Yangi to'lov tizimini ulash |
| **Gateway kartochkasi (Click, Payme...)** | Merchant ID, holat (Active/Inactive) ko'rsatiladi |
| **Toggle switch (Active/Inactive)** | Gateway'ni yoqish/o'chirish |
| **"Edit Credentials" tugmasi** | API kalitlarini yangilash (shifrlangan holda saqlanadi) |

**👤 Kim foydalanadi**: Admin

**🔗 API**: `GET /api/admin/settings/payment-gateways`, `PUT /api/admin/settings/payment-gateways/{id}`

**⚠️ Muhim biznes-qoida**: API kalitlari (`api_key`, `api_secret`) hech qachon frontend'ga to'liq qaytarilmaydi — faqat oxirgi 4 ta belgi ko'rsatiladi (masalan `****3456`).

---

## 6.5 SYSTEM SETTINGS

**🎯 Maqsad**: Mehmonxonaning umumiy ma'lumotlarini sozlash.

**🔘 Tugmalar va elementlar**:
| Element | Vazifasi |
|---------|----------|
| **Hotel Name, Address, Logo yuklash** | Asosiy identifikatsiya ma'lumotlari |
| **Ijtimoiy tarmoq linklari** | Instagram, Facebook, Telegram |
| **Rang tema tanlash** | Dastur asosiy rangi (brend rangiga moslash) |
| **Til sozlamalari** | Qaysi tillar interfeysda mavjud (EN/UZ/RU) |
| **"Save Settings" tugmasi** | Barcha o'zgarishlarni saqlaydi |

**👤 Kim foydalanadi**: Admin

**🔗 API**: `PUT /api/admin/settings`

---

## 6.6 AUDIT LOGS

**🎯 Maqsad**: Tizimda kim, qachon, nima qilganini kuzatish — xavfsizlik va javobgarlik uchun.

**🔘 Tugmalar va elementlar**:
| Element | Vazifasi |
|---------|----------|
| **Qidiruv maydoni** | Foydalanuvchi yoki action bo'yicha qidirish |
| **"All Actions" / "All Users" filtrlar** | Log'larni toraytirish |
| **Log qatori (User Login, Payment Received...)** | Vaqt, foydalanuvchi, amal ko'rsatiladi |
| **Pagination (1, 2, 3...50)** | Ko'p sonli log'larni sahifalarga bo'lib ko'rsatish |

**👤 Kim foydalanadi**: Admin

**🔗 API**: `GET /api/admin/audit-logs`

**⚠️ Muhim biznes-qoida**: Audit log'lar **hech qachon o'chirilmaydi yoki tahrirlanmaydi** — bu qonuniy talab (compliance).

---

## 6.7 FINANCIAL REPORTS

**🎯 Maqsad**: Butun mehmonxonaning moliyaviy holatini yuqori darajada ko'rish.

**🔘 Tugmalar va elementlar**:
| Element | Vazifasi |
|---------|----------|
| **Oylik/Kunlik tab'lar** | Hisobot davri |
| **Revenue vs Expenses grafigi** | Daromad va xarajatni solishtirish |
| **"Export to Excel/PDF" tugmasi** | Buxgalteriya uchun eksport |

**👤 Kim foydalanadi**: Admin

**🔗 API**: `GET /api/admin/financial/dashboard`

---

## 6.8 BACKUP & RESTORE

**🎯 Maqsad**: Ma'lumotlar bazasi zaxira nusxalarini boshqarish.

**🔘 Tugmalar va elementlar**:
| Element | Vazifasi |
|---------|----------|
| **"Create Backup Now" tugmasi** | Darhol zaxira nusxa yaratadi |
| **Backup ro'yxati (sana, hajm)** | Oldingi zaxiralar |
| **"Restore" tugmasi** | Tanlangan zaxiradan tiklaydi (ehtiyotkorlik bilan — tasdiqlash so'raladi) |

**👤 Kim foydalanadi**: Admin

**🔗 API**: `POST /api/admin/backup/create`, `POST /api/admin/backup/{id}/restore`

---

## 6.9 INTEGRATIONS

**🎯 Maqsad**: Tashqi tizimlar bilan ulanishni boshqarish (Booking.com, SMS provider, Email SMTP).

**🔘 Tugmalar va elementlar**:
| Element | Vazifasi |
|---------|----------|
| **Booking.com kartochkasi** | Ulanish holati, oxirgi sync vaqti |
| **"Sync Now" tugmasi** | Manual ravishda darhol sinxronlashtirish |
| **SMTP/SMS sozlamalari** | Email va SMS provayder ma'lumotlari |
| **Key Card / Door Lock tizimi kartochkasi** | Elektron eshik qulfi provayderi bilan ulanish holati — Reception'ning Check-in (1.2) bo'limida "Kalit-karta faollashtirish" shu integratsiyaga tayanadi |

**👤 Kim foydalanadi**: Admin

**🔗 API**: `GET /api/admin/integrations`, `POST /api/admin/integrations/booking-com/sync`, `PUT /api/admin/integrations/key-card-system`

---

# 7️⃣ GUEST PANEL

**Umumiy vazifasi**: Mehmon o'zi mustaqil ravishda xona qidiradi, bron qiladi, onlayn to'lov qiladi va o'z bronlarini kuzatadi. Boshqa 6 panel xodimlar uchun, bu panel esa **tashqi foydalanuvchi — mehmon** uchun, shuning uchun UI soddaligi va faqat o'z ma'lumotlarini ko'ra olishi (xavfsizlik) alohida muhim.

---

## 7.1 LOGIN / REGISTER

**🎯 Maqsad**: Mehmonni ro'yxatdan o'tkazish yoki tizimga kiritish — bron qilish va shaxsiy kabinetga kirish uchun zarur.

**⚙️ Qanday ishlaydi**:
1. Mehmon telefon raqami yoki email orqali ro'yxatdan o'tadi
2. Agar 2FA yoqilgan bo'lsa — SMS/email orqali tasdiqlash kodi yuboriladi
3. Kod tasdiqlangach parol o'rnatiladi
4. Keyingi kirishlarda telefon/email + parol (yoki 2FA kodi) orqali kiriladi

**🔘 Tugmalar va elementlar**:
| Element | Vazifasi |
|---------|----------|
| **"Ro'yxatdan o'tish" / "Kirish" tab'lari** | Formani almashtiradi |
| **Phone/Email, Password maydonlari** | Kirish/ro'yxatdan o'tish uchun asosiy maydonlar |
| **"Kod yuborish" tugmasi** | 2FA yoqilgan bo'lsa, SMS/email orqali tasdiqlash kodini yuboradi |
| **"Tasdiqlash" tugmasi** | Kiritilgan kodni tekshiradi, muvaffaqiyatli bo'lsa tizimga kiritadi |
| **"Parolni unutdim" havolasi** | Parolni tiklash oqimini boshlaydi |

**👤 Kim foydalanadi**: Mehmon (yangi yoki mavjud)

**🔗 API**: `POST /api/guest/register`, `POST /api/guest/login`, `POST /api/guest/verify-otp`

**⚠️ Muhim biznes-qoida**: Agar mehmon avval Reception orqali qo'shilgan bo'lsa (1.7 Add Guest), ro'yxatdan o'tishda xuddi shu telefon raqami aniqlanib mavjud profilga bog'lanadi — bitta mehmon uchun ikkita alohida yozuv yaratilmaydi.

---

## 7.2 HOME / ROOM SEARCH (Hero Landing)

**🎯 Maqsad**: Mehmon xona turlari, narxlar va bo'sh joylarni ko'radigan, bron qilishni boshlaydigan bosh sahifa.

**🔘 Tugmalar va elementlar**:
| Element | Vazifasi |
|---------|----------|
| **Check-in / Check-out sana tanlash** | Qidiruv davri belgilanadi |
| **Mehmonlar soni selektori** | Necha kishi uchun xona kerakligini belgilaydi |
| **"Search Rooms" tugmasi** | Tanlangan sana va mehmon soniga mos bo'sh xonalarni ko'rsatadi |
| **Xona kartochkasi (rasm, narx, xususiyatlar)** | Bosilsa — xona tafsiloti va bron qilish jarayoni (7.3) ochiladi |
| **Til almashtirish tugmasi (EN/UZ/RU)** | Sahifa tilini o'zgartiradi |

**👤 Kim foydalanadi**: Mehmon (login qilmasdan ham ko'rish mumkin; bron qilish uchun login talab qilinadi)

**🔗 API**: `GET /api/guest/rooms/available`

---

## 7.3 BOOKING PROCESS

**🎯 Maqsad**: Tanlangan xona uchun bosqichma-bosqich bron rasmiylashtirish.

**⚙️ Qanday ishlaydi (qadam-baqadam)**:
1. Xona va sanalar tanlangach "Book Now" bosiladi
2. Mehmon shaxsiy ma'lumotlarini tasdiqlaydi (profildan avtomatik to'ldiriladi)
3. Maxsus istaklar (agar bo'lsa) kiritiladi
4. Narx tafsiloti (xona narxi × kunlar soni + soliq) ko'rsatiladi
5. "Continue to Payment" bosiladi → 7.4 Payment bosqichiga o'tiladi

**🔘 Tugmalar va elementlar**:
| Element | Vazifasi |
|---------|----------|
| **Bosqich indikatori (1-Details, 2-Payment, 3-Confirmation)** | Jarayonning qaysi bosqichida ekanini ko'rsatadi |
| **"Special Requests" matn maydoni** | Maxsus istaklarni yozish |
| **Narx tafsiloti bloki** | Real-time hisoblanadi |
| **"Continue to Payment" tugmasi** | Keyingi bosqichga o'tadi, bron "Pending Payment" statusida vaqtinchalik yaratiladi |
| **"Back" tugmasi** | Oldingi bosqichga qaytadi |

**👤 Kim foydalanadi**: Login qilgan mehmon

**🔗 API**: `POST /api/guest/bookings/draft`

**⚠️ Muhim biznes-qoida**: "Pending Payment" statusidagi bron 15 daqiqa ichida to'lanmasa, avtomatik bekor qilinadi va xona yana bo'sh xonalar ro'yxatiga qaytadi — xona boshqa mehmonlar uchun asossiz "band" bo'lib turmasligi kerak.

---

## 7.4 PAYMENT MODAL

**🎯 Maqsad**: Bronni onlayn to'lov orqali yakunlash.

**🔘 Tugmalar va elementlar**:
| Element | Vazifasi |
|---------|----------|
| **To'lov usuli tanlash (Click/Payme)** | Admin panelida (6.4) faollashtirilgan gateway'lar ro'yxatidan dinamik olinadi |
| **"Pay Now" tugmasi** | Tanlangan gateway'ning to'lov sahifasiga/QR'iga yo'naltiradi |
| **To'lov holati indikatori (kutilmoqda/muvaffaqiyatli/xato)** | Gateway webhook orqali real-time yangilanadi |
| **"Qayta urinish" tugmasi** | To'lov muvaffaqiyatsiz bo'lsa qayta urinish imkonini beradi |

**👤 Kim foydalanadi**: Login qilgan mehmon

**🔗 API**: `POST /api/payments/{gateway}/create-url`, webhook: `POST /api/payments/{gateway}/webhook`

**⚠️ Muhim biznes-qoida**: To'lov summasi hech qachon frontend so'rovidan qabul qilinmaydi — server bron yaratilgandagi asl narxni bazadan olib, shu summaga to'lov so'rovi yaratadi (narx bilan firibgarlik qilishning oldini olish uchun).

---

## 7.5 MY BOOKINGS

**🎯 Maqsad**: Mehmon o'zining barcha (kelgusi, joriy, o'tgan, bekor qilingan) bronlarini ko'rishi.

**🔘 Tugmalar va elementlar**:
| Element | Vazifasi |
|---------|----------|
| **Tab'lar (Upcoming/Active/Past/Cancelled)** | Bronlarni statusi bo'yicha filtrlaydi |
| **Bron kartochkasi** | Xona, sanalar, narx, status ko'rsatiladi |
| **"View Receipt" tugmasi** | 7.6 Receipt oynasini ochadi |
| **"Cancel Booking" tugmasi** | Faqat check-in sanasiga qadar hotel siyosatida belgilangan muddatdan (masalan 24 soat) oldin faol bo'ladi; bosilsa bronni "Cancelled" statusiga o'tkazadi (DELETE emas — 1.5-bo'limdagi qoida shu yerda ham amal qiladi) |

**👤 Kim foydalanadi**: Login qilgan mehmon

**🔗 API**: `GET /api/guest/bookings`, `PATCH /api/guest/bookings/{booking_code}/cancel`

---

## 7.6 RECEIPT MODAL

**🎯 Maqsad**: To'langan bron uchun chekni ko'rish va yuklab olish.

**🔘 Tugmalar va elementlar**:
| Element | Vazifasi |
|---------|----------|
| **Chek tafsiloti** | Xona, sanalar, narx tafsiloti, to'lov usuli |
| **"Download PDF" tugmasi** | Chekni PDF formatda yuklaydi |
| **"Emailga yuborish" tugmasi** | Chekni mehmon email manziliga yuboradi |

**👤 Kim foydalanadi**: Login qilgan mehmon

**🔗 API**: `GET /api/guest/receipts/{id}`

---

## 7.7 SETTINGS (Guest darajasida)

**🎯 Maqsad**: Mehmonning shaxsiy profilini boshqarishi.

**🔘 Tugmalar va elementlar**:
| Element | Vazifasi |
|---------|----------|
| **Profil ma'lumotlari (ism, telefon, email, tug'ilgan sana, passport)** | Tahrirlash mumkin |
| **"Change Password"** | Parolni yangilash |
| **Til tanlash (EN/UZ/RU)** | Interfeys tilini o'zgartiradi |
| **2FA yoqish/o'chirish tugmasi** | Ikki bosqichli tasdiqlashni boshqaradi |
| **Notification toggle'lari** | Bron tasdiqlash, eslatmalar, aksiyalar haqidagi xabarnomalar sozlanadi |

**👤 Kim foydalanadi**: Login qilgan mehmon

**🔗 API**: `PUT /api/guest/settings`

---

## 7.8 SUPPORT MODAL

**🎯 Maqsad**: Mehmon savol yoki muammo bo'lganda mehmonxona bilan bevosita bog'lanishi.

**🔘 Tugmalar va elementlar**:
| Element | Vazifasi |
|---------|----------|
| **Mavzu tanlash dropdown** | Bron, to'lov, umumiy savol va h.k. |
| **Xabar matni maydoni** | Muammoni yozib yuborish |
| **"Yuborish" tugmasi** | Xabarni Reception'ga (yoki belgilangan support navbatiga) yuboradi |
| **Telefon/WhatsApp tezkor havolasi** | To'g'ridan-to'g'ri qo'ng'iroq/chatga o'tadi |

**👤 Kim foydalanadi**: Login qilgan mehmon

**🔗 API**: `POST /api/guest/support-requests`

---

# 📊 UMUMIY XULOSA — YANGI QO'SHILGAN BO'LIMLAR

Bu hujjat orqali quyidagi **avval tushib qolgan** bo'limlar to'ldirildi:

| Panel | Yangi qo'shilgan bo'lim |
|-------|------------------------|
| Reception | **Guest Ledger** ⭐ (butunlay yo'q edi) |
| Reception | New Booking, Add Guest modal'lari batafsil |
| Housekeeping | Floor Overview, Supplies, Staff (supervisor) |
| Bellboy | Guest Requests (alohida bo'lim sifatida) |
| Manager | Top Room Types / Revenue Sources tafsiloti |
| Procurement | Goods Received (alohida bosqich sifatida) |
| Admin | Integrations (Booking.com sync boshqaruvi, Key Card tizimi) |
| Manager | **Maintenance Requests** ⭐ (butunlay yo'q edi) |
| — | **Guest Panel** ⭐ (7-panel sifatida, butunlay yo'q edi — endi shu hujjatda) |

Bundan tashqari, quyidagi **nomuvofiqlik va bo'shliqlar** tuzatildi:

| Muammo | Tuzatish |
|--------|----------|
| Bron identifikatori har joyda boshqacha nomlangan edi (`booking_ref`, `booking_id`, "Booking ID") | Yagona `booking_code` atamasiga standartlashtirildi (hujjat boshida "Umumiy qoidalar"da izohlangan) |
| Bron bekor qilish `DELETE` bilan yozuvni butunlay o'chirar edi — bu Audit Logs (6.6) qoidasiga zid | `PATCH .../cancel` (status o'zgarishi) ga almashtirildi, biznes-qoida qo'shildi |
| Reception Payments faqat "Click"ni bilar edi, Admin esa bir nechta gateway boshqarardi | Online to'lov ro'yxati endi Admin'da faollashtirilgan gateway'lardan dinamik olinadi |
| "Settings" faqat Reception'da tasvirlangan edi, boshqa 5 panelda umuman yo'q edi | Umumiy header komponenti sifatida barcha panellar uchun izohlandi |
| Housekeeping va Reception Room Status o'rtasidagi real-time bog'liqlik faqat kirish qismida aytilgan, tegishli bo'limda yo'q edi | 2.3-bo'limga aniq WebSocket oqimi tavsifi qo'shildi |
| Manager > Bookings bo'limi 1 qatordan iborat edi, boshqa bo'limlar darajasida emas | To'liq tugma jadvali va Override Cancel huquqi qo'shildi |
| Check-in'dagi "kalit-karta faollashtirish" hech qayerda sozlanmagan edi | Admin > Integrations (6.9) ga Key Card/Door Lock tizimi qo'shildi |
| Guest Ledger'dagi "Balance" qanday hisoblanishi tushuntirilmagan edi | Hisoblash formulasi qo'shildi |

**Foydalanuvchi tasdig'i bilan qo'shilgan yangi bo'limlar**:
- **7️⃣ GUEST PANEL** — hujjatda butunlay yo'q edi ("alohida hujjatda" deb qoldirilgan edi), endi boshqa 6 panel bilan bir xil chuqurlikda (Login/Register, Home/Room Search, Booking Process, Payment, My Bookings, Receipt, Settings, Support) to'liq yozildi.
- **Manager > 4.6 MAINTENANCE REQUESTS** — Housekeeping'ning "Report Issues" (2.2) orqali yuborgan muammolari endi shu yerda qabul qilinadi, ustaga tayinlanadi va yopiladi (avval hech qayerda ko'rinmas edi).

**Har bir bo'lim endi quyidagilarga ega**:
- 🎯 Aniq maqsad (nega kerak)
- ⚙️ Ish jarayoni (qadam-baqadam)
- 🔘 Har bir tugma va uning aniq vazifasi
- 👤 Kim foydalanishi
- 🔗 Tegishli API endpoint
- ⚠️ Muhim biznes-qoidalar (bo'lganda)

---

## 🎯 AI AGENTGA BERISH UCHUN

```
"Bu hujjatni hotel-erp-backend-complete.md prompt bilan birga o'qib chiq.

Bu hujjat — barcha 7 panelning (Reception, Housekeeping, Bellboy, Manager,
Procurement, Admin, Guest) har bir bo'limi VA har bir tugmaning ANIQ
vazifasini tushuntiradi. Backend va frontend kod yozayotganda:

1. Har bir tugma bosilganda NIMA sodir bo'lishi kerakligini shu yerdan bil
2. Har bir bo'limning MAQSADINI tushunib, shunga mos biznes-mantiq yoz
3. 'Muhim biznes-qoida' deb belgilangan qismlarni AJRATIB, alohida validation sifatida qo'sh
4. Hujjat boshidagi 'UMUMIY QOIDALAR'ga rioya qil: barcha bronlar uchun
   YAGONA `booking_code` ishlat, bekor qilishda hech qachon DELETE emas
   status o'zgartirish (PATCH) ishlat, Settings komponentini barcha
   panellarda bitta umumiy komponent sifatida yoz
5. Guest Ledger va Maintenance Requests kabi avval tushib qolgan
   bo'limlarni backend-complete.md fayliga QO'SHIMCHA API va jadval
   sifatida qo'sh (masalan guest_ledger view, maintenance_requests jadvali)
6. Guest Panel (7-bo'lim) uchun alohida guest-auth (JWT) va staff-auth
   (JWT) tizimlarini bir-biridan ajratib yoz — ikkalasi bir xil
   middleware'dan foydalanmasin

Ikkala hujjatni birlashtirib, to'liq ishlaydigan backend va frontend yarat."
```

---

**STATUS**: ✅ Barcha 7 panel (Guest Panel bilan birga), har bir bo'lim va tugma darajasida tushuntirilgan, nomuvofiqliklar (booking_code, DELETE→cancel, Settings, real-time bog'lanish) tuzatilgan
**MAQSAD**: AI agent endi "nima qaytarish kerak" emas, "NEGA va QANDAY ishlashi kerak"ligini biladi
