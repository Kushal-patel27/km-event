const map = {
  '1': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1600&q=60',
  '2': 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?auto=format&fit=crop&w=1600&q=60',
  '3': 'https://images.unsplash.com/photo-1520975912777-3f0b4a8b8b3b?auto=format&fit=crop&w=1600&q=60',
  '4': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=60',
  '5': 'https://images.unsplash.com/photo-1508830524289-0adcbe822b40?auto=format&fit=crop&w=1600&q=60',
  '6': 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1600&q=60',
  '7': 'https://images.unsplash.com/photo-1508609349937-5ec4ae374ebf?auto=format&fit=crop&w=1600&q=60',
  '8': 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=60',
}

const DEFAULT = 'https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?auto=format&fit=crop&w=1600&q=60'

export function getEventImage(event){
  if(!event) return DEFAULT
  // prioritize explicit image field (data uri or remote)
  if(event.image) return event.image
  // try id mapping
  if(event.id && map[event.id]) return map[event.id]
  // try slug/title-based heuristics (optional)
  const title = (event.title || '').toLowerCase()
  if(title.includes('music')) return map['1']
  if(title.includes('tech') || title.includes('conference')) return map['2']
  if(title.includes('market') || title.includes('food')) return map['4']
  return DEFAULT
}

export default getEventImage
