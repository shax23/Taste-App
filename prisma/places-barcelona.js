/**
 * Barcelona places — curated from Barcelona Secreta (barcelonasecreta.com/en)
 * coverage + same-spirit local picks, so every map category is populated.
 * Upserted at boot by scripts/ensure-seed.js (idempotent, keyed on name+city).
 */
module.exports = [
  // ─── cafes ───
  { name: "Satan's Coffee Corner", category: 'cafe', address: "Carrer de l'Arc de Sant Ramon del Call 11", lat: 41.3829, lng: 2.1744 },
  { name: 'Syra Coffee Gràcia', category: 'cafe', address: 'Carrer de Bailèn 59, Gràcia', lat: 41.4036, lng: 2.1585 },
  { name: 'Three Marks Coffee', category: 'cafe', address: "Carrer d'Ausiàs Marc 151", lat: 41.3953, lng: 2.181 },

  // ─── restaurants ───
  { name: 'Brabo Restaurante', category: 'restaurant', address: 'Carrer de Casanova 44, Eixample', lat: 41.3856, lng: 2.1577 },
  { name: 'Can Lluís', category: 'restaurant', address: 'Carrer de la Cera 49, Raval', lat: 41.3779, lng: 2.1668 },
  { name: 'La Pubilla', category: 'restaurant', address: 'Plaça de la Llibertat 23, Gràcia', lat: 41.4005, lng: 2.1561 },
  { name: 'Bar Cañete', category: 'restaurant', address: 'Carrer de la Unió 17, Raval', lat: 41.3793, lng: 2.1734 },

  // ─── bars ───
  { name: 'Paradiso', category: 'bar', address: 'Carrer de Rera Palau 4, El Born', lat: 41.3838, lng: 2.1842 },
  { name: 'Quimet & Quimet', category: 'bar', address: 'Carrer del Poeta Cabanyes 25, Poble-sec', lat: 41.3737, lng: 2.1622 },
  { name: 'Dr. Stravinsky', category: 'bar', address: 'Carrer dels Mirallers 5, El Born', lat: 41.384, lng: 2.1822 },

  // ─── parks ───
  { name: 'Parc de la Ciutadella', category: 'park', address: 'Passeig de Picasso 21', lat: 41.3886, lng: 2.186 },
  { name: 'Park Güell', category: 'park', address: "Carrer d'Olot, Gràcia", lat: 41.4145, lng: 2.1527 },
  { name: 'Bunkers del Carmel', category: 'park', address: 'Turó de la Rovira, El Carmel', lat: 41.4194, lng: 2.1619 },
  { name: 'Carretera de les Aigües', category: 'park', address: 'Parc de Collserola', lat: 41.4108, lng: 2.1109 },

  // ─── studios (movement) ───
  { name: 'La Foixarda Climbing Tunnel', category: 'studio', address: 'Camí de la Foixarda, Montjuïc', lat: 41.3672, lng: 2.153 },
  { name: 'Piscines Bernat Picornell', category: 'studio', address: "Av. de l'Estadi 30, Montjuïc", lat: 41.3669, lng: 2.15 },

  // ─── galleries / culture ───
  { name: 'Fundació Joan Miró', category: 'gallery', address: 'Parc de Montjuïc', lat: 41.3686, lng: 2.16 },
  { name: 'CCCB', category: 'gallery', address: 'Carrer de Montalegre 5, Raval', lat: 41.3833, lng: 2.1669 },
  { name: 'Poble Espanyol', category: 'gallery', address: 'Av. Francesc Ferrer i Guàrdia 13, Montjuïc', lat: 41.3686, lng: 2.1467 },
  { name: 'Recinte Modernista de Sant Pau', category: 'gallery', address: 'Carrer de Sant Antoni Maria Claret 167', lat: 41.4119, lng: 2.1743 },

  // ─── markets ───
  { name: 'Mercat de la Boqueria', category: 'market', address: 'La Rambla 91', lat: 41.3817, lng: 2.1717 },
  { name: 'Mercat de Sant Antoni', category: 'market', address: 'Carrer del Comte d’Urgell 1', lat: 41.3784, lng: 2.1626 },
  { name: 'Els Encants Vells', category: 'market', address: 'Av. Meridiana 69, Glòries', lat: 41.4019, lng: 2.1865 },

  // ─── bookshops ───
  { name: 'Llibreria Finestres', category: 'bookshop', address: 'Carrer de la Diputació 249, Eixample', lat: 41.3902, lng: 2.1668 },
  { name: 'La Central del Raval', category: 'bookshop', address: "Carrer d'Elisabets 6, Raval", lat: 41.383, lng: 2.169 },
  { name: 'Casa Usher', category: 'bookshop', address: 'Carrer de Santaló 79, Sant Gervasi', lat: 41.3979, lng: 2.141 },

  // ─── clubs ───
  { name: 'Razzmatazz', category: 'club', address: 'Carrer dels Almogàvers 122, Poblenou', lat: 41.3973, lng: 2.1907 },
  { name: 'Sala Apolo', category: 'club', address: 'Carrer Nou de la Rambla 113, Poble-sec', lat: 41.3743, lng: 2.1697 },
  { name: 'La Paloma', category: 'club', address: 'Carrer del Tigre 27, Raval', lat: 41.3838, lng: 2.1645 },

  // ─── bakeries ───
  { name: 'Hofmann Pastisseria', category: 'bakery', address: 'Carrer dels Flassaders 44, El Born', lat: 41.3852, lng: 2.1828 },
  { name: 'Baluard Barceloneta', category: 'bakery', address: 'Carrer del Baluard 38, Barceloneta', lat: 41.3786, lng: 2.1893 },
  { name: 'Pastisseria Escribà', category: 'bakery', address: 'La Rambla 83', lat: 41.3815, lng: 2.1726 },
].map((p) => ({ ...p, city: 'Barcelona' }));
