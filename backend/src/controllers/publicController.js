const prisma = require('../utils/prismaClient');
const { fromJson } = require('../utils/jsonHelper');

// GET /api/public/settings — lightweight settings endpoint for the whole app
exports.getSettings = async (req, res) => {
  try {
    const settings = await prisma.hotelSettings.findFirst();
    if (!settings) return res.json({});
    res.json({
      ...settings,
      social_links: settings.social_links ? fromJson(settings.social_links) : {},
      enabled_languages: settings.enabled_languages ? fromJson(settings.enabled_languages) : {}
    });
  } catch (error) {
    console.error('Public Settings Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/public/hotel-info — no auth required, shown on the public landing page
exports.getHotelInfo = async (req, res) => {
  try {
    const settings = await prisma.hotelSettings.findFirst();
    const roomTypes = await prisma.roomType.findMany({
      orderBy: { base_price: 'asc' }
    });

    res.json({
      name: settings?.name || 'Hotel',
      address: settings?.address || '',
      logo_url: settings?.logo_url || null,
      theme_color: settings?.theme_color || null,
      description: settings?.description || '',
      contact_phone: settings?.contact_phone || '',
      contact_email: settings?.contact_email || '',
      social_links: settings?.social_links ? fromJson(settings.social_links) : {},
      room_types: roomTypes.map(rt => ({
        id: rt.id,
        name: rt.name,
        base_price: rt.base_price,
        capacity: rt.capacity,
        description: rt.description,
        photo_url: rt.photo_url,
        amenities: rt.amenities ? fromJson(rt.amenities) : []
      }))
    });
  } catch (error) {
    console.error('Public HotelInfo Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
