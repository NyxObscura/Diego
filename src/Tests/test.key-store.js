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
const Utils_1 = require("../Utils");
const logger_1 = __importDefault(require("../Utils/logger"));
const utils_1 = require("./utils");
logger_1.default.level = 'trace';
describe('Key Store w Transaction Tests', () => {
    const rawStore = (0, utils_1.makeMockSignalKeyStore)();
    const store = (0, Utils_1.addTransactionCapability)(rawStore, logger_1.default, {
        maxCommitRetries: 1,
        delayBetweenTriesMs: 10
    });
    it('should use transaction cache when mutated', () => __awaiter(void 0, void 0, void 0, function* () {
        const key = '123';
        const value = new Uint8Array(1);
        const ogGet = rawStore.get;
        yield store.transaction(() => __awaiter(void 0, void 0, void 0, function* () {
            yield store.set({ 'session': { [key]: value } });
            rawStore.get = () => {
                throw new Error('should not have been called');
            };
            const { [key]: stored } = yield store.get('session', [key]);
            expect(stored).toEqual(new Uint8Array(1));
        }));
        rawStore.get = ogGet;
    }));
    it('should not commit a failed transaction', () => __awaiter(void 0, void 0, void 0, function* () {
        const key = 'abcd';
        yield expect(store.transaction(() => __awaiter(void 0, void 0, void 0, function* () {
            yield store.set({ 'session': { [key]: new Uint8Array(1) } });
            throw new Error('fail');
        }))).rejects.toThrowError('fail');
        const { [key]: stored } = yield store.get('session', [key]);
        expect(stored).toBeUndefined();
    }));
    it('should handle overlapping transactions', () => __awaiter(void 0, void 0, void 0, function* () {
        // promise to let transaction 2
        // know that transaction 1 has started
        let promiseResolve;
        const promise = new Promise(resolve => {
            promiseResolve = resolve;
        });
        store.transaction(() => __awaiter(void 0, void 0, void 0, function* () {
            yield store.set({
                'session': {
                    '1': new Uint8Array(1)
                }
            });
            // wait for the other transaction to start
            yield (0, Utils_1.delay)(5);
            // reolve the promise to let the other transaction continue
            promiseResolve();
        }));
        yield store.transaction(() => __awaiter(void 0, void 0, void 0, function* () {
            yield promise;
            yield (0, Utils_1.delay)(5);
            expect(store.isInTransaction()).toBe(true);
        }));
        expect(store.isInTransaction()).toBe(false);
        // ensure that the transaction were committed
        const { ['1']: stored } = yield store.get('session', ['1']);
        expect(stored).toEqual(new Uint8Array(1));
    }));
});
