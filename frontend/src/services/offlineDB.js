export class OfflineDB {
  constructor(dbName = 'lunar-calendar-db') {
    this.dbName = dbName;
  }

  openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = event => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains('favorites')) {
          db.createObjectStore('favorites', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('holidays')) {
          db.createObjectStore('holidays', { keyPath: 'id' });
        }
      };
    });
  }

  async saveFavorite(favorite) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('favorites', 'readwrite');
      const store = transaction.objectStore('favorites');
      const request = store.add(favorite);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getFavorites() {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('favorites', 'readonly');
      const store = transaction.objectStore('favorites');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }
}

export function useOfflineDB() {
  const db = new OfflineDB();

  const saveFavoriteOffline = async (favorite) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/favorites`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(favorite)
        }
      );

      if (!response.ok) throw new Error('Network error');
      return { success: true, synced: true };
    } catch (error) {
      try {
        await db.saveFavorite({
          ...favorite,
          id: Date.now()
        });
        return { success: true, synced: false, offline: true };
      } catch (dbError) {
        return { success: false, error: dbError.message };
      }
    }
  };

  return { saveFavoriteOffline, db };
}