import Model from '../utils/model.js';

export default (sequelize, DataTypes) => {
	class AppFaq extends Model {

	};

	AppFaq.init({
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		category: {
			type: DataTypes.INTEGER,
            defaultValue: 1,
            allowNull: false
		},
		question: {
			type: DataTypes.STRING,
            allowNull: false
		},
		answer: {
			type: DataTypes.STRING,
            allowNull: false
		}
	}, {
		tableName: 'AppFaq',
		sequelize,
        defaultScope: {
            attributes: {
              exclude: ['createdAt', 'updatedAt']
            }
        }
	});
	return AppFaq;
};
