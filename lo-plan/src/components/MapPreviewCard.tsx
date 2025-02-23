import React, { useRef, useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapArea, StoredMap } from '../types/map';
import { CYBERPUNK_THEME as theme } from '../constants/theme';

interface MapPreviewCardProps {
  area: MapArea;
  storedMap?: StoredMap | null;
  isSelected: boolean;
  onSelect: (areaId: string) => void;
  onDownload: (area: MapArea) => void;
  downloading: boolean;
}

export default function MapPreviewCard({
  area,
  storedMap,
  isSelected,
  onSelect,
  onDownload,
  downloading
}: MapPreviewCardProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

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
          area.bounds.west,
          area.bounds.south,
          area.bounds.east,
          area.bounds.north
        ],
        fitBoundsOptions: { padding: 10 },
        interactive: false
      });

      map.current.on('load', () => {
        if (!map.current) return;

        // Add area boundary
        map.current.addSource('area', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [area.bounds.west, area.bounds.north],
                [area.bounds.east, area.bounds.north],
                [area.bounds.east, area.bounds.south],
                [area.bounds.west, area.bounds.south],
                [area.bounds.west, area.bounds.north]
              ]]
            }
          }
        });

        // Add glow effect
        map.current.addLayer({
          id: 'area-glow',
          type: 'line',
          source: 'area',
          paint: {
            'line-color': theme.colors.primary,
            'line-width': 3,
            'line-blur': 3,
            'line-opacity': 0.5
          }
        });

        // Add area fill
        map.current.addLayer({
          id: 'area-fill',
          type: 'fill',
          source: 'area',
          paint: {
            'fill-color': theme.colors.primary,
            'fill-opacity': isSelected ? 0.3 : 0.1
          }
        });

        // Add crisp line
        map.current.addLayer({
          id: 'area-line',
          type: 'line',
          source: 'area',
          paint: {
            'line-color': theme.colors.primary,
            'line-width': 1
          }
        });
      });

    } catch (error) {
      console.error('Error initializing map:', error);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [area.id, isSelected]);

  const cardStyle: React.CSSProperties = {
    backgroundColor: theme.colors.card,
    borderRadius: '12px',
    boxShadow: isSelected ? theme.shadows.selected : theme.shadows.normal,
    border: `1px solid ${isSelected ? theme.colors.primary : theme.colors.border.normal}`,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    overflow: 'hidden'
  };

  const mapContainerStyle: React.CSSProperties = {
    width: '100%',
    height: '180px',
    position: 'relative',
    borderBottom: `1px solid ${theme.colors.border.normal}`
  };

  const infoStyle: React.CSSProperties = {
    padding: '20px'
  };

  const buttonStyle: React.CSSProperties = {
    background: downloading ? theme.colors.border.normal : theme.gradients.button,
    color: theme.colors.text.primary,
    padding: '10px 20px',
    borderRadius: '6px',
    border: 'none',
    cursor: downloading ? 'not-allowed' : 'pointer',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    fontSize: '14px'
  };

  return (
    <div 
      style={cardStyle}
      onClick={() => onSelect(area.id)}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.boxShadow = theme.shadows.hover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = isSelected ? theme.shadows.selected : theme.shadows.normal;
      }}
    >
      <div style={mapContainerStyle}>
        <div ref={mapContainer} style={{ position: 'absolute', inset: 0 }} />
      </div>

      <div style={infoStyle}>
        <h3 style={{ 
          color: theme.colors.text.primary,
          fontSize: '20px',
          fontWeight: 'bold',
          marginBottom: '8px',
          textShadow: '0 0 10px rgba(0, 255, 178, 0.3)'
        }}>
          {area.name}
        </h3>
        
        <p style={{ 
          color: theme.colors.text.secondary,
          fontSize: '14px',
          marginBottom: '16px',
          lineHeight: '1.4'
        }}>
          {area.description}
        </p>

        <div style={{ marginBottom: '16px' }}>
          {area.landmarks.map(landmark => (
            <span 
              key={landmark}
              style={{
                display: 'inline-block',
                background: theme.colors.background,
                color: theme.colors.primary,
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                marginRight: '8px',
                marginBottom: '8px',
                border: `1px solid ${theme.colors.border.normal}`,
                boxShadow: '0 0 10px rgba(0, 255, 178, 0.1)'
              }}
            >
              {landmark}
            </span>
          ))}
        </div>

        <div style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '20px'
        }}>
          {storedMap && (
            <span style={{ 
              fontSize: '12px',
              color: theme.colors.text.muted
            }}>
              Updated: {new Date(storedMap.downloadedAt).toLocaleDateString()}
            </span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload(area);
            }}
            disabled={downloading}
            style={buttonStyle}
          >
            {downloading ? 'Downloading...' : (storedMap ? 'Update' : 'Download')}
          </button>
        </div>
      </div>
    </div>
  );
}