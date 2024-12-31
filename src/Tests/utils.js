"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.randomJid = randomJid;
exports.makeMockSignalKeyStore = makeMockSignalKeyStore;
const WABinary_1 = require("../WABinary");
function randomJid() {
    return (0, WABinary_1.jidEncode)(Math.floor(Math.random() * 1000000), Math.random() < 0.5 ? 's.whatsapp.net' : 'g.us');
}
function makeMockSignalKeyStore() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const store = {};
    return {
        get(type, ids) {
            const data = {};
            for (const id of ids) {
                const item = store[getUniqueId(type, id)];
                if (typeof item !== 'undefined') {
                    data[id] = item;
                }
            }
            return data;
        },
        set(data) {
            for (const type in data) {
                for (const id in data[type]) {
                    store[getUniqueId(type, id)] = data[type][id];
                }
            }
        },
    };
    function getUniqueId(type, id) {
        return `${type}.${id}`;
    }
}
