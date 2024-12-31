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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readAndEmitEventStream = exports.captureEventStream = void 0;
const events_1 = __importDefault(require("events"));
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const readline_1 = require("readline");
const generics_1 = require("./generics");
const make_mutex_1 = require("./make-mutex");
/**
 * Captures events from a baileys event emitter & stores them in a file
 * @param ev The event emitter to read events from
 * @param filename File to save to
 */
const captureEventStream = (ev, filename) => {
    const oldEmit = ev.emit;
    // write mutex so data is appended in order
    const writeMutex = (0, make_mutex_1.makeMutex)();
    // monkey patch eventemitter to capture all events
    ev.emit = function (...args) {
        const content = JSON.stringify({ timestamp: Date.now(), event: args[0], data: args[1] }) + '\n';
        const result = oldEmit.apply(ev, args);
        writeMutex.mutex(() => __awaiter(this, void 0, void 0, function* () {
            yield (0, promises_1.writeFile)(filename, content, { flag: 'a' });
        }));
        return result;
    };
};
exports.captureEventStream = captureEventStream;
/**
 * Read event file and emit events from there
 * @param filename filename containing event data
 * @param delayIntervalMs delay between each event emit
 */
const readAndEmitEventStream = (filename, delayIntervalMs = 0) => {
    const ev = new events_1.default();
    const fireEvents = () => __awaiter(void 0, void 0, void 0, function* () {
        var _a, e_1, _b, _c;
        // from: https://stackoverflow.com/questions/6156501/read-a-file-one-line-at-a-time-in-node-js
        const fileStream = (0, fs_1.createReadStream)(filename);
        const rl = (0, readline_1.createInterface)({
            input: fileStream,
            crlfDelay: Infinity
        });
        try {
            // Note: we use the crlfDelay option to recognize all instances of CR LF
            // ('\r\n') in input.txt as a single line break.
            for (var _d = true, rl_1 = __asyncValues(rl), rl_1_1; rl_1_1 = yield rl_1.next(), _a = rl_1_1.done, !_a; _d = true) {
                _c = rl_1_1.value;
                _d = false;
                const line = _c;
                if (line) {
                    const { event, data } = JSON.parse(line);
                    ev.emit(event, data);
                    delayIntervalMs && (yield (0, generics_1.delay)(delayIntervalMs));
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = rl_1.return)) yield _b.call(rl_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        fileStream.close();
    });
    return {
        ev,
        task: fireEvents()
    };
};
exports.readAndEmitEventStream = readAndEmitEventStream;
