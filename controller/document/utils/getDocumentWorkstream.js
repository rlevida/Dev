
const models = require("../../../modelORM");
const { Document, Tag } = models;
const { documentIncludes } = require("../../includes/document");

module.exports = async (params) => {
    const { documentWhereObj, tagWhereObj, options, starredUser, page } = { ...params }

    const tagFindResult = await Tag.findAll({
        where: tagWhereObj,
        attributes: ["tagTypeId"],
        raw: true
    }).map((tagObj => {
        return tagObj.tagTypeId
    }))

    const documentFindResult = await Document.findAndCountAll({
        where: { ...documentWhereObj, id: tagFindResult },
        distinct: true,
        include: documentIncludes(),
        ...options
    })

    const { rows, count } = { ...documentFindResult }

    const documentResult = rows.map((documentObj) => {
        const tagTaskArray = documentObj.tagDocumentTask
            .map(e => {
                if (e.tagTask) {
                    return { value: e.tagTask.id, label: e.tagTask.task };
                }
                return;
            })
            .filter(e => {
                return e;
            });
        let resToReturn = {
            ...documentObj.toJSON(),
            tagWorkstream: documentObj.tagDocumentWorkstream.filter(e => { return e.tagWorkstream; }).map(e => { return { value: e.tagWorkstream.id, label: e.tagWorkstream.workstream }; }),
            tagTask: tagTaskArray.length ? tagTaskArray : [],
            tagNote: documentObj.tagDocumentNotes.map(e => { return { value: e.TagNotes.id, label: e.TagNotes.note }; }),
            isStarred: typeof starredUser !== "undefined" && starredUser !== "" && documentObj.document_starred.length > 0 ? documentObj.document_starred[0].isActive : 0,
            isRead: documentObj.document_read.length > 0 ? 1 : 0
        };
        return _.omit(resToReturn, "tagDocumentWorkstream", "tagDocumentTask", "tagDocumentNotes");
    });

    const documentPaginationCount = {
        total_count: count,
        ...(typeof page != "undefined" && page != "" ? { current_page: count > 0 ? _.toNumber(page) : 0, last_page: _.ceil(count / 10) } : {})
    }

    return { count: documentPaginationCount, result: documentResult };
}