'use strict';

export default (sequelize, DataTypes) => {
  const Client = sequelize.define('Client', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(24),
      allowNull: false,
      unique: true
    },
    code: {
      type: DataTypes.STRING(4),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(50)
    },
    password: {
      type: DataTypes.STRING(60)
    },
    date_of_birth: {
      type: DataTypes.DATEONLY
    },
    google_id: {
      type: DataTypes.STRING(100)
    },
    id_subscription: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    locale: {
      type: DataTypes.STRING(5)
    },
    email_digest_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    // 0 = dimanche. Seules les offres payantes peuvent s'écarter de cette valeur.
    email_digest_day: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      defaultValue: 0
    },
    email_digest_last_sent_at: {
      type: DataTypes.DATE
    },
    avatar_url: {
      type: DataTypes.STRING(300)
    },
    banner_url: {
      type: DataTypes.STRING(300)
    },
    theme: {
      type: DataTypes.STRING(20)
    }
  }, {
    tableName: 'Client',
    freezeTableName: true,
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['name', 'code']
      }
    ]
  });

  Client.associate = models => {
    Client.belongsTo(models.Subscription, { foreignKey: 'id_subscription', as: 'subscription' });
    Client.hasMany(models.ClientCategoryAssignment, { foreignKey: 'name_client', sourceKey: 'name', as: 'categoryAssignments' });
    Client.hasMany(models.LibraryUsage, { foreignKey: 'name_client', sourceKey: 'name', as: 'libraryUsages' });
    Client.belongsToMany(models.UserCategory, {
      through: models.ClientCategoryAssignment,
      foreignKey: 'name_client',
      otherKey: 'id_user_category',
      sourceKey: 'name',
      as: 'categories'
    });
  };

  return Client;
};