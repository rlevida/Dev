var express = require("express");
var router = express();

router.get("/", (req, res, next) => {
    let controller = global.initController("termsAndConditions");
    try {
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
})

router.post("/", (req, res, next) => {
    try {
        let controller = global.initController("termsAndConditions");
        controller.post.user(req, c => {
            if (c.status) {
                res.send(c);
            } else {
                res.status(400).send({ message: c.error });
            }
        });
    } catch (err) {
        console.error(err);
        res.status(400).send({ error: "Not Found!" });
    }
});



module.exports = router;