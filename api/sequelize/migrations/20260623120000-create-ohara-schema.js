'use strict';

export async function up(queryInterface, Sequelize) {
    await queryInterface.createTable('Library', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        allowNull: false,
        type: Sequelize.STRING(200)
      },
      description: {
        type: Sequelize.STRING(500)
      },
      type: {
        type: Sequelize.STRING(50)
      },
      demographic: {
        type: Sequelize.STRING(50)
      },
      published: {
        type: Sequelize.STRING(50)
      },
      status: {
        type: Sequelize.STRING(50)
      },
      artist: {
        type: Sequelize.STRING(50)
      },
      author: {
        type: Sequelize.STRING(50)
      },
      theme: {
        type: Sequelize.STRING(50)
      },
      publishers: {
        type: Sequelize.STRING(50)
      },
      cover_path: {
        type: Sequelize.STRING(255)
      },
      cover_url: {
        type: Sequelize.STRING(255)
      }
    });

    await queryInterface.createTable('UserCategory', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING(50)
      },
      description: {
        type: Sequelize.STRING(150)
      }
    });

    await queryInterface.createTable('Subscription', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING(50)
      }
    });

    await queryInterface.createTable('Permissions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING(50)
      }
    });

    await queryInterface.createTable('Languages', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING(50)
      }
    });

    await queryInterface.createTable('Source', {
      id_source: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING(50)
      }
    });

    await queryInterface.createTable('Client', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        allowNull: false,
        unique: true,
        type: Sequelize.STRING(24)
      },
      code: {
        allowNull: false,
        type: Sequelize.STRING(4)
      },
      email: {
        type: Sequelize.STRING(50)
      },
      password: {
        type: Sequelize.STRING(50)
      },
      date_of_birth: {
        type: Sequelize.DATEONLY
      },
      google_id: {
        type: Sequelize.STRING(100)
      },
      id_subscription: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'Subscription',
          key: 'id'
        }
      }
    }, {
      uniqueKeys: {
        client_name_code_unique: {
          fields: ['name', 'code']
        }
      }
    });

    await queryInterface.createTable('Tag', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING(50)
      },
      type: {
        type: Sequelize.STRING(50)
      },
      id_library: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'Library',
          key: 'id'
        }
      }
    });

    await queryInterface.createTable('AssociativeTitle', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING(200)
      },
      id_library: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'Library',
          key: 'id'
        }
      }
    });

    await queryInterface.createTable('ClientCategoryAssignment', {
      name_client: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING(24),
        references: {
          model: 'Client',
          key: 'name'
        }
      },
      id_user_category: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.INTEGER,
        references: {
          model: 'UserCategory',
          key: 'id'
        }
      }
    });

    await queryInterface.createTable('libraryusage', {
      id_library: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.INTEGER,
        references: {
          model: 'Library',
          key: 'id'
        }
      },
      name_client: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING(24),
        references: {
          model: 'Client',
          key: 'name'
        }
      },
      score: {
        type: Sequelize.DECIMAL(15, 1)
      },
      note: {
        type: Sequelize.STRING(500)
      },
      last_chapter: {
        type: Sequelize.STRING(50)
      },
      reading_status: {
        type: Sequelize.STRING(50)
      }
    });

    await queryInterface.createTable('SubscriptionPermissions', {
      id_subscription: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.INTEGER,
        references: {
          model: 'Subscription',
          key: 'id'
        }
      },
      id_permissions: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.INTEGER,
        references: {
          model: 'Permissions',
          key: 'id'
        }
      }
    });

    await queryInterface.createTable('LangPref', {
      id_library: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.INTEGER,
        references: {
          model: 'Library',
          key: 'id'
        }
      },
      id_languages: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.INTEGER,
        references: {
          model: 'Languages',
          key: 'id'
        }
      }
    });

    await queryInterface.createTable('LastChapters', {
      id_library: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.INTEGER,
        references: {
          model: 'Library',
          key: 'id'
        }
      },
      id_source: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.INTEGER,
        references: {
          model: 'Source',
          key: 'id_source'
        }
      },
      chapter: {
        type: Sequelize.STRING(50)
      },
      url: {
        type: Sequelize.STRING(200)
      }
    });

    await queryInterface.createTable('LibrarySource', {
      id_library: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.INTEGER,
        references: {
          model: 'Library',
          key: 'id'
        }
      },
      id_source: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.INTEGER,
        references: {
          model: 'Source',
          key: 'id_source'
        }
      },
      url: {
        type: Sequelize.STRING(200)
      }
    });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('LibrarySource');
  await queryInterface.dropTable('LastChapters');
  await queryInterface.dropTable('LangPref');
  await queryInterface.dropTable('SubscriptionPermissions');
  await queryInterface.dropTable('libraryusage');
  await queryInterface.dropTable('ClientCategoryAssignment');
  await queryInterface.dropTable('AssociativeTitle');
  await queryInterface.dropTable('Tag');
  await queryInterface.dropTable('Client');
  await queryInterface.dropTable('Source');
  await queryInterface.dropTable('Languages');
  await queryInterface.dropTable('Permissions');
  await queryInterface.dropTable('Subscription');
  await queryInterface.dropTable('UserCategory');
  await queryInterface.dropTable('Library');
}

export default { up, down };