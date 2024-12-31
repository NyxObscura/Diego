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
const WAProto_1 = require("../../WAProto");
const Types_1 = require("../Types");
const Utils_1 = require("../Utils");
const logger_1 = __importDefault(require("../Utils/logger"));
const utils_1 = require("./utils");
describe('Event Buffer Tests', () => {
    let ev;
    beforeEach(() => {
        const _logger = logger_1.default.child({});
        _logger.level = 'trace';
        ev = (0, Utils_1.makeEventBuffer)(_logger);
    });
    it('should buffer a chat upsert & update event', () => __awaiter(void 0, void 0, void 0, function* () {
        const chatId = (0, utils_1.randomJid)();
        const chats = [];
        ev.on('chats.upsert', c => chats.push(...c));
        ev.on('chats.update', () => fail('should not emit update event'));
        ev.buffer();
        yield Promise.all([
            (() => __awaiter(void 0, void 0, void 0, function* () {
                ev.buffer();
                yield (0, Utils_1.delay)(100);
                ev.emit('chats.upsert', [{ id: chatId, conversationTimestamp: 123, unreadCount: 1 }]);
                const flushed = ev.flush();
                expect(flushed).toBeFalsy();
            }))(),
            (() => __awaiter(void 0, void 0, void 0, function* () {
                ev.buffer();
                yield (0, Utils_1.delay)(200);
                ev.emit('chats.update', [{ id: chatId, conversationTimestamp: 124, unreadCount: 1 }]);
                const flushed = ev.flush();
                expect(flushed).toBeFalsy();
            }))()
        ]);
        const flushed = ev.flush();
        expect(flushed).toBeTruthy();
        expect(chats).toHaveLength(1);
        expect(chats[0].conversationTimestamp).toEqual(124);
        expect(chats[0].unreadCount).toEqual(2);
    }));
    it('should overwrite a chats.delete event', () => __awaiter(void 0, void 0, void 0, function* () {
        const chatId = (0, utils_1.randomJid)();
        const chats = [];
        ev.on('chats.update', c => chats.push(...c));
        ev.on('chats.delete', () => fail('not should have emitted'));
        ev.buffer();
        ev.emit('chats.update', [{ id: chatId, conversationTimestamp: 123, unreadCount: 1 }]);
        ev.emit('chats.delete', [chatId]);
        ev.emit('chats.update', [{ id: chatId, conversationTimestamp: 124, unreadCount: 1 }]);
        ev.flush();
        expect(chats).toHaveLength(1);
    }));
    it('should overwrite a chats.update event', () => __awaiter(void 0, void 0, void 0, function* () {
        const chatId = (0, utils_1.randomJid)();
        const chatsDeleted = [];
        ev.on('chats.delete', c => chatsDeleted.push(...c));
        ev.on('chats.update', () => fail('not should have emitted'));
        ev.buffer();
        ev.emit('chats.update', [{ id: chatId, conversationTimestamp: 123, unreadCount: 1 }]);
        ev.emit('chats.delete', [chatId]);
        ev.flush();
        expect(chatsDeleted).toHaveLength(1);
    }));
    it('should release a conditional update at the right time', () => __awaiter(void 0, void 0, void 0, function* () {
        const chatId = (0, utils_1.randomJid)();
        const chatId2 = (0, utils_1.randomJid)();
        const chatsUpserted = [];
        const chatsSynced = [];
        ev.on('chats.upsert', c => chatsUpserted.push(...c));
        ev.on('messaging-history.set', c => chatsSynced.push(...c.chats));
        ev.on('chats.update', () => fail('not should have emitted'));
        ev.buffer();
        ev.emit('chats.update', [{
                id: chatId,
                archived: true,
                conditional(buff) {
                    if (buff.chatUpserts[chatId]) {
                        return true;
                    }
                }
            }]);
        ev.emit('chats.update', [{
                id: chatId2,
                archived: true,
                conditional(buff) {
                    if (buff.historySets.chats[chatId2]) {
                        return true;
                    }
                }
            }]);
        ev.flush();
        ev.buffer();
        ev.emit('chats.upsert', [{
                id: chatId,
                conversationTimestamp: 123,
                unreadCount: 1,
                muteEndTime: 123
            }]);
        ev.emit('messaging-history.set', {
            chats: [{
                    id: chatId2,
                    conversationTimestamp: 123,
                    unreadCount: 1,
                    muteEndTime: 123
                }],
            contacts: [],
            messages: [],
            isLatest: false
        });
        ev.flush();
        expect(chatsUpserted).toHaveLength(1);
        expect(chatsUpserted[0].id).toEqual(chatId);
        expect(chatsUpserted[0].archived).toEqual(true);
        expect(chatsUpserted[0].muteEndTime).toEqual(123);
        expect(chatsSynced).toHaveLength(1);
        expect(chatsSynced[0].id).toEqual(chatId2);
        expect(chatsSynced[0].archived).toEqual(true);
    }));
    it('should discard a conditional update', () => __awaiter(void 0, void 0, void 0, function* () {
        const chatId = (0, utils_1.randomJid)();
        const chatsUpserted = [];
        ev.on('chats.upsert', c => chatsUpserted.push(...c));
        ev.on('chats.update', () => fail('not should have emitted'));
        ev.buffer();
        ev.emit('chats.update', [{
                id: chatId,
                archived: true,
                conditional(buff) {
                    if (buff.chatUpserts[chatId]) {
                        return false;
                    }
                }
            }]);
        ev.emit('chats.upsert', [{
                id: chatId,
                conversationTimestamp: 123,
                unreadCount: 1,
                muteEndTime: 123
            }]);
        ev.flush();
        expect(chatsUpserted).toHaveLength(1);
        expect(chatsUpserted[0].archived).toBeUndefined();
    }));
    it('should overwrite a chats.update event with a history event', () => __awaiter(void 0, void 0, void 0, function* () {
        const chatId = (0, utils_1.randomJid)();
        let chatRecv;
        ev.on('messaging-history.set', ({ chats }) => {
            chatRecv = chats[0];
        });
        ev.on('chats.update', () => fail('not should have emitted'));
        ev.buffer();
        ev.emit('messaging-history.set', {
            chats: [{ id: chatId, conversationTimestamp: 123, unreadCount: 1 }],
            messages: [],
            contacts: [],
            isLatest: true
        });
        ev.emit('chats.update', [{ id: chatId, archived: true }]);
        ev.flush();
        expect(chatRecv).toBeDefined();
        expect(chatRecv === null || chatRecv === void 0 ? void 0 : chatRecv.archived).toBeTruthy();
    }));
    it('should buffer message upsert events', () => __awaiter(void 0, void 0, void 0, function* () {
        const messageTimestamp = (0, Utils_1.unixTimestampSeconds)();
        const msg = {
            key: {
                remoteJid: (0, utils_1.randomJid)(),
                id: (0, Utils_1.generateMessageID)(),
                fromMe: false
            },
            messageStubType: Types_1.WAMessageStubType.CIPHERTEXT,
            messageTimestamp
        };
        const msgs = [];
        ev.on('messages.upsert', c => {
            msgs.push(...c.messages);
            expect(c.type).toEqual('notify');
        });
        ev.buffer();
        ev.emit('messages.upsert', { messages: [WAProto_1.proto.WebMessageInfo.fromObject(msg)], type: 'notify' });
        msg.messageTimestamp = (0, Utils_1.unixTimestampSeconds)() + 1;
        msg.messageStubType = undefined;
        msg.message = { conversation: 'Test' };
        ev.emit('messages.upsert', { messages: [WAProto_1.proto.WebMessageInfo.fromObject(msg)], type: 'notify' });
        ev.emit('messages.update', [{ key: msg.key, update: { status: Types_1.WAMessageStatus.READ } }]);
        ev.flush();
        expect(msgs).toHaveLength(1);
        expect(msgs[0].message).toBeTruthy();
        expect((0, Utils_1.toNumber)(msgs[0].messageTimestamp)).toEqual(messageTimestamp);
        expect(msgs[0].status).toEqual(Types_1.WAMessageStatus.READ);
    }));
    it('should buffer a message receipt update', () => __awaiter(void 0, void 0, void 0, function* () {
        const msg = {
            key: {
                remoteJid: (0, utils_1.randomJid)(),
                id: (0, Utils_1.generateMessageID)(),
                fromMe: false
            },
            messageStubType: Types_1.WAMessageStubType.CIPHERTEXT,
            messageTimestamp: (0, Utils_1.unixTimestampSeconds)()
        };
        const msgs = [];
        ev.on('messages.upsert', c => msgs.push(...c.messages));
        ev.on('message-receipt.update', () => fail('should not emit'));
        ev.buffer();
        ev.emit('messages.upsert', { messages: [WAProto_1.proto.WebMessageInfo.fromObject(msg)], type: 'notify' });
        ev.emit('message-receipt.update', [
            {
                key: msg.key,
                receipt: {
                    userJid: (0, utils_1.randomJid)(),
                    readTimestamp: (0, Utils_1.unixTimestampSeconds)()
                }
            }
        ]);
        ev.flush();
        expect(msgs).toHaveLength(1);
        expect(msgs[0].userReceipt).toHaveLength(1);
    }));
    it('should buffer multiple status updates', () => __awaiter(void 0, void 0, void 0, function* () {
        const key = {
            remoteJid: (0, utils_1.randomJid)(),
            id: (0, Utils_1.generateMessageID)(),
            fromMe: false
        };
        const msgs = [];
        ev.on('messages.update', c => msgs.push(...c));
        ev.buffer();
        ev.emit('messages.update', [{ key, update: { status: Types_1.WAMessageStatus.DELIVERY_ACK } }]);
        ev.emit('messages.update', [{ key, update: { status: Types_1.WAMessageStatus.READ } }]);
        ev.flush();
        expect(msgs).toHaveLength(1);
        expect(msgs[0].update.status).toEqual(Types_1.WAMessageStatus.READ);
    }));
    it('should remove chat unread counter', () => __awaiter(void 0, void 0, void 0, function* () {
        const msg = {
            key: {
                remoteJid: '12345@s.whatsapp.net',
                id: (0, Utils_1.generateMessageID)(),
                fromMe: false
            },
            message: {
                conversation: 'abcd'
            },
            messageTimestamp: (0, Utils_1.unixTimestampSeconds)()
        };
        const chats = [];
        ev.on('chats.update', c => chats.push(...c));
        ev.buffer();
        ev.emit('messages.upsert', { messages: [WAProto_1.proto.WebMessageInfo.fromObject(msg)], type: 'notify' });
        ev.emit('chats.update', [{ id: msg.key.remoteJid, unreadCount: 1, conversationTimestamp: msg.messageTimestamp }]);
        ev.emit('messages.update', [{ key: msg.key, update: { status: Types_1.WAMessageStatus.READ } }]);
        ev.flush();
        expect(chats[0].unreadCount).toBeUndefined();
    }));
});
