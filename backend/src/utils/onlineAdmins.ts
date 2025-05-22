const onlineAdmins = new Set<string>();

export function addOnlineAdmin(adminId: string): void {
  onlineAdmins.add(adminId);
}

export function removeOnlineAdmin(adminId: string): void {
  onlineAdmins.delete(adminId);
}

export function getOnlineAdmins(): string[] {
  return Array.from(onlineAdmins);
} 