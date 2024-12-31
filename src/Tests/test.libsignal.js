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
const libsignal_1 = require("../Signal/libsignal");
const Utils_1 = require("../Utils");
describe('Signal Tests', () => {
    it('should correctly encrypt/decrypt 1 message', () => __awaiter(void 0, void 0, void 0, function* () {
        const user1 = makeUser();
        const user2 = makeUser();
        const msg = Buffer.from('hello there!');
        yield prepareForSendingMessage(user1, user2);
        const result = yield user1.repository.encryptMessage({ jid: user2.jid, data: msg });
        const dec = yield user2.repository.decryptMessage(Object.assign({ jid: user1.jid }, result));
        expect(dec).toEqual(msg);
    }));
    it('should correctly override a session', () => __awaiter(void 0, void 0, void 0, function* () {
        const user1 = makeUser();
        const user2 = makeUser();
        const msg = Buffer.from('hello there!');
        for (let preKeyId = 2; preKeyId <= 3; preKeyId++) {
            yield prepareForSendingMessage(user1, user2, preKeyId);
            const result = yield user1.repository.encryptMessage({ jid: user2.jid, data: msg });
            const dec = yield user2.repository.decryptMessage(Object.assign({ jid: user1.jid }, result));
            expect(dec).toEqual(msg);
        }
    }));
    it('should correctly encrypt/decrypt multiple messages', () => __awaiter(void 0, void 0, void 0, function* () {
        const user1 = makeUser();
        const user2 = makeUser();
        const msg = Buffer.from('hello there!');
        yield prepareForSendingMessage(user1, user2);
        for (let i = 0; i < 10; i++) {
            const result = yield user1.repository.encryptMessage({ jid: user2.jid, data: msg });
            const dec = yield user2.repository.decryptMessage(Object.assign({ jid: user1.jid }, result));
            expect(dec).toEqual(msg);
        }
    }));
    it('should encrypt/decrypt messages from group', () => __awaiter(void 0, void 0, void 0, function* () {
        const groupId = '123456@g.us';
        const participants = [...Array(5)].map(makeUser);
        const msg = Buffer.from('hello there!');
        const sender = participants[0];
        const enc = yield sender.repository.encryptGroupMessage({
            group: groupId,
            meId: sender.jid,
            data: msg
        });
        for (const participant of participants) {
            if (participant === sender) {
                continue;
            }
            yield participant.repository.processSenderKeyDistributionMessage({
                item: {
                    groupId,
                    axolotlSenderKeyDistributionMessage: enc.senderKeyDistributionMessage
                },
                authorJid: sender.jid
            });
            const dec = yield participant.repository.decryptGroupMessage({
                group: groupId,
                authorJid: sender.jid,
                msg: enc.ciphertext
            });
            expect(dec).toEqual(msg);
        }
    }));
});
function makeUser() {
    const store = makeTestAuthState();
    const jid = `${Math.random().toString().replace('.', '')}@s.whatsapp.net`;
    const repository = (0, libsignal_1.makeLibSignalRepository)(store);
    return { store, jid, repository };
}
function prepareForSendingMessage(sender_1, receiver_1) {
    return __awaiter(this, arguments, void 0, function* (sender, receiver, preKeyId = 2) {
        const preKey = Utils_1.Curve.generateKeyPair();
        yield sender.repository.injectE2ESession({
            jid: receiver.jid,
            session: {
                registrationId: receiver.store.creds.registrationId,
                identityKey: (0, Utils_1.generateSignalPubKey)(receiver.store.creds.signedIdentityKey.public),
                signedPreKey: {
                    keyId: receiver.store.creds.signedPreKey.keyId,
                    publicKey: (0, Utils_1.generateSignalPubKey)(receiver.store.creds.signedPreKey.keyPair.public),
                    signature: receiver.store.creds.signedPreKey.signature,
                },
                preKey: {
                    keyId: preKeyId,
                    publicKey: (0, Utils_1.generateSignalPubKey)(preKey.public),
                }
            }
        });
        yield receiver.store.keys.set({
            'pre-key': {
                [preKeyId]: preKey
            }
        });
    });
}
function makeTestAuthState() {
    const identityKey = Utils_1.Curve.generateKeyPair();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const store = {};
    return {
        creds: {
            signedIdentityKey: identityKey,
            registrationId: (0, Utils_1.generateRegistrationId)(),
            signedPreKey: (0, Utils_1.signedKeyPair)(identityKey, 1),
        },
        keys: {
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
        }
    };
    function getUniqueId(type, id) {
        return `${type}.${id}`;
    }
}
