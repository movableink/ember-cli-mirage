import { Factory, faker } from '@movable/ember-cli-mirage';

export default Factory.extend({
  name() {
    return `${faker.name.firstName()} ${faker.name.lastName()}`;
  }
});
