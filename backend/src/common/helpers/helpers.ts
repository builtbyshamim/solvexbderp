export const getNumberEnv = (key: string, defaultValue: number): number => {
  const value = process.env[key];
  return value ? Number(value) : defaultValue;
};
export async function generateId(count?: number) {
  const { nanoid } = await import('nanoid');
  return nanoid(count || 6);
}
