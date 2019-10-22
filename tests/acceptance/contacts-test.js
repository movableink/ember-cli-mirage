import {
  click,
  fillIn,
  currentRouteName,
  findAll,
  visit
} from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';
import setupMirage from '../helpers/setup-mirage';

let contacts;

module('Acceptance | Contacts', function(hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);

  hooks.beforeEach(function() {
    contacts = this.server.createList('contact', 2);
  });

  test('I can view the contacts', async function(assert) {
    await visit('/');

    assert.equal(currentRouteName(), 'contacts');
    assert.dom('p').exists({ count: 2 });
    assert.dom('p').hasText(contacts[0].name);
  });

  test('I can create a new contact', async function(assert) {
    await visit('/');
    await fillIn('input', 'Ganon');
    await click('[data-test-create-button]');

    assert.equal(currentRouteName(), 'contacts');
    assert.dom('p').exists({ count: 3 });

    const contactElements = findAll('p');
    assert.dom(contactElements[contactElements.length - 1]).hasText('Ganon');
  });

  test('If the server errors on /contacts, the first error message should show', async function(assert) {
    this.server.get(
      '/contacts',
      {
        errors: ['improper auth']
      },
      404
    );

    await visit('/');

    assert.dom('.error span').hasText('improper auth');
  });
});
