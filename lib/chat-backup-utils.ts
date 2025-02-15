// Functions to export and import chatThread backups from localStorage

export const exportChatBackup = (): string => {
  // Retrieve current conversation data from localStorage
  const backup = localStorage.getItem('chatThreads') || '';
  return backup;
};

export const importChatBackup = (backupData: string): void => {
  // Store backup data under a new key to preserve the original data
  localStorage.setItem('chatThreads_backup', backupData);
};
