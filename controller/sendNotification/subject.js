module.exports = async (params) => {
    const { notificationType, sender } = { ...params }
    switch (notificationType) {
        case "messageSend":
            return `${sender.firstName} sent you a message`;
        default:
            break
    }
}