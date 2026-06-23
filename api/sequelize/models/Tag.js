'use strict';

export default (sequelize, DataTypes) => {
  const Tag = sequelize.define('Tag', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.TEXT
    },
    type: {
      type: DataTypes.TEXT
    },
    id_library: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'Tag',
    freezeTableName: true,
    timestamps: false
  });

  Tag.associate = models => {
    Tag.belongsTo(models.Library, { foreignKey: 'id_library', as: 'library' });
  };

  return Tag;
};