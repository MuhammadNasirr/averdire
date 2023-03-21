import Model from '../utils/model.js';

export default (sequelize, DataTypes) => {
  class RssNewsPreferences extends Model {
    static associate(models) {
      this.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }
  };

  RssNewsPreferences.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    categories: {
      type: DataTypes.STRING,
      set(value) {
        if(value) this.setDataValue('categories', JSON.stringify(value));
        else this.setDataValue('categories', value);
      },
      get() {
        const rawValue = this.getDataValue('categories');
        return rawValue ? JSON.parse(rawValue) : [];
      }
    },
    countries: {
      type: DataTypes.STRING,
      set(value) {
        if(value) this.setDataValue('countries', JSON.stringify(value));
        else this.setDataValue('countries', value);
      },
      get() {
        const rawValue = this.getDataValue('countries');
        return rawValue ? JSON.parse(rawValue) : [];
      }
    }
  }, {
    tableName: 'RssNewsPreferences',
    sequelize,
    defaultScope: {
      attributes: {
        exclude: ['userId', 'createdAt']
      }
    }
  });

  return RssNewsPreferences;
};
