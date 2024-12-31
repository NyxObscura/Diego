"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Utils_1 = require("../Utils");
describe('Messages Tests', () => {
    it('should correctly unwrap messages', () => {
        const CONTENT = { imageMessage: {} };
        expectRightContent(CONTENT);
        expectRightContent({
            ephemeralMessage: { message: CONTENT }
        });
        expectRightContent({
            viewOnceMessage: {
                message: {
                    ephemeralMessage: { message: CONTENT }
                }
            }
        });
        expectRightContent({
            viewOnceMessage: {
                message: {
                    viewOnceMessageV2: {
                        message: {
                            ephemeralMessage: { message: CONTENT }
                        }
                    }
                }
            }
        });
        function expectRightContent(content) {
            expect((0, Utils_1.normalizeMessageContent)(content)).toHaveProperty('imageMessage');
        }
    });
});
