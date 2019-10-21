import { click, fillIn, currentRouteName, findAll, visit } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';
import setupMirage from '../helpers/setup-mirage';

let pets;

module('Acceptance | Pets', function(hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);

  hooks.beforeEach(function() {
    pets = this.server.createList('pet', 3);
  });

  test('I can view the pets', async function(assert) {
    await visit('/pets');

    assert.equal(currentRouteName(), 'pets');
    assert.dom('li').exists({ count: 3 });

    const petNameElements = findAll('li .name');
    assert.dom(petNameElements[0]).hasText(pets[0].name);
  });

  test('I can create a new pet', async function(assert) {
    await visit('/pets');

    await fillIn('input', 'Brownie');
    await click('[data-test-create-button]');

    assert.equal(currentRouteName(), 'pets');
    assert.dom('li').exists({ count: 4 });

    const names = findAll('li .name');
    assert.dom(names[names.length - 1]).hasText('Brownie');
  });
});
