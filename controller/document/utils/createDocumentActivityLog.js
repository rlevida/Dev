const models = require("../../../modelORM");
const { ActivityLogsDocument, Users } = models;

module.exports = async (params) => {
    const { documents, projectId, isDuplicate, usersId } = { ...params }
    const documentActivityLogBulkCreateData = documents.map((documentObj) => {
        return {
            projectId: projectId,
            linkType: `document`,
            linkId: documentObj.id,
            actionType: documentObj.actionType
                ? documentObj.actionType
                : isDuplicate
                    ? "duplicated"
                    : "created",
            old: documentObj.old ? documentObj.old : "",
            new: documentObj.new ? documentObj.new : documentObj.origin,
            title: documentObj.title
                ? documentObj.title
                : isDuplicate
                    ? documentObj.type === "document"
                        ? "Document duplicated"
                        : "Folder duplicated"
                    : documentObj.type === "document"
                        ? "uploaded a document"
                        : "created a folder",
            usersId: usersId
        }
    })
    const result = await ActivityLogsDocument.bulkCreate(documentActivityLogBulkCreateData).map((activityLogResponse) => { return activityLogResponse.id });
    return await ActivityLogsDocument.findAll({
        where: { id: result }, include: [
            {
                model: Users,
                as: "user"
            }
        ]
    })
}