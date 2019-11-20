const models = require('../modelORM');
const { Type } = models;

exports.get = {
    index: async (req, cb) => {
        try {
            const typeFindResult = await Type.findAll({ raw: true });
            cb({ status: true, data: typeFindResult })
        } catch (error) {
            cb({ status: false, error: res.error })
        }
    }
}