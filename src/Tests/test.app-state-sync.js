"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Utils_1 = require("../Utils");
const chat_utils_1 = require("../Utils/chat-utils");
const logger_1 = __importDefault(require("../Utils/logger"));
describe('App State Sync Tests', () => {
    const me = { id: randomJid() };
    // case when initial sync is off
    it('should return archive=false event', () => {
        var _a;
        const jid = randomJid();
        const index = ['archive', jid];
        const CASES = [
            [
                {
                    index,
                    syncAction: {
                        value: {
                            archiveChatAction: {
                                archived: false,
                                messageRange: {
                                    lastMessageTimestamp: (0, Utils_1.unixTimestampSeconds)()
                                }
                            }
                        }
                    }
                }
            ],
            [
                {
                    index,
                    syncAction: {
                        value: {
                            archiveChatAction: {
                                archived: true,
                                messageRange: {
                                    lastMessageTimestamp: (0, Utils_1.unixTimestampSeconds)()
                                }
                            }
                        }
                    }
                },
                {
                    index,
                    syncAction: {
                        value: {
                            archiveChatAction: {
                                archived: false,
                                messageRange: {
                                    lastMessageTimestamp: (0, Utils_1.unixTimestampSeconds)()
                                }
                            }
                        }
                    }
                }
            ]
        ];
        for (const mutations of CASES) {
            const events = (0, chat_utils_1.processSyncAction)(mutations, me, undefined, logger_1.default);
            expect(events['chats.update']).toHaveLength(1);
            const event = (_a = events['chats.update']) === null || _a === void 0 ? void 0 : _a[0];
            expect(event.archive).toEqual(false);
        }
    });
    // case when initial sync is on
    // and unarchiveChats = true
    it('should not fire any archive event', () => {
        var _a;
        const jid = randomJid();
        const index = ['archive', jid];
        const now = (0, Utils_1.unixTimestampSeconds)();
        const CASES = [
            [
                {
                    index,
                    syncAction: {
                        value: {
                            archiveChatAction: {
                                archived: true,
                                messageRange: {
                                    lastMessageTimestamp: now - 1
                                }
                            }
                        }
                    }
                }
            ],
            [
                {
                    index,
                    syncAction: {
                        value: {
                            archiveChatAction: {
                                archived: false,
                                messageRange: {
                                    lastMessageTimestamp: now + 10
                                }
                            }
                        }
                    }
                }
            ],
            [
                {
                    index,
                    syncAction: {
                        value: {
                            archiveChatAction: {
                                archived: true,
                                messageRange: {
                                    lastMessageTimestamp: now + 10
                                }
                            }
                        }
                    }
                },
                {
                    index,
                    syncAction: {
                        value: {
                            archiveChatAction: {
                                archived: false,
                                messageRange: {
                                    lastMessageTimestamp: now + 11
                                }
                            }
                        }
                    }
                }
            ],
        ];
        const ctx = {
            recvChats: {
                [jid]: { lastMsgRecvTimestamp: now }
            },
            accountSettings: { unarchiveChats: true }
        };
        for (const mutations of CASES) {
            const events = processSyncActions(mutations, me, ctx, logger_1.default);
            expect((_a = events['chats.update']) === null || _a === void 0 ? void 0 : _a.length).toBeFalsy();
        }
    });
    // case when initial sync is on
    // with unarchiveChats = true & unarchiveChats = false
    it('should fire archive=true events', () => {
        var _a;
        const jid = randomJid();
        const index = ['archive', jid];
        const now = (0, Utils_1.unixTimestampSeconds)();
        const CASES = [
            {
                settings: { unarchiveChats: true },
                mutations: [
                    {
                        index,
                        syncAction: {
                            value: {
                                archiveChatAction: {
                                    archived: true,
                                    messageRange: {
                                        lastMessageTimestamp: now
                                    }
                                }
                            }
                        }
                    }
                ],
            },
            {
                settings: { unarchiveChats: false },
                mutations: [
                    {
                        index,
                        syncAction: {
                            value: {
                                archiveChatAction: {
                                    archived: true,
                                    messageRange: {
                                        lastMessageTimestamp: now - 10
                                    }
                                }
                            }
                        }
                    }
                ],
            }
        ];
        for (const { mutations, settings } of CASES) {
            const ctx = {
                recvChats: {
                    [jid]: { lastMsgRecvTimestamp: now }
                },
                accountSettings: settings
            };
            const events = processSyncActions(mutations, me, ctx, logger_1.default);
            expect(events['chats.update']).toHaveLength(1);
            const event = (_a = events['chats.update']) === null || _a === void 0 ? void 0 : _a[0];
            expect(event.archive).toEqual(true);
        }
    });
});
