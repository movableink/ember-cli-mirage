import { click, currentRouteName, visit } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';
import setupMirage from '../helpers/setup-mirage';

let contact;

module('Acceptance | Contact', function(hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);

  hooks.beforeEach(function() {
    contact = this.server.create('contact');
  });

  test('I can view a contact', async function(assert) {
    await visit('/1');

    assert.equal(currentRouteName(), 'contact');
    assert.dom('p').hasText(`The contact is ${contact.name}`);
  });

  test('I can delete a contact', async function(assert) {
    await visit('/1');
    await click('[data-test-delete-button]');

    assert.equal(currentRouteName(), 'contacts');
    assert.dom('p').doesNotExist();
  });
});
