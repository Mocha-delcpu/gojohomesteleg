import { Scenes } from 'telegraf';

export interface MySession extends Scenes.WizardSession<Scenes.WizardSessionData> {
  language?: 'en' | 'am';
}

export interface MyContext extends Scenes.WizardContext {
  session: MySession;
  wizard: Scenes.WizardContextWizard<MyContext> & {
    state: {
      location?: string;
      propertyType?: string;
      minPrice?: number;
      price?: number;
      bedrooms?: number;
      description?: string;
      photos?: string[]; // array of file_ids
      contactPhone?: string;
    };
  };
}
