import { Scenes } from 'telegraf';
import { postPropertyWizard } from './postProperty';
import { searchPropertyWizard } from './searchProperty';
import { MyContext } from '../utils/types';

export const stage = new Scenes.Stage<MyContext>([
    postPropertyWizard,
    searchPropertyWizard
]);
