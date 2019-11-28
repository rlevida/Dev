/* MODELS */
const models = require("../../modelORM");
const {
    Conversation,
    Document,
    Tasks,
    Tag,
    Workstream,
    Users,
} = models;

exports.noteIncludes = noteIncludes = (params) => {
    return  NotesInclude = [
        {
            model: Tag,
            where: {
                linkType: "task",
                tagType: "notes"
            },
            as: "notesTagTask",
            required: false,
            include: [
                {
                    model: Tasks,
                    as: "tagTask"
                }
            ]
        },
        {
            model: Workstream,
            as: "noteWorkstream"
        },
        {
            model: Tag,
            where: {
                linkType: "notes",
                tagType: "document"
            },
            as: "documentTags",
            required: false,
            include: [
                {
                    model: Document,
                    as: "document",
                    include: [
                        {
                            model: Users,
                            as: "user",
                            attributes: ["id", "firstName", "lastName", "emailAddress"]
                        }
                    ]
                }
            ]
        },
        {
            model: Conversation,
            where: {
                linkType: "notes"
            },
            as: "comments",
            required: false,
            include: [
                {
                    model: Users,
                    as: "users",
                    attributes: ["id", "firstName", "lastName", "emailAddress"]
                }
            ]
        },
        {
            model: Users,
            as: "creator",
            required: false,
            attributes: ["id", "firstName", "lastName", "emailAddress"]
        }
    ];
}