export const openGoogleMaps = (store) => {
  if (!store) return;
  
  // 1. Prioritize the custom Google Maps link
  if (store.maps_link && store.maps_link.startsWith('http')) {
    window.open(store.maps_link, '_blank');
    return;
  }

  // 2. Fallback to coordinates
  if (store.latitude && store.longitude) {
    window.open(`https://www.google.com/maps/search/?api=1&query=${store.latitude},${store.longitude}`, '_blank');
    return;
  }

  // 3. Fallback to address
  if (store.address) {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address)}`, '_blank');
  }
};