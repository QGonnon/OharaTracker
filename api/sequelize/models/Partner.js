'use strict';

export default (sequelize, DataTypes) => {
  const Partner = sequelize.define('Partner', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(80),
      allowNull: false,
      unique: true
    },
    kind: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'platform'
    },
    url: {
      type: DataTypes.STRING(300)
    },
    logo_url: {
      type: DataTypes.STRING(300)
    },
    description: {
      type: DataTypes.STRING(300)
    },
    locales: {
      type: DataTypes.ARRAY(DataTypes.STRING(5))
    },
    affiliate_code: {
      type: DataTypes.STRING(24),
      unique: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    is_highlighted: {
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
    tableName: 'Partner',
    freezeTableName: true,
    timestamps: false
  });

  return Partner;
};
