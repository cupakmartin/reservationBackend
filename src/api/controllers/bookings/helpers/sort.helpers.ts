// src/api/controllers/bookings/helpers/sort.helpers.ts
export const createSortOption = (sortBy: string, order: string): Record<string, 1 | -1> => {
  const sortOrder = order === 'asc' ? 1 : -1;

  const sortMap: Record<string, Record<string, 1 | -1>> = {
    price: { finalPrice: sortOrder },
    createdAt: { createdAt: sortOrder },
    startsAt: { startsAt: sortOrder }
  };

  return sortMap[sortBy] || { startsAt: sortOrder };
};

export const sortByPopulatedField = (bookings: any[], sortBy: string, order: string): void => {
  const sortOrder = order === 'asc' ? 1 : -1;

  if (sortBy === 'clientName') {
    bookings.sort((a, b) => {
      const nameA = a.clientId?.name?.toLowerCase() || '';
      const nameB = b.clientId?.name?.toLowerCase() || '';
      return sortOrder === 1 ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });
  } else if (sortBy === 'workerName') {
    bookings.sort((a, b) => {
      const nameA = a.workerId?.name?.toLowerCase() || '';
      const nameB = b.workerId?.name?.toLowerCase() || '';
      return sortOrder === 1 ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });
  } else if (sortBy === 'duration') {
    bookings.sort((a, b) => {
      const durA = a.procedureId?.durationMin || 0;
      const durB = b.procedureId?.durationMin || 0;
      return sortOrder === 1 ? durA - durB : durB - durA;
    });
  }
};
