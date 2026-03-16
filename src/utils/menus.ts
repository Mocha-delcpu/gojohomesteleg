import { Markup } from 'telegraf';
import { i18n } from '../i18n';

export const getMainMenu = (lang: 'en' | 'am' = 'en') => {
  const t = i18n.get(lang);
  return Markup.inlineKeyboard([
    [Markup.button.callback(t.searchBtn, 'action_search')],
    [Markup.button.callback(t.postBtn, 'action_post_property')],
    [Markup.button.callback(t.latestBtn, 'action_latest'), Markup.button.callback(t.agenciesBtn, 'action_agencies')],
    [Markup.button.callback(t.switchLanguageBtn, 'action_language'), Markup.button.callback(t.helpBtn, 'action_help')],
  ]);
};

export const getPropertyTypeMenu = () => {
  return Markup.keyboard([
    ['Apartment', 'Villa'],
    ['Studio', 'Commercial'],
    ['Land']
  ]).resize().oneTime();
};

export const getCancelMenu = (lang: 'en' | 'am' = 'en') => {
  const t = i18n.get(lang);
  return Markup.keyboard([
    [t.cancelBtn]
  ]).resize();
};
