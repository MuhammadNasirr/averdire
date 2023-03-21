import Model from '../utils/model.js'
import { MEMO } from '../constants/attachment.js';

export default (sequelize, DataTypes) => {
  class Memo extends Model {
    static associate(models) {
      this.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      this.belongsTo(models.Company, { foreignKey: 'companyId', as: 'company' });
      this.hasOne(models.Attachment, { foreignKey: 'modelId', as: MEMO.fields.photo });
      this.hasOne(models.Attachment, { foreignKey: 'modelId', as: MEMO.fields.document });
      this.hasMany(models.UserExperience, { foreignKey: 'companyId', sourceKey:'companyId', as: "experience" });
      this.hasMany(models.MemoComment, { foreignKey: 'memoId', as: 'comments' });
    }

    static scopes() {
      const m = sequelize.models;
      return {
        excludeOnUpdate: { attributes: { exclude: ['userId', 'companyId'] } },
        attachments: {include: [
            m.Attachment.getIncludeQueryObject(MEMO.value, MEMO.fields.photo),
            m.Attachment.getIncludeQueryObject(MEMO.value, MEMO.fields.document)
        ]}
      }
    }
  };

  Memo.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    companyId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    tableName: 'Memo',
    sequelize,
    defaultScope: {
      attributes: {
        exclude: ['userId', 'companyId', 'updatedAt']
      }
    }
  });
  return Memo;
};
