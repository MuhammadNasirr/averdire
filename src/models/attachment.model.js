import Model from '../utils/model.js';
import fs from 'fs';

export default (sequelize, DataTypes) => {
	class Attachment extends Model {
		static associate(models) {
			this.belongsTo(models.User, { foreignKey: 'uploadedBy', as: 'uploader' })
		}

		static async saveAttachment(model, modelId, modelField, req, reqField = null) {
			if (req.files && req.files[reqField || modelField]) {
				let savedAttachments = [];
				for (const file of req.files[reqField || modelField]) {
					const fileInfo = {
						path: file.destination,
						originalFileName: file.originalname,
						fileName: file.filename,
						type: file.mimetype,
						size: file.size,
						encoding: file.encoding
					}
					await new Promise(async (resolve, reject) => {
						// find existing attachment
						this.findOne({ where: { model, modelId, modelField }, attributes: {} }).then((obj) => {
							if (obj) {
								// if existing attachment found
								// delete old file and update attachment record for new file
								const filePath = obj.path + '/' + obj.fileName;
								if (fs.existsSync(filePath)) {
									// if file exists in storage then delete
									fs.unlink(filePath, (err) => {
										if (err) throw (err);
										obj.update(fileInfo).then((attachment) => {
											savedAttachments.push(attachment);
											resolve();
										});
									});
								} else {
									obj.update(fileInfo).then((attachment) => {
										savedAttachments.push(attachment);
										resolve();
									});
								}
							}
							else {
								this.create({
									uploadedBy: req.user.id,
									model, modelId, modelField,
									...fileInfo
								}).then((attachment) => {
									savedAttachments.push(attachment);
									resolve();
								});
							}
						}).catch((err) => { reject(err); });
					});
				};

				return savedAttachments;
			}
			return null;
		}

		static async saveSingleAttachment(model, modelId, modelField, req, index) {
			let savedAttachment = null;
			if (req.files && Array.isArray(req.files) && req.files[index]) {
				
				const file = req.files[index];
				const fileInfo = {
					path: file.destination,
					originalFileName: file.originalname,
					fileName: file.filename,
					type: file.mimetype,
					size: file.size,
					encoding: file.encoding
				}
				await new Promise(async (resolve, reject) => {
					this.create({
						uploadedBy: req.user.id,
						model, modelId, modelField,
						...fileInfo
					}).then((attachment) => {
						savedAttachment = attachment;
						resolve();
					});
				});
			}
			return savedAttachment;
		}

		/**
		 * Makes a copy of existsing attacment data and actual file
		 * @param {*} attachment 
		 * @param {*} model 
		 * @param {*} modelId 
		 * @param {*} modelField
		 * @returns copied Attachment object
		 */
		static async copyAttachment(attachmentId, model, modelId, modelField, destPath) {
			if (attachmentId) {
				return new Promise(async (resolve, reject) => {
					let cData = await this.unscoped().findOne({
						where: { id: attachmentId},
						raw: true,
					});
					delete cData.id;
					const src = cData.path + '/' + cData.fileName;
					const dest = destPath + '/' + cData.fileName;

					if (!fs.existsSync(destPath)) {
						fs.mkdirSync(destPath, {recursive: true});
					}

					fs.copyFile( src, dest, (err) => {
						if (err) reject(err);
						else {
							this.create({
								...cData, model, modelId, modelField, path: destPath
							}).then((attachment) => {
								resolve(attachment);
							});
						}
					});
				});
			}
			return null;
		}

		static async deleteAttachment(model, modelId, modelField) {
			await new Promise(async (resolve, reject) => {
				// find existing attachment
				this.findOne({ where: { model, modelId, modelField }, attributes: {} }).then((obj) => {
					if (obj) {
						// if existing attachment found
						// delete old file and update attachment record for new file
						const filePath = obj.path + '/' + obj.fileName;
						if (fs.existsSync(filePath)) {
							fs.unlink(filePath, (err) => {
								if (err) throw (err);
							});
						}
						obj.destroy();
						resolve();
					}
					else {
						reject("Attachment doesn't exist.");
					}
				}).catch((err) => { reject(err); });
			});
		}

		static getIncludeQueryObject(MODEL, FIELD) {
			return {
				model: this,
				as: FIELD,
				foreignKey: { name: 'modelId' },
				where: { model: MODEL, modelField: FIELD },
				required: false
			};
		}
	};
	Attachment.init({
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		uploadedBy: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		model: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		modelId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		modelField: {
			type: DataTypes.STRING,
			allowNull: false
		},
		path: {
			type: DataTypes.STRING,
			allowNull: false
		},
		originalFileName: {
			type: DataTypes.STRING,
			allowNull: false
		},
		fileName: {
			type: DataTypes.STRING,
			allowNull: false
		},
		url: {
			type: DataTypes.STRING,
			get() {
				let url = null;
				if (this.path) {
					url = process.env.SERVER_URL;
					url += this.path.split('/').splice(1).join('/');
					if (this.fileName) {
						url += '/' + this.fileName;
					}
				}
				this.setDataValue('path', undefined);
				this.setDataValue('fileName', undefined);
				return url;
			}
		},
		type: {
			type: DataTypes.STRING
		},
		size: {
			type: DataTypes.FLOAT
		},
		encoding: {
			type: DataTypes.STRING
		}
	}, {
		tableName: 'Attachment',
		sequelize,
		defaultScope: {
			attributes: {
			  exclude: ['uploadedBy', 'model', 'modelId', 'modelField', 'encoding',
			  'createdAt', 'updatedAt', 'originalFileName', 'type', 'size']
			}
		  }
	});
	return Attachment;
};
