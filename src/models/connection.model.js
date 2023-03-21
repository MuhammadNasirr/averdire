import Sequelize from 'sequelize';
import Model from '../utils/model.js';

export default (sequelize, DataTypes) => {
  class Connection extends Model {
    static associate(models) {
      this.belongsTo(models.User, { foreignKey: 'userOneId', as: 'myConnection' })
    }

    static userConnectionsRawSql(uId) {
      const { Op } = Sequelize;
      return sequelize.dialect.queryGenerator.selectQuery(this.getTableName(),{
        attributes: [[sequelize.literal('IF(`userOneId`='+uId+', `userTwoId`, `userOneId`)'),'userN']],
        where: {
          [Op.or]: [{userOneId: uId}, {userTwoId: uId}]
        }})
        .slice(0,-1); // to remove the ';' from the end of the SQL
    }
  };

  Connection.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userOneId: {
      type: DataTypes.INTEGER,
    },
    userTwoId: {
      type: DataTypes.INTEGER
    },
  }, {
    tableName: 'Connection',
    sequelize,
    defaultScope: {
      attributes: {
        exclude: ['updatedAt']
      }
    }
  });

  return Connection;
};
