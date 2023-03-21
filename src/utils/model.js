import Sequelize from 'sequelize';
import _ from 'lodash';
import { sendErrorResponse } from "../utils/helpers.js";

class Model extends Sequelize.Model {

    static respond(res) {
        this.res = res;
        this.returnResponse = true;
        this.isFindAndCountAll = false;
        this.isFindOne = false;
        return this;
    }

    /**
     * This method should be used directly on model
     * i.e before calling any other method
     * This method "paginate" should be used with "findAndCountAll" or "countAndFindAll" method to get total count also
     */
    static paginate(req) {
        this.pagination = null;
        if(req.body) {
            this.setPagination(req.body.pagination);
        }
        return this;
    }
    static setPagination(pagination) {
        this.paginationApplied = false;
        this.pagination = {
            pageSize: 10,
            current: 1,
            total: 0
        };
        if(pagination) {
            this.pagination = { ...this.pagination, ...pagination };
        }
        return this.pagination;
    }
    static getPagination() {
        return this.pagination;
    }

    static findOne(queryProps) {
        this.isFindOne = true;
        return super.findOne(queryProps);
    }
    static findAll(queryProps) {
        if(queryProps && queryProps.attributes && Array.isArray(queryProps.attributes)) {
            const attrs = {};
            if(!queryProps.attributes.exclude) {
                attrs.exclude = Object.keys(this.getAttributes());
            }
            attrs.include = queryProps.attributes;
            queryProps.attributes = attrs;
        }
        return super.findAll(queryProps)
            .then((result)=> {
                /**
                 * Send server response if this.res is set by model and this.returnResponse is set to true
                 * findAndCountAll calls this function so server response should not be sent in that case
                 * findOne also calls this function so server response should not be sent in that case also
                 */
                // if(this.isFindAndCountAll === true || this.isFindOne === true) {
                //     return result;
                // }
                // else if(this.returnResponse === true && this.res) {
                //     return this.res.send({ data: result });
                // }
                return result;
            })
            .catch((err) => {
                // if(this.isFindAndCountAll === true || this.isFindOne === true) {
                //     return err;
                // }
                // else if(this.returnResponse === true && this.res) {
                //     return sendErrorResponse(err, this.res);
                // }
                return err;
            });
    }
    static findAndCountAll(queryProps) {
        this.isFindAndCountAll = true;
        if(!queryProps) queryProps = {};

        if(this.pagination) {
            queryProps.offset = this.pagination.pageSize * (this.pagination.current-1);
            queryProps.limit = this.pagination.pageSize;
            /**
             * In case of limit a subquery is added in the query by sequelize, it cause problem in result
             * So following option is added to fix this
             */
            queryProps.subQuery = false;
            this.paginationApplied = true;
        }
        
        return super.findAndCountAll(queryProps)
            .then((result)=> {
                if(this.pagination) {
                    /** 
                     * If query contains "group by" clause then result of count query is an array of objects by groups
                     * Hence in case of "group by" clause count is taken as length of count query result
                     */
                    this.pagination.total = queryProps.group ? result.count.length : result.count;
                }

                if(this.returnResponse === true && this.res) {
                    if(this.pagination) {
                        return this.res.send({ pagination: this.pagination, data: result.rows });
                    }
                    return this.res.send({ data: result.rows });
                }
                return result;
            })
            .catch((err) => {
                if(this.returnResponse === true && this.res) {
                    return sendErrorResponse(err, this.res);
                }
                return err;
            });
    }
    /** A custom function similar to findAndCountAll */
    static countAndFindAll(queryProps) {
        this.isFindAndCountAll = true;
        if(!queryProps) queryProps = {};

        // remove group clause from query if it's empty
        if(!queryProps.group || queryProps.group.length<1) {
            delete queryProps.group
        }

        const countQueryProps = _.cloneDeep(queryProps);

        // if group is empty or not defined in query props by added in some scope
        // then check for group in added scopes and add it in count query props
        if(!countQueryProps.group && this._scope) {
            if(this._scope.group) countQueryProps.group = this._scope.group;
        }

        // update attributes for count query because count query wasn't working for aliased attribute in "having" clause
        // so that aliased attributes are added in count query
        // then add any aliased attributes from associations
        if(countQueryProps.having) {
            let countAttributes = [];
            // add given attributes in count query
            // As count query doesn't consider "include"/"exclude" in attributes object
            // means if attributes are given as object then they are ignored in count query
            // So move included attributes from object to attributes array
            if(countQueryProps.attributes) {
                if(Array.isArray(countQueryProps.attributes)) {
                    countAttributes = countQueryProps.attributes;
                } else if(countQueryProps.attributes.include && Array.isArray(countQueryProps.attributes.include)) {
                    countAttributes = countQueryProps.attributes.include;
                }
            }
            
            // now check if any associations are included then add their aliased attributes in count query attributes
            // because count query by default doesn't consider association attributes
            if(countQueryProps.include && Array.isArray(countQueryProps.include)) {
                countQueryProps.include.map((associate, i) => {
                    // if the association is given as object
                    if(typeof associate === 'object' && associate.as && associate.attributes) {
                        // if attributes are defined in the association
                        if(Array.isArray(associate.attributes)) {
                            associate.attributes.map((attr, j) => {
                                if(Array.isArray(attr) && attr.length===2) {
                                    countAttributes.push([attr[0], ""+associate.as+"."+attr[1]]);
                                }
                            });
                        } else if(associate.attributes.include && Array.isArray(associate.attributes.include)) {
                            associate.attributes.include.map((attr, j) => {
                                // check if it's an aliased attribute
                                if(Array.isArray(attr) && attr.length===2) {
                                    countAttributes.push([attr[0], ""+associate.as+"."+attr[1]]);
                                }
                            });
                        }
                    }
                })
            }
            countQueryProps.attributes = countAttributes;
        }

        // add pagination clause in query props
        if(this.pagination) {
            queryProps.offset = this.pagination.pageSize * (this.pagination.current-1);
            queryProps.limit = this.pagination.pageSize;
            /**
             * In case of limit a subquery is added in the query by sequelize, it cause problem in result
             * So following option is added to fix this
             */
            queryProps.subQuery = false;
            this.paginationApplied = true;
        }

        return Promise.all([
            super.count(countQueryProps),
            this.findAll(queryProps)
        ]).then((result)=> {
            if(this.pagination) {
                /** 
                 * If query contains "group by" clause then result of count query is an array of objects by groups
                 * Hence in case of "group by" clause count is taken as length of count query result
                 */
                this.pagination.total = Array.isArray(result[0]) ? result[0].length : result[0];
            }
            if(this.returnResponse === true && this.res) {
                if(this.pagination) {
                    return this.res.send({ pagination: this.pagination, data: result[1] });
                }
                return this.res.send({ data: result[1] });
            }
            return result;
        })
        .catch((err) => {
            if(this.returnResponse === true && this.res) {
                return sendErrorResponse(err, this.res);
            }
            return err;
        });
    }

    static scope() {
        let argArr = Array.prototype.slice.call(arguments);
        // add defaultScope in each db request if any other scope is added in query
        if(argArr.length>0) {
            if(Array.isArray(argArr[0])) {
                argArr = argArr[0];
            }
            argArr.unshift("defaultScope");
        }
        return super.scope(argArr);
    }
};
export default Model;
