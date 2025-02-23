// Define the types we need
export interface StoredMap {
  id: string;
  name: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  description: string;
  tiles: {
    x: number;
    y: number;
    z: number;
    data: string;
  }[];
  downloadedAt: string;
  zoom: number;
  version: string;
}

const STORAGE_KEY = 'sf-maps';

export class MapStorage {
  static getStoredMaps(): StoredMap[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      console.log('Reading from storage:', stored ? JSON.parse(stored).length : 0, 'maps');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading from storage:', error);
      return [];
    }
  }

  static saveMap(mapData: StoredMap): void {
    try {
      const maps = this.getStoredMaps();
      const existingIndex = maps.findIndex(m => m.id === mapData.id);
      
      if (existingIndex >= 0) {
        maps[existingIndex] = mapData;
        console.log('Updating existing map:', mapData.id);
      } else {
        maps.push(mapData);
        console.log('Adding new map:', mapData.id);
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(maps));
      console.log('Storage updated, total maps:', maps.length);
    } catch (error) {
      console.error('Error saving to storage:', error);
      throw new Error('Failed to save map');
    }
  }

  static deleteMap(mapId: string): void {
    try {
      const maps = this.getStoredMaps();
      const filtered = maps.filter(m => m.id !== mapId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      console.log('Deleted map:', mapId);
    } catch (error) {
      console.error('Error deleting from storage:', error);
      throw new Error('Failed to delete map');
    }
  }

  static getStorageUsage(): number {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? (stored.length * 2) / (1024 * 1024) : 0; // Size in MB
    } catch (error) {
      console.error('Error calculating storage usage:', error);
      return 0;
    }
  }

  static clearStorage(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log('Storage cleared');
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw new Error('Failed to clear storage');
    }
  }
}