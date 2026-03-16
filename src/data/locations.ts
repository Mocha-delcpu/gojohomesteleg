// src/data/locations.ts

export interface LocationHierarchy {
  [region: string]: {
    [subcityOrZone: string]: string[];
  };
}

export const ETHIOPIA_LOCATIONS: LocationHierarchy = {
  "Addis Ababa": {
    "Bole": ["Bole Rwanda", "Edna Mall", "Brass", "Chechnya", "Japan", "Gerji", "Goro", "CMC", "Ayat", "Bole Arabsa", "Bulbula", "Bole Medhanialem", "Bole Michael"],
    "Yeka": ["Megenagna", "Signal", "Kotebe", "Kara", "Ferensay", "Shola", "Gurd Shola", "Yeka Abado", "Weserbi"],
    "Kirkos": ["Kazanchis", "Meskel Square", "Gotera", "Kera", "Bambis", "Dembel", "Lancia", "Beklo Bet", "Gofa Sefer"],
    "Arada": ["Piassa", "Arat Kilo", "Semen Mazegaja", "Aware", "Afincho Ber", "Doro Manekia", "Sebara Babur", "Giyorgis"],
    "Nifas Silk-Lafto": ["Lebu", "Jemo 1", "Jemo 2", "Jemo 3", "Haile Garment", "Mekanisa", "Sarbet", "Lafto", "Nifas Silk", "Gofa Camp"],
    "Kolfe Keranio": ["Ayer Tena", "Bethel", "Alem Bank", "Keranio", "Zenebe Work", "Total", "Repi"],
    "Lideta": ["Lideta", "Abnet", "Teka Haymanot", "Geja Sefer", "Sengatera", "Coca Cola", "Mexico"],
    "Addis Ketema": ["Merkato", "Autobus Tera", "Atekelt Tera", "Gojjam Ber", "Kolfe", "Paulos"],
    "Akaky Kaliti": ["Kaliti", "Akaky", "Tuludimtu", "Gelan Condominium", "Saris", "Koye Feche"],
    "Gulele": ["Shiromeda", "Gulele", "Addisu Gebeya", "Kuskuam", "Entoto", "Wingate", "Pastor"],
    "Lemi Kura": ["Lemi", "Ayat Zone 2", "Ayat Zone 5", "Meri", "Kura"],
  },
  "Amhara": {
    "Bahir Dar": ["Kebele 14", "Fasilo", "Diaspora", "Avanti", "Gish Abay", "Peda", "Sefene Selam"],
    "Gondar": ["Piazza", "Arada", "Azezo", "Kebele 18", "Maraki", "Jantekel"],
    "Dessie": ["Piazza", "Arada", "Buanbuawuha", "Hotie", "Dawudo", "Arab Genda"],
    "Debre Markos": ["Menaharia", "Kebele 1", "Kebele 2", "Gohatsion"],
    "Kombolcha": ["01 Kebele", "02 Kebele", "03 Kebele"]
  },
  "Oromia": {
    "Adama (Nazret)": ["Bole", "Aba Geda", "Boku Shenan", "Geda", "Dabe Soloke", "Kera", "Awash"],
    "Bishoftu (Debre Zeyit)": ["Kajimma", "Babogaya", "Kuriftu", "Cheleleka", "Hora"],
    "Jimma": ["Hermata", "Awetu", "Mentina", "Boche", "Kofe"],
    "Shashamane": ["Awasho", "Arada", "01 Kebele", "Kuyera"],
    "Nekemte": ["Bakanisa", "01 Kebele", "Sorga", "Bake Jama"]
  },
  "Tigray": {
    "Mekelle": ["15", "16", "Ayder", "Hawelti", "Adihaki", "Kedamay Weyane", "Quiha"],
    "Adigrat": ["Central", "Edaga", "Agazi", "Emded"],
    "Axum": ["Hawelti", "Maebel", "Central"],
    "Shire": ["Central", "Suq"]
  },
  "SNNPR": {
    "Hawassa": ["Piassa", "Adare", "Tabor", "Mehal Ketema", "Misrak", "Hayk Dar"],
    "Arba Minch": ["Secha", "Sikela", "Wuha Minch"],
    "Dila": ["Central", "Mehal Ketema"]
  },
  "Sidama": {
    "Hawassa (Capital)": ["Piassa", "Adare", "Tabor", "Menaharia"]
  },
  "Dire Dawa": {
    "Dire Dawa": ["Keira", "Megala", "Sabian", "Number One", "Gende Kore", "Dechatu", "Fasil"]
  },
  "Harari": {
    "Harar": ["Jegol", "Arategna", "Shewa Ber", "Amir Nur"]
  },
  "Somali": {
    "Jijiga": ["Kebele 01", "Kebele 02", "Kebele 03", "Kebele 04", "Taiwan"],
  },
  "Afar": {
    "Semera": ["Central", "Admin Area"],
    "Logia": ["Logia Town"]
  },
  "Benishangul-Gumuz": {
    "Assosa": ["Kebele 01", "Kebele 02", "Kebele 03"]
  },
  "Gambela": {
    "Gambela City": ["Kebele 01", "Kebele 02", "Kebele 03"]
  }
};
