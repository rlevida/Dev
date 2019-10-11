var express = require("express");
var router = express();
const models = require("../modelORM");
var path = require("path");
const { Projects, Document, Session, Members, Users, UsersRole, Roles } = models;

(async = require("async")), (_ = require("lodash"));

/**
 * Middleware
 *
 */

router.use(function(req, res, next) {
    let token = req.body.Token ? req.body.Token : req.params.Token ? req.params.Token : req.query.Token ? req.query.Token : req.cookies["app.sid"] ? req.cookies["app.sid"] : "";
    try {
        Session.findOne({
            where: { session: token },
            include: [
                {
                    model: Users,
                    as: "user",
                    include: [
                        {
                            model: Members,
                            as: "user_projects",
                            where: { usersType: "users", linkType: "project" },
                            required: false,
                            include: [
                                {
                                    model: Projects,
                                    as: "memberProject",
                                    required: true,
                                    where: { isDeleted: 0, isActive: 1 }
                                }
                            ]
                        },
                        {
                            model: UsersRole,
                            as: "user_role",
                            include: [
                                {
                                    model: Roles,
                                    as: "role"
                                }
                            ]
                        }
                    ]
                }
            ]
        }).then(ret => {
            if (ret) {
                req.user = ret.toJSON().user;
                req.query.auth = {};
                req.query.auth.yourToken = token;
                req.query.auth.userId = ret.toJSON().userId;
                req.query.auth.LastLoggedIn = ret.toJSON().date_updated;
                Session.update({ dateUpdated: new Date() }, { where: { id: ret.toJSON().id } }).then(updateRes => {
                    next();
                });
            } else {
                res.status(401).send({ error: "Unauthorized", error_description: "Unauthorized Access" });
            }
        });
    } catch (err) {
        console.error(err);
    }
});

/**
 * GET
 *
 */

router.get("/downloadDocument", (req, res, next) => {
    var fs = global.initRequire("fs"),
        AWS = global.initAWS(),
        s3 = new AWS.S3();

    let fileName = req.query.fileName;
    let origin = req.query.origin;
    let fileStream = fs.createWriteStream(`${origin}`);
    s3.getObject(
        {
            Bucket: global.AWSBucket,
            Key: global.environment + "/upload/" + fileName
        },
        (err, data) => {
            if (err) {
                console.log("Error in Uploading to AWS. [" + err + "]");
            } else {
                fileStream.write(data.Body);
                res.download(`${origin}`, `${origin}`, c => {
                    fs.unlink(`${origin}`, t => {});
                });
                fileStream.end();
            }
        }
    );
});

router.get("/downloadFolder", (req, res, next) => {
    var fs = global.initRequire("fs"),
        AWS = global.initAWS();
    let parentDirectory = `${req.query.folderName}`;
    let allPath = [];

    var s3 = new AWS.S3();
    allPath.push(parentDirectory);

    fs.mkdir(parentDirectory, function(e) {
        var getFolderDocument = folderId => {
            let currentPath = [];
            Document.findAll({
                where: { folderId: folderId, isDeleted: 0, isArchived: 0, isActive: 1 },
                include: [
                    {
                        model: Document,
                        as: "document_folder",
                        where: { type: "folder" },
                        required: false
                    }
                ]
            }).then(ret => {
                async.map(
                    ret,
                    (e, mapCallback) => {
                        if (e.type == "document") {
                            let fileStream = fs.createWriteStream(
                                `${
                                    allPath.filter(d => {
                                        return d.slice(d.lastIndexOf("/") + 1) === `${e.document_folder.origin}${e.document_folder.documentNameCount > 0 ? `(${e.document_folder.documentNameCount})` : ""}`;
                                    })[0]
                                }/${e.origin}${e.documentNameCount > 0 ? `(${e.documentNameCount})` : ""}`
                            );
                            s3.getObject(
                                {
                                    Bucket: global.AWSBucket,
                                    Key: global.environment + "/upload/" + e.name
                                },
                                (err, data) => {
                                    if (err) {
                                        console.error("Error in Uploading to AWS. [" + err + "]");
                                    } else {
                                        fileStream.write(data.Body);
                                        fileStream.end();
                                        mapCallback(null);
                                    }
                                }
                            );
                        }
                        if (e.type == "folder") {
                            let directory = `${
                                allPath.filter(d => {
                                    return d.slice(d.lastIndexOf("/") + 1) === `${e.document_folder.origin}${e.document_folder.documentNameCount > 0 ? `(${e.document_folder.documentNameCount})` : ""}`;
                                })[0]
                            }/${e.origin}${e.documentNameCount > 0 ? `(${e.documentNameCount})` : ""}`;
                            currentPath.push(directory);
                            fs.mkdir(directory, function(e) {
                                mapCallback(null);
                            });
                        }
                    },
                    () => {
                        let child = ret
                            .filter(e => {
                                return e.type == "folder";
                            })
                            .map(e => {
                                return e.id;
                            });
                        if (child.length > 0) {
                            allPath = currentPath;
                            getFolderDocument(child);
                        } else {
                            const folderPath = path.join(__dirname, "../");
                            var zipFolder = require("zip-folder");

                            zipFolder(`${folderPath}${parentDirectory}`, `${folderPath}${parentDirectory}.zip`, function(err) {
                                if (err) {
                                    console.error("oh no!", err);
                                } else {
                                    res.download(`${folderPath}${parentDirectory}.zip`, `${folderPath}${parentDirectory}.zip`, c => {
                                        fs.unlink(`${folderPath}${parentDirectory}.zip`, t => {});
                                        var deleteFolderRecursive = function(path) {
                                            // remove temp files
                                            if (fs.existsSync(path)) {
                                                fs.readdirSync(path).forEach(function(file, index) {
                                                    var curPath = path + "/" + file;
                                                    if (fs.lstatSync(curPath).isDirectory()) {
                                                        // recurse
                                                        deleteFolderRecursive(curPath);
                                                    } else {
                                                        // delete file
                                                        fs.unlinkSync(curPath);
                                                    }
                                                });
                                                fs.rmdirSync(path);
                                            }
                                        };
                                        deleteFolderRecursive(`${folderPath}${parentDirectory}`);
                                    });
                                }
                            });
                        }
                    }
                );
            });
        };
        getFolderDocument(req.query.folder);
    });
});

router.get("/:controller", (req, res, next) => {
    if (!req.params.controller) {
        res.status(400).send("Page Not found.");
        return;
    }
    try {
        let controller = global.initController(req.params.controller);
        controller.get.index(req, c => {
            if (c.status) {
                res.send(c.data);
            } else {
                res.status(400).send({ message: c.error });
            }
        });
    } catch (err) {
        console.error(err);
        res.status(400).send({ error: "Not Found!" });
    }
});

router.get("/:controller/detail/:id", (req, res, next) => {
    if (!req.params.controller) {
        res.status(400).send("Page Not found.");
        return;
    }
    if (!req.params.id) {
        res.status(400).send("Id is requird.");
        return;
    }
    try {
        let controller = global.initController(req.params.controller);
        controller.get.getById(req, c => {
            if (c.status) {
                res.send(c.data);
            } else {
                res.status(400).send({ message: c.error });
            }
        });
    } catch (err) {
        console.error(err);
        res.status(400).send({ error: "Not Found!" });
    }
});
router.get("/:controller/:action", (req, res, next) => {
    if (!req.params.controller || !req.params.action) {
        res.status(400).send("Page Not found.");
        return;
    }
    try {
        let controller = global.initController(req.params.controller);
        controller.get[req.params.action](req, c => {
            if (c.status) {
                res.send(c.data);
            } else {
                res.status(400).send({ message: c.error });
            }
        });
    } catch (err) {
        console.error(err);
        res.status(400).send({ error: "Not Found!" });
    }
});

router.post("/:controller", (req, res, next) => {
    if (!req.params.controller) {
        res.status(400).send("Page Not found.");
        return;
    }
    try {
        let controller = global.initController(req.params.controller);
        controller.post.index(req, c => {
            if (c.status) {
                res.send(c.data);
            } else {
                res.status(400).send({ message: c.error });
            }
        });
    } catch (err) {
        console.error(err);
        res.status(400).send({ error: "Not Found!" });
    }
});

router.post("/:controller/:action", (req, res, next) => {
    if (!req.params.controller || !req.params.action) {
        res.status(400).send("Page Not found.");
        return;
    }
    try {
        let controller = global.initController(req.params.controller);
        controller.post[req.params.action](req, c => {
            if (c.status) {
                res.send(c.data);
            } else {
                res.status(400).send({ message: c.error });
            }
        });
    } catch (err) {
        console.error(err);
        res.status(400).send({ error: "Not Found!" });
    }
});

router.put("/:controller/:id", (req, res, next) => {
    if (!req.params.controller) {
        res.status(400).send("Page Not found.");
        return;
    }
    if (!req.params.id) {
        res.status(400).send("Id is requird.");
        return;
    }
    try {
        let controller = global.initController(req.params.controller);
        controller.put.index(req, c => {
            if (c.status) {
                res.send(c.data);
            } else {
                res.status(400).send({ message: c.error });
            }
        });
    } catch (err) {
        console.error(err);
        res.status(400).send({ error: "Not Found!" });
    }
});

router.put("/:controller/:action/:id", (req, res, next) => {
    if (!req.params.controller || !req.params.action) {
        res.status(400).send("Page Not found.");
        return;
    }
    if (!req.params.id) {
        res.status(400).send("Id is requird.");
        return;
    }
    try {
        let controller = global.initController(req.params.controller);
        controller.put[req.params.action](req, c => {
            if (c.status) {
                res.send(c.data);
            } else {
                res.status(400).send({ message: c.error });
            }
        });
    } catch (err) {
        res.status(400).send({ error: "Not Found!" });
    }
});

router.delete("/:controller/:id", (req, res, next) => {
    if (!req.params.controller) {
        res.status(400).send("Page Not found.");
        return;
    }
    if (!req.params.id) {
        res.status(400).send("Id is requird.");
        return;
    }
    try {
        let controller = global.initController(req.params.controller);
        controller.delete.index(req, c => {
            if (c.status) {
                res.send(c.data);
            } else {
                res.status(400).send({ message: c.error });
            }
        });
    } catch (err) {
        res.status(400).send({ error: "Not Found!" });
    }
});

router.delete("/:controller/:action/:id", (req, res, next) => {
    if (!req.params.controller || !req.params.action) {
        res.status(400).send("Page Not found.");
        return;
    }
    if (!req.params.id) {
        res.status(400).send("Id is requird.");
        return;
    }
    try {
        let controller = global.initController(req.params.controller);
        controller.delete[req.params.action](req, c => {
            if (c.status) {
                res.send(c.data);
            } else {
                res.status(400).send({ message: c.error });
            }
        });
    } catch (err) {
        res.status(400).send({ error: "Not Found!" });
    }
});

module.exports = router;
