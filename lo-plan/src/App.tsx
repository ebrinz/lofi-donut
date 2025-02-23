import React, { useEffect, useState } from 'react';
import { useBasic } from '@basictech/react';
import { MapStorage } from './lib/MapStorage';
import { MapArea, StoredMap } from './types/map';
import { MAP_AREAS } from './constants';
import { CYBERPUNK_THEME as theme } from './constants/theme';

// Component imports
import TileOverview from './components/TileOverview';
import LocalMapViewer from './components/LocalMapViewer';
import LLMInterface from './components/LLMInterface';
import MapPreviewCard from './components/MapPreviewCard';

export default function App() {
  const { signin, isSignedIn, user, signout } = useBasic();
  const [isInitialized, setIsInitialized] = useState(false);
  const [storedMaps, setStoredMaps] = useState<StoredMap[]>([]);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [downloadingArea, setDownloadingArea] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Initialize storage and auth
  useEffect(() => {
    if (isSignedIn !== undefined) {
      setIsInitialized(true);
      setStoredMaps(MapStorage.getStoredMaps());
    }
  }, [isSignedIn]);

  const handleDownload = async (area: MapArea) => {
    if (!isSignedIn) {
      signin();
      return;
    }

    setDownloadingArea(area.id);
    setDownloadProgress(0);

    try {
      const tilesToDownload = [];
      const zoom = 15; // High detail for offline use
      const bounds = getTileBounds(area.bounds, zoom);
      
      for (let x = bounds.minX; x <= bounds.maxX; x++) {
        for (let y = bounds.minY; y <= bounds.maxY; y++) {
          tilesToDownload.push({ x, y, z: zoom });
        }
      }

      const tiles = [];
      let completed = 0;

      // Download tiles in batches
      const batchSize = 4;
      for (let i = 0; i < tilesToDownload.length; i += batchSize) {
        const batch = tilesToDownload.slice(i, i + batchSize);
        const promises = batch.map(async (tile) => {
          const url = `https://tile.openstreetmap.org/${tile.z}/${tile.x}/${tile.y}.png`;
          const response = await fetch(url);
          const blob = await response.blob();
          tiles.push({
            x: tile.x,
            y: tile.y,
            z: tile.z,
            data: await blobToBase64(blob)
          });
          completed++;
          setDownloadProgress((completed / tilesToDownload.length) * 100);
        });
        await Promise.all(promises);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Save to storage
      const mapData: StoredMap = {
        id: area.id,
        name: area.name,
        bounds: area.bounds,
        description: area.description,
        tiles,
        downloadedAt: new Date().toISOString(),
        zoom,
        version: '1.0.0'
      };

      MapStorage.saveMap(mapData);
      setStoredMaps(MapStorage.getStoredMaps());

    } catch (error) {
      console.error('Failed to download area:', error);
    } finally {
      setDownloadingArea(null);
      setDownloadProgress(0);
    }
  };

  const handleAreaSelect = (areaId: string) => {
    setSelectedArea(areaId);
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  if (!isInitialized) {
    return (
      <div style={{
        padding: '20px',
        color: theme.colors.text.primary
      }}>
        Loading...
      </div>
    );
  }

  const mainContainerStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: theme.colors.background,
    padding: '20px',
    color: theme.colors.text.primary
  };

  const headerStyle: React.CSSProperties = {
    background: theme.colors.card,
    borderBottom: `1px solid ${theme.colors.border.normal}`,
    padding: '16px 0',
    marginBottom: '24px',
    boxShadow: theme.shadows.normal
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
    maxWidth: '1400px',
    margin: '0 auto'
  };

  return (
    <div style={mainContainerStyle}>
      <header style={headerStyle}>
        <div style={{ 
          maxWidth: '1400px', 
          margin: '0 auto',
          padding: '0 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{ 
            fontSize: '24px',
            fontWeight: 'bold',
            background: theme.gradients.button,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: `0 0 20px ${theme.colors.primary}40`
          }}>
            SF Map Explorer
          </h1>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            {user?.email && (
              <span style={{ color: theme.colors.text.secondary }}>
                {user.email}
              </span>
            )}
            <button
              onClick={isSignedIn ? signout : signin}
              style={{
                background: theme.gradients.button,
                color: theme.colors.text.primary,
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
                boxShadow: theme.shadows.normal
              }}
            >
              {isSignedIn ? 'Sign Out' : 'Sign In'}
            </button>
          </div>
        </div>
      </header>

      <main style={gridStyle}>
        {MAP_AREAS.map(area => {
          const storedMap = storedMaps.find(m => m.id === area.id);
          return (
            <MapPreviewCard
              key={area.id}
              area={area}
              storedMap={storedMap}
              isSelected={area.id === selectedArea}
              onSelect={handleAreaSelect}
              onDownload={handleDownload}
              downloading={area.id === downloadingArea}
            />
          );
        })}
      </main>

      {downloadingArea && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: theme.colors.card,
          padding: '16px',
          borderRadius: '12px',
          boxShadow: theme.shadows.normal,
          border: `1px solid ${theme.colors.border.normal}`,
          width: '300px'
        }}>
          <div style={{ marginBottom: '12px' }}>
            <p style={{ 
              color: theme.colors.text.primary,
              marginBottom: '4px'
            }}>
              Downloading {MAP_AREAS.find(a => a.id === downloadingArea)?.name}
            </p>
            <p style={{ 
              color: theme.colors.text.secondary,
              fontSize: '14px'
            }}>
              {Math.round(downloadProgress)}% complete
            </p>
          </div>
          <div style={{ 
            width: '100%',
            height: '4px',
            background: theme.colors.border.normal,
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div
              style={{
                width: `${downloadProgress}%`,
                height: '100%',
                background: theme.gradients.button,
                transition: 'width 0.3s ease'
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to convert lat/lon bounds to tile coordinates
function getTileBounds(bounds: { north: number, south: number, east: number, west: number }, zoom: number) {
  const lat2tile = (lat: number) => Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
  const lon2tile = (lon: number) => Math.floor((lon + 180) / 360 * Math.pow(2, zoom));

  return {
    minX: lon2tile(bounds.west),
    maxX: lon2tile(bounds.east),
    minY: lat2tile(bounds.north),
    maxY: lat2tile(bounds.south)
  };
}