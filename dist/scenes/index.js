"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stage = void 0;
const telegraf_1 = require("telegraf");
const postProperty_1 = require("./postProperty");
const searchProperty_1 = require("./searchProperty");
exports.stage = new telegraf_1.Scenes.Stage([
    postProperty_1.postPropertyWizard,
    searchProperty_1.searchPropertyWizard
]);
