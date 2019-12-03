const moment = require("moment")

module.exports = (mail) => {
    const cloudLogo = {
        filename: 'blue-logo.png',
        path: `https://app.cloudcfo.ph/images/blue-logo.png`,
        cid: 'cloud-cfo-logo'
    }
    const clientProject = {
        filename: 'fa-users.png',
        path: `https://app.cloudcfo.ph/images/fa-users.png`,
        cid: 'client-project-icon'
    }
    const privateProject = {
        filename: 'fa-lock.png',
        path: `https://app.cloudcfo.ph/images/fa-lock.png`,
        cid: 'private-project-icon'
    }
    const internalProject = {
        filename: 'fa-cloud.png',
        path: `https://app.cloudcfo.ph/images/fa-cloud.png`,
        cid: 'internal-project-icon'
    }

    let iconType = [cloudLogo]

    if (mail.icons) {
        let mailIcon = mail.icons.map((type) => {
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