import db from "../../models/index.js";
import { sendErrorResponse, formatDate } from "../../utils/helpers.js";
import { AUTH_USER_TYPES, EXPERIENCE_TYPE, EXP_VERIFY_VALUE } from "../../constants/index.js";
import { addExpConnections, updateExpEndorsementPoints } from "../../utils/connection.js";

const User = db.User;
const UserEducation = db.UserEducation;
const UserExperience = db.UserExperience;
const sequelize = db.sequelize;
const CompanyCeo = db.CompanyCeo;
const CompanyDepartment = db.CompanyDepartment;

export const listEmployees = (req, res) => {
  User.scope("short", "avatar").findAll({
    where: {
      '$experience.companyId$': req.user.companyId,
      '$experience.to$': null
    },
    include: [
      { model: UserExperience.scope("isVerified", "short"), as:"experience" }
    ]
  }).then((data) => {
    return res.status(200).send({ data });
  }).catch(err => sendErrorResponse(err, res));
};

export const listStudentBatches = (req, res) => {
  UserEducation.findAll({
    where: { instituteId: req.user.companyId },
    attributes: [[db.sequelize.literal('DISTINCT(DATE_FORMAT(`from`, "%Y"))'), 'batch']]
  }).then((data) => {
    return res.status(200).send({ data });
  }).catch(err => sendErrorResponse(err, res));
};

export const listStudents = (req, res) => {
  if(!req.query.batch) {
    return res.status(404).send({ message: "Invalid batch id." });
  }
  User.scope("short", "avatar").findAll({
    where: { '$education.instituteId$': req.user.companyId },
    include: [
      { model: UserEducation.scope("isVerified", "short"), as:"education"}
    ],
    attributes: {include:[[db.sequelize.literal('DATE_FORMAT(education.from, "%Y")'), 'batch']]},
    having: {'$batch$': req.query.batch}
    // group: [db.sequelize.literal('DATE_FORMAT(`education.from`, "%M %Y")')]
  }).then((data) => {
    return res.status(200).send({ data });
  }).catch(err => sendErrorResponse(err, res));
};

export const jobInvitationUserSearch = (req, res) => {
    const { Op } = db.Sequelize;

    let filters = [];
    let addInclude = [];
    if(req.query.queryName) { 
      filters.push({
        [Op.or]: [
          {
            nameQuery: sequelize.where(
              sequelize.fn("concat",sequelize.col("firstName")," ",sequelize.col("lastName")),
              { [Op.like]: `%${req.query.queryName}%` }
            ),
          }
        ]
      });
    }
    if(req.query.queryEmail) {
      filters.push({email : { [Op.like]: '%'+req.query.queryEmail+'%' }});
    }
    if(req.query.queryLocation) {
      filters.push({
        [Op.or]: [
          {'$profile.city$' : { [Op.like]: req.query.queryLocation+'%' }},
          {'$profile.state$' : { [Op.like]: req.query.queryLocation+'%' }},
          {'$profile.country$' : { [Op.like]: req.query.queryLocation+'%' }}
        ]
      });
    }
    if(req.query.queryDesignation) {
      addInclude.push(
        {
          model: db.UserExperience,
          as: "experience",
          where: { 
            designation: { [Op.like]: req.query.queryDesignation+'%' },
            // to: null
          },
          // attributes: [],
          required: true,
        }
      );
    }

    User.scope('short', 'avatar').findAll({
      where: {
        [Op.and]: filters,
        role: AUTH_USER_TYPES.default
      },
      attributes: {include:[[db.sequelize.literal('IF(COUNT(jobInvitations.id)>0, 1, 0)'),'isInvited']]},
      group: ["id"],
      include: [
        {
          model: db.JobInvitation,
          as: "jobInvitations",
          where: { jobId: req.params.modelId },
          attributes: [],
          required: false
        },
        {
          model: db.UserProfile,
          as: "profile",
          attributes: []
        },
        ...addInclude
      ]
    }).then((data) => {
      return res.status(200).send({ data });
    }).catch(err => sendErrorResponse(err, res));
};

export const getCeo = (req, res) => {
  CompanyCeo.scope('user', 'experience').findOne({
    where: { companyId: req.user.companyId }
  }).then(async ceo => {
    if(ceo) return res.send({ data: ceo });
    return res.status(404).send({ message: "CEO not added yet." });
  });
}

export const addCeo = (req, res) => {
  User.scope('short', 'avatar').findOne({
    where: { email: req.body.email }
  }).then(user => {
    if (!user) {
      return res.status(404).send({ message: "This email can't be added as CEO." });
    }

    CompanyDepartment.findOne({
      where: { companyId: req.user.companyId, id: req.body.departmentId}
    }).then(async dep => {
      if(!dep) {
        return res.status(404).send({ message: "Selected department is not valid." });
      }

      const t = await db.sequelize.transaction();
      let ceoExp = null;
      try {
        const fromDate = formatDate(req.body.from);

        // add/update ceo experience
        ceoExp = await UserExperience.findOrCreate({
          where: { 
            userId: user.id,
            companyId: req.user.companyId, 
            departmentId: req.body.departmentId,
            from: fromDate, 
            expType: EXPERIENCE_TYPE.ceo
          },
          defaults: { 
            jobTitle: req.body.jobTitle,
            designation: req.body.designation,
            isVerified: EXP_VERIFY_VALUE.verified,
            verifiedAt: Date.now()
          }
        }).then(async exp => {
          if(!exp[1]) {
            // update ceo's experience if already exists
            // hooks are disabled to prevent excluding attributes which are being used later in this request
            await exp[0].update({
              jobTitle: req.body.jobTitle,
              designation: req.body.designation,
              departmentId: req.body.departmentId
            }, { hooks: false, transaction: t });
          }
          return exp[0];
        });

        // add/update ceo
        const ceo = await CompanyCeo.scope('user', 'experience').findOrCreate({
          where: { companyId: req.user.companyId },
          defaults: { userId: user.id, userExperienceId: ceoExp.id },
          transaction: t
        }).then(async ceo => {
          if(!ceo[1]) {
            // update ceo if already exists
            await ceo[0].update({userId: user.id, userExperienceId: ceoExp.id}, {transaction: t});
          }
          return ceo[0];
        });

        // add ceo's connections
        await addExpConnections(t, ceoExp);
        // update endorsement points (affected due to new connections)
        await updateExpEndorsementPoints(res, ceoExp.companyId);
        
        await t.commit();
        // reload ceo data after transaction commit
        await ceo.reload();
        return res.send({ message: "Company CEO has been updated successfully.", data: ceo });

      } catch (err) {
        await t.rollback();
        // manually do rollback for newly created ceo case scenario
        // ceoExp update will rollback automatically becuase update use transaction object
        if(ceoExp && ceoExp._options.isNewRecord) { ceoExp.destroy(); }
        sendErrorResponse(err, res);
      }

    });
  }).catch(err => sendErrorResponse(err, res));
}