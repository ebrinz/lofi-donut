// src/constants/index.ts

// San Francisco bounds for reference
export const SF_BOUNDS = {
    north: 37.84,
    south: 37.70,
    east: -122.35,
    west: -122.52
  }
  
  // Map area definitions
  export const MAP_AREAS = [
    {
      id: 'downtown',
      name: 'Downtown SF',
      bounds: {
        north: 37.79,
        south: 37.77,
        east: -122.39,
        west: -122.42
      },
      description: 'Financial District and surrounding areas',
      price: 4.99,
      landmarks: [
        'Salesforce Tower',
        'Ferry Building',
        'Union Square'
      ]
    },
    {
      id: 'mission',
      name: 'Mission District',
      bounds: {
        north: 37.77,
        south: 37.75,
        east: -122.41,
        west: -122.43
      },
      description: 'Vibrant neighborhood with great food and culture',
      price: 3.99,
      landmarks: [
        'Mission Dolores',
        'Dolores Park',
        'Mission Street'
      ]
    },
    {
      id: 'golden-gate',
      name: 'Golden Gate Area',
      bounds: {
        north: 37.81,
        south: 37.79,
        east: -122.47,
        west: -122.49
      },
      description: 'Including the famous bridge and surrounding parks',
      price: 5.99,
      landmarks: [
        'Golden Gate Bridge',
        'Presidio',
        'Palace of Fine Arts'
      ]
    },
    {
      id: 'sunset',
      name: 'Sunset District',
      bounds: {
        north: 37.76,
        south: 37.74,
        east: -122.46,
        west: -122.51
      },
      description: 'Peaceful residential area near Ocean Beach',
      price: 4.99,
      landmarks: [
        'Ocean Beach',
        'Golden Gate Park',
        'Sunset Boulevard'
      ]
    }
  ]
  
  // Map configuration
  export const MAP_CONFIG = {
    defaultCenter: [-122.4194, 37.7749], // SF center
    defaultZoom: 12,
    minZoom: 10,
    maxZoom: 16,
    tileSize: 256,
    downloadZoom: 15, // Zoom level for tile downloads
    batchSize: 4 // Number of concurrent tile downloads
  }
  
  // Tile server URLs
  export const TILE_SERVERS = {
    osm: [
      'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
      'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
      'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
    ],
    dark: [
      'https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
      'https://cartodb-basemaps-b.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
      'https://cartodb-basemaps-c.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png'
    ]
  }
  
  // Style configurations
  export const MAP_STYLES = {
    light: {
      background: '#ffffff',
      water: '#a5bfdd',
      park: '#c8facd',
      road: '#ffffff',
      building: '#d1d5db',
      text: '#000000'
    },
    dark: {
      background: '#242424',
      water: '#1a365d',
      park: '#064e3b',
      road: '#1f2937',
      building: '#374151',
      text: '#ffffff'
    }
  }
  
  // Storage configuration
  export const STORAGE_CONFIG = {
    key: 'sf-maps',
    maxSize: 5 * 1024 * 1024, // 5MB storage limit
    version: '1.0.0'
  }
  
  // LLM configuration
  export const LLM_CONFIG = {
    endpoint: 'http://localhost:11434/api',
    model: 'llama2',
    contextLimit: 2048,
    temperature: 0.7
  }
  
  // Map attribution
  export const MAP_ATTRIBUTION = '© OpenStreetMap contributors'
  
  // Error messages
  export const ERRORS = {
    storage: {
      full: 'Storage limit reached. Please delete some maps before downloading more.',
      failed: 'Failed to save map to storage.',
      notFound: 'Map not found in storage.'
    },
    download: {
      failed: 'Failed to download map tiles.',
      timeout: 'Download timed out. Please try again.'
    },
    llm: {
      connection: 'Failed to connect to LLM service.',
      response: 'Failed to get response from LLM.'
    }
  }