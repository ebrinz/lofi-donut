import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MAP_AREAS } from '../constants';
import { StoredMap } from '../types/map';

interface TileOverviewProps {
  storedMaps: StoredMap[];
  onAreaSelect: (areaId: string) => void;
  selectedArea: string | null;
}

export default function TileOverview({ storedMaps, onAreaSelect, selectedArea }: TileOverviewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

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
            source: 'osm'
          }]
        },
        center: [-122.4194, 37.7749],
        zoom: 12
      });

      map.current.on('load', () => {
        MAP_AREAS.forEach(area => {
          const sourceId = `area-${area.id}`;
          
          map.current?.addSource(sourceId, {
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

          map.current?.addLayer({
            id: sourceId,
            type: 'fill',
            source: sourceId,
            paint: {
              'fill-color': area.id === selectedArea ? 'blue' : 'gray',
              'fill-opacity': 0.5
            }
          });

          // Add click handler
          map.current?.on('click', sourceId, () => onAreaSelect(area.id));
        });
      });

    } catch (err) {
      console.error('Map error:', err);
      setError('Failed to load map');
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '400px', position: 'relative' }}>
      <div ref={mapContainer} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />
      {error && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>{error}</div>}
    </div>
  );
}