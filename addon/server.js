/* eslint no-console: 0 */

import { Promise } from 'rsvp';

import { pluralize, camelize } from './utils/inflector';
import { toCollectionName } from '@movable/ember-cli-mirage/utils/normalize-name';
import isAssociation from '@movable/ember-cli-mirage/utils/is-association';
import Pretender from 'pretender';
import Db from './db';
import Schema from './orm/schema';
import assert from './assert';
import SerializerRegistry from './serializer-registry';
import RouteHandler from './route-handler';

import {
  pick as _pick,
  assign as _assign,
  find as _find,
  isPlainObject as _isPlainObject,
  isInteger as _isInteger
} from 'lodash-es';

/**
 * Creates a new Pretender instance.
 *
 * @method createPretender
 * @param {Server} server
 * @return {Object} A new Pretender instance.
 * @public
 */
function createPretender(server) {
  return new Pretender(function() {
    this.passthroughRequest = function(verb, path, request) {
      if (server.shouldLog()) {
        console.log(
          `Passthrough request: ${verb.toUpperCase()} ${request.url}`
        );
      }
    };

    this.handledRequest = function(verb, path, request) {
      if (server.shouldLog()) {
        console.log(
          `Mirage: [${request.status}] ${verb.toUpperCase()} ${request.url}`
        );
        let { responseText } = request;
        let loggedResponse;

        try {
          loggedResponse = JSON.parse(responseText);
        } catch (e) {
          loggedResponse = responseText;
        }

        console.log(loggedResponse);
      }
    };

    this.unhandledRequest = function(verb, path) {
      path = decodeURI(path);
      assert(
        `Your Ember app tried to ${verb} '${path}',
         but there was no route defined to handle this request.
         Define a route that matches this path in your
         mirage/config.js file. Did you forget to add your namespace?`
      );
    };
  });
}

const defaultRouteOptions = {
  coalesce: false,
  timing: undefined
};

const defaultPassthroughs = [
  'http://localhost:0/chromecheckurl', // mobile chrome
  'http://localhost:30820/socket.io' // electron
];
export { defaultPassthroughs };

/**
 * Determine if the object contains a valid option.
 *
 * @method isOption
 * @param {Object} option An object with one option value pair.
 * @return {Boolean} True if option is a valid option, false otherwise.
 * @private
 */
function isOption(option) {
  if (!option || typeof option !== 'object') {
    return false;
  }

  let allOptions = Object.keys(defaultRouteOptions);
  let optionKeys = Object.keys(option);
  for (let i = 0; i < optionKeys.length; i++) {
    let key = optionKeys[i];
    if (allOptions.indexOf(key) > -1) {
      return true;
    }
  }
  return false;
}

/**
 * Extract arguments for a route.
 *
 * @method extractRouteArguments
 * @param {Array} args Of the form [options], [object, code], [function, code]
 * [shorthand, options], [shorthand, code, options]
 * @return {Array} [handler (i.e. the function, object or shorthand), code,
 * options].
 * @private
 */
function extractRouteArguments(args) {
  let [lastArg] = args.splice(-1);
  if (isOption(lastArg)) {
    lastArg = _assign({}, defaultRouteOptions, lastArg);
  } else {
    args.push(lastArg);
    lastArg = defaultRouteOptions;
  }
  let t = 2 - args.length;
  while (t-- > 0) {
    args.push(undefined);
  }
  args.push(lastArg);
  return args;
}

/**
 *
 *
 * @class Server
 * @public
 */
export default class Server {
  /**
   * Build the new server object.
   *
   * @constructor
   * @public
   */
  constructor(options = {}) {
    this.config(options);
  }

  config(config = {}) {
    let didOverrideConfig =
      config.environment &&
      (this.environment && this.environment !== config.environment);
    assert(
      !didOverrideConfig,
      "You cannot modify Mirage's environment once the server is created"
    );
    this.environment = config.environment || 'development';

    this.options = config;

    this.timing = this.timing || config.timing || 400;
    this.namespace = this.namespace || config.namespace || '';
    this.urlPrefix = this.urlPrefix || config.urlPrefix || '';

    this._defineRouteHandlerHelpers();

    this.db = this.db || new Db();
    if (this.schema) {
      this.schema.registerModels(config.models);
      this.serializerOrRegistry.registerSerializers(config.serializers || {});
    } else {
      this.schema = new Schema(this.db, config.models);
      this.serializerOrRegistry = new SerializerRegistry(
        this.schema,
        config.serializers
      );
    }

    let hasFactories = this._hasModulesOfType(config, 'factories');
    let hasDefaultScenario =
      config.scenarios && config.scenarios.hasOwnProperty('default');

    this.pretender = this.pretender || createPretender(this);

    if (config.baseConfig) {
      this.loadConfig(config.baseConfig);
    }

    if (this.isTest()) {
      if (config.testConfig) {
        this.loadConfig(config.testConfig);
      }

      window.server = this; // TODO: Better way to inject server into test env
    }

    if (this.isTest() && hasFactories) {
      this.loadFactories(config.factories);
    } else if (!this.isTest() && hasDefaultScenario) {
      this.loadFactories(config.factories);
      config.scenarios.default(this);
    } else {
      this.loadFixtures();
    }

    if (config.useDefaultPassthroughs) {
      this._configureDefaultPassthroughs();
    }
  }

  /**
   * Determines if the current environment is the testing environment.
   *
   * @method isTest
   * @return {Boolean} True if the environment is 'test', false otherwise.
   * @public
   */
  isTest() {
    return this.environment === 'test';
  }

  /**
   * Determines if the server should log.
   *
   * @method shouldLog
   * @return The value of this.logging if defined, or false if in the testing environment,
   * true otherwise.
   * @public
   */
  shouldLog() {
    return typeof this.logging !== 'undefined' ? this.logging : !this.isTest();
  }

  /**
   * Load the configuration given, setting timing to 0 if in the test
   * environment.
   *
   * @method loadConfig
   * @param {Object} config The configuration to load.
   * @public
   */
  loadConfig(config) {
    config.call(this);
    this.timing = this.isTest() ? 0 : this.timing || 0;
  }

  /**
   * Whitelist requests to the specified paths and allow them to pass through
   * your Mirage server to the actual network layer.
   *
   * @method passthrough
   * @param {String} [...paths] Any numer of paths to whitelist
   * @param {Array} options Unused
   * @public
   */
  passthrough(...paths) {
    let verbs = ['get', 'post', 'put', 'delete', 'patch'];
    let lastArg = paths[paths.length - 1];

    if (paths.length === 0) {
      // paths = ['http://localhost:7357'];
      paths = ['/**', '/'];
    } else if (Array.isArray(lastArg)) {
      verbs = paths.pop();
    }

    verbs.forEach(verb => {
      paths.forEach(path => {
        let fullPath = this._getFullPath(path);
        this.pretender[verb](fullPath, this.pretender.passthrough);
      });
    });
  }

  /**
   * Load the all or only the specified fixtures into Mirage's database.
   *
   * @method loadFixtures
   * @param {String} [...args] The name of the fixture to load.
   * @public
   */
  loadFixtures(...args) {
    let { fixtures } = this.options;
    if (args.length) {
      let camelizedArgs = args.map(camelize);
      fixtures = _pick(fixtures, ...camelizedArgs);
    }

    this.db.loadData(fixtures);
  }

  /*
    Factory methods
  */

  /**
   * Load factories into Mirage's database.
   *
   * @method loadFactories
   * @param {Object} factoryMap
   * @public
   */
  loadFactories(factoryMap = {}) {
    // Store a reference to the factories
    let currentFactoryMap = this._factoryMap || {};
    this._factoryMap = _assign(currentFactoryMap, factoryMap);

    // Create a collection for each factory
    Object.keys(factoryMap).forEach(type => {
      let collectionName = toCollectionName(type);
      this.db.createCollection(collectionName);
    });
  }

  /**
   * Get the factory for a given type.
   *
   * @method factoryFor
   * @param {String} type
   * @private
   */
  factoryFor(type) {
    let camelizedType = camelize(type);

    if (this._factoryMap && this._factoryMap[camelizedType]) {
      return this._factoryMap[camelizedType];
    }
  }

  build(type, ...traitsAndOverrides) {
    let traits = traitsAndOverrides.filter(
      arg => arg && typeof arg === 'string'
    );
    let overrides = _find(traitsAndOverrides, arg => _isPlainObject(arg));
    let camelizedType = camelize(type);

    // Store sequence for factory type as instance variable
    this.factorySequences = this.factorySequences || {};
    this.factorySequences[camelizedType] =
      this.factorySequences[camelizedType] + 1 || 0;

    let OriginalFactory = this.factoryFor(type);
    if (OriginalFactory) {
      OriginalFactory = OriginalFactory.extend({});
      let attrs = OriginalFactory.attrs || {};
      this._validateTraits(traits, OriginalFactory, type);
      let mergedExtensions = this._mergeExtensions(attrs, traits, overrides);
      this._mapAssociationsFromAttributes(type, attrs);
      this._mapAssociationsFromAttributes(type, mergedExtensions);

      let Factory = OriginalFactory.extend(mergedExtensions);
      let factory = new Factory();

      let sequence = this.factorySequences[camelizedType];
      return factory.build(sequence);
    } else {
      return overrides;
    }
  }

  buildList(type, amount, ...traitsAndOverrides) {
    assert(
      _isInteger(amount),
      `second argument has to be an integer, you passed: ${typeof amount}`
    );

    let list = [];

    for (let i = 0; i < amount; i++) {
      list.push(this.build(type, ...traitsAndOverrides));
    }

    return list;
  }

  create(type, ...options) {
    // When there is a Model defined, we should return an instance
    // of it instead of returning the bare attributes.
    let traits = options.filter(arg => arg && typeof arg === 'string');
    let overrides = _find(options, arg => _isPlainObject(arg));
    let collectionFromCreateList = _find(
      options,
      arg => arg && Array.isArray(arg)
    );

    let attrs = this.build(type, ...traits, overrides);
    let modelOrRecord;

    if (this.schema && this.schema[toCollectionName(type)]) {
      let modelClass = this.schema[toCollectionName(type)];

      modelOrRecord = modelClass.create(attrs);
    } else {
      let collection, collectionName;

      if (collectionFromCreateList) {
        collection = collectionFromCreateList;
      } else {
        collectionName = this.schema ? toCollectionName(type) : pluralize(type);
        collection = this.db[collectionName];
      }

      assert(
        collection,
        `You called server.create(${type}) but no model or factory was found. Try \`ember g mirage-model ${type}\`.`
      );
      modelOrRecord = collection.insert(attrs);
    }

    let OriginalFactory = this.factoryFor(type);
    if (OriginalFactory) {
      OriginalFactory.extractAfterCreateCallbacks({ traits }).forEach(
        afterCreate => {
          afterCreate(modelOrRecord, this);
        }
      );
    }

    return modelOrRecord;
  }

  createList(type, amount, ...traitsAndOverrides) {
    assert(
      _isInteger(amount),
      `second argument has to be an integer, you passed: ${typeof amount}`
    );

    let list = [];
    let collectionName = this.schema ? toCollectionName(type) : pluralize(type);
    let collection = this.db[collectionName];

    for (let i = 0; i < amount; i++) {
      list.push(this.create(type, ...traitsAndOverrides, collection));
    }

    return list;
  }

  shutdown() {
    this.pretender.shutdown();
    if (this.environment === 'test') {
      window.server = undefined;
    }
  }

  resource(resourceName, { only, except } = {}) {
    only = only || [];
    except = except || [];

    if (only.length > 0 && except.length > 0) {
      throw 'cannot use both :only and :except options';
    }

    let actionsMethodsAndsPathsMappings = {
      index: { methods: ['get'], path: `/${resourceName}` },
      show: { methods: ['get'], path: `/${resourceName}/:id` },
      create: { methods: ['post'], path: `/${resourceName}` },
      update: { methods: ['put', 'patch'], path: `/${resourceName}/:id` },
      delete: { methods: ['del'], path: `/${resourceName}/:id` }
    };

    let allActions = Object.keys(actionsMethodsAndsPathsMappings);
    let actions =
      (only.length > 0 && only) ||
      (except.length > 0 &&
        allActions.filter(action => except.indexOf(action) === -1)) ||
      allActions;

    actions.forEach(action => {
      let methodsWithPath = actionsMethodsAndsPathsMappings[action];

      methodsWithPath.methods.forEach(method =>
        this[method](methodsWithPath.path)
      );
    });
  }

  /**
   *
   * @private
   */
  _defineRouteHandlerHelpers() {
    [
      ['get'],
      ['post'],
      ['put'],
      ['delete', 'del'],
      ['patch'],
      ['head']
    ].forEach(([verb, alias]) => {
      this[verb] = (path, ...args) => {
        let [rawHandler, customizedCode, options] = extractRouteArguments(args);
        this._registerRouteHandler(
          verb,
          path,
          rawHandler,
          customizedCode,
          options
        );
      };

      if (alias) {
        this[alias] = this[verb];
      }
    });
  }

  _serialize(body) {
    if (typeof body === 'string') {
      return body;
    } else if (body) {
      return JSON.stringify(body);
    } else {
      return '{"error": "not found"}';
    }
  }

  _registerRouteHandler(verb, path, rawHandler, customizedCode, options) {
    let routeHandler = new RouteHandler({
      schema: this.schema,
      verb,
      rawHandler,
      customizedCode,
      options,
      path,
      serializerOrRegistry: this.serializerOrRegistry
    });

    let fullPath = this._getFullPath(path);
    let timing =
      options.timing !== undefined ? options.timing : () => this.timing;

    this.pretender[verb](
      fullPath,
      request => {
        return new Promise(resolve => {
          Promise.resolve(routeHandler.handle(request)).then(mirageResponse => {
            let [code, headers, response] = mirageResponse;
            resolve([code, headers, this._serialize(response)]);
          });
        });
      },
      timing
    );
  }

  /**
   *
   * @private
   */
  _hasModulesOfType(modules, type) {
    let modulesOfType = modules[type];
    return modulesOfType ? Object.keys(modulesOfType).length > 0 : false;
  }

  /**
   * Builds a full path for Pretender to monitor based on the `path` and
   * configured options (`urlPrefix` and `namespace`).
   *
   * @private
   */
  _getFullPath(path) {
    path = path[0] === '/' ? path.slice(1) : path;
    let fullPath = '';
    let urlPrefix = this.urlPrefix ? this.urlPrefix.trim() : '';
    let namespace = '';

    // if there is a urlPrefix and a namespace
    if (this.urlPrefix && this.namespace) {
      if (
        this.namespace[0] === '/' &&
        this.namespace[this.namespace.length - 1] === '/'
      ) {
        namespace = this.namespace
          .substring(0, this.namespace.length - 1)
          .substring(1);
      }

      if (
        this.namespace[0] === '/' &&
        this.namespace[this.namespace.length - 1] !== '/'
      ) {
        namespace = this.namespace.substring(1);
      }

      if (
        this.namespace[0] !== '/' &&
        this.namespace[this.namespace.length - 1] === '/'
      ) {
        namespace = this.namespace.substring(0, this.namespace.length - 1);
      }

      if (
        this.namespace[0] !== '/' &&
        this.namespace[this.namespace.length - 1] !== '/'
      ) {
        namespace = this.namespace;
      }
    }

    // if there is a namespace and no urlPrefix
    if (this.namespace && !this.urlPrefix) {
      if (
        this.namespace[0] === '/' &&
        this.namespace[this.namespace.length - 1] === '/'
      ) {
        namespace = this.namespace.substring(0, this.namespace.length - 1);
      }

      if (
        this.namespace[0] === '/' &&
        this.namespace[this.namespace.length - 1] !== '/'
      ) {
        namespace = this.namespace;
      }

      if (
        this.namespace[0] !== '/' &&
        this.namespace[this.namespace.length - 1] === '/'
      ) {
        let namespaceSub = this.namespace.substring(
          0,
          this.namespace.length - 1
        );
        namespace = `/${namespaceSub}`;
      }

      if (
        this.namespace[0] !== '/' &&
        this.namespace[this.namespace.length - 1] !== '/'
      ) {
        namespace = `/${this.namespace}`;
      }
    }

    // if no namespace
    if (!this.namespace) {
      namespace = '';
    }

    // check to see if path is a FQDN. if so, ignore any urlPrefix/namespace that was set
    if (/^https?:\/\//.test(path)) {
      fullPath += path;
    } else {
      // otherwise, if there is a urlPrefix, use that as the beginning of the path
      if (urlPrefix.length) {
        fullPath +=
          urlPrefix[urlPrefix.length - 1] === '/' ? urlPrefix : `${urlPrefix}/`;
      }

      // add the namespace to the path
      fullPath += namespace;

      // add a trailing slash to the path if it doesn't already contain one
      if (fullPath[fullPath.length - 1] !== '/') {
        fullPath += '/';
      }

      // finally add the configured path
      fullPath += path;

      // if we're making a same-origin request, ensure a / is prepended and
      // dedup any double slashes
      if (!/^https?:\/\//.test(fullPath)) {
        fullPath = `/${fullPath}`;
        fullPath = fullPath.replace(/\/+/g, '/');
      }
    }

    return fullPath;
  }

  /**
   *
   * @private
   */
  _configureDefaultPassthroughs() {
    defaultPassthroughs.forEach(passthroughUrl => {
      this.passthrough(passthroughUrl);
    });
  }

  /**
   *
   * @private
   */
  _validateTraits(traits, factory, type) {
    traits.forEach(traitName => {
      if (!factory.isTrait(traitName)) {
        throw new Error(
          `'${traitName}' trait is not registered in '${type}' factory`
        );
      }
    });
  }

  /**
   *
   * @private
   */
  _mergeExtensions(attrs, traits, overrides) {
    let allExtensions = traits.map(traitName => {
      return attrs[traitName].extension;
    });
    allExtensions.push(overrides || {});
    return allExtensions.reduce((accum, extension) => {
      return _assign(accum, extension);
    }, {});
  }

  /**
   *
   * @private
   */
  _mapAssociationsFromAttributes(modelType, attributes) {
    Object.keys(attributes || {})
      .filter(attr => {
        return isAssociation(attributes[attr]);
      })
      .forEach(attr => {
        let association = attributes[attr];
        let associationName = this._fetchAssociationNameFromModel(
          modelType,
          attr
        );
        let foreignKey = `${camelize(attr)}Id`;
        attributes[foreignKey] = this.create(
          associationName,
          ...association.traitsAndOverrides
        ).id;
        delete attributes[attr];
      });
  }

  /**
   *
   * @private
   */
  _fetchAssociationNameFromModel(modelType, associationAttribute) {
    let model = this.schema.modelFor(modelType);
    if (!model) {
      throw new Error(`Model not registered: ${modelType}`);
    }

    let association = model.class.findBelongsToAssociation(
      associationAttribute
    );
    if (!association) {
      throw new Error(
        `You're using the \`association\` factory helper on the '${associationAttribute}' attribute of your ${modelType} factory, but that attribute is not a \`belongsTo\` association. Read the Factories docs for more information: http://www.@movable/ember-cli-mirage.com/docs/v0.2.x/factories/#factories-and-relationships`
      );
    }
    return camelize(association.modelName);
  }
}
