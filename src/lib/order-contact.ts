export function matchesOrderContact(input: string, email: string, phone: string): boolean {
  const contact = input.trim();
  if (!contact) return false;
  if (contact.includes("@")) return Boolean(email.trim()) && contact.toLowerCase() === email.trim().toLowerCase();
  const digits = contact.replace(/\D/g, "");
  const storedDigits = phone.replace(/\D/g, "");
  return digits.length >= 7 && Boolean(storedDigits) && digits === storedDigits;
}