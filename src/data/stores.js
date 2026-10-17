export const STORES = [
  {
    id: 'benoni',
    name: 'CeeKay Emporium',
    branch: 'Benoni',
    address: 'Benoni, Gauteng',
    whatsapp: '27780178517',
    email: 'info@ceekayemporium.com',
    /* 0 = Sunday, 6 = Saturday. [openMin, closeMin] in minutes from midnight. */
    hours: {
      0: [600, 1260],  /* Sun 10:00 – 21:00 */
      1: [600, 1260],
      2: [600, 1260],
      3: [600, 1260],
      4: [600, 1260],
      5: [600, 1260],
      6: [600, 1260],
    },
    hoursLabel: 'Mon–Sun · 10:00 – 21:00',
    features: { delivery: false, loyalty: false, pickup: true },
    comingSoon: false,
  },
  {
    id: 'springs',
    name: 'CeeKay Emporium',
    branch: 'Springs',
    address: 'Springs, Gauteng',
    whatsapp: '27000000000',
    email: 'springs@ceekayemporium.com',
    hours: {
      0: [600, 1230], 1: [600, 1230], 2: [600, 1230], 3: [600, 1230],
      4: [600, 1230], 5: [600, 1230], 6: [600, 1230],
    },
    hoursLabel: 'Mon–Sun · 10:00 – 20:30',
    features: { delivery: true, loyalty: false, pickup: true },
    comingSoon: true,
  },
];

/* Returns 'open' | 'closed' | 'coming-soon' based on current time */
export function getStoreStatus(store, now = new Date()) {
  if (store.comingSoon) return 'coming-soon';
  const day = now.getDay();
  const window = store.hours[day];
  if (!window) return 'closed';
  const minutes = now.getHours() * 60 + now.getMinutes();
  return minutes >= window[0] && minutes < window[1] ? 'open' : 'closed';
}
