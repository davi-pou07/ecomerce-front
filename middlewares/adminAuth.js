function adminAuth(req,res,next){
    if(req.session.cli != undefined){
        // console.log(req.session)
        next()
    }else{
        res.redirect("/login")
    }
}

module.exports = adminAuth