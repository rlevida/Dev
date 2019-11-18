
const models = require("../../../modelORM");
const { documentIncludes } = require("../../includes/document");
const { DocumentLink, Document } = models;
const { omit } = require("lodash")
module.exports = async (params) => {
    const { documentIds } = { ...params };

    const result = await DocumentLink.findAll({
        where: { documentId: documentIds },
        include: [
            {
                model: Document,
                as: "document",
                include: documentIncludes()
            }
        ]
    }).map(documentLinkResponse => {
        let resToReturn = {
            ...documentLinkResponse.document.toJSON(),
            tagWorkstream: documentLinkResponse.document.tagDocumentWorkstream.map(e => {
                return { value: e.tagWorkstream.id, label: e.tagWorkstream.workstream };
            }),
            tagTask: documentLinkResponse.document.tagDocumentTask.map(e => {
                return { value: e.tagTask.id, label: e.tagTask.task };
            }),
            tagNote: documentLinkResponse.document.tagDocumentNotes.map(e => {
                return { value: e.TagNotes.id, label: e.TagNotes.note };
            }),
            isRead: documentLinkResponse.document.document_read.length > 0 ? 1 : 0
        };
        return omit(resToReturn, "tagDocumentWorkstream", "tagDocumentTask");
    });

    return result
}