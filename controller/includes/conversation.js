/* MODELS */
const models = require("../../modelORM");
const {
    Notes,
    Tag,
    Workstream,
    Users,
    Document,
    DocumentRead,
    Projects,
} = models;

exports.conversationIncludes = conversationIncludes = (params) => {
    return ConversationIncludes = [
        {
            model: Tag,
            as: "conversationDocuments",
            attributes: ["id"],
            where: {
                linkType: "conversation",
                tagType: "document",
                isDeleted: 0
            },
            required: false,
            include: [
                {
                    model: Document,
                    as: "document",
                    include: [
                        {
                            model: DocumentRead,
                            as: "document_read",
                            attributes: ["id"],
                            required: false
                        },
                        {
                            model: Users,
                            as: "user",
                            attributes: ["id", "username", "firstName", "lastName", "avatar"]
                        }
                    ],
                    where: {
                        isDeleted: 0
                    },
                    required: false
                }
            ]
        },
        {
            model: Users,
            as: "users"
        },
        {
            model: Notes,
            as: "conversationNotes",
            include: [
                {
                    model: Workstream,
                    as: "noteWorkstream",
                    include: [
                        {
                            model: Projects,
                            as: "project"
                        }
                    ]
                },
                {
                    model: Tag,
                    as: "notesTagTask",
                    required: false,
                    where: {
                        linkType: "user",
                        tagType: "notes",
                        isDeleted: 0
                    },
                    include: [
                        {
                            model: Users,
                            as: "user"
                        }
                    ]
                }
            ]
        }
    ]
}

