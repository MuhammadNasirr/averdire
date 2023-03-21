import db from "../../../models/index.js";
import { COMPANY_TYPES, EMAIL_VERIFY_VALUE } from "../../../constants/index.js";

/**
 * IMPORTANT NOTE:
 * Try not to use scopes to include (association) in reports unless it's sure that it will not cause any problem
 */

const Company = db.Company;

/**
 * Filter companies (of "company" type) by country, state and industry
 * @param {Object} req 
 * @param {Object} res 
 * @returns list of filtered companies
 */
export const companies = (req, res) => {
    const Op = db.Sequelize.Op;
    let queryFilters = req.body.filters || {};
    const { country, state, industry } = queryFilters;
    let filters = {};
    let associations = {};
    let having = {};
    let group = [];
    let order = [];

    /** Adding country filter */
    if(country) {
        filters['country'] = { [Op.like]: `${country}%` };
    }
    /** Adding state filter */
    if(state) {
        filters['state'] = { [Op.like]: `${state}%` };
    }
    /** Adding industry filter */
    if(industry) {
        filters['industry'] = { [Op.like]: `${industry}%` };
    }

    // sort by employee count
    order.push(db.sequelize.literal('employeeCount DESC'));

    return Company.respond(res).paginate(req).scope("logo", "employeeStats").countAndFindAll({ 
        attributes: ["id", "name", "email", "status", "type", "industry", "country", "state", "city"],
        where: {
            // filter companies (of "company" type)
            type: { [Op.eq]: COMPANY_TYPES.company },
            ...filters,
        },
        include: Object.values(associations),
        group, having, order
    });
}

/**
 * Filter verified companies (of "company" type)
 * Filter by country, state and industry
 * A company is considered verified if it is verified  by email
 * @param {Object} req 
 * @param {Object} res 
 * @returns list of filtered verified companies
 */
 export const verifiedCompanies = (req, res) => {
    const Op = db.Sequelize.Op;
    let queryFilters = req.body.filters || {};
    const { country, state, industry } = queryFilters;
    let filters = {};
    let associations = {};
    let having = {};
    let group = [];
    let order = [];

    /** Adding country filter */
    if(country) {
        filters['country'] = { [Op.like]: `${country}%` };
    }
    /** Adding state filter */
    if(state) {
        filters['state'] = { [Op.like]: `${state}%` };
    }
    /** Adding industry filter */
    if(industry) {
        filters['industry'] = { [Op.like]: `${industry}%` };
    }

    // sort by employee count
    order.push(db.sequelize.literal('employeeCount DESC'));

    return Company.respond(res).paginate(req).scope("logo", "employeeStats").countAndFindAll({ 
        attributes: ["id", "name", "email", "status", "type", "industry", "country", "state", "city"],
        where: {
            // filter companies (of "company" type)
            type: { [Op.eq]: COMPANY_TYPES.company },
            emailVerified: EMAIL_VERIFY_VALUE.verified, // verified filter
            ...filters,
        },
        include: Object.values(associations),
        group, having, order
    });
}

/**
 * Filter companies (of "institute" type)
 * Filter by country, state and industry
 * @param {Object} req 
 * @param {Object} res 
 * @returns list of filtered institutes
 */
 export const institutes = (req, res) => {
    const Op = db.Sequelize.Op;
    let queryFilters = req.body.filters || {};
    const { country, state, industry } = queryFilters;
    let filters = {};
    let associations = {};
    let having = {};
    let group = [];
    let order = [];

    /** Adding country filter */
    if(country) {
        filters['country'] = { [Op.like]: `${country}%` };
    }
    /** Adding state filter */
    if(state) {
        filters['state'] = { [Op.like]: `${state}%` };
    }
    /** Adding industry filter */
    if(industry) {
        // industry filter is not added for list of "institutes"
        // because institute have only one kind of industry and that is "Education"
        // filters['industry'] = { [Op.like]: `${industry}%` };
    }

    // sort by student count
    order.push(db.sequelize.literal('studentCount DESC'));

    return Company.respond(res).paginate(req).scope("logo", "studentStats").countAndFindAll({ 
        attributes: ["id", "name", "email", "status", "type", "industry", "country", "state", "city"],
        where: {
            // filter companies (of "institute" type)
            type: { [Op.eq]: COMPANY_TYPES.institute },
            ...filters,
        },
        include: Object.values(associations),
        group, having, order
    });
}
