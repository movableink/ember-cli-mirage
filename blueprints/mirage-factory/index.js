/* eslint-env node */
'use strict';

var path = require('path');

module.exports = {
  description: 'Generates a Mirage factory.',

  fileMapTokens: function() {
    var self = this;
    return {
      __root__: function(options) {
        if (
          !!self.project.config()['@movable/ember-cli-mirage'] &&
          !!self.project.config()['@movable/ember-cli-mirage'].directory
        ) {
          return self.project.config()['@movable/ember-cli-mirage'].directory;
        } else if (options.inAddon) {
          return path.join('tests', 'dummy', 'mirage');
        } else {
          return '/mirage';
        }
      }
    };
  }
};
