'use strict';

export default (sequelize, DataTypes) => {
  const LangPref = sequelize.define('LangPref', {
    id_library: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    id_languages: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    }
  }, {
    tableName: 'LangPref',
    freezeTableName: true,
    timestamps: false
  });

  LangPref.associate = models => {
    LangPref.belongsTo(models.Library, { foreignKey: 'id_library', as: 'library' });
    LangPref.belongsTo(models.Languages, { foreignKey: 'id_languages', as: 'language' });
  };

  return LangPref;
};