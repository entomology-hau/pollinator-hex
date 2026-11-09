/** A stable, stateless pseudo-random value. Separate streams prevent action order
 * from changing tomorrow's weather or a cell's habitat. Not cryptographic. */
export const randomUnit = (seed: string, stream: string, key: string | number): number => {
  const input = JSON.stringify([seed, stream, String(key)]);
  let hash = 2166136261;
  for (let index = 0; index < input.length; index++) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35);
  hash ^= hash >>> 16;
  return (hash >>> 0) / 4294967296;
};
