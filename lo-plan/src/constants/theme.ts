export const CYBERPUNK_THEME = {
    colors: {
      background: '#0F1116',
      card: '#1A1D24',
      primary: '#00FFB2',    // Neon green
      secondary: '#FF00E5',  // Neon pink
      accent: '#3D00C8',     // Deep purple
      text: {
        primary: '#FFFFFF',
        secondary: '#B2B9C8',
        muted: '#666B74'
      },
      border: {
        normal: '#2A2E35',
        glow: '#00FFB280'
      },
      map: {
        background: '#141619',
        water: '#1C2333',
        land: '#1A1D24',
        highlight: '#00FFB2'
      }
    },
    shadows: {
      normal: '0 4px 20px rgba(0, 255, 178, 0.15)',
      hover: '0 8px 30px rgba(0, 255, 178, 0.25)',
      selected: '0 0 30px rgba(0, 255, 178, 0.35)'
    },
    gradients: {
      button: 'linear-gradient(135deg, #00FFB2 0%, #3D00C8 100%)',
      card: 'linear-gradient(180deg, #1A1D24 0%, #141619 100%)',
      border: 'linear-gradient(90deg, #00FFB2 0%, #FF00E5 100%)'
    },
    animation: {
      glow: '@keyframes glow { 0% { box-shadow: 0 0 10px rgba(0, 255, 178, 0.5); } 100% { box-shadow: 0 0 20px rgba(0, 255, 178, 0.8); } }',
      pulse: '@keyframes pulse { 0% { opacity: 0.5; } 100% { opacity: 1; } }'
    }
  };