import { Model, hasMany } from '@movable/ember-cli-mirage';

export default Model.extend({
  blogPosts: hasMany()
});
