const moment = require("moment")

module.exports = (mail) => {
    console.log(mail)
    const cloudLogo = {
        filename: 'blue-logo.png',
        path: `https://cloudcfo.mobbizapps.com/images/blue-logo.png`,
        cid: 'cloud-cfo-logo'
    }
    const clientProject = {
        filename: 'fa-users.png',
        path: `https://cloudcfo.mobbizapps.com/images/fa-users.png`,
        cid: 'client-project-icon'
    }
    const privateProject = {
        filename: 'fa-lock.png',
        path: `https://cloudcfo.mobbizapps.com/images/fa-lock.png`,
        cid: 'private-project-icon'
    }
    const internalProject = {
        filename: 'fa-cloud.png',
        path: `https://cloudcfo.mobbizapps.com/images/fa-cloud.png`,
        cid: 'internal-project-icon'
    }

    let iconType = [cloudLogo]

    if (mail.icon) {
        let mailIcon = mail.icon.map((type) => {
            return type == "Private" ? privateProject : type == "Client" ? clientProject : internalProject
        })
        iconType = [...iconType, ...mailIcon]
    }

    const options = {
        from: "<no-reply@c_cfo.com>",
        to: `${mail.to}`,
        subject: mail.subject,
        html: mail.html,
        attachments: iconType
    }

    return global.emailtransport(options);

}