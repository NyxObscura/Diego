"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.makeLibSignalRepository = makeLibSignalRepository;
const libsignal = __importStar(require("libsignal"));
const WASignalGroup_1 = require("../../WASignalGroup");
const Utils_1 = require("../Utils");
const WABinary_1 = require("../WABinary");
function makeLibSignalRepository(auth) {
    const storage = signalStorage(auth);
    return {
        decryptGroupMessage({ group, authorJid, msg }) {
            const senderName = jidToSignalSenderKeyName(group, authorJid);
            const cipher = new WASignalGroup_1.GroupCipher(storage, senderName);
            return cipher.decrypt(msg);
        },
        processSenderKeyDistributionMessage(_a) {
            return __awaiter(this, arguments, void 0, function* ({ item, authorJid }) {
                const builder = new WASignalGroup_1.GroupSessionBuilder(storage);
                const senderName = jidToSignalSenderKeyName(item.groupId, authorJid);
                const senderMsg = new WASignalGroup_1.SenderKeyDistributionMessage(null, null, null, null, item.axolotlSenderKeyDistributionMessage);
                const { [senderName]: senderKey } = yield auth.keys.get('sender-key', [senderName]);
                if (!senderKey) {
                    yield storage.storeSenderKey(senderName, new WASignalGroup_1.SenderKeyRecord());
                }
                yield builder.process(senderName, senderMsg);
            });
        },
        decryptMessage(_a) {
            return __awaiter(this, arguments, void 0, function* ({ jid, type, ciphertext }) {
                const addr = jidToSignalProtocolAddress(jid);
                const session = new libsignal.SessionCipher(storage, addr);
                let result;
                switch (type) {
                    case 'pkmsg':
                        result = yield session.decryptPreKeyWhisperMessage(ciphertext);
                        break;
                    case 'msg':
                        result = yield session.decryptWhisperMessage(ciphertext);
                        break;
                }
                return result;
            });
        },
        encryptMessage(_a) {
            return __awaiter(this, arguments, void 0, function* ({ jid, data }) {
                const addr = jidToSignalProtocolAddress(jid);
                const cipher = new libsignal.SessionCipher(storage, addr);
                const { type: sigType, body } = yield cipher.encrypt(data);
                const type = sigType === 3 ? 'pkmsg' : 'msg';
                return { type, ciphertext: Buffer.from(body, 'binary') };
            });
        },
        encryptGroupMessage(_a) {
            return __awaiter(this, arguments, void 0, function* ({ group, meId, data }) {
                const senderName = jidToSignalSenderKeyName(group, meId);
                const builder = new WASignalGroup_1.GroupSessionBuilder(storage);
                const { [senderName]: senderKey } = yield auth.keys.get('sender-key', [senderName]);
                if (!senderKey) {
                    yield storage.storeSenderKey(senderName, new WASignalGroup_1.SenderKeyRecord());
                }
                const senderKeyDistributionMessage = yield builder.create(senderName);
                const session = new WASignalGroup_1.GroupCipher(storage, senderName);
                const ciphertext = yield session.encrypt(data);
                return {
                    ciphertext,
                    senderKeyDistributionMessage: senderKeyDistributionMessage.serialize(),
                };
            });
        },
        injectE2ESession(_a) {
            return __awaiter(this, arguments, void 0, function* ({ jid, session }) {
                const cipher = new libsignal.SessionBuilder(storage, jidToSignalProtocolAddress(jid));
                yield cipher.initOutgoing(session);
            });
        },
        jidToSignalProtocolAddress(jid) {
            return jidToSignalProtocolAddress(jid).toString();
        },
    };
}
const jidToSignalProtocolAddress = (jid) => {
    const { user, device } = (0, WABinary_1.jidDecode)(jid);
    return new libsignal.ProtocolAddress(user, device || 0);
};
const jidToSignalSenderKeyName = (group, user) => {
    return new WASignalGroup_1.SenderKeyName(group, jidToSignalProtocolAddress(user)).toString();
};
function signalStorage({ creds, keys }) {
    return {
        loadSession: (id) => __awaiter(this, void 0, void 0, function* () {
            const { [id]: sess } = yield keys.get('session', [id]);
            if (sess) {
                return libsignal.SessionRecord.deserialize(sess);
            }
        }),
        storeSession: (id, session) => __awaiter(this, void 0, void 0, function* () {
            yield keys.set({ 'session': { [id]: session.serialize() } });
        }),
        isTrustedIdentity: () => {
            return true;
        },
        loadPreKey: (id) => __awaiter(this, void 0, void 0, function* () {
            const keyId = id.toString();
            const { [keyId]: key } = yield keys.get('pre-key', [keyId]);
            if (key) {
                return {
                    privKey: Buffer.from(key.private),
                    pubKey: Buffer.from(key.public)
                };
            }
        }),
        removePreKey: (id) => keys.set({ 'pre-key': { [id]: null } }),
        loadSignedPreKey: () => {
            const key = creds.signedPreKey;
            return {
                privKey: Buffer.from(key.keyPair.private),
                pubKey: Buffer.from(key.keyPair.public)
            };
        },
        loadSenderKey: (keyId) => __awaiter(this, void 0, void 0, function* () {
            const { [keyId]: key } = yield keys.get('sender-key', [keyId]);
            if (key) {
                return new WASignalGroup_1.SenderKeyRecord(key);
            }
        }),
        storeSenderKey: (keyId, key) => __awaiter(this, void 0, void 0, function* () {
            yield keys.set({ 'sender-key': { [keyId]: key.serialize() } });
        }),
        getOurRegistrationId: () => (creds.registrationId),
        getOurIdentity: () => {
            const { signedIdentityKey } = creds;
            return {
                privKey: Buffer.from(signedIdentityKey.private),
                pubKey: (0, Utils_1.generateSignalPubKey)(signedIdentityKey.public),
            };
        }
    };
}
