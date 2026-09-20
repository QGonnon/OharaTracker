'use strict';

export default (sequelize, DataTypes) => {
  const WatchlistFollower = sequelize.define('WatchlistFollower', {
    id_watchlist: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    name_client: {
      type: DataTypes.STRING(24),
      allowNull: false,
      primaryKey: true
    },
    followed_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'WatchlistFollower',
    freezeTableName: true,
    timestamps: false
  });

  WatchlistFollower.associate = models => {
    WatchlistFollower.belongsTo(models.Watchlist, { foreignKey: 'id_watchlist', as: 'watchlist' });
    WatchlistFollower.belongsTo(models.Client, { foreignKey: 'name_client', targetKey: 'name', as: 'client' });
  };

  return WatchlistFollower;
};
