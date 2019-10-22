import { JSONAPISerializer } from '@movable/ember-cli-mirage';

export default JSONAPISerializer.extend({
  include: ['blogPosts']
});
