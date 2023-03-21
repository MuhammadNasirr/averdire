import db from "../../../models/index.js";
import { AUTH_USER_TYPES, LOGIN_STATUS } from "../../../constants/index.js";

/**
 * IMPORTANT NOTE:
 * Try not to use scopes to include (association) in reports unless it's sure that it will not cause any problem
 */

const User = db.User;

/**
 * Filter users (of "default" type)
 * Filter by country, state, gender, title and number of years of experience
 * If title filter is applied then expYears will be counted and filtered for given title
 * @param {Object} req 
 * @param {Object} res 
 * @returns list of filtered default users
 */
export const users = (req, res) => {
    const Op = db.Sequelize.Op;
    let queryFilters = req.body.filters || {};
    const { country, state, gender, title, expYears } = queryFilters;
    let filters = {};
    let associations = {};
    let having = {};
    let group = [];

    // calculation of number of years of all filtered experiences of a user
    const diff = db.sequelize.literal('TIMESTAMPDIFF(YEAR, MIN(`experience`.from), CASE WHEN MAX(`experience`.to IS NULL) = 0 THEN MAX(`experience`.to) ELSE NOW() END)');

    // include user's profile
    associations.profile = "profile";

    // include user's experience for count
    associations.experience = { 
        model: db.UserExperience,
        as: "experience",
        attributes: [
            "jobTitle",
            // [db.sequelize.literal('MIN(`experience`.from)'), 'expStart'],
            // [db.sequelize.literal('case when MAX(`experience`.to IS NULL) = 0 THEN MAX(`experience`.to) ELSE CURRENT_DATE END'), 'expEnd'],
            // [db.sequelize.literal('DATEDIFF(CASE WHEN MAX(`experience`.to IS NULL) = 0 THEN MAX(`experience`.to) ELSE CURRENT_DATE END, MIN(`experience`.from))/365'), "expYears"],
            [diff, "expYears"]
        ]
    };
    // grouping must be used when using "count" in query
    group.push("experience.userId");

    /** user's country filter */
    if(country) {
        filters['$profile.country$'] = { [Op.like]: `${country}%` };
    }
    /** user's state filter */
    if(state) {
        filters['$profile.state$'] = { [Op.like]: `${state}%` };
    }
    /** user's gender filter */
    if(gender) {
        filters['gender'] = gender;
    }
    /** user's jobTitle filter */
    if(title) {
        filters['$experience.jobTitle$'] = { [Op.like]: `${title}%` };
    }
    /** number of years of experience filter */
    if(expYears) {
        having['experience.expYears'] = {[Op.gte] : expYears };
        // having = db.Sequelize.literal(diff.val+" >= "+expYears);
    }

    return User.respond(res).paginate(req).scope("avatar").countAndFindAll({
        where: {
            // filter users (of "default" type)
            role: { [Op.eq]: AUTH_USER_TYPES.default },
            ...filters,
        },
        include: Object.values(associations),
        group, having
    });
}

/**
 * Filter completely verified users (of "default" type)
 * Filter by country, state, gender, title and number of years of experience
 * If title filter is applied then expYears will be counted and filtered for given title
 * Verified user is one whose all experiences added by him are verfied by respective company
 * Means if a user has added 5 experiences and all 5 are verified then he will be considered completely verified
 * If even only 1 is unverified then he will be considered verified
 * If a user has no experience then he will be considered verified
 * @param {Object} req 
 * @param {Object} res 
 * @returns list of filtered completely verified default users
 */
 export const verifiedUsers = (req, res) => {
    const Op = db.Sequelize.Op;
    let queryFilters = req.body.filters || {};
    const { country, state, gender, title, expYears } = queryFilters;
    let filters = {};
    let associations = {};
    let having = {};
    let group = [];

    // calculation of number of years of all filtered experiences of a user
    const diff = db.sequelize.literal('TIMESTAMPDIFF(YEAR, MIN(`experience`.from), CASE WHEN MAX(`experience`.to IS NULL) = 0 THEN MAX(`experience`.to) ELSE NOW() END)');

    // include user's profile
    associations.profile = "profile";

    // include user's experiences for count
    associations.experience = { 
        model: db.UserExperience,
        as: "experience",
        attributes: [
            "jobTitle",
            // number of filtered experiences of a user
            [db.sequelize.literal('COUNT(`experience`.id)'), 'expCount'],
            // number of verified (by company) filtered experiences of a user
            [db.sequelize.literal('COUNT(IF(`experience`.isVerified=1, 1, NULL))'), 'verifiedCount'],
            [diff, "expYears"]
        ]
    };
    // grouping must be used when using "count" in query
    group.push("experience.userId");

    // filter users with all experiences verified
    having['experience.expCount'] = {[Op.eq] : db.sequelize.literal('`experience.verifiedCount`') };

    /** user's country filter */
    if(country) {
        filters['$profile.country$'] = { [Op.like]: `${country}%` };
    }
    /** user's state filter */
    if(state) {
        filters['$profile.state$'] = { [Op.like]: `${state}%` };
    }
    /** user's gender filter */
    if(gender) {
        filters['gender'] = gender;
    }
    /** user's jobTitle filter */
    if(title) {
        filters['$experience.jobTitle$'] = { [Op.like]: `${title}%` };
    }
    /** number of years of experience filter */
    if(expYears) {
        having['experience.expYears'] = {[Op.gte] : expYears };
        // having = db.Sequelize.literal(diff.val+" >= "+expYears);
    }

    return User.respond(res).paginate(req).scope("avatar").countAndFindAll({
        where: {
            // filter users (of "default" type)
            role: { [Op.eq]: AUTH_USER_TYPES.default },
            ...filters,
        },
        include: Object.values(associations),
        group, having
    });
}

/**
 * Get List of active users (of "default" type)
 * Active Users are those who are currently logged in (determined by "loginStatus")
 * @param {Object} req 
 * @param {Object} res 
 * @returns list of active default users
 */
 export const activeUsers = (req, res) => {
    const Op = db.Sequelize.Op;
    let filters = {};
    let associations = {};
    let having = {};
    let group = [];

    // include user's profile
    associations.profile = "profile";

    return User.respond(res).paginate(req).scope("avatar").countAndFindAll({
        where: {
            // filter logged in users (of "default" type)
            role: { [Op.eq]: AUTH_USER_TYPES.default },
            loginStatus: { [Op.eq]: LOGIN_STATUS.active },
            ...filters,
        },
        include: Object.values(associations),
        group, having
    });
}
