import { Factory, faker } from '@movable/ember-cli-mirage';

export default Factory.extend({
  title() {
    return faker.lorem.sentence();
  }
});
