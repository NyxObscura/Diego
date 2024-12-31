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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const WAProto_1 = require("../../WAProto");
const Utils_1 = require("../Utils");
jest.setTimeout(20000);
const TEST_VECTORS = [
    {
        type: 'image',
        message: WAProto_1.proto.Message.ImageMessage.decode(Buffer.from('Ck1odHRwczovL21tZy53aGF0c2FwcC5uZXQvZC9mL0FwaHR4WG9fWXZZcDZlUVNSa0tjOHE5d2ozVUpleWdoY3poM3ExX3I0ektnLmVuYxIKaW1hZ2UvanBlZyIgKTuVFyxDc6mTm4GXPlO3Z911Wd8RBeTrPLSWAEdqW8MomcUBQiB7wH5a4nXMKyLOT0A2nFgnnM/DUH8YjQf8QtkCIekaSkogTB+BXKCWDFrmNzozY0DCPn0L4VKd7yG1ZbZwbgRhzVc=', 'base64')),
        plaintext: (0, fs_1.readFileSync)('./Media/cat.jpeg')
    },
    {
        type: 'image',
        message: WAProto_1.proto.Message.ImageMessage.decode(Buffer.from('Ck1odHRwczovL21tZy53aGF0c2FwcC5uZXQvZC9mL0Ftb2tnWkphNWF6QWZxa3dVRzc0eUNUdTlGeWpjMmd5akpqcXNmMUFpZEU5LmVuYxIKaW1hZ2UvanBlZyIg8IS5TQzdzcuvcR7F8HMhWnXmlsV+GOo9JE1/t2k+o9Yoz6o6QiA7kDk8j5KOEQC0kDFE1qW7lBBDYhm5z06N3SirfUj3CUog/CjYF8e670D5wUJwWv2B2mKzDEo8IJLStDv76YmtPfs=', 'base64')),
        plaintext: (0, fs_1.readFileSync)('./Media/icon.png')
    },
];
describe('Media Download Tests', () => {
    it('should download a full encrypted media correctly', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a, e_1, _b, _c;
        for (const { type, message, plaintext } of TEST_VECTORS) {
            const readPipe = yield (0, Utils_1.downloadContentFromMessage)(message, type);
            let buffer = Buffer.alloc(0);
            try {
                for (var _d = true, readPipe_1 = (e_1 = void 0, __asyncValues(readPipe)), readPipe_1_1; readPipe_1_1 = yield readPipe_1.next(), _a = readPipe_1_1.done, !_a; _d = true) {
                    _c = readPipe_1_1.value;
                    _d = false;
                    const read = _c;
                    buffer = Buffer.concat([buffer, read]);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = readPipe_1.return)) yield _b.call(readPipe_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            expect(buffer).toEqual(plaintext);
        }
    }));
    it('should download an encrypted media correctly piece', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a, e_2, _b, _c;
        for (const { type, message, plaintext } of TEST_VECTORS) {
            // check all edge cases
            const ranges = [
                { startByte: 51, endByte: plaintext.length - 100 }, // random numbers
                { startByte: 1024, endByte: 2038 }, // larger random multiples of 16
                { startByte: 1, endByte: plaintext.length - 1 } // borders
            ];
            for (const range of ranges) {
                const readPipe = yield (0, Utils_1.downloadContentFromMessage)(message, type, range);
                let buffer = Buffer.alloc(0);
                try {
                    for (var _d = true, readPipe_2 = (e_2 = void 0, __asyncValues(readPipe)), readPipe_2_1; readPipe_2_1 = yield readPipe_2.next(), _a = readPipe_2_1.done, !_a; _d = true) {
                        _c = readPipe_2_1.value;
                        _d = false;
                        const read = _c;
                        buffer = Buffer.concat([buffer, read]);
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (!_d && !_a && (_b = readPipe_2.return)) yield _b.call(readPipe_2);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
                const hex = buffer.toString('hex');
                const expectedHex = plaintext.slice(range.startByte || 0, range.endByte || undefined).toString('hex');
                expect(hex).toBe(expectedHex);
                console.log('success on ', range);
            }
        }
    }));
});
