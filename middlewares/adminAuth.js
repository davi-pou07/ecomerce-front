function adminAuth(req,res,next){
    if(req.session.usu != undefined){
        // console.log(req.session)
        next()
    }else{
        res.redirect("/login")
    }
}

module.exports = adminAuth