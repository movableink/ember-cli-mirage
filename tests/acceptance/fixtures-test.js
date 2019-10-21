import { visit } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';
import setupMirage from '../helpers/setup-mirage';

module('Acceptance | Fixtures', function(hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);

  hooks.beforeEach(function() {
    this.store = this.owner.lookup('service:store');
  });

  test('I can use fixtures', async function(assert) {
    this.server.loadFixtures();

    await visit(`/word-smiths/1`);

    let wordSmithsInStore = this.store.peekAll('word-smith');
    let blogPostsInStore = this.store.peekAll('blog-post');

    assert.equal(wordSmithsInStore.get('length'), 1);
    assert.equal(blogPostsInStore.get('length'), 3);
  });

  test('I can use fixtures with the filename api', async function(assert) {
    this.server.loadFixtures('word-smiths', 'blog-posts');

    await visit(`/word-smiths/1`);

    let wordSmithsInStore = this.store.peekAll('word-smith');
    let blogPostsInStore = this.store.peekAll('blog-post');

    assert.equal(wordSmithsInStore.get('length'), 1);
    assert.equal(blogPostsInStore.get('length'), 3);
  });
});

