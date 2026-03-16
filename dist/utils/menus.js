"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCancelMenu = exports.getPropertyTypeMenu = exports.getMainMenu = void 0;
const telegraf_1 = require("telegraf");
const i18n_1 = require("../i18n");
const getMainMenu = (lang = 'en') => {
    const t = i18n_1.i18n.get(lang);
    return telegraf_1.Markup.inlineKeyboard([
        [telegraf_1.Markup.button.callback(t.searchBtn, 'action_search')],
        [telegraf_1.Markup.button.callback(t.postBtn, 'action_post_property')],
        [telegraf_1.Markup.button.callback(t.latestBtn, 'action_latest'), telegraf_1.Markup.button.callback(t.agenciesBtn, 'action_agencies')],
        [telegraf_1.Markup.button.callback(t.switchLanguageBtn, 'action_language'), telegraf_1.Markup.button.callback(t.helpBtn, 'action_help')],
    ]);
};
exports.getMainMenu = getMainMenu;
const getPropertyTypeMenu = () => {
    return telegraf_1.Markup.keyboard([
        ['Apartment', 'Villa'],
        ['Studio', 'Commercial'],
        ['Land']
    ]).resize().oneTime();
};
exports.getPropertyTypeMenu = getPropertyTypeMenu;
const getCancelMenu = (lang = 'en') => {
    const t = i18n_1.i18n.get(lang);
    return telegraf_1.Markup.keyboard([
        [t.cancelBtn]
    ]).resize();
};
exports.getCancelMenu = getCancelMenu;
