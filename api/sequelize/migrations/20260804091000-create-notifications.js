'use strict';

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('Notification', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER
    },
    name_client: {
      allowNull: false,
      type: Sequelize.STRING(24),
      references: {
        model: 'Client',
        key: 'name'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    id_library: {
      allowNull: false,
      type: Sequelize.INTEGER
    },
    id_source: {
      allowNull: false,
      type: Sequelize.INTEGER
    },
    chapter: {
      allowNull: false,
      type: Sequelize.DECIMAL(10, 2)
    },
    type: {
      allowNull: false,
      type: Sequelize.STRING(30),
      defaultValue: 'new_chapter'
    },
    is_read: {
      allowNull: false,
      type: Sequelize.BOOLEAN,
      defaultValue: false
    },
    created_at: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('NOW()')
    }
  });

  await queryInterface.addConstraint('Notification', {
    fields: ['id_library', 'id_source', 'chapter'],
    type: 'foreign key',
    name: 'notification_chapter_fkey',
    references: {
      table: 'Chapters',
      fields: ['id_library', 'id_source', 'chapter']
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  });

  await queryInterface.addIndex('Notification', ['name_client', 'is_read'], {
    name: 'notification_client_unread_idx'
  });
  await queryInterface.addIndex('Notification', ['name_client', 'created_at'], {
    name: 'notification_client_created_idx'
  });

  await queryInterface.createTable('PushSubscription', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER
    },
    name_client: {
      allowNull: false,
      type: Sequelize.STRING(24),
      references: {
        model: 'Client',
        key: 'name'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    endpoint: {
      allowNull: false,
      unique: true,
      type: Sequelize.STRING(500)
    },
    p256dh: {
      allowNull: false,
      type: Sequelize.STRING(255)
    },
    auth: {
      allowNull: false,
      type: Sequelize.STRING(255)
    },
    created_at: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('NOW()')
    }
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('PushSubscription');
  await queryInterface.dropTable('Notification');
}

export default { up, down };
