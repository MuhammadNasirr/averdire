import db from "../../../models/index.js";

/**
 * IMPORTANT NOTE:
 * Try not to use scopes to include (association) in reports unless it's sure that it will not cause any problem
 */

const Publication = db.Publication;

/**
 * Get list of publications (posted by users) sorted by comments count and likes count
 * @param {Object} req 
 * @param {Object} res 
 * @returns list of sorted publications
 */
export const publications = (req, res) => {
    let filters = {};
    let associations = {};
    let having = {};
    let group = [];
    let order = [];

    // sort by likes count first and then by comments count
    order.push(db.sequelize.literal('likesCount DESC'));
    order.push(db.sequelize.literal('commentsCount DESC'));

    return Publication.respond(res).paginate(req).scope('banner', { method: ['publicationStats', null] }).countAndFindAll({
        where: { ...filters },
        include: Object.values(associations),
        group, having, order
    });
}
