export interface GlobalModel {
    isLoading: boolean;
    notifications: any[];
    isConnectedToWhatsapp: boolean;
    whatsappSyncStatus: 'unknown' | 'not_synced' | 'connecting' | 'syncing' | 'ready' | 'error';
    whatsappSyncProgress: number;
    whatsappSyncMessage: string | null;
}