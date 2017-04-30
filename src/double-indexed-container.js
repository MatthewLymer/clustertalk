"use strict";

module.exports = function DoubleIndexedContainer() {
    const _itemsById = {};
    const _itemsByCollectionId = {};

    this.add = function (id, collectionId, data) {
        const item = {
            collectionId,
            data
        };

        _itemsById[id] = item;

        let items = _itemsByCollectionId[collectionId]

        if (typeof items === 'undefined') {
            _itemsByCollectionId[collectionId] = items = {};
        }

        items[id] = item;
    };

    this.get = function (id) {
        const item = _itemsById[id];
        return typeof item === 'undefined' 
            ? null 
            : item.data;
    };

    this.remove = function (id) {
        const item = _itemsById[id];

        if (typeof item === 'undefined') {
            return null;
        }

        delete _itemsById[id];
        delete _itemsByCollectionId[item.collectionId][id];

        if (Object.keys(_itemsByCollectionId[item.collectionId]).length === 0) {
            delete _itemsByCollectionId[item.collectionId];
        }
    };

    this.getAll = function (collectionId) {
        const items = _itemsByCollectionId[collectionId];
        return typeof items === 'undefined' 
            ? [] 
            : Object.keys(items).map(k => items[k].data);
    };

    this.removeAll = function (collectionId) {
        const items = _itemsByCollectionId[collectionId];

        if (typeof items === 'undefined') {
            return;
        }

        Object.keys(items).forEach(key => {
            delete _itemsById[key];
        });

        delete _itemsByCollectionId[collectionId];
    };  
};