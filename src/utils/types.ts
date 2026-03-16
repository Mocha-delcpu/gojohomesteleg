import { Scenes } from 'telegraf';

export interface MySession extends Scenes.WizardSession<Scenes.WizardSessionData> {
  language?: 'en' | 'am';
}

export interface PropertyData {
  id?: string;
  listing_type?: 'rent' | 'sale';
  // Location selection state
  selectedRegion?: string;
  selectedZone?: string;
  // Final data
  location?: string;
  property_type?: string;
  price?: number;
  bedrooms?: number;
  description?: string;
  photos?: string[];
  contact_phone?: string;
}

export interface MyContext extends Scenes.WizardContext {
  session: MySession;
  wizard: Scenes.WizardContextWizard<MyContext> & {
    state: PropertyData;
  };
}
