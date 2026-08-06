const express = require('express');
const router = express.Router();
const staffAuth = require('../middlewares/staffAuthMiddleware');
const bcrypt = require('bcrypt');
const prisma = require('../utils/prismaClient');

router.use(staffAuth);

// GET /api/me/profile — o'z profilini olish
router.get('/profile', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, full_name: true, email: true, role: { select: { name: true } } }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('ME Profile Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/me/profile — profilni yangilash
router.put('/profile', async (req, res) => {
  try {
    const { full_name, email } = req.body;
    if (!full_name && !email) return res.status(400).json({ error: 'full_name yoki email kerak' });

    const data = {};
    if (full_name) data.full_name = full_name;
    if (email) data.email = email;

    const updated = await prisma.user.update({
      where: { id: req.user.userId },
      data,
      select: { id: true, full_name: true, email: true }
    });
    res.json(updated);
  } catch (err) {
    console.error('ME UpdateProfile Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/me/password — parolni yangilash
router.put('/password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'currentPassword va newPassword majburiy' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Yangi parol kamida 6 ta belgi bo\'lishi kerak' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) return res.status(401).json({ error: 'Joriy parol noto\'g\'ri' });

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: req.user.userId }, data: { password_hash: newHash } });

    res.json({ message: 'Parol muvaffaqiyatli yangilandi' });
  } catch (err) {
    console.error('ME ChangePassword Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
