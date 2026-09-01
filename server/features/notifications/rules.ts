export const deduplicateRecipientUserIds = (recipientUserIds: readonly string[]) => [...new Set(
  recipientUserIds.map(id => id.trim()).filter(Boolean),
)]
