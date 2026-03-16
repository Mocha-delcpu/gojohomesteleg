import { TranslationDictionary } from './types';

export const am: TranslationDictionary = {
  welcome: '👋 እንኳን ወደ *ጎጆ ሆምስ* (Gojo Homes) በደህና መጡ!\n\nበኢትዮጵያ ውስጥ ቤቶችን *ለማግኘት* እና *ለማከራየት/ለመሸጥ* ቀላሉ መንገድ።\n\nምን ማድረግ ይፈልጋሉ?',
  searchBtn: '🔍 ፈልግ',
  postBtn: '📢 ቤት አስገባ',
  latestBtn: '🆕 አዳዲስ ቤቶች',
  agenciesBtn: '🏢 ኤጀንሲዎች',
  helpBtn: '❓ እርዳታ',
  cancelBtn: '❌ ሰርዝ',
  switchLanguageBtn: '🌐 ቋንቋ ቀይር',
  languageChanged: '🇪🇹 ቋንቋ ወደ አማርኛ ተቀይሯል!',
  
  searchStep1: '🔍 *ቤቶችን ይፈልጉ*\n\nደረጃ 1 ከ 4 — የሚፈልጉትን *አካባቢ* ያስገቡ:\n_(ለምሳሌ፦ ቦሌ፣ ሲኤምሲ፣ መገናኛ)_',
  searchStep2: '📍 *አካባቢው ተመዝግቧል!*\n\nደረጃ 2 ከ 4 — የቤቱን *አይነት* ይምረጡ:',
  searchStep3: '🏘 *አይነቱ ተመዝግቧል!*\n\nደረጃ 3 ከ 4 — *አነስተኛ* የመክፈል አቅምዎ ስንት ነው? (በብር)\n_(ቁጥር ብቻ ያስገቡ)_',
  searchStep4: '💵 *አነስተኛ ዋጋ ተመዝግቧል!*\n\nደረጃ 4 ከ 4 — *ከፍተኛ* የመክፈል አቅምዎ ስንት ነው? (በብር)\n_(ቁጥር ብቻ ያስገቡ)_',
  searchSearching: '🔎 በመፈለግ ላይ...',
  searchNoResults: '😔 የተገኘ ቤት የለም።',
  invalidLocation: 'እባክዎ ትክክለኛ አካባቢ ያስገቡ።',
  invalidNumber: 'እባክዎ ትክክለኛ ቁጥር ያስገቡ።',
  
  postStep1: '📢 *ቤት ለማስገባት*\n\nደረጃ 1 ከ 8 — ቤቱ የሚገኝበት *አካባቢ* የት ነው?',
  postStep2: '📍 *አካባቢው ተመዝግቧል!*\n\nደረጃ 2 ከ 8 — የቤቱ *አይነት* ምንድነው?',
  postStep3: '🏘 *አይነቱ ተመዝግቧል!*\n\nደረጃ 3 ከ 8 — *ዋጋው* ስንት ነው? (በብር)\n_(ቁጥር ብቻ ያስገቡ)_',
  postStep4: '💵 *ዋጋው ተመዝግቧል!*\n\nደረጃ 4 ከ 8 — ስንት *መኝታ ቤት* አለው?\n_(ከሌለው 0 ያስገቡ)_',
  postStep5: '🛏 *መኝታ ቤቱ ተመዝግቧል!*\n\nደረጃ 5 ከ 8 — ሰፋ ያለ *ማብራሪያ* ይጻፉ:',
  postPhoto: '📝 *ማብራሪያው ተመዝግቧል!*\n\nደረጃ 6 ከ 8 — የቤቱን ጥሩ *ፎቶ* ይላኩ:',
  postContact: '📸 *ፎቶው ተመዝግቧል!*\n\nደረጃ 7 ከ 8 — የዎትን *ስልክ ቁጥር* ያስገቡ?',
  postConfirm: '📞 *ስልኩ ተመዝግቧል!*\n\nደረጃ 8 ከ 8 — *መረጃውን ያረጋግጡ:*\n\nበትክክል ተሞልቷል?',
  confirmBtn: '✅ አዎ፣ ይለቀቅ',
  postSuccess: '🎉 *ቤቱ በተሳካ ሁኔታ ተለቋል!*\n\nመረጃው በጎጆ ሆምስ ቻናል ላይ ወጥቷል።',
  
  bedrooms: 'መኝታ ክፍሎች',
  price: 'ዋጋ',
  location: 'አካባቢ',
  description: 'ማብራሪያ',
  contact: 'ስልክ ቁጥር',

  // Rent vs Sale
  listingTypePrompt: '📢 *ቤት ለማስገባት*\n\nይህ ቤት *ለኪራይ* ነው ወይስ *ለሽያጭ*?',
  rent: 'ለኪራይ',
  sale: 'ለሽያጭ',

  // Location Hierarchy
  selectRegion: '🗺 *ደረጃ 1 ከ 9 — አካባቢ*\n\nእባክዎ *ክልል* ይምረጡ:',
  selectZone: '📍 *ክልሉ ተመዝግቧል!*\n\n*ከተማ/ክፍለ ከተማ* ይምረጡ:',
  selectNeighborhood: '🏘 *ከተማው ተመዝግቧል!*\n\nየሚገኝበትን ልዩ *ሰፈር* ይምረጡ:',
  selectedLocation: '✅ *አካባቢው ተመዝግቧል:*',
};
