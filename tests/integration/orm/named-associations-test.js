import { module, test } from 'qunit';
import Schema from '@movable/ember-cli-mirage/orm/schema';
import Model from '@movable/ember-cli-mirage/orm/model';
import Db from '@movable/ember-cli-mirage/db';
import { hasMany, belongsTo } from '@movable/ember-cli-mirage';

module('Integration | ORM | Named associations test', function() {
  test('schemas with a single hasMany have correct foreign keys', function(assert) {
    let schema = new Schema(new Db(), {
      user: Model.extend({
        projects: hasMany()
      }),
      project: Model
    });

    // Fks are set up correctly
    assert.deepEqual(schema._registry.user.foreignKeys, []);
    assert.deepEqual(schema._registry.project.foreignKeys, ['userId']);

    let user = schema.users.create();
    let project = user.createProject();

    assert.ok(user);
    assert.ok(project);
  });

  test('schemas with a single hasMany with a different property name defaults to a foreign key named by type', function(assert) {
    let schema = new Schema(new Db(), {
      user: Model.extend({
        specialProjects: hasMany('project')
      }),
      project: Model
    });

    assert.deepEqual(schema._registry.user.foreignKeys, []);
    assert.deepEqual(schema._registry.project.foreignKeys, ['userId']);
  });

  test('schemas with a single belongsTo have correct foreign keys', function(assert) {
    let schema = new Schema(new Db(), {
      user: Model,
      project: Model.extend({
        user: belongsTo()
      })
    });

    // Fks are set up correctly
    assert.deepEqual(schema._registry.user.foreignKeys, []);
    assert.deepEqual(schema._registry.project.foreignKeys, ['userId']);

    let project = schema.projects.create();
    let user = project.createUser();

    assert.ok(user);
    assert.ok(project);
  });

  test('schemas with a single belongsTo with a different property name have correct foreign keys', function(assert) {
    let schema = new Schema(new Db(), {
      user: Model,
      project: Model.extend({
        owner: belongsTo('user')
      })
    });

    // Fks are set up correctly
    assert.deepEqual(schema._registry.user.foreignKeys, []);
    assert.deepEqual(schema._registry.project.foreignKeys, ['ownerId']);

    let project = schema.projects.create();
    let user = project.createOwner();

    assert.ok(user);
    assert.ok(project);
  });

  test('schemas with a single hasMany and belongsTo have correct foreign keys', function(assert) {
    let schema = new Schema(new Db(), {
      user: Model.extend({
        projects: hasMany()
      }),
      project: Model.extend({
        user: belongsTo()
      })
    });

    // Fks are set up correctly
    assert.deepEqual(schema._registry.user.foreignKeys, []);
    assert.deepEqual(schema._registry.project.foreignKeys, ['userId']);

    let project = schema.projects.create();
    let user = project.createUser();

    assert.ok(user);
    assert.ok(project);
  });

  test('complex schemas have correct foreign keys', function(assert) {
    let schema = new Schema(new Db(), {
      user: Model.extend({
        projects: hasMany(),
        tasks: hasMany()
      }),
      project: Model.extend({
        user: belongsTo(),
        tasks: hasMany()
      }),
      task: Model.extend({
        user: belongsTo(),
        project: belongsTo()
      })
    });

    // Fks are set up correctly
    assert.deepEqual(schema._registry.user.foreignKeys, []);
    assert.deepEqual(schema._registry.project.foreignKeys, ['userId']);
    assert.deepEqual(schema._registry.task.foreignKeys, [
      'userId',
      'projectId'
    ]);

    let user = schema.users.create();
    let project = user.createProject();
    let task = user.createTask();

    assert.ok(user);
    assert.ok(project);
    assert.ok(task);
  });

  test('foreign keys should be named appropriately for multiword properties', function(assert) {
    let schema = new Schema(new Db(), {
      author: Model,
      post: Model.extend({
        wordSmith: belongsTo('author')
      })
    });

    // Fks are set up correctly
    assert.deepEqual(schema._registry.author.foreignKeys, []);
    assert.deepEqual(schema._registry.post.foreignKeys, ['wordSmithId']);

    let post = schema.posts.create();
    let wordSmith = post.createWordSmith();

    assert.ok(post);
    assert.ok(wordSmith);
    assert.equal(wordSmith.modelName, 'author');
  });

  test('foreign keys should be named appropriately for multiword model names', function(assert) {
    let schema = new Schema(new Db(), {
      wordSmith: Model,
      post: Model.extend({
        author: belongsTo('word-smith')
      })
    });

    assert.deepEqual(schema._registry.wordSmith.foreignKeys, []);
    assert.deepEqual(schema._registry.post.foreignKeys, ['authorId']);

    let post = schema.posts.create();
    let author = post.createAuthor();

    assert.ok(post);
    assert.ok(author);
    assert.equal(author.modelName, 'word-smith');
  });

  test('foreign keys should be named appropriately for multiword properties and model names', function(assert) {
    let schema = new Schema(new Db(), {
      wordSmith: Model,
      post: Model.extend({
        brilliantWriter: belongsTo('word-smith')
      })
    });

    assert.deepEqual(schema._registry.wordSmith.foreignKeys, []);
    assert.deepEqual(schema._registry.post.foreignKeys, ['brilliantWriterId']);

    let post = schema.posts.create();
    let brilliantWriter = post.createBrilliantWriter();

    assert.ok(post);
    assert.ok(brilliantWriter);
    assert.equal(brilliantWriter.modelName, 'word-smith');
  });

  test('a model can have multiple belongsTo associations of the same type', function(assert) {
    let schema = new Schema(new Db(), {
      user: Model,
      project: Model.extend({
        admin: belongsTo('user'),
        specialUser: belongsTo('user')
      })
    });

    assert.deepEqual(schema._registry.user.foreignKeys, []);
    assert.deepEqual(schema._registry.project.foreignKeys, [
      'adminId',
      'specialUserId'
    ]);

    let project = schema.projects.create();
    let admin = project.createAdmin();
    let specialUser = project.createSpecialUser();

    assert.ok(project);
    assert.ok(admin);
    assert.equal(admin.modelName, 'user');
    assert.ok(specialUser);
    assert.equal(specialUser.modelName, 'user');
  });

  test('multiple hasMany associations of the same type with no explicit inverses throw an error', function(assert) {
    assert.throws(() => {
      new Schema(new Db(), {
        user: Model.extend({
          mainProjects: hasMany('project'),
          specialProjects: hasMany('project')
        }),
        project: Model
      });
    }, /multiple possible inverse relationships/);
  });

  test('multiple hasMany associations with explicit inverses sets up the correct foreign keys', function(assert) {
    let schema = new Schema(new Db(), {
      user: Model.extend({
        mainProjects: hasMany('project', { inverse: 'mainUser' }),
        specialProjects: hasMany('project', { inverse: 'specialUser' })
      }),
      project: Model
    });

    assert.deepEqual(schema._registry.user.foreignKeys, []);
    assert.deepEqual(schema._registry.project.foreignKeys, [
      'mainUserId',
      'specialUserId'
    ]);
  });

  test('multiple hasMany associations with one explicit inverse sets up the correct foreign keys', function(assert) {
    let schema = new Schema(new Db(), {
      user: Model.extend({
        projects: hasMany(),
        specialProjects: hasMany('project', { inverse: 'specialUser' })
      }),
      project: Model
    });

    assert.deepEqual(schema._registry.user.foreignKeys, []);
    assert.deepEqual(schema._registry.project.foreignKeys, [
      'userId',
      'specialUserId'
    ]);
  });
});
