import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MAP_AREAS } from '../constants';
import { StoredMap } from '../types/map';
import { CYBERPUNK_THEME as theme } from '../constants/theme';

interface LocalMapViewerProps {
  selectedArea: string | null;
  storedMaps: StoredMap[];
}

export default function LocalMapViewer({ selectedArea, storedMaps }: LocalMapViewerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (map.current) {
      map.current.remove();
      map.current = null;
    }

    if (!mapContainer.current || !selectedArea) return;

    const areaConfig = MAP_AREAS.find(a => a.id === selectedArea);
    if (!areaConfig) {
      setError('Area not found');
      return;
    }

    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            'osm': {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256
            }
          },
          layers: [{
            id: 'osm',
            type: 'raster',
            source: 'osm',
            paint: {
              'raster-opacity': 0.7,
              'raster-brightness-min': 0,
              'raster-brightness-max': 0.5,
              'raster-contrast': 0.5,
              'raster-saturation': -0.9
            }
          }]
        },
        bounds: [
          areaConfig.bounds.west,
          areaConfig.bounds.south,
          areaConfig.bounds.east,
          areaConfig.bounds.north
        ],
        fitBoundsOptions: { padding: 50 }
      });

      map.current.on('load', () => {
        if (!map.current) return;

        // Add glowing boundary
        map.current.addSource('area-boundary', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [areaConfig.bounds.west, areaConfig.bounds.north],
                [areaConfig.bounds.east, areaConfig.bounds.north],
                [areaConfig.bounds.east, areaConfig.bounds.south],
                [areaConfig.bounds.west, areaConfig.bounds.south],
                [areaConfig.bounds.west, areaConfig.bounds.north]
              ]]
            }
          }
        });

        // Outer glow
        map.current.addLayer({
          id: 'area-glow-outer',
          type: 'line',
          source: 'area-boundary',
          paint: {
            'line-color': theme.colors.primary,
            'line-width': 8,
            'line-blur': 8,
            'line-opacity': 0.3
          }
        });

        // Inner glow
        map.current.addLayer({
          id: 'area-glow-inner',
          type: 'line',
          source: 'area-boundary',
          paint: {
            'line-color': theme.colors.primary,
            'line-width': 4,
            'line-blur': 4,
            'line-opacity': 0.5
          }
        });

        // Solid line
        map.current.addLayer({
          id: 'area-line',
          type: 'line',
          source: 'area-boundary',
          paint: {
            'line-color': theme.colors.primary,
            'line-width': 2,
            'line-opacity': 1
          }
        });

        // Add landmarks with cyberpunk markers
        areaConfig.landmarks.forEach((landmark, i) => {
          const markerEl = document.createElement('div');
          
          // Marker styling
          Object.assign(markerEl.style, {
            width: '16px',
            height: '16px',
            background: theme.colors.primary,
            borderRadius: '50%',
            boxShadow: `0 0 10px ${theme.colors.primary}, 0 0 20px ${theme.colors.primary}`,
            animation: 'pulse 2s infinite ease-in-out'
          });

          // Calculate position
          const lngSpan = areaConfig.bounds.east - areaConfig.bounds.west;
          const latSpan = areaConfig.bounds.north - areaConfig.bounds.south;
          const lng = areaConfig.bounds.west + (lngSpan * (i + 1)) / (areaConfig.landmarks.length + 1);
          const lat = areaConfig.bounds.south + (latSpan * (i + 1)) / (areaConfig.landmarks.length + 1);

          // Create and style popup
          const popup = new maplibregl.Popup({
            offset: 25,
            closeButton: false,
            className: 'cyberpunk-popup'
          }).setHTML(`
            <div style="
              background: ${theme.colors.card};
              border: 1px solid ${theme.colors.primary};
              border-radius: 4px;
              padding: 8px 12px;
              color: ${theme.colors.text.primary};
              font-size: 14px;
              box-shadow: 0 0 15px rgba(0, 255, 178, 0.2);
            ">
              <strong>${landmark}</strong>
            </div>
          `);

          // Add marker
          new maplibregl.Marker(markerEl)
            .setLngLat([lng, lat])
            .setPopup(popup)
            .addTo(map.current!);
        });
      });

      // Add cyberpunk-styled navigation control
      const nav = new maplibregl.NavigationControl();
      map.current.addControl(nav, 'top-right');

    } catch (err) {
      console.error('Map error:', err);
      setError('Failed to load map');
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [selectedArea]);

  // Add the pulse animation
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.2); opacity: 0.5; }
        100% { transform: scale(1); opacity: 1; }
      }
      .cyberpunk-popup .maplibregl-popup-content {
        background: transparent !important;
        padding: 0 !important;
        border: none !important;
      }
      .cyberpunk-popup .maplibregl-popup-tip {
        display: none;
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    minHeight: '500px',
    position: 'relative',
    backgroundColor: theme.colors.background,
    borderRadius: '12px',
    overflow: 'hidden',
    border: `1px solid ${theme.colors.border.normal}`,
    boxShadow: theme.shadows.normal
  };

  const mapStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  };

  return (
    <div style={containerStyle}>
      <div ref={mapContainer} style={mapStyle} />
      {error && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: theme.colors.card,
          padding: '20px',
          borderRadius: '8px',
          color: theme.colors.text.primary,
          border: `1px solid ${theme.colors.border.normal}`,
          boxShadow: theme.shadows.normal
        }}>
          {error}
        </div>
      )}
    </div>
  );
}