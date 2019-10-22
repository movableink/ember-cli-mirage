'use strict';

var path = require('path');
var mergeTrees = require('broccoli-merge-trees');
var Funnel = require('broccoli-funnel');

module.exports = {
  name: require('./package').name,

  options: {
    autoImport: {
      webpack: {
        node: {
          // Mock `process` to force Pretender to use `require` to resolve dependencies
          process: 'mock'
        }
      }
    },

    babel: {
      include: [
        // Some code relies on being able to call an ES class constructor without `new`
        '@babel/plugin-transform-classes'
      ]
    }
  },

  included() {
    var app;

    // If the addon has the _findHost() method (in ember-cli >= 2.7.0), we'll just
    // use that.
    if (typeof this._findHost === 'function') {
      app = this._findHost();
    } else {
      // Otherwise, we'll use this implementation borrowed from the _findHost()
      // method in ember-cli.
      var current = this;
      do {
        app = current.app || app;
      } while (current.parent.parent && (current = current.parent));
    }

    this.app = app;
    this.addonConfig =
      this.app.project.config(app.env)['@movable/ember-cli-mirage'] || {};
    this.addonBuildConfig = this.app.options['@movable/ember-cli-mirage'] || {};

    // Call super after initializing config so we can use _shouldIncludeFiles for the node assets
    this._super.included.apply(this, arguments);

    if (this.addonBuildConfig.directory) {
      this.mirageDirectory = this.addonBuildConfig.directory;
    } else if (this.addonConfig.directory) {
      this.mirageDirectory = this.addonConfig.directory;
    } else if (
      app.project.pkg['ember-addon'] &&
      !app.project.pkg['ember-addon'].paths
    ) {
      this.mirageDirectory = path.resolve(
        app.project.root,
        path.join('tests', 'dummy', 'mirage')
      );
    } else {
      this.mirageDirectory = path.join(this.app.project.root, '/mirage');
    }

    app.import('vendor/movable-ember-cli-mirage/alias-ember-cli-mirage.js');
  },

  blueprintsPath() {
    return path.join(__dirname, 'blueprints');
  },

  treeFor() {
    if (!this._shouldIncludeFiles()) {
      return;
    }

    return this._super.treeFor.apply(this, arguments);
  },

  _lintMirageTree(mirageTree) {
    var lintedMirageTrees;
    // _eachProjectAddonInvoke was added in ember-cli@2.5.0
    // this conditional can be removed when we no longer support
    // versions older than 2.5.0
    if (this._eachProjectAddonInvoke) {
      lintedMirageTrees = this._eachProjectAddonInvoke('lintTree', [
        'mirage',
        mirageTree
      ]);
    } else {
      lintedMirageTrees = this.project.addons
        .map(function(addon) {
          if (addon.lintTree) {
            return addon.lintTree('mirage', mirageTree);
          }
        })
        .filter(Boolean);
    }

    var lintedMirage = mergeTrees(lintedMirageTrees, {
      overwrite: true,
      annotation: 'TreeMerger (mirage-lint)'
    });

    return new Funnel(lintedMirage, {
      destDir: 'tests/mirage/'
    });
  },

  treeForApp(appTree) {
    var trees = [appTree];
    var mirageFilesTree = new Funnel(this.mirageDirectory, {
      destDir: 'mirage'
    });
    trees.push(mirageFilesTree);

    if (this.hintingEnabled()) {
      trees.push(this._lintMirageTree(mirageFilesTree));
    }

    return mergeTrees(trees);
  },

  _shouldIncludeFiles() {
    if (process.env.EMBER_CLI_FASTBOOT) {
      return false;
    }

    var environment = this.app.env;
    var enabledInProd =
      environment === 'production' && this.addonConfig.enabled;
    var explicitExcludeFiles = this.addonConfig.excludeFilesFromBuild;
    if (enabledInProd && explicitExcludeFiles) {
      throw new Error(
        'Mirage was explicitly enabled in production, but its files were excluded ' +
          "from the build. Please, use only ENV['@movable/ember-cli-mirage'].enabled in " +
          'production environment.'
      );
    }
    return (
      enabledInProd ||
      (environment &&
        environment !== 'production' &&
        explicitExcludeFiles !== true)
    );
  }
};
