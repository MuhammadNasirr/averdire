import Sequelize from "sequelize";
import db from "../../../models/index.js";

/**
 * IMPORTANT NOTE:
 * Try not to use scopes to include (association) in reports unless it's sure that it will not cause any problem
 */

const SharedRssNews = db.SharedRssNews;

/**
 * Get list of news sorted by comments count and likes count
 * @param {Object} req 
 * @param {Object} res 
 * @returns list of sorted news
 */
export const news = (req, res) => {
    let filters = {};
    let associations = {};
    let having = {};
    let group = [];
    let order = [];

    // sort by comments count first and then by likes count
    order.push(db.sequelize.literal('sharedCount DESC'));
    order.push(db.sequelize.literal('likesCount DESC'));
    order.push(db.sequelize.literal('commentsCount DESC'));

    return SharedRssNews.respond(res).paginate(req).scope('news', { method: ['newsStats', null, ['rssNewsId']] }).countAndFindAll({
        attributes: {include: [[Sequelize.fn("COUNT", Sequelize.fn('DISTINCT', Sequelize.col(`${SharedRssNews.getTableName()}.id`))), "sharedCount"]]},
        where: { ...filters },
        include: Object.values(associations),
        group, having, order
    });
}
