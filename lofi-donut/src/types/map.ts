// export interface StoredMap {
//     id: string
//     name: string
//     bounds: {
//       north: number
//       south: number
//       east: number
//       west: number
//     }
//     tiles: {
//       x: number
//       y: number
//       z: number
//       data: string
//     }[]
//     downloadedAt: string
//     zoom: number
//     description: string
//   }


  export interface MapBounds {
    north: number
    south: number
    east: number
    west: number
  }
  
  export interface MapArea {
    id: string
    name: string
    bounds: MapBounds
    description: string
    price: number
    landmarks: string[]
  }
  
  export interface MapTile {
    x: number
    y: number
    z: number
    data: string // base64 encoded tile data
  }
  
  export interface StoredMap {
    id: string
    name: string
    bounds: MapBounds
    tiles: MapTile[]
    downloadedAt: string
    zoom: number
    description: string
    version: string
  }
  
  export interface MapStyle {
    background: string
    water: string
    park: string
    road: string
    building: string
    text: string
  }
  
  export interface LLMResponse {
    type: 'location' | 'general' | 'error'
    content: string
    context?: {
      landmarks?: string[]
      coordinates?: [number, number]
    }
  }