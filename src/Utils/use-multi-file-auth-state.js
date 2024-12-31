"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMultiFileAuthState = void 0;
const promises_1 = require("fs/promises");
const path_1 = require("path");
const WAProto_1 = require("../../WAProto");
const auth_utils_1 = require("./auth-utils");
const generics_1 = require("./generics");
/**
 * stores the full authentication state in a single folder.
 * Far more efficient than singlefileauthstate
 *
 * Again, I wouldn't endorse this for any production level use other than perhaps a bot.
 * Would recommend writing an auth state for use with a proper SQL or No-SQL DB
 * */
const useMultiFileAuthState = (folder) => __awaiter(void 0, void 0, void 0, function* () {
    const writeData = (data, file) => {
        return (0, promises_1.writeFile)((0, path_1.join)(folder, fixFileName(file)), JSON.stringify(data, generics_1.BufferJSON.replacer));
    };
    const readData = (file) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const data = yield (0, promises_1.readFile)((0, path_1.join)(folder, fixFileName(file)), { encoding: 'utf-8' });
            return JSON.parse(data, generics_1.BufferJSON.reviver);
        }
        catch (error) {
            return null;
        }
    });
    const removeData = (file) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield (0, promises_1.unlink)((0, path_1.join)(folder, fixFileName(file)));
        }
        catch (_a) {
        }
    });
    const folderInfo = yield (0, promises_1.stat)(folder).catch(() => { });
    if (folderInfo) {
        if (!folderInfo.isDirectory()) {
            throw new Error(`found something that is not a directory at ${folder}, either delete it or specify a different location`);
        }
    }
    else {
        yield (0, promises_1.mkdir)(folder, { recursive: true });
    }
    const fixFileName = (file) => { var _a; return (_a = file === null || file === void 0 ? void 0 : file.replace(/\//g, '__')) === null || _a === void 0 ? void 0 : _a.replace(/:/g, '-'); };
    const creds = (yield readData('creds.json')) || (0, auth_utils_1.initAuthCreds)();
    return {
        state: {
            creds,
            keys: {
                get: (type, ids) => __awaiter(void 0, void 0, void 0, function* () {
                    const data = {};
                    yield Promise.all(ids.map((id) => __awaiter(void 0, void 0, void 0, function* () {
                        let value = yield readData(`${type}-${id}.json`);
                        if (type === 'app-state-sync-key' && value) {
                            value = WAProto_1.proto.Message.AppStateSyncKeyData.fromObject(value);
                        }
                        data[id] = value;
                    })));
                    return data;
                }),
                set: (data) => __awaiter(void 0, void 0, void 0, function* () {
                    const tasks = [];
                    for (const category in data) {
                        for (const id in data[category]) {
                            const value = data[category][id];
                            const file = `${category}-${id}.json`;
                            tasks.push(value ? writeData(value, file) : removeData(file));
                        }
                    }
                    yield Promise.all(tasks);
                })
            }
        },
        saveCreds: () => {
            return writeData(creds, 'creds.json');
        }
    };
});
exports.useMultiFileAuthState = useMultiFileAuthState;
