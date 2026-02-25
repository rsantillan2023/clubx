export async function getStoreData() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
        return navigator.storage.estimate().then(({ usage }) => {
            return Math.round(usage / (1024 * 1024));
        });
    }
    return 0;
}

export async function getQuotaData() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
        return navigator.storage.estimate().then(({ quota }) => {
            return Math.round(quota / (1024 * 1024));
        });
    }
    return 0;
}