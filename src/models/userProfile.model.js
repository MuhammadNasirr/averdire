import Model from '../utils/model.js';

export default (sequelize, DataTypes) => {
  class UserProfile extends Model {
    static associate(models) {
        this.belongsTo(models.User, {foreignKey: 'userId', as: 'user'})
    }
  };
  
  UserProfile.init({
    userId: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    bio: {
      type: DataTypes.STRING
    },
    facebook: {
      type: DataTypes.STRING
    },
    instagram: {
      type: DataTypes.STRING
    },
    linkedin: {
      type: DataTypes.STRING
    },
    city: {
      type: DataTypes.STRING
    },
    state: {
      type: DataTypes.STRING
    },
    country: {
      type: DataTypes.STRING
    },
    address: {
      type: DataTypes.STRING
    }
  }, {
    tableName: 'UserProfile',
    sequelize,
    timestamps: false,
    defaultScope: {
      attributes: {
        exclude: ['userId', 'updatedAt']
      }
    }
  });
  return UserProfile;
};
