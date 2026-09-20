'use strict';

export default (sequelize, DataTypes) => {
  const WatchlistItem = sequelize.define('WatchlistItem', {
    id_watchlist: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    id_library: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    position: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    tableName: 'WatchlistItem',
    freezeTableName: true,
    timestamps: false
  });

  WatchlistItem.associate = models => {
    WatchlistItem.belongsTo(models.Watchlist, { foreignKey: 'id_watchlist', as: 'watchlist' });
    WatchlistItem.belongsTo(models.Library, { foreignKey: 'id_library', as: 'library' });
  };

  return WatchlistItem;
};
