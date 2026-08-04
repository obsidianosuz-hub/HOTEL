import { create } from 'zustand';

const MOCK_ROOMS = [
  // Floor 1
  { id: 101, room_number: '101', floor: 1, price_per_night: 80,  adults: 2, children: 0, bed: 'Single',  amenities: ['WiFi','TV','AC'],              room_type: { name: 'Standard'     }, reception_status: 'Available',   housekeeping_status: 'VacantClean'   },
  { id: 102, room_number: '102', floor: 1, price_per_night: 80,  adults: 2, children: 0, bed: 'Double',  amenities: ['WiFi','TV','AC'],              room_type: { name: 'Standard'     }, reception_status: 'Occupied',    housekeeping_status: 'OccupiedClean' },
  { id: 103, room_number: '103', floor: 1, price_per_night: 120, adults: 2, children: 1, bed: 'Queen',   amenities: ['WiFi','TV','AC','Minibar'],    room_type: { name: 'Deluxe'       }, reception_status: 'Cleaning',    housekeeping_status: 'VacantDirty'   },
  { id: 104, room_number: '104', floor: 1, price_per_night: 200, adults: 2, children: 2, bed: 'King',    amenities: ['WiFi','TV','AC','Minibar','Jacuzzi'], room_type: { name: 'Suite'  }, reception_status: 'Available',   housekeeping_status: 'VacantClean'   },
  { id: 105, room_number: '105', floor: 1, price_per_night: 80,  adults: 1, children: 0, bed: 'Single',  amenities: ['WiFi','TV'],                  room_type: { name: 'Standard'     }, reception_status: 'Maintenance', housekeeping_status: 'OutOfService'  },
  // Floor 2
  { id: 201, room_number: '201', floor: 2, price_per_night: 80,  adults: 2, children: 0, bed: 'Double',  amenities: ['WiFi','TV','AC'],              room_type: { name: 'Standard'     }, reception_status: 'Occupied',    housekeeping_status: 'OccupiedClean' },
  { id: 202, room_number: '202', floor: 2, price_per_night: 80,  adults: 2, children: 0, bed: 'Twin',    amenities: ['WiFi','TV','AC'],              room_type: { name: 'Standard'     }, reception_status: 'Occupied',    housekeeping_status: 'OccupiedDirty' },
  { id: 203, room_number: '203', floor: 2, price_per_night: 120, adults: 2, children: 1, bed: 'Queen',   amenities: ['WiFi','TV','AC','Minibar','Balcony'], room_type: { name: 'Deluxe' }, reception_status: 'Available',   housekeeping_status: 'VacantClean'   },
  { id: 204, room_number: '204', floor: 2, price_per_night: 200, adults: 3, children: 2, bed: 'King',    amenities: ['WiFi','TV','AC','Minibar','Jacuzzi','Balcony'], room_type: { name: 'Suite' }, reception_status: 'Available', housekeeping_status: 'VacantClean' },
  { id: 205, room_number: '205', floor: 2, price_per_night: 120, adults: 2, children: 1, bed: 'Queen',   amenities: ['WiFi','TV','AC','Minibar'],    room_type: { name: 'Deluxe'       }, reception_status: 'Occupied',    housekeeping_status: 'OccupiedClean' },
  // Floor 3
  { id: 301, room_number: '301', floor: 3, price_per_night: 450, adults: 4, children: 2, bed: 'King',    amenities: ['WiFi','TV','AC','Minibar','Jacuzzi','Balcony','Kitchen'], room_type: { name: 'Presidential' }, reception_status: 'Available', housekeeping_status: 'VacantClean' },
  { id: 302, room_number: '302', floor: 3, price_per_night: 200, adults: 2, children: 1, bed: 'King',    amenities: ['WiFi','TV','AC','Minibar','Balcony'], room_type: { name: 'Suite'   }, reception_status: 'Cleaning',    housekeeping_status: 'VacantDirty'   },
  { id: 303, room_number: '303', floor: 3, price_per_night: 200, adults: 3, children: 2, bed: 'Queen',   amenities: ['WiFi','TV','AC','Minibar','Jacuzzi'], room_type: { name: 'Suite'   }, reception_status: 'Available',   housekeeping_status: 'VacantClean'   },
];

const MOCK_BOOKINGS = [
  { 
    id: 1, 
    booking_code: 'BKG-2026-001', 
    guest: { full_name: 'John Doe', phone: '+1234567890' }, 
    source: 'BookingCom', 
    payment_model: 'booking_com_collect', 
    total_price: 300, 
    status: 'Active', 
    room: { room_number: '101', id: 101 }, 
    extra_charges: [
      {id: 1, description: 'Minibar - Cola & Snacks', amount: 15},
      {id: 2, description: 'In-Room Dining (Dinner)', amount: 45}
    ] 
  },
  { 
    id: 2, 
    booking_code: 'BKG-2026-002', 
    guest: { full_name: 'Alice Smith', phone: '+1987654321' }, 
    source: 'Walk-In', 
    payment_model: 'hotel_collect', 
    total_price: 150, 
    status: 'Active', 
    room: { room_number: '102', id: 102 }, 
    extra_charges: [] 
  }
];

const useHotelStore = create((set) => ({
  rooms: MOCK_ROOMS,
  bookings: MOCK_BOOKINGS,
  
  checkInGuest: (room, checkInForm) => set((state) => {
    // 1. Create a new booking
    const newBooking = {
      id: state.bookings.length + 1,
      booking_code: `BKG-2026-00${state.bookings.length + 1}`,
      guest: { full_name: checkInForm.guest_name, phone: checkInForm.guest_phone },
      source: 'Walk-In',
      payment_model: 'hotel_collect',
      total_price: room.price_per_night * checkInForm.nights,
      status: 'Active',
      room: { room_number: room.room_number, id: room.id },
      extra_charges: []
    };

    // 2. Update room status
    const updatedRooms = state.rooms.map(r => 
      r.id === room.id 
        ? { ...r, reception_status: 'Occupied', housekeeping_status: 'OccupiedClean' } 
        : r
    );

    return {
      bookings: [newBooking, ...state.bookings],
      rooms: updatedRooms
    };
  })
}));

export default useHotelStore;
