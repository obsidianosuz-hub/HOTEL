const prisma = require('../utils/prismaClient');
const crypto = require('crypto');
const { toJson, fromJson } = require('../utils/jsonHelper');


// ==========================================
// CLICK TO'LOV GATEWAY
// ==========================================

// POST /api/payments/click/create-url — to'lov havolasi yaratish
exports.clickCreateUrl = async (req, res) => {
  try {
    const { booking_code } = req.body;

    // Business Rule: summa FAQAT bazadan olinadi
    const booking = await prisma.booking.findUnique({ where: { booking_code } });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.status !== 'PendingPayment') {
      return res.status(400).json({ error: `Booking status is '${booking.status}', expected PendingPayment` });
    }

    const merchantId = process.env.CLICK_MERCHANT_ID;
    const serviceId = process.env.CLICK_SERVICE_ID;
    if (!merchantId || !serviceId) {
      return res.status(500).json({ error: 'Click gateway is not configured' });
    }

    // Create pending payment
    const payment = await prisma.payment.create({
      data: {
        booking_id: booking.id,
        guest_id: booking.guest_id,
        amount: booking.total_price, // BAZADAN, so'rovdan emas
        method: 'Online',
        gateway_name: 'Click',
        status: 'Pending'
      }
    });

    // Click URL format
    const paymentUrl = `https://my.click.uz/services/pay?service_id=${serviceId}&merchant_id=${merchantId}&amount=${booking.total_price}&transaction_param=${payment.id}`;

    res.json({ paymentUrl, paymentId: payment.id, amount: booking.total_price });
  } catch (error) {
    console.error('Click CreateUrl Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/payments/click/webhook — Click'dan kelgan tasdiqlash
exports.clickWebhook = async (req, res) => {
  try {
    const { click_trans_id, merchant_trans_id, amount, sign_time, sign_string, error: clickError, action } = req.body;

    // Business Rule: webhook imzosi MAJBURIY tekshiriladi
    const secretKey = process.env.CLICK_SECRET_KEY;
    if (!secretKey) {
      console.error('CLICK_SECRET_KEY is not configured');
      return res.status(500).json({ error: -1, error_note: 'Gateway not configured' });
    }

    // Imzo tekshirish
    const expectedSign = crypto
      .createHash('md5')
      .update(`${click_trans_id}${secretKey}${merchant_trans_id}${amount}${action}${sign_time}`)
      .digest('hex');

    if (expectedSign !== sign_string) {
      return res.status(401).json({ error: -1, error_note: 'Invalid signature' });
    }

    const paymentId = parseInt(merchant_trans_id);
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { booking: true }
    });

    if (!payment) {
      return res.json({ error: -5, error_note: 'Payment not found' });
    }

    // Idempotentlik: agar allaqachon Completed bo'lsa, qayta qabul qilinmasin
    if (payment.status === 'Completed') {
      return res.json({ error: 0, error_note: 'Already processed' });
    }

    if (action === 1) {
      // Prepare — dastlabki tekshirish
      return res.json({ error: 0, click_trans_id, merchant_trans_id, merchant_prepare_id: paymentId });
    }

    if (action === 2) {
      // Complete — to'lov yakunlash
      if (parseInt(clickError) < 0) {
        await prisma.payment.update({ where: { id: paymentId }, data: { status: 'Failed' } });
        return res.json({ error: parseInt(clickError), error_note: 'Payment failed' });
      }

      // Bitta DB tranzaksiyasi: Payment + Receipt + Booking status
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: paymentId },
          data: { status: 'Completed', transaction_id: String(click_trans_id) }
        });

        const receipt = await tx.receipt.create({
          data: {
            booking_id: payment.booking_id,
            payment_id: paymentId,
            receipt_number: `RCT-CLK-${Date.now()}`
          }
        });

        await tx.receiptItem.create({
          data: { receipt_id: receipt.id, description: `Room Booking (Click)`, amount: payment.amount }
        });

        if (payment.booking && payment.booking.status === 'PendingPayment') {
          await tx.booking.update({
            where: { id: payment.booking_id },
            data: { status: 'Upcoming' }
          });
        }
      });

      // Real-time event
      req.io.to(`guest-${payment.guest_id}`).to('reception-updates').emit('booking-payment-confirmed', { bookingId: payment.booking_id, guestId: payment.guest_id });

      return res.json({ error: 0, click_trans_id, merchant_trans_id, merchant_confirm_id: paymentId });
    }

    res.json({ error: -3, error_note: 'Unknown action' });
  } catch (error) {
    console.error('Click Webhook Error:', error);
    res.status(500).json({ error: -1, error_note: 'Server error' });
  }
};

// ==========================================
// PAYME TO'LOV GATEWAY
// ==========================================

// POST /api/payments/payme/create-url — to'lov havolasi yaratish
exports.paymeCreateUrl = async (req, res) => {
  try {
    const { booking_code } = req.body;

    const booking = await prisma.booking.findUnique({ where: { booking_code } });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.status !== 'PendingPayment') {
      return res.status(400).json({ error: `Booking status is '${booking.status}', expected PendingPayment` });
    }

    const merchantId = process.env.PAYME_MERCHANT_ID;
    if (!merchantId) return res.status(500).json({ error: 'Payme gateway is not configured' });

    const payment = await prisma.payment.create({
      data: {
        booking_id: booking.id,
        guest_id: booking.guest_id,
        amount: booking.total_price,
        method: 'Online',
        gateway_name: 'Payme',
        status: 'Pending'
      }
    });

    // Payme URL: amount is in tiyinlarda (x100)
    const amountInTiyin = Math.round(booking.total_price * 100);
    const params = Buffer.from(`m=${merchantId};ac.payment_id=${payment.id};a=${amountInTiyin}`).toString('base64');
    const paymentUrl = `https://checkout.paycom.uz/${params}`;

    res.json({ paymentUrl, paymentId: payment.id, amount: booking.total_price });
  } catch (error) {
    console.error('Payme CreateUrl Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/payments/payme/webhook — Payme'dan kelgan JSON-RPC so'rov
exports.paymeWebhook = async (req, res) => {
  try {
    // Business Rule: kalit tekshirish MAJBURIY
    const secretKey = process.env.PAYME_SECRET_KEY;
    if (!secretKey) {
      return res.json({ error: { code: -32504, message: 'Gateway not configured' }, id: req.body.id });
    }

    // Basic Auth tekshirish
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.json({ error: { code: -32504, message: 'Unauthorized' }, id: req.body.id });
    }

    const decoded = Buffer.from(authHeader.slice(6), 'base64').toString();
    const [, password] = decoded.split(':');
    if (password !== secretKey) {
      return res.json({ error: { code: -32504, message: 'Invalid credentials' }, id: req.body.id });
    }

    const { method, params, id: rpcId } = req.body;

    switch (method) {
      case 'CheckPerformTransaction': {
        const paymentId = parseInt(params.account?.payment_id);
        const payment = await prisma.payment.findUnique({ where: { id: paymentId }, include: { booking: true } });
        if (!payment) return res.json({ error: { code: -31050, message: 'Payment not found' }, id: rpcId });
        return res.json({ result: { allow: true }, id: rpcId });
      }

      case 'CreateTransaction': {
        const paymentId = parseInt(params.account?.payment_id);
        const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
        if (!payment) return res.json({ error: { code: -31050, message: 'Payment not found' }, id: rpcId });

        // Idempotentlik
        if (payment.transaction_id === params.id) {
          return res.json({ result: { transaction: params.id, state: 1, create_time: Date.now() }, id: rpcId });
        }

        await prisma.payment.update({
          where: { id: paymentId },
          data: { transaction_id: params.id }
        });

        return res.json({ result: { transaction: params.id, state: 1, create_time: Date.now() }, id: rpcId });
      }

      case 'PerformTransaction': {
        const payment = await prisma.payment.findFirst({
          where: { transaction_id: params.id },
          include: { booking: true }
        });

        if (!payment) return res.json({ error: { code: -31003, message: 'Transaction not found' }, id: rpcId });
        if (payment.status === 'Completed') {
          return res.json({ result: { transaction: params.id, state: 2, perform_time: Date.now() }, id: rpcId });
        }

        await prisma.$transaction(async (tx) => {
          await tx.payment.update({ where: { id: payment.id }, data: { status: 'Completed' } });

          const receipt = await tx.receipt.create({
            data: {
              booking_id: payment.booking_id,
              payment_id: payment.id,
              receipt_number: `RCT-PME-${Date.now()}`
            }
          });

          await tx.receiptItem.create({
            data: { receipt_id: receipt.id, description: 'Room Booking (Payme)', amount: payment.amount }
          });

          if (payment.booking && payment.booking.status === 'PendingPayment') {
            await tx.booking.update({ where: { id: payment.booking_id }, data: { status: 'Upcoming' } });
          }
        });

        req.io.to(`guest-${payment.guest_id}`).to('reception-updates').emit('booking-payment-confirmed', { bookingId: payment.booking_id, guestId: payment.guest_id });

        return res.json({ result: { transaction: params.id, state: 2, perform_time: Date.now() }, id: rpcId });
      }

      case 'CancelTransaction': {
        const payment = await prisma.payment.findFirst({ where: { transaction_id: params.id } });
        if (!payment) return res.json({ error: { code: -31003, message: 'Transaction not found' }, id: rpcId });

        await prisma.payment.update({ where: { id: payment.id }, data: { status: 'Failed' } });

        return res.json({ result: { transaction: params.id, state: -1, cancel_time: Date.now() }, id: rpcId });
      }

      default:
        return res.json({ error: { code: -32601, message: 'Method not found' }, id: rpcId });
    }
  } catch (error) {
    console.error('Payme Webhook Error:', error);
    res.json({ error: { code: -32400, message: 'Server error' }, id: req.body?.id });
  }
};
