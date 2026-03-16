"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.i18n = void 0;
const en_1 = require("./en");
const am_1 = require("./am");
exports.i18n = {
    en: en_1.en,
    am: am_1.am,
    get(lang = 'en') {
        return this[lang] || this.en;
    }
};
