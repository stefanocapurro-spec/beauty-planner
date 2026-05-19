// Catalogo default — 20 prestazioni dal listino prezzi originale
// IDs generati senza underscore (compatibili con Appwrite document IDs)
export const DEFAULT_SERVICES = [
  { id: 'srv001', icon: '🧖‍♀️', category: 'Viso',     name: 'Pulizia viso',                    price: 22 },
  { id: 'srv002', icon: '✨',   category: 'Ceretta',  name: 'Cera viso',                       price: 6  },
  { id: 'srv003', icon: '✨',   category: 'Ceretta',  name: 'Cera baffetti',                   price: 3  },
  { id: 'srv004', icon: '✨',   category: 'Ceretta',  name: 'Cera sopracciglia',               price: 3  },
  { id: 'srv005', icon: '✨',   category: 'Ceretta',  name: 'Cera ascelle',                    price: 5  },
  { id: 'srv006', icon: '🦵',   category: 'Ceretta',  name: 'Cera mezza gamba',                price: 10 },
  { id: 'srv007', icon: '🦵',   category: 'Ceretta',  name: 'Cera gamba intera con inguine',   price: 20 },
  { id: 'srv008', icon: '💪',   category: 'Ceretta',  name: 'Cera braccia',                    price: 10 },
  { id: 'srv009', icon: '💪',   category: 'Ceretta',  name: 'Cera petto',                      price: 10 },
  { id: 'srv010', icon: '💪',   category: 'Ceretta',  name: 'Cera dorso',                      price: 10 },
  { id: 'srv011', icon: '🦶',   category: 'Unghie',   name: 'Pedicure',                        price: 12 },
  { id: 'srv012', icon: '💅',   category: 'Unghie',   name: 'Manicure',                        price: 6  },
  { id: 'srv013', icon: '💅',   category: 'Unghie',   name: 'Semipermanente piedi',            price: 15 },
  { id: 'srv014', icon: '💅',   category: 'Unghie',   name: 'Gel mani',                        price: 25 },
  { id: 'srv015', icon: '💅',   category: 'Unghie',   name: 'Rimozione gel con cura specifica',price: 10 },
  { id: 'srv016', icon: '💆‍♀️', category: 'Massaggi', name: 'Massaggio intero',                price: 25 },
  { id: 'srv017', icon: '💆‍♀️', category: 'Massaggi', name: 'Mezzo massaggio',                 price: 15 },
  { id: 'srv018', icon: '💆‍♀️', category: 'Massaggi', name: 'Massaggio schiena',               price: 10 },
  { id: 'srv019', icon: '💄',   category: 'Trucco',   name: 'Trucco sposa',                    price: 30 },
  { id: 'srv020', icon: '💄',   category: 'Trucco',   name: 'Trucco classico',                 price: 20 },
]

export const SERVICE_CATEGORIES = ['Viso','Ceretta','Unghie','Massaggi','Trucco','Altro']

export const CATEGORY_ICONS = {
  Viso: '🧖‍♀️', Ceretta: '✨', Unghie: '💅', Massaggi: '💆‍♀️', Trucco: '💄', Altro: '🌸',
}
