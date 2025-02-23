import React, { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import { StoredMap } from '../types/map'
import { MAP_AREAS, TILE_SERVERS } from '../constants'

interface TileOverviewProps {
  storedMaps: StoredMap[]
  onAreaSelect: (areaId: string) => void
  selectedArea: string | null
}

export default function TileOverview({ 
  storedMaps, 
  onAreaSelect, 
  selectedArea 
}: TileOverviewProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let currentMap: maplibregl.Map | null = null;

    const initializeMap = async () => {
      if (!mapContainer.current || map.current) return;

      try {
        currentMap = new maplibregl.Map({
          container: mapContainer.current,
          style: {
            version: 8,
            sources: {
              'osm-tiles': {
                type: 'raster',
                tiles: TILE_SERVERS.osm,
                tileSize: 256,
              }
            },
            layers: [{
              id: 'osm-tiles',
              type: 'raster',
              source: 'osm-tiles',
              paint: {
                'raster-opacity': 0.5
              }
            }]
          },
          center: [-122.4194, 37.7749], // SF center
          zoom: 12
        });

        currentMap.on('load', () => {
          if (!currentMap) return;
          setMapLoaded(true);
          map.current = currentMap;

          // Add area polygons after map is loaded
          MAP_AREAS.forEach(area => {
            const isStored = storedMaps.some(m => m.id === area.id);
            const isSelected = area.id === selectedArea;

            const sourceId = `area-${area.id}`;
            const fillLayerId = `${sourceId}-fill`;
            const lineLayerId = `${sourceId}-line`;

            // Add source
            currentMap!.addSource(sourceId, {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
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

            // Add fill layer
            currentMap!.addLayer({
              id: fillLayerId,
              type: 'fill',
              source: sourceId,
              paint: {
                'fill-color': isStored ? '#3B82F6' : '#9CA3AF',
                'fill-opacity': isSelected ? 0.7 : 0.3
              }
            });

            // Add line layer
            currentMap!.addLayer({
              id: lineLayerId,
              type: 'line',
              source: sourceId,
              paint: {
                'line-color': isSelected ? '#2563EB' : '#6B7280',
                'line-width': isSelected ? 2 : 1
              }
            });

            // Add click handler
            currentMap!.on('click', fillLayerId, () => {
              onAreaSelect(area.id);
            });

            // Change cursor on hover
            currentMap!.on('mouseenter', fillLayerId, () => {
              currentMap!.getCanvas().style.cursor = 'pointer';
            });

            currentMap!.on('mouseleave', fillLayerId, () => {
              currentMap!.getCanvas().style.cursor = '';
            });
          });
        });

      } catch (err) {
        console.error('Error initializing map:', err);
        setError('Failed to load map');
      }
    };

    initializeMap();

    return () => {
      if (currentMap) {
        currentMap.remove();
        map.current = null;
        setMapLoaded(false);
      }
    };
  }, []);

  // Update area styles when selection or stored maps change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    MAP_AREAS.forEach(area => {
      const isStored = storedMaps.some(m => m.id === area.id);
      const isSelected = area.id === selectedArea;
      const sourceId = `area-${area.id}`;
      const fillLayerId = `${sourceId}-fill`;
      const lineLayerId = `${sourceId}-line`;

      try {
        map.current!.setPaintProperty(
          fillLayerId,
          'fill-color',
          isStored ? '#3B82F6' : '#9CA3AF'
        );
        map.current!.setPaintProperty(
          fillLayerId,
          'fill-opacity',
          isSelected ? 0.7 : 0.3
        );
        map.current!.setPaintProperty(
          lineLayerId,
          'line-color',
          isSelected ? '#2563EB' : '#6B7280'
        );
        map.current!.setPaintProperty(
          lineLayerId,
          'line-width',
          isSelected ? 2 : 1
        );
      } catch (err) {
        console.error('Error updating area styles:', err);
      }
    });
  }, [storedMaps, selectedArea, mapLoaded]);

  return (
    <div className="flex flex-col h-full">
      <div className="relative w-full h-96 rounded-lg mb-4">
        <div 
          ref={mapContainer} 
          className="absolute inset-0 rounded-lg overflow-hidden"
        />
        {!mapLoaded && (
          <div className="absolute inset-0 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
            <span className="text-gray-500">Loading map...</span>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 bg-red-50 rounded-lg flex items-center justify-center">
            <span className="text-red-500">{error}</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {MAP_AREAS.map(area => {
          const isStored = storedMaps.some(m => m.id === area.id);
          const isSelected = area.id === selectedArea;
          
          return (
            <button
              key={area.id}
              onClick={() => onAreaSelect(area.id)}
              className={`w-full text-left p-2 rounded transition-colors ${
                isSelected 
                  ? 'bg-blue-100 border-blue-500' 
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{area.name}</span>
                {isStored && (
                  <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">
                    Stored
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}