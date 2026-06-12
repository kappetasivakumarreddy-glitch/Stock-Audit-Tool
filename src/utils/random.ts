export class SeededRNG {
  private state: number;

  constructor(seed: string) {
    this.state = this.hashString(seed);
  }

  // Simple string hashing to convert string seeds to starting numeric states
  private hashString(str: string): number {
    let hash = 0;
    if (str.length === 0) return 0;
    for (let i = 0; i < str.length; i++) {
      const chr = str.charCodeAt(i);
      hash = (hash << 5) - hash + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  // LCG parameters (Numerical Recipes)
  public next(): number {
    this.state = (this.state * 1664525 + 1013904223) % 4294967296;
    return this.state / 4294967296;
  }

  // Get a random range integer [min, max]
  public nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

/**
 * Selects a deterministic random sample of size N from an array of items.
 * Does not mutate the original array.
 */
export function selectRandomSample<T>(items: T[], size: number, seed: string): T[] {
  if (size <= 0) return [];
  if (size >= items.length) return [...items];

  const rng = new SeededRNG(seed);
  const pool = [...items];
  const sample: T[] = [];

  for (let i = 0; i < size; i++) {
    const index = rng.nextInt(0, pool.length - 1);
    sample.push(pool[index]);
    pool.splice(index, 1); // remove selected to prevent duplicates
  }

  return sample;
}

/**
 * Generates a standard random seed of 8 characters.
 */
export function generateRandomSeed(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let seed = '';
  for (let i = 0; i < 8; i++) {
    seed += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return seed;
}
