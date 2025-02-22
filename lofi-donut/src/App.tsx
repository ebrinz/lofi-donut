import { useEffect, useState } from 'react'
import { useBasic } from '@basictech/react'
import { MapStorage } from './lib/MapStorage'
import { StoredMap, MapArea } from './types/map'
import { MAP_AREAS } from './constants'

// Component imports
import TileOverview from './components/TileOverview'
import LocalMapViewer from './components/LocalMapViewer'
import LLMInterface from './components/LLMInterface'
import MapPreviewCard from './components/MapPreviewCard'

export default function App() {
  const basic = useBasic()
  const [isInitialized, setIsInitialized] = useState(false)
  const [storedMaps, setStoredMaps] = useState<StoredMap[]>([])
  const [selectedArea, setSelectedArea] = useState<string | null>(null)
  const [downloadingArea, setDownloadingArea] = useState<string | null>(null)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [showMapGrid, setShowMapGrid] = useState(true) // Toggle between grid and focused view

  // Initialize storage and auth
  useEffect(() => {
    if (basic && basic.isAuthReady) {
      setIsInitialized(true)
      setStoredMaps(MapStorage.getStoredMaps())
    }
  }, [basic])

  const handleDownload = async (area: MapArea) => {
    if (!basic.isSignedIn) {
      basic.signin()
      return
    }

    setDownloadingArea(area.id)
    setDownloadProgress(0)

    try {
      const tilesToDownload = []
      const zoom = 15 // High detail for offline use
      const bounds = getTileBounds(area.bounds, zoom)
      
      for (let x = bounds.minX; x <= bounds.maxX; x++) {
        for (let y = bounds.minY; y <= bounds.maxY; y++) {
          tilesToDownload.push({ x, y, z: zoom })
        }
      }

      const tiles = []
      let completed = 0

      // Download tiles in batches
      const batchSize = 4
      for (let i = 0; i < tilesToDownload.length; i += batchSize) {
        const batch = tilesToDownload.slice(i, i + batchSize)
        const promises = batch.map(async (tile) => {
          const url = `https://a.tile.openstreetmap.org/${tile.z}/${tile.x}/${tile.y}.png`
          const response = await fetch(url)
          const blob = await response.blob()
          tiles.push({
            x: tile.x,
            y: tile.y,
            z: tile.z,
            data: await blobToBase64(blob)
          })
          completed++
          setDownloadProgress((completed / tilesToDownload.length) * 100)
        })
        await Promise.all(promises)
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Save to storage
      const mapData: StoredMap = {
        id: area.id,
        name: area.name,
        bounds: area.bounds,
        description: area.description,
        tiles,
        downloadedAt: new Date().toISOString(),
        zoom: zoom,
        version: '1.0.0'
      }

      MapStorage.saveMap(mapData)
      setStoredMaps(MapStorage.getStoredMaps())

    } catch (error) {
      console.error('Failed to download area:', error)
    } finally {
      setDownloadingArea(null)
      setDownloadProgress(0)
    }
  }

  const handleAreaSelect = (areaId: string) => {
    setSelectedArea(areaId)
    setShowMapGrid(false) // Switch to focused view
  }

  // Helper function for base64 conversion
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  if (!isInitialized) {
    return (
      <div className="p-4">
        <div className="animate-pulse">Initializing Basic...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-lg mb-6">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-blue-600">SF Map Explorer</h1>
            <button
              onClick={() => setShowMapGrid(!showMapGrid)}
              className="text-gray-600 hover:text-gray-800"
            >
              {showMapGrid ? 'Show Focus View' : 'Show Grid View'}
            </button>
          </div>
          {basic.isSignedIn ? (
            <button 
              onClick={() => basic.signout()}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Sign Out
            </button>
          ) : (
            <button 
              onClick={() => basic.signin()}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Sign in
            </button>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4">
      {showMapGrid ? (
        <div className="container mx-auto">
          {/* Add debug info */}
          <div className="mb-4 p-2 bg-gray-100 rounded">
            <p>Stored Maps: {storedMaps.length}</p>
            <p>Storage Size: {(MapStorage.getStorageUsage()).toFixed(2)} MB</p>
          </div>
          
          {/* Fix height and prevent scroll issues */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[calc(100vh-16rem)] overflow-y-auto">
            {MAP_AREAS.map(area => {
              const storedMap = storedMaps.find(m => m.id === area.id);
              console.log(`Rendering ${area.name}, stored: ${Boolean(storedMap)}`);
              
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
          </div>
        </div>

        ) : (
          // Focus View
          <div className="grid grid-cols-12 gap-6">
            {/* Left: Overview */}
            <div className="col-span-3 bg-white rounded-lg shadow-lg p-4">
              <TileOverview
                storedMaps={storedMaps}
                onAreaSelect={setSelectedArea}
                selectedArea={selectedArea}
              />
            </div>

            {/* Middle: Map Viewer */}
            <div className="col-span-6 bg-gray-900 rounded-lg shadow-lg">
              <LocalMapViewer
                selectedArea={selectedArea}
                storedMaps={storedMaps}
              />
            </div>

            {/* Right: LLM Interface */}
            <div className="col-span-3 bg-white rounded-lg shadow-lg p-4">
              <LLMInterface
                selectedArea={selectedArea}
                storedMaps={storedMaps}
              />
            </div>
          </div>
        )}

        {/* Download Progress */}
        {downloadingArea && (
          <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 w-80">
            <div className="mb-2">
              <p className="text-sm font-medium">
                Downloading {MAP_AREAS.find(a => a.id === downloadingArea)?.name}
              </p>
              <p className="text-xs text-gray-500">
                {Math.round(downloadProgress)}% complete
              </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 rounded-full h-2 transition-all duration-300"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

// Helper function to convert lat/lon bounds to tile coordinates
function getTileBounds(bounds: { north: number, south: number, east: number, west: number }, zoom: number) {
  const lat2tile = (lat: number) => Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom))
  const lon2tile = (lon: number) => Math.floor((lon + 180) / 360 * Math.pow(2, zoom))

  return {
    minX: lon2tile(bounds.west),
    maxX: lon2tile(bounds.east),
    minY: lat2tile(bounds.north),
    maxY: lat2tile(bounds.south)
  }
}