import { MapStorage } from '../src/lib/MapStorage'

interface StorageStatsProps {
  onClearAll: () => void
}

export function StorageStats({ onClearAll }: StorageStatsProps) {
  const usage = MapStorage.getStorageUsage()
  
  return (
    <div className="border-t border-gray-200 pt-4 mt-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-600">Storage Used</p>
          <p className="font-semibold">{usage.toFixed(2)} MB</p>
        </div>
        <button 
          onClick={onClearAll}
          className="text-red-500 hover:text-red-600 text-sm"
        >
          Clear All Data
        </button>
      </div>
      <div className="mt-2 w-full bg-gray-200 rounded">
        <div 
          className="bg-blue-500 rounded h-2" 
          style={{ width: `${Math.min((usage / 5) * 100, 100)}%` }} 
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">
        {usage > 4.5 ? "Storage nearly full" : "Storage available"}
      </p>
    </div>
  )
}