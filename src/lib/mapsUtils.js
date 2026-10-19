export const openGoogleMaps = (store) => {
  if (!store) return;
  
  // If we have exact coordinates, use them. Otherwise, fallback to address search.
  if (store.latitude && store.longitude) {
    window.open(`https://www.google.com/maps/search/?api=1&query=${store.latitude},${store.longitude}`, '_blank');
  } else if (store.address) {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address)}`, '_blank');
  }
};