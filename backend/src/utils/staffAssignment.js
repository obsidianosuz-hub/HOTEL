// Picks the active Housekeeping (or HousekeepingSupervisor) staff member with the fewest
// open (Pending/InProgress) tasks right now — simple load-balancing auto-assignment.
async function findLeastBusyHousekeepingStaff(prisma) {
  const staff = await prisma.user.findMany({
    where: {
      status: 'Active',
      role: { name: { in: ['Housekeeping', 'HousekeepingSupervisor'] } }
    },
    include: {
      housekeeping_tasks: { where: { status: { in: ['Pending', 'InProgress'] } } }
    }
  });

  if (staff.length === 0) return null;

  return staff.reduce((least, current) =>
    current.housekeeping_tasks.length < least.housekeeping_tasks.length ? current : least
  );
}

module.exports = { findLeastBusyHousekeepingStaff };
