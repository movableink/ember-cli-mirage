import { startMirage } from 'dummy/initializers/ember-cli-mirage';
import { settled } from '@ember/test-helpers';

export default function setupMirage(hooks) {
  hooks.beforeEach(function() {
    if (typeof window.server !== 'undefined') {
      this.server = window.server;
    } else {
      this.server = startMirage();
    }
  });

  hooks.afterEach(async function() {
    await settled();
    this.server.shutdown();
    delete this.server;
  });
}
