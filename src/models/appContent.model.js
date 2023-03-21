import Model from '../utils/model.js';

export default (sequelize, DataTypes) => {
	class AppContent extends Model {


	};

	AppContent.init({
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		about: {
			type: DataTypes.STRING
		},
		privacyPolicy: {
			type: DataTypes.STRING
		},
		termsOfUse: {
			type: DataTypes.STRING
		}
	}, {
		tableName: 'AppContent',
		sequelize
	});
	return AppContent;
};
