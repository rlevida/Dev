var express = require('express');
var router = express();
const models = require('../modelORM');
const {
    Session
} = models;

router.use(function (req, res, next) {
    try {
        Session
            .findOne({ where: { session: req.cookies["app.sid"] } })
            .then((ret) => {
                if (ret) {
                    Session
                        .update({ dateUpdated: new Date() }, { where: { id: ret.toJSON().id } })
                        .then((updateRes) => {
                            req.userDetails = ret.toJSON();
                            next();
                        })
                } else {
                    res.redirect('/auth');
                }
            })
    } catch (err) {
        console.error(err)
    }
});

router.get('/', function (req, res, next) {
    if (req.userDetails.users_userType != "External") {
        res.render('project', {
            title: global.site_name,
            page: 'project',
            subpage: '',
            project: "",
            body: "./template/index",
            user: JSON.stringify(req.userDetails.data)
        });
    } else {
        let members = global.initModel("members")
        members.getData("members", { userTypeLinkId: req.userDetails.usersId, linkType: "project" }, {}, (c) => {
            if (c.status) {
                if (c.data.length) {
                    if (c.data.length > 1) {
                        res.render('project', {
                            title: global.site_name,
                            page: 'project',
                            subpage: '',
                            project: "",
                            body: "./template/index",
                            user: JSON.stringify(req.userDetails.data)
                        });
                    } else {
                        res.redirect(`/project/${c.data[0].linkId}`);
                    }
                }
            } else {
                if (c.error) { socket.emit("RETURN_ERROR_MESSAGE", { message: c.error.sqlMessage }) }
            }
        })
    }
});

router.get('/:project', function (req, res, next) {
    if (typeof req.params != "undefined" && typeof req.params.project != "undefined") {
        const func = global.initFunc();
        const userRole = JSON.parse(req.userDetails.data).userRole;
        if (userRole != 5 && userRole != 6) {
            res.render('project', {
                title: global.site_name,
                page: 'project',
                subpage: 'home',
                body: "./template/index",
                project: req.params.project,
                user: JSON.stringify(req.userDetails.data)
            });
        } else {
            func.getUserAllowedAccess({ userId: req.userDetails.usersId, params: req.params.project }, resp => {
                if (resp.status) {
                    res.render('project', {
                        title: global.site_name,
                        page: 'project',
                        subpage: 'home',
                        body: "./template/index",
                        project: req.params.project,
                        user: JSON.stringify(req.userDetails.data)
                    });
                } else {
                    res.render('index', {
                        title: global.site_name + " - pageNotAvailable",
                        body: './template/index',
                        page: 'pageNotAvailable',
                        user: JSON.stringify(req.userDetails.data)
                    });
                }
            })
        }
    }
});

router.get('/:project/documents', function (req, res, next) {
    if (typeof req.params != "undefined" && typeof req.params.project != "undefined") {
        const func = global.initFunc();
        const userRole = JSON.parse(req.userDetails.data).userRole;
        if (userRole != 5 && userRole != 6) {
            res.render('project', {
                title: global.site_name,
                page: 'project',
                subpage: 'documents',
                body: "./template/index",
                project: req.params.project,
                folder: req.query.folder,
                folderType: req.query.type,
                folderStatus: req.query.status,
                folderOrigin: req.query.origin,
                user: JSON.stringify(req.userDetails.data)
            });
        } else {
            func.getUserAllowedAccess({ userId: req.userDetails.usersId, params: req.params.project }, resp => {
                if (resp.status) {
                    res.render('project', {
                        title: global.site_name,
                        page: 'project',
                        subpage: 'documents',
                        body: "./template/index",
                        project: req.params.project,
                        folder: req.query.folder,
                        folderType: req.query.type,
                        folderStatus: req.query.status,
                        folderOrigin: req.query.origin,
                        user: JSON.stringify(req.userDetails.data)
                    });
                } else {
                    res.render('index', {
                        title: global.site_name + " - pageNotAvailable",
                        body: './template/index',
                        page: 'pageNotAvailable',
                        user: JSON.stringify(req.userDetails.data)
                    });
                }
            })
        }
    }
});

router.get('/:project/documents/:document', function (req, res, next) {
    if (typeof req.params != "undefined" && typeof req.params.project != "undefined") {
        const func = global.initFunc();
        const userRole = JSON.parse(req.userDetails.data).userRole;
        if (userRole != 5 && userRole != 6) {
            res.render('project', {
                title: global.site_name,
                page: 'project',
                subpage: 'documents',
                body: "./template/index",
                project: req.params.project,
                folder: req.query.folder,
                folderType: req.query.type,
                folderStatus: req.query.status,
                folderOrigin: req.query.origin,
                documentId: req.params.document,
                user: JSON.stringify(req.userDetails.data)
            });
        } else {
            func.getUserAllowedAccess({ userId: req.userDetails.usersId, params: req.params.project }, resp => {
                if (resp.status) {
                    res.render('project', {
                        title: global.site_name,
                        page: 'project',
                        subpage: 'documents',
                        body: "./template/index",
                        project: req.params.project,
                        folder: req.query.folder,
                        folderType: req.query.type,
                        folderStatus: req.query.status,
                        folderOrigin: req.query.origin,
                        documentId: req.params.document,
                        user: JSON.stringify(req.userDetails.data)
                    });
                } else {
                    res.render('index', {
                        title: global.site_name + " - pageNotAvailable",
                        body: './template/index',
                        page: 'pageNotAvailable',
                        user: JSON.stringify(req.userDetails.data)
                    });
                }
            })
        }
    }
});

router.get('/:project/trash', function (req, res, next) {
    if (typeof req.params != "undefined" && typeof req.params.project != "undefined") {
        const func = global.initFunc();
        const userRole = JSON.parse(req.userDetails.data).userRole;
        if (userRole != 5 && userRole != 6) {
            res.render('project', {
                title: global.site_name + " - Trash",
                body: './template/index',
                page: 'project',
                subpage: 'trash',
                project: req.params.project,
                user: JSON.stringify(req.userDetails.data)
            });
        } else {
            func.getUserAllowedAccess({ userId: req.userDetails.usersId, params: req.params.project }, resp => {
                if (resp.status) {
                    res.render('project', {
                        title: global.site_name + " - Trash",
                        body: './template/index',
                        page: 'project',
                        subpage: 'trash',
                        project: req.params.project,
                        user: JSON.stringify(req.userDetails.data)
                    });
                } else {
                    res.render('index', {
                        title: global.site_name + " - pageNotAvailable",
                        body: './template/index',
                        page: 'pageNotAvailable',
                        user: JSON.stringify(req.userDetails.data)
                    });
                }
            })
        }
    }
});

router.get('/:project/workstream', function (req, res, next) {
    if (typeof req.params != "undefined" && typeof req.params.project != "undefined") {
        const func = global.initFunc();
        const userRole = JSON.parse(req.userDetails.data).userRole;
        if (userRole != 5 && userRole != 6) {
            res.render('project', {
                title: global.site_name + " - Workstream",
                body: './template/index',
                page: 'project',
                subpage: 'workstream',
                project: req.params.project,
                user: JSON.stringify(req.userDetails.data)
            });
        } else {
            func.getUserAllowedAccess({ userId: req.userDetails.usersId, params: req.params.project }, resp => {
                if (resp.status) {
                    res.render('project', {
                        title: global.site_name + " - Workstream",
                        body: './template/index',
                        page: 'project',
                        subpage: 'workstream',
                        project: req.params.project,
                        user: JSON.stringify(req.userDetails.data)
                    });
                } else {
                    res.render('index', {
                        title: global.site_name + " - pageNotAvailable",
                        body: './template/index',
                        page: 'pageNotAvailable',
                        user: JSON.stringify(req.userDetails.data)
                    });
                }
            })
        }
    }
});


router.get('/:project/workstream/:workstream', function (req, res, next) {
    if (typeof req.params != "undefined" && typeof req.params.project != "undefined") {
        let task = (typeof req.query.task != "undefined" ? req.query.task : undefined)
        const func = global.initFunc();
        const userRole = JSON.parse(req.userDetails.data).userRole;
        if (userRole != 5 && userRole != 6) {
            res.render('project', {
                title: global.site_name + " - Workstream",
                body: './template/index',
                page: 'project',
                subpage: 'workstream',
                project: req.params.project,
                workstream: req.params.workstream,
                task: task,
                user: JSON.stringify(req.userDetails.data)
            });
        } else {
            func.getUserAllowedAccess({ userId: req.userDetails.usersId, params: req.params.project }, resp => {
                if (resp.status) {
                    res.render('project', {
                        title: global.site_name + " - Workstream",
                        body: './template/index',
                        page: 'project',
                        subpage: 'workstream',
                        project: req.params.project,
                        workstream: req.params.workstream,
                        task: task,
                        user: JSON.stringify(req.userDetails.data)
                    });
                } else {
                    res.render('index', {
                        title: global.site_name + " - pageNotAvailable",
                        body: './template/index',
                        page: 'pageNotAvailable',
                        user: JSON.stringify(req.userDetails.data)
                    });
                }
            })
        }
    }
});

router.get('/:project/task', function (req, res, next) {
    if (typeof req.params != "undefined" && typeof req.params.project != "undefined") {
        const func = global.initFunc();
        const userRole = JSON.parse(req.userDetails.data).userRole;
        if (userRole != 5 && userRole != 6) {
            res.render('project', {
                title: global.site_name + " - Tasks",
                body: './template/index',
                page: 'project',
                subpage: 'task',
                project: req.params.project,
                user: JSON.stringify(req.userDetails.data)
            });
        } else {
            func.getUserAllowedAccess({ userId: req.userDetails.usersId, params: req.params.project }, resp => {
                if (resp.status) {
                    res.render('project', {
                        title: global.site_name + " - Tasks",
                        body: './template/index',
                        page: 'project',
                        subpage: 'task',
                        project: req.params.project,
                        user: JSON.stringify(req.userDetails.data)
                    });
                } else {
                    res.render('index', {
                        title: global.site_name + " - pageNotAvailable",
                        body: './template/index',
                        page: 'pageNotAvailable',
                        user: JSON.stringify(req.userDetails.data)
                    });
                }
            })
        }
    }
});

router.get('/:project/conversations/:conversations', function (req, res, next) {
    if (typeof req.params != "undefined" && typeof req.params.project != "undefined") {
        const func = global.initFunc();
        const userRole = JSON.parse(req.userDetails.data).userRole;
        if (userRole != 5 && userRole != 6) {
            res.render('project', {
                title: global.site_name + " - Conversations",
                body: './template/index',
                page: 'project',
                subpage: 'conversations',
                project: req.params.project,
                conversationId: req.params.conversations,
                user: JSON.stringify(req.userDetails.data)
            });
        } else {
            func.getUserAllowedAccess({ userId: req.userDetails.usersId, params: req.params.project }, resp => {
                if (resp.status) {
                    res.render('project', {
                        title: global.site_name + " - Conversations",
                        body: './template/index',
                        page: 'project',
                        subpage: 'conversations',
                        project: req.params.project,
                        conversationId: req.params.conversations,
                        user: JSON.stringify(req.userDetails.data)
                    });
                } else {
                    res.render('index', {
                        title: global.site_name + " - pageNotAvailable",
                        body: './template/index',
                        page: 'pageNotAvailable',
                        user: JSON.stringify(req.userDetails.data)
                    });
                }
            })
        }
    }
});

router.get('/:project/conversations', function (req, res, next) {
    if (typeof req.params != "undefined" && typeof req.params.project != "undefined") {
        const func = global.initFunc();
        const userRole = JSON.parse(req.userDetails.data).userRole;
        if (userRole != 5 && userRole != 6) {
            res.render('project', {
                title: global.site_name + " - Conversations",
                body: './template/index',
                page: 'project',
                subpage: 'conversations',
                project: req.params.project,
                user: JSON.stringify(req.userDetails.data)
            });
        } else {
            func.getUserAllowedAccess({ userId: req.userDetails.usersId, params: req.params.project }, resp => {
                if (resp.status) {
                    res.render('project', {
                        title: global.site_name + " - Conversations",
                        body: './template/index',
                        page: 'project',
                        subpage: 'conversations',
                        project: req.params.project,
                        user: JSON.stringify(req.userDetails.data)
                    });
                } else {
                    res.render('index', {
                        title: global.site_name + " - pageNotAvailable",
                        body: './template/index',
                        page: 'pageNotAvailable',
                        user: JSON.stringify(req.userDetails.data)
                    });
                }
            })
        }
    }
});

module.exports = router;
