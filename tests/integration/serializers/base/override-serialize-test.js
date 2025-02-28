import SerializerRegistry from '@movable/ember-cli-mirage/serializer-registry';
import Serializer from '@movable/ember-cli-mirage/serializer';
import schemaHelper from '../schema-helper';
import { module, test } from 'qunit';

module('Integration | Serializers | Base | Overriding Serialize', function(
  hooks
) {
  hooks.beforeEach(function() {
    this.schema = schemaHelper.setup();
  });

  hooks.afterEach(function() {
    this.schema.db.emptyData();
  });

  test(`it can use a completely custom serialize function`, function(assert) {
    this.registry = new SerializerRegistry(this.schema, {
      wordSmith: Serializer.extend({
        serialize() {
          return 'blah';
        }
      })
    });

    let wordSmith = this.schema.wordSmiths.create({
      id: 1,
      title: 'Link'
    });

    let result = this.registry.serialize(wordSmith);

    assert.deepEqual(result, 'blah');
  });

  test(`it can access the request in a custom serialize function`, function(assert) {
    this.registry = new SerializerRegistry(this.schema, {
      wordSmith: Serializer.extend({
        serialize(response, request) {
          return request.queryParams.foo || 'blah';
        }
      })
    });

    let wordSmith = this.schema.wordSmiths.create({
      id: 1,
      title: 'Link'
    });

    let request = {
      url: '/word-smiths/1?foo=bar',
      params: { id: '1' },
      queryParams: { foo: 'bar' }
    };
    let result = this.registry.serialize(wordSmith, request);

    assert.deepEqual(result, 'bar');
  });
});
