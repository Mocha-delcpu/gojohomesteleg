export type LanguageCode = 'en' | 'am';

export interface TranslationDictionary {
  welcome: string;
  searchBtn: string;
  postBtn: string;
  latestBtn: string;
  agenciesBtn: string;
  helpBtn: string;
  cancelBtn: string;
  switchLanguageBtn: string;
  languageChanged: string;
  searchStep1: string;
  searchStep2: string;
  searchStep3: string;
  searchStep4: string;
  searchSearching: string;
  searchNoResults: string;
  invalidLocation: string;
  invalidNumber: string;
  // Post Wizard
  postStep1: string;
  postStep2: string;
  postStep3: string;
  postStep4: string;
  postStep5: string;
  postPhoto: string;
  postContact: string;
  postConfirm: string;
  confirmBtn: string;
  postSuccess: string;
  // formatting
  bedrooms: string;
  price: string;
  location: string;
  description: string;
  contact: string;
  // Rent vs Sale
  listingTypePrompt: string;
  rent: string;
  sale: string;
  // Location Hierarchy
  selectRegion: string;
  selectZone: string;
  selectNeighborhood: string;
  selectedLocation: string;
}
