var express = require('express');
var jwt = require('jsonwebtoken');
var router = express();

router.use(function (req, res, next) {
    let session = global.initModel("session");
    session.getData("session",{session:req.cookies["app.sid"]},{},(ret)=>{
        if(ret.status && ret.data.length > 0){
            res.redirect('/');
        } else {
            next();
        }
    })
});

router.get('/', function(req, res, next) {
    res.render('auth', {
        title: global.site_name,
        global: global,
        body : "./template/auth",
        page : "auth"
    });
});

module.exports = router;