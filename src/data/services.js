/**
 * Default services catalogue.
 * Loaded once on first use per user; stored encrypted in Supabase thereafter.
 *
 * icon  → emoji used in the UI
 * category → groups services in the dropdown
 */
export const DEFAULT_SERVICES = [
  // ── Viso ───────────────────────────────────────────────────────────────────
  { id: 'srv_001', icon: '🧖‍♀️', category: 'Viso', name: 'Pulizia viso',            price: 22 },

  // ── Ceretta ────────────────────────────────────────────────────────────────
  { id: 'srv_002', icon: '✨', category: 'Ceretta', name: 'Cera viso',              price: 6  },
  { id: 'srv_003', icon: '✨', category: 'Ceretta', name: 'Cera baffetti',          price: 3  },
  { id: 'srv_004', icon: '✨', category: 'Ceretta', name: 'Cera sopracciglia',      price: 3  },
  { id: 'srv_005', icon: '✨', category: 'Ceretta', name: 'Cera ascelle',           price: 5  },
  { id: 'srv_006', icon: '🦵', category: 'Ceretta', name: 'Cera ½ gamba',          price: 10 },
  { id: 'srv_007', icon: '🦵', category: 'Ceretta', name: 'Cera gamba intera + inguine', price: 20 },
  { id: 'srv_008', icon: '💪', category: 'Ceretta', name: 'Cera braccia',          price: 10 },
  { id: 'srv_009', icon: '💪', category: 'Ceretta', name: 'Cera petto',            price: 10 },
  { id: 'srv_010', icon: '💪', category: 'Ceretta', name: 'Cera dorso',            price: 10 },

  // ── Unghie ─────────────────────────────────────────────────────────────────
  { id: 'srv_011', icon: '🦶', category: 'Unghie', name: 'Pedicure',              price: 12 },
  { id: 'srv_012', icon: '💅', category: 'Unghie', name: 'Manicure',              price: 6  },
  { id: 'srv_013', icon: '💅', category: 'Unghie', name: 'Semipermanente piedi', price: 15 },
  { id: 'srv_014', icon: '💅', category: 'Unghie', name: 'Gel mani',             price: 25 },
  { id: 'srv_015', icon: '💅', category: 'Unghie', name: 'Rimozione gel con cura specifica', price: 10 },

  // ── Massaggi ───────────────────────────────────────────────────────────────
  { id: 'srv_016', icon: '💆‍♀️', category: 'Massaggi', name: 'Massaggio intero',  price: 25 },
  { id: 'srv_017', icon: '💆‍♀️', category: 'Massaggi', name: '½ Massaggio',       price: 15 },
  { id: 'srv_018', icon: '💆‍♀️', category: 'Massaggi', name: 'Massaggio schiena', price: 10 },

  // ── Trucco ─────────────────────────────────────────────────────────────────
  { id: 'srv_019', icon: '💄', category: 'Trucco', name: 'Trucco sposa',         price: 30 },
  { id: 'srv_020', icon: '💄', category: 'Trucco', name: 'Trucco classico',      price: 20 },
]

export const SERVICE_CATEGORIES = [
  'Viso',
  'Ceretta',
  'Unghie',
  'Massaggi',
  'Trucco',
  'Altro',
]

export const CATEGORY_ICONS = {
  Viso:     '🧖‍♀️',
  Ceretta:  '✨',
  Unghie:   '💅',
  Massaggi: '💆‍♀️',
  Trucco:   '💄',
  Altro:    '🌸',
}
