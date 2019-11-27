module.exports = async (params) => {
    const { notificationType, sender, task } = { ...params }
    switch (notificationType) {
        case "messageSend":
            return `${sender.firstName} ${sender.lastName} sent you a message`;
        case "messageMentioned":
            return `${sender.firstName} ${sender.lastName} mentioned you in a message`;
        case "taskTagged":
            return `Mentioned you on the task ${task.task} under ${task.workstream.workstream} workstream.`;
        case "fileTagged":
            return `Mentioned you on a file.`
        case "commentReplies":
            return `Replies to a comment.`
        default:
            return "";
    }
}