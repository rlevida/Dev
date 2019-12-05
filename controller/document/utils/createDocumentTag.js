const models = require("../../../modelORM");
const { Tag } = models;

module.exports = async (params) => {
    const { projectId, documents, tagWorkstream } = { ...params }
    let documentTags = [];
    documents.forEach((documentObj) => {
        const tagData = tagWorkstream.map(tagObj => {
            return {
                linkType: "workstream",
                linkId: tagObj.value,
                tagType: "document",
                tagTypeId: documentObj.id,
                projectId: projectId
            }
        })
        documentTags = [...documentTags, ...tagData]
    })
    return await Tag.bulkCreate(documentTags);
}