(function() {
  if (require.has('ember-cli-mirage')) {
    console.warn('Both `ember-cli-mirage` and `@movable/ember-cli-mirage` are installed');
  } else {
    define.alias('@movable/ember-cli-mirage', 'ember-cli-mirage');
  }
})();
