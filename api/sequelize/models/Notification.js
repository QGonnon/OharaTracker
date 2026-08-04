'use strict';

export default (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    name_client: {
      type: DataTypes.STRING(24),
      allowNull: false
    },
    id_library: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    id_source: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    chapter: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    type: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'new_chapter'
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'Notification',
    freezeTableName: true,
    timestamps: false
  });

  Notification.associate = models => {
    Notification.belongsTo(models.Client, { foreignKey: 'name_client', targetKey: 'name', as: 'client' });
    Notification.belongsTo(models.Library, { foreignKey: 'id_library', as: 'library' });
    Notification.belongsTo(models.Source, { foreignKey: 'id_source', targetKey: 'id_source', as: 'source' });
  };

  return Notification;
};
