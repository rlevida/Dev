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
            return `Mentioned you on a file.`;
        case "commentReplies":
            return `Replies to a comment.`;
        case "taskAssignedComment":
            return `Commented on the task ${task.task} under ${task.workstream.workstream} workstream.`;
        case "taskAssigned":
            return `Assigned a new task for you`;
        case "fileNewUpload":
            return `Upload a new file`;
        case "taskFollowingCompleted":
            return `Task ${task.task} that you followed has been completed.`;
        case "taskMemberCompleted":
            return `Team member has completed a task ${task.task}.`;
        case "taskApprover":
            return `Needs your approval to complete a task`;
        default:
            return "";
    }
}