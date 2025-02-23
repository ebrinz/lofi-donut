import React, { useRef, useEffect, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { MapArea, StoredMap } from '../types/map'
import { TILE_SERVERS } from '../constants'

interface MapPreviewCardProps {
  area: MapArea
  storedMap?: StoredMap | null
  isSelected: boolean
  onSelect: (areaId: string) => void
  onDownload: (area: MapArea) => void
  downloading: boolean
}

export default function MapPreviewCard({
  area,
  storedMap,
  isSelected,
  onSelect,
  onDownload,
  downloading
}: MapPreviewCardProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const [lastUpdate, setLastUpdate] = useState<string | null>(
    storedMap ? new Date(storedMap.downloadedAt).toLocaleDateString() : null
  )
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    let currentMap: maplibregl.Map | null = null
    let mounted = true

    const initMap = async () => {
      if (!mapContainer.current || map.current) return

      try {
        currentMap = new maplibregl.Map({
          container: mapContainer.current,
          style: {
            version: 8,
            sources: {
              'osm': {
                type: 'raster',
                tiles: TILE_SERVERS.osm,
                tileSize: 256,
              }
            },
            layers: [{
              id: 'osm',
              type: 'raster',
              source: 'osm',
              paint: {
                'raster-opacity': 0.8
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
          interactive: false,
          renderWorldCopies: false,
        //   antialias: true
        })

        // Wait for map to load
        await new Promise<void>((resolve) => {
          currentMap!.once('load', () => {
            if (!mounted || !currentMap) return
            
            setMapLoaded(true)
            map.current = currentMap
            resolve()
          })
        })

        // Add area outline
        currentMap.addSource('area-bounds', {
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
        })

        // Add fill layer
        currentMap.addLayer({
          id: 'area-bounds-fill',
          type: 'fill',
          source: 'area-bounds',
          paint: {
            'fill-color': isSelected ? '#3B82F6' : '#9CA3AF',
            'fill-opacity': 0.2
          }
        })

        // Add line layer
        currentMap.addLayer({
          id: 'area-bounds-line',
          type: 'line',
          source: 'area-bounds',
          paint: {
            'line-color': isSelected ? '#2563EB' : '#6B7280',
            'line-width': 2
          }
        })

        // Add markers for landmarks
        area.landmarks.forEach((landmark, i) => {
          if (!currentMap) return
          
          const el = document.createElement('div')
          el.className = 'w-2 h-2 rounded-full bg-red-500'
          
          const lngSpan = area.bounds.east - area.bounds.west
          const latSpan = area.bounds.north - area.bounds.south
          const lng = area.bounds.west + (lngSpan * (i + 1)) / (area.landmarks.length + 1)
          const lat = area.bounds.south + (latSpan * (i + 1)) / (area.landmarks.length + 1)

          new maplibregl.Marker(el)
            .setLngLat([lng, lat])
            .addTo(currentMap)
        })

      } catch (error) {
        console.error('Error initializing map:', error)
        if (mounted) {
          setMapLoaded(false)
        }
      }
    }

    initMap()

    // Cleanup
    return () => {
      mounted = false
      if (currentMap) {
        currentMap.remove()
        map.current = null
        setMapLoaded(false)
      }
    }
  }, [area.id, isSelected])

  // Update selection state
  useEffect(() => {
    if (!map.current || !mapLoaded) return

    try {
      map.current.setPaintProperty(
        'area-bounds-fill',
        'fill-color',
        isSelected ? '#3B82F6' : '#9CA3AF'
      )
      map.current.setPaintProperty(
        'area-bounds-line',
        'line-color',
        isSelected ? '#2563EB' : '#6B7280'
      )
    } catch (error) {
      console.error('Error updating selection state:', error)
    }
  }, [isSelected, mapLoaded])

  return (
    <div 
      className={`bg-white rounded-lg shadow-lg transition-shadow hover:shadow-xl ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={() => onSelect(area.id)}
    >
      {/* Preview Map */}
      <div className="w-full h-36 rounded-t-lg relative overflow-hidden">
        <div 
          ref={mapContainer} 
          className="absolute inset-0"
        />
        {!mapLoaded && (
          <div className="absolute inset-0 bg-gray-100 animate-pulse" />
        )}
      </div>

      {/* Info Section */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-lg font-semibold">{area.name}</h3>
            <p className="text-sm text-gray-600">{area.description}</p>
          </div>
          {storedMap && (
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
              Saved
            </span>
          )}
        </div>

        {/* Landmarks */}
        <div className="mt-2 mb-3">
          <p className="text-xs text-gray-500 mb-1">Notable landmarks:</p>
          <div className="flex flex-wrap gap-1">
            {area.landmarks.map(landmark => (
              <span 
                key={landmark}
                className="text-xs bg-gray-100 px-2 py-1 rounded-full"
              >
                {landmark}
              </span>
            ))}
          </div>
        </div>

        {/* Last Update & Actions */}
        <div className="flex items-center justify-between mt-4">
          {lastUpdate && (
            <span className="text-xs text-gray-500">
              Updated: {lastUpdate}
            </span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDownload(area)
            }}
            disabled={downloading}
            className={`px-3 py-1.5 rounded text-sm font-medium ${
              downloading
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {downloading ? 'Downloading...' : (storedMap ? 'Update' : 'Download')}
          </button>
        </div>
      </div>
    </div>
  )
}