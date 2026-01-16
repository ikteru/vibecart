/**
 * VibeCart Constants
 *
 * Static data for Moroccan locations, mock products, etc.
 */

// Moroccan Cities and Neighborhoods
export const MOROCCAN_LOCATIONS: Record<string, string[]> = {
  "Agadir": [
    "Agadir Bay", "Al Massira", "Anza", "Bensergao", "Charaf", "Cite Dakhla",
    "Cite El Houda", "Cite Suisse", "Drarga", "Founty", "Hay Assaka", "Hay Hassani",
    "Hay Mohammadi", "Ihchach", "Iligh", "Les Amicales", "Nahda", "Najakh",
    "Quartier Industriel", "Riad Salam", "Salam", "Sonaba", "Taddart", "Talborjt",
    "Tikiouine", "Tilila"
  ],
  "Al Hoceima": [
    "Bario", "Calabonita", "Centre Ville", "Hay El Manar", "Marmorico", "Mirador",
    "Sidi Abid", "Tala Youssef"
  ],
  "Beni Mellal": [
    "Atlas", "Beni Amir", "Centre Ville", "Hay El Houda", "Hay Mohammadi",
    "Ouled Hamdan", "Riad Salam", "Takaddoum"
  ],
  "Berkane": [
    "Bayou", "Bouhhdila", "Centre Ville", "Hay Al Andalous", "Hay El Majd", "Hay Salem"
  ],
  "Casablanca": [
    "2 Mars", "Ain Chock", "Ain Diab", "Ain Sebaa", "Almaz", "Anfa", "Belvedere",
    "Bernoussi", "Bourgogne", "Bouskoura", "California", "Centre Ville", "CIL",
    "Derb Ghallef", "Derb Omar", "Derb Sultan", "Gauthier", "Gironde", "Habous",
    "Hay Adil", "Hay Chrifa", "Hay El Hana", "Hay Farah", "Hay Hassani",
    "Hay Mohammadi", "Hay Moulay Rachid", "Hay Sadri", "Hay Salama", "Inara",
    "Lahraouiyine", "Laymoun", "Lissasfa", "Maarif", "Maarif Extension", "Mers Sultan",
    "Nassim", "Oulfa", "Palmier", "Polo", "Racine", "Roche Noire", "Sbata",
    "Sidi Bernoussi", "Sidi Maarouf", "Sidi Moumen", "Sidi Othmane", "Val Fleuri", "Zoubir"
  ],
  "Dar Bouazza": [
    "Tamaris", "Oued Merzeg", "Jack Beach", "Errahma"
  ],
  "El Jadida": [
    "Airport", "Centre Ville", "Cite Portugaise", "Hay El Matar", "Hay Essalam",
    "Hay Najmat", "Najmat El Janoub", "Plateau"
  ],
  "Errachidia": [
    "Boutalamine", "Centre Ville", "Hay El Wifaq", "Targa", "Zitouna"
  ],
  "Essaouira": [
    "Ahl Agadir", "Borj", "Centre Ville", "Diabat", "Dune", "Ghazoua", "Lagouas",
    "Medina", "Mellah", "Skala"
  ],
  "Fes": [
    "Agdal", "Ain Nokbi", "Atlas", "Bab Ftouh", "Batha", "Bensouda", "Champs Course",
    "Dokayrat", "Doukkarat", "Fes El Bali", "Hay Hassani", "Hay Tariq", "Lido",
    "Medina", "Merinides", "Mont Fleuri", "Narjiss", "Oued Fes", "Route Immouzer",
    "Saiss", "Sidi Brahim", "Ville Nouvelle", "Zouagha"
  ],
  "Kenitra": [
    "Alliance Darna", "Bir Rami", "Centre Ville", "Haddada", "Hay El Wifaq",
    "La Ville Haute", "Maamora", "Mehdia", "Mimosa", "Ouled Oujih", "Saknia", "Val Fleuri"
  ],
  "Khouribga": [
    "Hay El Hana", "Hay El Massira", "Hay El Yasmine", "Hay Mohammadi", "Zaytouna"
  ],
  "Laayoune": [
    "Al Aouda", "Al Massira", "Centre Ville", "Dwirat", "Hay El Matar", "Polco"
  ],
  "Marrakech": [
    "Agdal", "Amerchich", "Annakhil", "Bab Doukkala", "Camp El Ghoul", "Chrifia",
    "Daoudiate", "Douar Al Askar", "Gueliz", "Hivernage", "Issil", "Kasbah",
    "Massira 1", "Massira 2", "Massira 3", "Medina", "Mhamid", "Palmeraie",
    "Sidi Ghanem", "Sidi Youssef Ben Ali", "Socoma", "Targa", "Victor Hugo"
  ],
  "Meknes": [
    "Agdal", "Bassatine", "Belle Vue", "Beni Mhamed", "Borj Moulay Omar", "Hamria",
    "Marjane", "Medina", "Ouislane", "Plaisance", "Rouamzine", "Sidi Baba",
    "Toulal", "Ville Nouvelle", "Wislane", "Zitoune"
  ],
  "Mohammedia": [
    "Al Alia", "Centre Ville", "El Falah", "Hay El Houria", "Hay Riad",
    "La Colline", "Monica", "Riad Salam", "Yasmina"
  ],
  "Nador": [
    "Al Matar", "Bni Ensar", "Centre Ville", "Hay Al Kindy", "Hay El Matar",
    "Ouled Mimoun", "Selouane"
  ],
  "Ouarzazate": [
    "Ait Kedif", "Al Massira", "Centre Ville", "Hay Mohammadi", "Tabounte", "Tassoumaat"
  ],
  "Oujda": [
    "Al Qods", "Centre Ville", "Hay Al Andalous", "Hay El Hikma", "Hay Essalam",
    "Hay Salam", "Lazaret", "Les Orangers", "Progres"
  ],
  "Rabat": [
    "Agdal", "Akkari", "Aviation", "Diour Jamaa", "Hassan", "Hay Ennahda",
    "Hay Fath", "Hay Riad", "Kamra", "Kebibat", "Les Orangers", "Mabella",
    "Medina", "Ocean", "Quartier Administratif", "Souissi", "Takaddoum",
    "Yacoub El Mansour"
  ],
  "Safi": [
    "Azib Derai", "Biada", "Centre Ville", "Hay Anas", "Hay El Matar",
    "Hay Mohammadi", "Jrifat", "Plateau", "Sidi Bouzid"
  ],
  "Sale": [
    "Bettana", "Hay Chmaou", "Hay Karima", "Hay Rahma", "Hay Salam", "Karia",
    "Layayda", "Marina", "Rostomia", "Sala Al Jadida", "Sidi Moussa", "Tabriquet"
  ],
  "Settat": [
    "Al Fath", "Centre Ville", "Hay El Farah", "Hay Salam", "M'hallah", "Mimosas"
  ],
  "Tangier": [
    "Achakar", "Ahlan", "Beni Makada", "Boubana", "California", "Casabarata",
    "Centre Ville", "Dradeb", "Gzenaya", "Iberia", "Jebel Kebir", "Malabata",
    "Marjane", "Marshane", "Mesnana", "Moghogha", "Mojahidine", "Moujahidine",
    "Msala", "Playa", "Sidi Driss", "Souani", "Tanah", "Val Fleuri"
  ],
  "Temara": [
    "Al Wifaq", "Guich Loudaya", "Harhoura", "Massira 1", "Massira 2",
    "Ouled Mtaa", "Sidi El Abed", "Val d'Or"
  ],
  "Tetouan": [
    "Al Mandari", "Boujarah", "Centre Ville", "Coelho", "Hay El Matar",
    "Medina", "Saniat Rmel", "Touila", "Wilaya"
  ],
  "Tiznit": [
    "Al Massira", "Centre Ville", "Hay Afrak", "Hay Mohammadi", "Hay Moulay Rachid"
  ],
};

export const MOROCCAN_CITIES = Object.keys(MOROCCAN_LOCATIONS).sort();

// Product Categories
export const PRODUCT_CATEGORIES = [
  'clothing',
  'shoes',
  'jewelry',
  'beauty',
  'home',
  'other',
] as const;

export type ProductCategoryType = (typeof PRODUCT_CATEGORIES)[number];
