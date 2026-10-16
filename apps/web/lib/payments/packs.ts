// What people can buy. Prices live here (in paise) and are copied onto each
// order, so changing them later never rewrites past orders.
export const PACKS = [
  { id: "single", boosts: 1, amountPaise: 2900 },
  { id: "trio", boosts: 3, amountPaise: 4900 },
  { id: "ten", boosts: 10, amountPaise: 12900 },
] as const;

export type Pack = (typeof PACKS)[number];
export type PackId = Pack["id"];

export const findPack = (id: unknown): Pack | null => PACKS.find((pack) => pack.id === id) ?? null;

// "₹29", or "₹34.30" when there are paise.
export function formatRupees(paise: number) {
  return `₹${paise % 100 === 0 ? paise / 100 : (paise / 100).toFixed(2)}`;
}
