'use strict';

export default (sequelize, DataTypes) => {
  const Watchlist = sequelize.define('Watchlist', {
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
    title: {
      type: DataTypes.STRING(80),
      allowNull: false
    },
    description: {
      type: DataTypes.STRING(300)
    },
    share_token: {
      type: DataTypes.STRING(22),
      unique: true
    },
    is_public: {
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
    tableName: 'Watchlist',
    freezeTableName: true,
    timestamps: false
  });

  Watchlist.associate = models => {
    Watchlist.belongsTo(models.Client, { foreignKey: 'name_client', targetKey: 'name', as: 'owner' });
    Watchlist.hasMany(models.WatchlistItem, { foreignKey: 'id_watchlist', as: 'items' });
    Watchlist.hasMany(models.WatchlistFollower, { foreignKey: 'id_watchlist', as: 'followers' });
    Watchlist.belongsToMany(models.Library, {
      through: models.WatchlistItem,
      foreignKey: 'id_watchlist',
      otherKey: 'id_library',
      as: 'works'
    });
  };

  return Watchlist;
};
