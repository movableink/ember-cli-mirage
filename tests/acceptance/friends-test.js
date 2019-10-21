import { currentRouteName, findAll, visit } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';
import setupMirage from '../helpers/setup-mirage';

module('Acceptance | Friends', function(hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);

  test('I can view the friends', async function(assert) {
    let friend = this.server.create('friend');
    let youngFriend = this.server.create('friend', { name: 'Tommy', age: 10 });

    await visit('/friends');

    assert.equal(currentRouteName(), 'friends');
    assert.dom('p').exists({ count: 2 });
    assert.equal(friend.isYoung, false);
    assert.equal(youngFriend.isYoung, true);

    const paragraphs = findAll('p');
    const first = paragraphs[0];
    const last = paragraphs[paragraphs.length - 1];
    assert.dom(first).containsText(friend.name);
    assert.dom(first).containsText(friend.age);
    assert.dom(last).containsText('Tommy');
    assert.dom(last).containsText('10');
  });

  test('I can view the selected friends', async function(assert) {
    this.server.create('friend', { name: 'Jane', age: 30 });
    this.server.create('friend', { name: 'Tommy', age: 10 });
    this.server.create('friend', { name: 'Bob', age: 28 });

    await visit('/close-friends');

    assert.equal(currentRouteName(), 'close-friends');
    assert.dom('p').exists({ count: 2 });

    const paragraphs = findAll('p');
    const first = paragraphs[0];
    const last = paragraphs[paragraphs.length - 1];
    assert.dom(first).containsText('Jane');
    assert.dom(first).containsText('30');
    assert.dom(last).containsText('Bob');
    assert.dom(last).containsText('28');
  });

  test('I can view a friend that was configured only for test mode', async function(assert) {
    let friend = this.server.create('friend', { name: 'The Dude' });

    await visit(`/friends/${friend.id}`);

    assert.equal(currentRouteName(), 'friend');
    assert.dom('h2.friend-name').containsText('The Dude');
  });
});
