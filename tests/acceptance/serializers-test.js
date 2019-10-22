import { visit } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';
import setupMirage from '../helpers/setup-mirage';

module('Acceptance | Serializers', function(hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);

  hooks.beforeEach(function() {
    this.store = this.owner.lookup('service:store');
  });

  test('Serializers can provide default includes', async function(assert) {
    let wordSmith = this.server.create('word-smith');
    this.server.createList('blog-post', 3, { wordSmithId: wordSmith.id });

    await visit(`/word-smiths/${wordSmith.id}`);

    let wordSmithsInStore = this.store.peekAll('word-smith');
    let blogPostsInStore = this.store.peekAll('blog-post');

    assert.equal(wordSmithsInStore.get('length'), 1);
    assert.equal(blogPostsInStore.get('length'), 3);
  });
});
