import { currentRouteName, find, visit } from '@ember/test-helpers';
import { module, skip } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';
import { startMirage } from 'dummy/initializers/ember-cli-mirage';
import ENV from 'dummy/config/environment';
import setupMirage from '../helpers/setup-mirage';

module('Acceptance: Manually starting Mirage', function(hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function() {
    ENV['@movable/ember-cli-mirage'] = { enabled: false };
  });

  setupMirage(hooks);

  hooks.afterEach(function() {
    ENV['@movable/ember-cli-mirage'].enabled = undefined;
  });

  skip('The server can be started manually when configured with { enabled: false }', async function(assert) {
    assert.equal(this.server, undefined, 'There is no server at first');
    this.server = startMirage();
    assert.ok(this.server, 'There is a server after starting');

    let contact = this.server.create('contact');
    await visit('/1');

    assert.equal(currentRouteName(), 'contact');
    assert
      .dom(find('p:first'))
      .hasText(
        `The contact is ${contact.name}`,
        'The manually started server works'
      );
  });
});
