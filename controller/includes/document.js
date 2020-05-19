const models = require("../../modelORM");
const { Document, DocumentRead, Starred, Tasks, Tag, Users, Workstream, Notes, Conversation } = models;

exports.documentIncludes = documentIncludes = (params) => {
    return DocumentIncludes = [
        {
            model: Tag,
            where: {
                linkType: "workstream",
                tagType: "document"
            },
            as: "tagDocumentWorkstream",
            required: false,
            include: [
                {
                    model: Workstream,
                    as: "tagWorkstream"
                }
            ]
        },
        {
            model: Tag,
            where: {
                linkType: "task",
                tagType: "document"
            },
            required: false,
            as: "tagDocumentTask",
            include: [
                {
                    model: Tasks,
                    as: "tagTask"
                }
            ]
        },
        {
            model: Tag,
            where: {
                linkType: "notes",
                tagType: "document"
            },
            required: false,
            as: "tagDocumentNotes",
            include: [
                {
                    model: Notes,
                    as: "TagNotes"
                }
            ]
        },
        {
            model: Users,
            as: "user"
        },
        {
            model: Starred,
            as: "document_starred",
            where: { linkType: "document", isActive: 1, isDeleted: 0 },
            required: false,
            include: [
                {
                    model: Users,
                    as: "user",
                    attributes: ["id", "firstName", "lastName", "emailAddress"]
                }
            ]
        },
        {
            model: Document,
            as: "document_folder",
            where: { type: "folder" },
            required: false
        },
        {
            model: DocumentRead,
            as: "document_read",
            required: false
        },
        {
            model: Document,
            as: "folder_document",
            required: false,
            subQuery: true
        },
    ];
}