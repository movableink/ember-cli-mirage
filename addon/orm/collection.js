import { invokeMap as _invokeMap } from 'lodash-es';
import assert from '../assert';

/**
 * An array of models, returned from one of the schema query
 * methods (all, find, where). Knows how to update and destroy its models.
 * @class Collection
 * @constructor
 * @public
 */
export default class Collection {
  constructor(modelName, models = []) {
    assert(
      modelName && typeof modelName === 'string',
      'You must pass a `modelName` into a Collection'
    );

    this.modelName = modelName;
    this.models = models;
  }

  /**
   * Number of models in the collection.
   *
   * @property length
   * @type Number
   * @public
   */
  get length() {
    return this.models.length;
  }

  /**
   * Updates each model in the collection (persisting immediately to the db).
   * @method update
   * @param key
   * @param val
   * @return this
   * @public
   */
  update(...args) {
    _invokeMap(this.models, 'update', ...args);

    return this;
  }

  /**
   * Destroys the db record for all models in the collection.
   * @method destroy
   * @return this
   * @public
   */
  destroy() {
    _invokeMap(this.models, 'destroy');

    return this;
  }

  /**
   * Saves all models in the collection.
   * @method save
   * @return this
   * @public
   */
  save() {
    _invokeMap(this.models, 'save');

    return this;
  }

  /**
   * Reloads each model in the collection.
   * @method reload
   * @return this
   * @public
   */
  reload() {
    _invokeMap(this.models, 'reload');

    return this;
  }

  /**
   * @method filter
   * @param f
   * @return {Collection}
   * @public
   */
  filter(f) {
    let filteredModels = this.models.filter(f);

    return new Collection(this.modelName, filteredModels);
  }

  /**
   * @method sort
   * @param f
   * @return {Collection}
   * @public
   */
  sort(f) {
    let sortedModels = this.models.concat().sort(f);

    return new Collection(this.modelName, sortedModels);
  }

  /**
   * @method slice
   * @param {Integer} begin
   * @param {Integer} end
   * @return {Collection}
   * @public
   */
  slice(...args) {
    let slicedModels = this.models.slice(...args);

    return new Collection(this.modelName, slicedModels);
  }

  /**
   * @method mergeCollection
   * @param collection
   * @return this
   * @public
   */
  mergeCollection(collection) {
    this.models = this.models.concat(collection.models);

    return this;
  }

  /**
   * Simple string representation of the collection and id.
   * @method toString
   * @return {String}
   * @public
   */
  toString() {
    return `collection:${this.modelName}(${this.models
      .map(m => m.id)
      .join(',')})`;
  }
}
