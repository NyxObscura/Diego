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
exports.makeBusinessSocket = void 0;
const business_1 = require("../Utils/business");
const WABinary_1 = require("../WABinary");
const generic_utils_1 = require("../WABinary/generic-utils");
const messages_recv_1 = require("./messages-recv");
const makeBusinessSocket = (config) => {
    const sock = (0, messages_recv_1.makeMessagesRecvSocket)(config);
    const { authState, query, waUploadToServer } = sock;
    const getCatalog = (_a) => __awaiter(void 0, [_a], void 0, function* ({ jid, limit, cursor }) {
        var _b;
        jid = jid || ((_b = authState.creds.me) === null || _b === void 0 ? void 0 : _b.id);
        jid = (0, WABinary_1.jidNormalizedUser)(jid);
        const queryParamNodes = [
            {
                tag: 'limit',
                attrs: {},
                content: Buffer.from((limit || 10).toString())
            },
            {
                tag: 'width',
                attrs: {},
                content: Buffer.from('100')
            },
            {
                tag: 'height',
                attrs: {},
                content: Buffer.from('100')
            },
        ];
        if (cursor) {
            queryParamNodes.push({
                tag: 'after',
                attrs: {},
                content: cursor
            });
        }
        const result = yield query({
            tag: 'iq',
            attrs: {
                to: WABinary_1.S_WHATSAPP_NET,
                type: 'get',
                xmlns: 'w:biz:catalog'
            },
            content: [
                {
                    tag: 'product_catalog',
                    attrs: {
                        jid,
                        'allow_shop_source': 'true'
                    },
                    content: queryParamNodes
                }
            ]
        });
        return (0, business_1.parseCatalogNode)(result);
    });
    const getCollections = (jid_1, ...args_1) => __awaiter(void 0, [jid_1, ...args_1], void 0, function* (jid, limit = 51) {
        var _a;
        jid = jid || ((_a = authState.creds.me) === null || _a === void 0 ? void 0 : _a.id);
        jid = (0, WABinary_1.jidNormalizedUser)(jid);
        const result = yield query({
            tag: 'iq',
            attrs: {
                to: WABinary_1.S_WHATSAPP_NET,
                type: 'get',
                xmlns: 'w:biz:catalog',
                'smax_id': '35'
            },
            content: [
                {
                    tag: 'collections',
                    attrs: {
                        'biz_jid': jid,
                    },
                    content: [
                        {
                            tag: 'collection_limit',
                            attrs: {},
                            content: Buffer.from(limit.toString())
                        },
                        {
                            tag: 'item_limit',
                            attrs: {},
                            content: Buffer.from(limit.toString())
                        },
                        {
                            tag: 'width',
                            attrs: {},
                            content: Buffer.from('100')
                        },
                        {
                            tag: 'height',
                            attrs: {},
                            content: Buffer.from('100')
                        }
                    ]
                }
            ]
        });
        return (0, business_1.parseCollectionsNode)(result);
    });
    const getOrderDetails = (orderId, tokenBase64) => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield query({
            tag: 'iq',
            attrs: {
                to: WABinary_1.S_WHATSAPP_NET,
                type: 'get',
                xmlns: 'fb:thrift_iq',
                'smax_id': '5'
            },
            content: [
                {
                    tag: 'order',
                    attrs: {
                        op: 'get',
                        id: orderId
                    },
                    content: [
                        {
                            tag: 'image_dimensions',
                            attrs: {},
                            content: [
                                {
                                    tag: 'width',
                                    attrs: {},
                                    content: Buffer.from('100')
                                },
                                {
                                    tag: 'height',
                                    attrs: {},
                                    content: Buffer.from('100')
                                }
                            ]
                        },
                        {
                            tag: 'token',
                            attrs: {},
                            content: Buffer.from(tokenBase64)
                        }
                    ]
                }
            ]
        });
        return (0, business_1.parseOrderDetailsNode)(result);
    });
    const productUpdate = (productId, update) => __awaiter(void 0, void 0, void 0, function* () {
        update = yield (0, business_1.uploadingNecessaryImagesOfProduct)(update, waUploadToServer);
        const editNode = (0, business_1.toProductNode)(productId, update);
        const result = yield query({
            tag: 'iq',
            attrs: {
                to: WABinary_1.S_WHATSAPP_NET,
                type: 'set',
                xmlns: 'w:biz:catalog'
            },
            content: [
                {
                    tag: 'product_catalog_edit',
                    attrs: { v: '1' },
                    content: [
                        editNode,
                        {
                            tag: 'width',
                            attrs: {},
                            content: '100'
                        },
                        {
                            tag: 'height',
                            attrs: {},
                            content: '100'
                        }
                    ]
                }
            ]
        });
        const productCatalogEditNode = (0, generic_utils_1.getBinaryNodeChild)(result, 'product_catalog_edit');
        const productNode = (0, generic_utils_1.getBinaryNodeChild)(productCatalogEditNode, 'product');
        return (0, business_1.parseProductNode)(productNode);
    });
    const productCreate = (create) => __awaiter(void 0, void 0, void 0, function* () {
        // ensure isHidden is defined
        create.isHidden = !!create.isHidden;
        create = yield (0, business_1.uploadingNecessaryImagesOfProduct)(create, waUploadToServer);
        const createNode = (0, business_1.toProductNode)(undefined, create);
        const result = yield query({
            tag: 'iq',
            attrs: {
                to: WABinary_1.S_WHATSAPP_NET,
                type: 'set',
                xmlns: 'w:biz:catalog'
            },
            content: [
                {
                    tag: 'product_catalog_add',
                    attrs: { v: '1' },
                    content: [
                        createNode,
                        {
                            tag: 'width',
                            attrs: {},
                            content: '100'
                        },
                        {
                            tag: 'height',
                            attrs: {},
                            content: '100'
                        }
                    ]
                }
            ]
        });
        const productCatalogAddNode = (0, generic_utils_1.getBinaryNodeChild)(result, 'product_catalog_add');
        const productNode = (0, generic_utils_1.getBinaryNodeChild)(productCatalogAddNode, 'product');
        return (0, business_1.parseProductNode)(productNode);
    });
    const productDelete = (productIds) => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield query({
            tag: 'iq',
            attrs: {
                to: WABinary_1.S_WHATSAPP_NET,
                type: 'set',
                xmlns: 'w:biz:catalog'
            },
            content: [
                {
                    tag: 'product_catalog_delete',
                    attrs: { v: '1' },
                    content: productIds.map(id => ({
                        tag: 'product',
                        attrs: {},
                        content: [
                            {
                                tag: 'id',
                                attrs: {},
                                content: Buffer.from(id)
                            }
                        ]
                    }))
                }
            ]
        });
        const productCatalogDelNode = (0, generic_utils_1.getBinaryNodeChild)(result, 'product_catalog_delete');
        return {
            deleted: +((productCatalogDelNode === null || productCatalogDelNode === void 0 ? void 0 : productCatalogDelNode.attrs.deleted_count) || 0)
        };
    });
    return Object.assign(Object.assign({}, sock), { logger: config.logger, getOrderDetails,
        getCatalog,
        getCollections,
        productCreate,
        productDelete,
        productUpdate });
};
exports.makeBusinessSocket = makeBusinessSocket;
