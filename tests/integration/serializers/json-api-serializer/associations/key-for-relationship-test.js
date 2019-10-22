import Schema from '@movable/ember-cli-mirage/orm/schema';
import Db from '@movable/ember-cli-mirage/db';
import SerializerRegistry from '@movable/ember-cli-mirage/serializer-registry';
import { Model, hasMany, JSONAPISerializer } from '@movable/ember-cli-mirage';
import { underscore } from '@movable/ember-cli-mirage/utils/inflector';
import { module, test } from 'qunit';

module(
  'Integration | Serializers | JSON API Serializer | Key for relationship',
  function(hooks) {
    hooks.beforeEach(function() {
      this.schema = new Schema(new Db(), {
        wordSmith: Model.extend({
          blogPosts: hasMany()
        }),
        blogPost: Model
      });
    });

    test(`keyForRelationship works`, function(assert) {
      let registry = new SerializerRegistry(this.schema, {
        application: JSONAPISerializer.extend({
          keyForRelationship(key) {
            return underscore(key);
          }
        })
      });
      let wordSmith = this.schema.wordSmiths.create({
        id: 1,
        firstName: 'Link',
        lastName: 'Jackson',
        age: 323
      });
      wordSmith.createBlogPost({ title: 'Lorem ipsum' });

      let result = registry.serialize(wordSmith);

      assert.deepEqual(result, {
        data: {
          type: 'word-smiths',
          id: '1',
          attributes: {
            age: 323,
            'first-name': 'Link',
            'last-name': 'Jackson'
          },
          relationships: {
            blog_posts: {
              data: [{ id: '1', type: 'blog-posts' }]
            }
          }
        }
      });
    });
  }
);
