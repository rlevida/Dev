const models = require('../modelORM');
const { Users, UsersCreatePassword } = models;

exports.put = {
    index: (req, cb) => {
        const body = req.body;
        const func = global.initFunc();
        try {
            UsersCreatePassword
                .findOne({ where: { hash: body.hash } })
                .then((res) => {
                    if (res) {
                        let data = {};
                        data.salt = func.randomString(32);
                        data.password = func.generatePassword(body.newPassword, data.salt);

                        Users
                            .update(data, { where: { id: res.usersId } })
                            .then((updateRes) => {
                                if (updateRes.length) {
                                    UsersCreatePassword
                                        .destroy({ where: { hash: body.hash, usersId: res.usersId } })
                                        .then(() => {
                                            cb({ status: true, data: res });
                                        });
                                }else{
                                    cb({ status: true, error: "Something went wrong. Please try again later." });
                                }
                            })
                    } else {
                        cb({ status: true });
                    }
                })
        } catch (err) {
            cb({ status: true, error: err });
        }
    }
}