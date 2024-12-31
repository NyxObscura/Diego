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
exports.uploadingNecessaryImages = exports.parseProductNode = exports.toProductNode = exports.parseOrderDetailsNode = exports.parseCollectionsNode = exports.parseCatalogNode = void 0;
exports.uploadingNecessaryImagesOfProduct = uploadingNecessaryImagesOfProduct;
const boom_1 = require("@hapi/boom");
const crypto_1 = require("crypto");
const WABinary_1 = require("../WABinary");
const messages_media_1 = require("./messages-media");
const parseCatalogNode = (node) => {
    const catalogNode = (0, WABinary_1.getBinaryNodeChild)(node, 'product_catalog');
    const products = (0, WABinary_1.getBinaryNodeChildren)(catalogNode, 'product').map(exports.parseProductNode);
    const paging = (0, WABinary_1.getBinaryNodeChild)(catalogNode, 'paging');
    return {
        products,
        nextPageCursor: paging
            ? (0, WABinary_1.getBinaryNodeChildString)(paging, 'after')
            : undefined
    };
};
exports.parseCatalogNode = parseCatalogNode;
const parseCollectionsNode = (node) => {
    const collectionsNode = (0, WABinary_1.getBinaryNodeChild)(node, 'collections');
    const collections = (0, WABinary_1.getBinaryNodeChildren)(collectionsNode, 'collection').map(collectionNode => {
        const id = (0, WABinary_1.getBinaryNodeChildString)(collectionNode, 'id');
        const name = (0, WABinary_1.getBinaryNodeChildString)(collectionNode, 'name');
        const products = (0, WABinary_1.getBinaryNodeChildren)(collectionNode, 'product').map(exports.parseProductNode);
        return {
            id,
            name,
            products,
            status: parseStatusInfo(collectionNode)
        };
    });
    return {
        collections
    };
};
exports.parseCollectionsNode = parseCollectionsNode;
const parseOrderDetailsNode = (node) => {
    const orderNode = (0, WABinary_1.getBinaryNodeChild)(node, 'order');
    const products = (0, WABinary_1.getBinaryNodeChildren)(orderNode, 'product').map(productNode => {
        const imageNode = (0, WABinary_1.getBinaryNodeChild)(productNode, 'image');
        return {
            id: (0, WABinary_1.getBinaryNodeChildString)(productNode, 'id'),
            name: (0, WABinary_1.getBinaryNodeChildString)(productNode, 'name'),
            imageUrl: (0, WABinary_1.getBinaryNodeChildString)(imageNode, 'url'),
            price: +(0, WABinary_1.getBinaryNodeChildString)(productNode, 'price'),
            currency: (0, WABinary_1.getBinaryNodeChildString)(productNode, 'currency'),
            quantity: +(0, WABinary_1.getBinaryNodeChildString)(productNode, 'quantity')
        };
    });
    const priceNode = (0, WABinary_1.getBinaryNodeChild)(orderNode, 'price');
    const orderDetails = {
        price: {
            total: +(0, WABinary_1.getBinaryNodeChildString)(priceNode, 'total'),
            currency: (0, WABinary_1.getBinaryNodeChildString)(priceNode, 'currency'),
        },
        products
    };
    return orderDetails;
};
exports.parseOrderDetailsNode = parseOrderDetailsNode;
const toProductNode = (productId, product) => {
    const attrs = {};
    const content = [];
    if (typeof productId !== 'undefined') {
        content.push({
            tag: 'id',
            attrs: {},
            content: Buffer.from(productId)
        });
    }
    if (typeof product.name !== 'undefined') {
        content.push({
            tag: 'name',
            attrs: {},
            content: Buffer.from(product.name)
        });
    }
    if (typeof product.description !== 'undefined') {
        content.push({
            tag: 'description',
            attrs: {},
            content: Buffer.from(product.description)
        });
    }
    if (typeof product.retailerId !== 'undefined') {
        content.push({
            tag: 'retailer_id',
            attrs: {},
            content: Buffer.from(product.retailerId)
        });
    }
    if (product.images.length) {
        content.push({
            tag: 'media',
            attrs: {},
            content: product.images.map(img => {
                if (!('url' in img)) {
                    throw new boom_1.Boom('Expected img for product to already be uploaded', { statusCode: 400 });
                }
                return {
                    tag: 'image',
                    attrs: {},
                    content: [
                        {
                            tag: 'url',
                            attrs: {},
                            content: Buffer.from(img.url.toString())
                        }
                    ]
                };
            })
        });
    }
    if (typeof product.price !== 'undefined') {
        content.push({
            tag: 'price',
            attrs: {},
            content: Buffer.from(product.price.toString())
        });
    }
    if (typeof product.currency !== 'undefined') {
        content.push({
            tag: 'currency',
            attrs: {},
            content: Buffer.from(product.currency)
        });
    }
    if ('originCountryCode' in product) {
        if (typeof product.originCountryCode === 'undefined') {
            attrs['compliance_category'] = 'COUNTRY_ORIGIN_EXEMPT';
        }
        else {
            content.push({
                tag: 'compliance_info',
                attrs: {},
                content: [
                    {
                        tag: 'country_code_origin',
                        attrs: {},
                        content: Buffer.from(product.originCountryCode)
                    }
                ]
            });
        }
    }
    if (typeof product.isHidden !== 'undefined') {
        attrs['is_hidden'] = product.isHidden.toString();
    }
    const node = {
        tag: 'product',
        attrs,
        content
    };
    return node;
};
exports.toProductNode = toProductNode;
const parseProductNode = (productNode) => {
    const isHidden = productNode.attrs.is_hidden === 'true';
    const id = (0, WABinary_1.getBinaryNodeChildString)(productNode, 'id');
    const mediaNode = (0, WABinary_1.getBinaryNodeChild)(productNode, 'media');
    const statusInfoNode = (0, WABinary_1.getBinaryNodeChild)(productNode, 'status_info');
    const product = {
        id,
        imageUrls: parseImageUrls(mediaNode),
        reviewStatus: {
            whatsapp: (0, WABinary_1.getBinaryNodeChildString)(statusInfoNode, 'status'),
        },
        availability: 'in stock',
        name: (0, WABinary_1.getBinaryNodeChildString)(productNode, 'name'),
        retailerId: (0, WABinary_1.getBinaryNodeChildString)(productNode, 'retailer_id'),
        url: (0, WABinary_1.getBinaryNodeChildString)(productNode, 'url'),
        description: (0, WABinary_1.getBinaryNodeChildString)(productNode, 'description'),
        price: +(0, WABinary_1.getBinaryNodeChildString)(productNode, 'price'),
        currency: (0, WABinary_1.getBinaryNodeChildString)(productNode, 'currency'),
        isHidden,
    };
    return product;
};
exports.parseProductNode = parseProductNode;
/**
 * Uploads images not already uploaded to WA's servers
 */
function uploadingNecessaryImagesOfProduct(product_1, waUploadToServer_1) {
    return __awaiter(this, arguments, void 0, function* (product, waUploadToServer, timeoutMs = 30000) {
        product = Object.assign(Object.assign({}, product), { images: product.images ? yield (0, exports.uploadingNecessaryImages)(product.images, waUploadToServer, timeoutMs) : product.images });
        return product;
    });
}
/**
 * Uploads images not already uploaded to WA's servers
 */
const uploadingNecessaryImages = (images_1, waUploadToServer_1, ...args_1) => __awaiter(void 0, [images_1, waUploadToServer_1, ...args_1], void 0, function* (images, waUploadToServer, timeoutMs = 30000) {
    const results = yield Promise.all(images.map((img) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, e_1, _b, _c;
        if ('url' in img) {
            const url = img.url.toString();
            if (url.includes('.whatsapp.net')) {
                return { url };
            }
        }
        const { stream } = yield (0, messages_media_1.getStream)(img);
        const hasher = (0, crypto_1.createHash)('sha256');
        const contentBlocks = [];
        try {
            for (var _d = true, stream_1 = __asyncValues(stream), stream_1_1; stream_1_1 = yield stream_1.next(), _a = stream_1_1.done, !_a; _d = true) {
                _c = stream_1_1.value;
                _d = false;
                const block = _c;
                hasher.update(block);
                contentBlocks.push(block);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = stream_1.return)) yield _b.call(stream_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        const sha = hasher.digest('base64');
        const { directPath } = yield waUploadToServer((0, messages_media_1.toReadable)(Buffer.concat(contentBlocks)), {
            mediaType: 'product-catalog-image',
            fileEncSha256B64: sha,
            timeoutMs
        });
        return { url: (0, messages_media_1.getUrlFromDirectPath)(directPath) };
    })));
    return results;
});
exports.uploadingNecessaryImages = uploadingNecessaryImages;
const parseImageUrls = (mediaNode) => {
    const imgNode = (0, WABinary_1.getBinaryNodeChild)(mediaNode, 'image');
    return {
        requested: (0, WABinary_1.getBinaryNodeChildString)(imgNode, 'request_image_url'),
        original: (0, WABinary_1.getBinaryNodeChildString)(imgNode, 'original_image_url')
    };
};
const parseStatusInfo = (mediaNode) => {
    const node = (0, WABinary_1.getBinaryNodeChild)(mediaNode, 'status_info');
    return {
        status: (0, WABinary_1.getBinaryNodeChildString)(node, 'status'),
        canAppeal: (0, WABinary_1.getBinaryNodeChildString)(node, 'can_appeal') === 'true',
    };
};
