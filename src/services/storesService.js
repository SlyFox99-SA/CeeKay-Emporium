import { STORES, getStoreStatus } from '../data/stores';

/* Simulate async so we can swap to real API later without changing callers */
const delay = (ms = 0) => new Promise(r => setTimeout(r, ms));

export async function getStores() {
  await delay();
  return STORES.map(s => ({ ...s, status: getStoreStatus(s) }));
}

export function getStoresSync() {
  return STORES.map(s => ({ ...s, status: getStoreStatus(s) }));
}
