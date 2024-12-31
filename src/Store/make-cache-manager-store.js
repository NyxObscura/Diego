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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cache_manager_1 = require("cache-manager");
const WAProto_1 = require("../../WAProto");
const Utils_1 = require("../Utils");
const logger_1 = __importDefault(require("../Utils/logger"));
const makeCacheManagerAuthState = (store, sessionKey) => __awaiter(void 0, void 0, void 0, function* () {
    const defaultKey = (file) => `${sessionKey}:${file}`;
    const databaseConn = yield (0, cache_manager_1.caching)(store);
    const writeData = (file, data) => __awaiter(void 0, void 0, void 0, function* () {
        let ttl = undefined;
        if (file === 'creds') {
            ttl = 63115200; // 2 years
        }
        yield databaseConn.set(defaultKey(file), JSON.stringify(data, Utils_1.BufferJSON.replacer), ttl);
    });
    const readData = (file) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const data = yield databaseConn.get(defaultKey(file));
            if (data) {
                return JSON.parse(data, Utils_1.BufferJSON.reviver);
            }
            return null;
        }
        catch (error) {
            logger_1.default.error(error);
            return null;
        }
    });
    const removeData = (file) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            return yield databaseConn.del(defaultKey(file));
        }
        catch (_a) {
            logger_1.default.error(`Error removing ${file} from session ${sessionKey}`);
        }
    });
    const clearState = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const result = yield databaseConn.store.keys(`${sessionKey}*`);
            yield Promise.all(result.map((key) => __awaiter(void 0, void 0, void 0, function* () { return yield databaseConn.del(key); })));
        }
        catch (err) {
        }
    });
    const creds = (yield readData('creds')) || (0, Utils_1.initAuthCreds)();
    return {
        clearState,
        saveCreds: () => writeData('creds', creds),
        state: {
            creds,
            keys: {
                get: (type, ids) => __awaiter(void 0, void 0, void 0, function* () {
                    const data = {};
                    yield Promise.all(ids.map((id) => __awaiter(void 0, void 0, void 0, function* () {
                        let value = yield readData(`${type}-${id}`);
                        if (type === 'app-state-sync-key' && value) {
                            value = WAProto_1.proto.Message.AppStateSyncKeyData.fromObject(value);
                        }
                        data[id] = value;
                    })));
                    return data;
                }),
                set: (data) => __awaiter(void 0, void 0, void 0, function* () {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const tasks = [];
                    for (const category in data) {
                        for (const id in data[category]) {
                            const value = data[category][id];
                            const key = `${category}-${id}`;
                            tasks.push(value ? writeData(key, value) : removeData(key));
                        }
                    }
                    yield Promise.all(tasks);
                }),
            }
        }
    };
});
exports.default = makeCacheManagerAuthState;
