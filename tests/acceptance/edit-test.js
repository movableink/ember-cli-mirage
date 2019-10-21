import { click, fillIn, currentRouteName, visit } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';
import setupMirage from '../helpers/setup-mirage';

module('Acceptance | Edit', function(hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);

  test('I can edit a contact', async function(assert) {
    this.server.create('contact');

    await visit('/1');
    await click('[data-test-edit-button]');
    await fillIn('input', 'Shiek');
    await click('[data-test-save-button]');

    assert.equal(currentRouteName(), 'contact');
    assert.dom('p').hasText('The contact is Shiek');
  });
});

