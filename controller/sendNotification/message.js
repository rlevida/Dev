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
        case "taskBeforeDeadline":
            return `Task about to be due`
        case "taskResponsibleBeforeDeadline":
            return `Task about to be due as responsible`;
        case "taskDeadline":
            return `You seem to have missed a deadline.`;
        case "taskTeamDeadline":
            return `Team member seem to have missed a deadline.`;
        case "taskFollowingDeadline":
            return `Task following seem to have missed a deadline.`;
        case "taskResponsibleDeadline":
            return `Task seem to have missed a deadline as a responsible.`;
        default:
            return "";
    }
}