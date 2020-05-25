const models = require("../../../modelORM");
const { DocumentLink, Document } = models;

module.exports = async (params) => {
    const { projectId, documents, folderId } = { ...params }
    const documentBulkCreateData = documents.map(async (document) => {
        let whereObj = {
            ...(typeof document.origin != "undefined" && document.origin != "" ? { origin: document.origin } : {}),
            ...(typeof document.folderId != "undefined" && document != "" ? { folderId: document.folderId } : { folderId: null }),
            ...(typeof document.status != "undefined" && document.status != "" ? { status: document.status } : {}),
            ...(typeof document.type != "undefined" && document.type != "" ? { type: document.type } : {})
        };
        return new Promise(async resolve => {
            const findDocumentLinkResult = await DocumentLink.findAll({
                where: {
                    linkType: "project",
                    linkId: projectId
                },
                include: [
                    {
                        model: Document,
                        as: "document",
                        where: whereObj,
                        order: [["documentNameCount", "DESC"]],
                        required: true
                    }
                ],
            });
            resolve({
                ...document,
                folderId: typeof document.folderId !== "undefined" ? document.folderId : null,
                documentNameCount: findDocumentLinkResult.length > 0 ? findDocumentLinkResult[0].document.documentNameCount + 1 : 0
            })
        })
    })

    const documentBulkCreateDataPromise = await Promise.all(documentBulkCreateData).then((promiseResponse) => {
        return promiseResponse;
    })

    const documentBulkCreateResult = await Document.bulkCreate(documentBulkCreateDataPromise);

    /* Link document to the project */
    const documentLinBulkCreateData = documentBulkCreateResult.map((documentBulkCreateObj) => {
        return { documentId: documentBulkCreateObj.id, linkType: "project", linkId: projectId }
    });

    await DocumentLink.bulkCreate(documentLinBulkCreateData);

    return documentBulkCreateResult;
}