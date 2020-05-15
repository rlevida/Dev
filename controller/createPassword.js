const models = require('../modelORM');
const { Users, UsersCreatePassword } = models;

exports.post = {
    index: (req, cb) => {
        try {
            const body = req.body;
            let func = global.initFunc(),
                salt = func.randomString(32),
                date = new Date(),
                hash = func.generatePassword(date.getFullYear() + "-" + date.getMonth() + "-" + date.getDay() + "-" + date.getHours() + "-" + date.getMinutes() + "-" + date.getSeconds(), salt);
            let html = `<p>Hi ${body.firstName}<br></p>`;
            html += `<p>Your account for CloudCFO is now created.</p>`;
            html += `<p>Id: ${body.id}</p>`;
            html += `<p>Username: ${body.username}</p>`;
            html += `<p>Please access the link below to activate your account and create your password..</p>`;
            html += `<a href="${process.env.NODE_ENV == "production" ? "https:" : "http:"}${global.site_url}createPassword?hash=${hash}">Click Here</a>`;
            html += `<p>Regards,<br>Admin</p>`;

            UsersCreatePassword.create({ hash: hash, usersId: body.id }).then(() => {
                const mailOptions = {
                    from: '"no-reply" <no-reply@c_cfo.com>',
                    to: `${body.emailAddress}`,
                    subject: "[CLOUD-CFO]",
                    html: html
                };
                global.emailtransport(mailOptions);
                cb({ status: true });
            });

        } catch (error) {
            console.error(error)
            cb({ status: true, error: error });
        }
    }
}

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
                        data.isActive = 1;

                        Users
                            .update(data, { where: { id: res.usersId } })
                            .then((updateRes) => {
                                if (updateRes.length) {
                                    UsersCreatePassword
                                        .destroy({ where: { hash: body.hash, usersId: res.usersId } })
                                        .then(() => {
                                            cb({ status: true, data: res });
                                        });
                                } else {
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