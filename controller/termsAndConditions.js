const models = require('../modelORM');

const {
    TermsAndCondtions,
    Sequelize,
} = models;

const Op = Sequelize.Op;

exports.get = {
    index: async (req, cb) => {
        try {

            const termsAndCondtionsFindResult = await TermsAndCondtions.findOne({});
            cb({ status: true, data: termsAndCondtionsFindResult });
        } catch (error) {
            cb({ status: false, error: error })
        }
    }
}

exports.post = {
    index: async (req, cb) => {
        try {
            const { termsAndConditions } = { ...req.body };
            const termsAndCondtionsCreateResult = await TermsAndCondtions.create({ termsAndConditions });
            cb({ status: true, data: termsAndCondtionsCreateResult });
        } catch (error) {
            cb({ status: false, error: error })
        }
    }
}

exports.put = {
    index: async (req, cb) => {
        try {
            const { id } = { ...req.params }
            const { termsAndConditions } = { ...req.body };
            const termsAndConditionsUpdateResult = await TermsAndCondtions.update({ termsAndConditions: termsAndConditions }, { where: { id } });
            cb({ status: true, data: termsAndConditionsUpdateResult });
        } catch (error) {
            cb({ status: false, error: error })
        }
    }
}