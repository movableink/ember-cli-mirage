import {
  assign as _assign,
  isFunction as _isFunction,
  mapValues as _mapValues,
  isPlainObject as _isPlainObject
} from 'lodash-es';
import referenceSort from './utils/reference-sort';

let Factory = function() {
  this.build = function(sequence) {
    let object = {};
    let topLevelAttrs = _assign({}, this.attrs);
    delete topLevelAttrs.afterCreate;
    Object.keys(topLevelAttrs).forEach(attr => {
      if (Factory.isTrait.call(this, attr)) {
        delete topLevelAttrs[attr];
      }
    });
    let keys = sortAttrs(topLevelAttrs, sequence);

    keys.forEach(function(key) {
      let buildAttrs, buildSingleValue;

      buildAttrs = function(attrs) {
        return _mapValues(attrs, buildSingleValue);
      };

      buildSingleValue = value => {
        if (Array.isArray(value)) {
          return value.map(buildSingleValue);
        } else if (_isPlainObject(value)) {
          return buildAttrs(value);
        } else if (_isFunction(value)) {
          return value.call(topLevelAttrs, sequence);
        } else {
          return value;
        }
      };

      let value = topLevelAttrs[key];
      if (_isFunction(value)) {
        object[key] = value.call(object, sequence);
      } else {
        object[key] = buildSingleValue(value);
      }
    });

    return object;
  };
};

Factory.extend = function(attrs) {
  // Merge the new attributes with existing ones. If conflict, new ones win.
  let newAttrs = _assign({}, this.attrs, attrs);

  let Subclass = function() {
    this.attrs = newAttrs;
    Factory.call(this);
  };

  // Copy extend
  Subclass.extend = Factory.extend;
  Subclass.extractAfterCreateCallbacks = Factory.extractAfterCreateCallbacks;
  Subclass.isTrait = Factory.isTrait;

  // Store a reference on the class for future subclasses
  Subclass.attrs = newAttrs;

  return Subclass;
};

Factory.extractAfterCreateCallbacks = function({ traits } = {}) {
  let afterCreateCallbacks = [];
  let attrs = this.attrs || {};
  let traitCandidates;

  if (attrs.afterCreate) {
    afterCreateCallbacks.push(attrs.afterCreate);
  }

  if (Array.isArray(traits)) {
    traitCandidates = traits;
  } else {
    traitCandidates = Object.keys(attrs);
  }

  traitCandidates
    .filter(attr => {
      return this.isTrait(attr) && attrs[attr].extension.afterCreate;
    })
    .forEach(attr => {
      afterCreateCallbacks.push(attrs[attr].extension.afterCreate);
    });

  return afterCreateCallbacks;
};

Factory.isTrait = function(attrName) {
  let { attrs } = this;
  return (
    _isPlainObject(attrs[attrName]) && attrs[attrName].__isTrait__ === true
  );
};

function sortAttrs(attrs, sequence) {
  let Temp = function() {};
  let obj = new Temp();
  let refs = [];
  let property;

  Object.keys(attrs).forEach(function(key) {
    let value;
    Object.defineProperty(obj.constructor.prototype, key, {
      get() {
        refs.push([property, key]);
        return value;
      },
      set(newValue) {
        value = newValue;
      },
      enumerable: false,
      configurable: true
    });
  });

  Object.keys(attrs).forEach(function(key) {
    let value = attrs[key];
    if (typeof value !== 'function') {
      obj[key] = value;
    }
  });

  Object.keys(attrs).forEach(function(key) {
    let value = attrs[key];
    property = key;

    if (typeof value === 'function') {
      obj[key] = value.call(obj, sequence);
    }

    refs.push([key]);
  });

  return referenceSort(refs);
}

export default Factory;
