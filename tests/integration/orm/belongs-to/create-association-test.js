import BelongsToHelper from './belongs-to-helper';
import { module, test } from 'qunit';

module('Integration | ORM | belongsTo #createAssociation', function(hooks) {
  hooks.beforeEach(function() {
    this.helper = new BelongsToHelper();
  });

  /*
    createAssociation behavior works regardless of the state of the child
  */

  [
    'savedChildNoParent',
    'savedChildNewParent',
    'savedChildSavedParent',
    'newChildNoParent',
    'newChildNewParent',
    'newChildSavedParent'
  ].forEach(state => {
    test(`a ${state} can create an associated parent`, function(assert) {
      let [address] = this.helper[state]();

      let ganon = address.createUser({ name: 'Ganon' });

      assert.ok(ganon.id, 'the parent was persisted');
      assert.deepEqual(address.user, ganon);
      assert.equal(address.userId, ganon.id);
      assert.equal(
        this.helper.schema.addresses.find(address.id).userId,
        ganon.id,
        'the child was persisted'
      );
    });
  });
});
