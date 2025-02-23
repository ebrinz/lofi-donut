import React, { useRef, useEffect, useState } from 'react'
import maplibregl from 'maplibre-gl'
import { MAP_STYLES, MAP_AREAS } from '../constants'
import { StoredMap } from '../types/map'

interface LocalMapViewerProps {
  selectedArea: string | null
  storedMaps: StoredMap[]
}

export default function LocalMapViewer({ selectedArea, storedMaps }: LocalMapViewerProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Reset error state when area changes
    setError(null)

    // Find selected map data
    const storedMap = selectedArea ? storedMaps.find(m => m.id === selectedArea) : null
    const areaConfig = selectedArea ? MAP_AREAS.find(a => a.id === selectedArea) : null

    if (!storedMap || !areaConfig) {
      setError(selectedArea ? 'No stored data for this area' : 'Select an area to view')
      return
    }

    if (!mapContainer.current) return

    // Create or update map
    if (!map.current) {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {},
          layers: [{
            id: 'background',
            type: 'background',
            paint: {
              'background-color': MAP_STYLES.dark.background
            }
          }]
        },
        bounds: [
          areaConfig.bounds.west,
          areaConfig.bounds.south,
          areaConfig.bounds.east,
          areaConfig.bounds.north
        ],
        fitBoundsOptions: { padding: 20 }
      })

      // Add navigation control
      map.current.addControl(
        new maplibregl.NavigationControl({ showCompass: false }),
        'top-right'
      )
    }

    // Create image sources from stored tiles
    if (map.current) {
      // Remove existing sources and layers
      if (map.current.getSource('local-tiles')) {
        map.current.removeLayer('local-tiles')
        map.current.removeSource('local-tiles')
      }

      // Create a custom source function
      const customSource: maplibregl.ImageSourceSpecification = {
        type: 'image',
        url: '',
        coordinates: [
          [areaConfig.bounds.west, areaConfig.bounds.north],
          [areaConfig.bounds.east, areaConfig.bounds.north],
          [areaConfig.bounds.east, areaConfig.bounds.south],
          [areaConfig.bounds.west, areaConfig.bounds.south]
        ]
      }

      // Add source and layer for local tiles
      map.current.addSource('local-tiles', customSource)
      map.current.addLayer({
        id: 'local-tiles',
        type: 'raster',
        source: 'local-tiles',
        paint: {
          'raster-opacity': 0.8,
          'raster-contrast': 0.2,
          'raster-brightness-min': 0.2
        }
      })

      // Composite stored tiles into a single canvas
      const canvas = document.createElement('canvas')
      const totalTiles = Math.pow(2, storedMap.zoom)
      const tileSize = 256
      canvas.width = totalTiles * tileSize
      canvas.height = totalTiles * tileSize
      const ctx = canvas.getContext('2d')!

      // Load and draw all tiles
      Promise.all(
        storedMap.tiles.map(tile => {
          return new Promise<void>((resolve) => {
            const img = new Image()
            img.onload = () => {
              ctx.drawImage(
                img,
                tile.x * tileSize,
                tile.y * tileSize,
                tileSize,
                tileSize
              )
              resolve()
            }
            img.src = tile.data
          })
        })
      ).then(() => {
        // Update the source with the composite image
        ;(map.current!.getSource('local-tiles') as maplibregl.ImageSource)
          .updateImage({ url: canvas.toDataURL() })
      })

      // Add landmarks
      areaConfig.landmarks.forEach((landmark, i) => {
        const markerId = `landmark-${i}`
        
        // Create marker element
        const el = document.createElement('div')
        el.className = 'landmark-marker'
        el.style.cssText = `
          width: 12px;
          height: 12px;
          background-color: ${MAP_STYLES.dark.text};
          border: 2px solid ${MAP_STYLES.dark.water};
          border-radius: 50%;
          cursor: pointer;
        `

        // Calculate approximate position (this would need real coordinates in practice)
        const lngSpan = areaConfig.bounds.east - areaConfig.bounds.west
        const latSpan = areaConfig.bounds.north - areaConfig.bounds.south
        const lng = areaConfig.bounds.west + (lngSpan * (i + 1)) / (areaConfig.landmarks.length + 1)
        const lat = areaConfig.bounds.south + (latSpan * (i + 1)) / (areaConfig.landmarks.length + 1)

        // Add popup
        const popup = new maplibregl.Popup({
          offset: 25,
          className: 'dark-popup'
        }).setHTML(`
          <div style="color: ${MAP_STYLES.dark.text}; padding: 8px;">
            <h3 style="font-weight: bold; margin-bottom: 4px;">${landmark}</h3>
            <p style="font-size: 12px;">Notable location in ${areaConfig.name}</p>
          </div>
        `)

        // Add marker to map
        new maplibregl.Marker(el)
          .setLngLat([lng, lat])
          .setPopup(popup)
          .addTo(map.current!)
      })
    }

  }, [selectedArea, storedMaps])

  // Handle cleanup
  useEffect(() => {
    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  return (
    <div className="relative h-full">
      <div 
        ref={mapContainer} 
        className="w-full h-full rounded-lg overflow-hidden"
        style={{ minHeight: '400px' }}
      />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 rounded-lg">
          <p className="text-white text-lg">{error}</p>
        </div>
      )}
      <style>{`
        .dark-popup .maplibregl-popup-content {
          background-color: ${MAP_STYLES.dark.background};
          border: 1px solid ${MAP_STYLES.dark.water};
        }
        .dark-popup .maplibregl-popup-tip {
          border-top-color: ${MAP_STYLES.dark.water};
        }
        .maplibregl-ctrl button {
          background-color: ${MAP_STYLES.dark.background} !important;
          color: ${MAP_STYLES.dark.text} !important;
        }
      `}</style>
    </div>
  )
}