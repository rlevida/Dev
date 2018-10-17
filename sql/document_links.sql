DROP TABLE IF EXISTS `document_links`;
CREATE TABLE `document_links` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `documentId` BIGINT,
    `linkType` ENUM("project","workstream","task","conversation"),
    `linkId` BIGINT,
    `dateAdded` DATETIME,
    `dateUpdated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY(`id`)
) ENGINE=INNODB;