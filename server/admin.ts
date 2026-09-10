export function isAdminPasswordValid(password: string): boolean {
  const configured = process.env.PRAISE_ADMIN_PASSWORD;
  return Boolean(configured && password && password === configured);
}
