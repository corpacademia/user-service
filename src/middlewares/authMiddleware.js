const jwt = require('jsonwebtoken');

const verifyToken = async(req,res,next)=>{
    try {
        
        const token = req.cookies.session_token;
        if(!token){
            return res.status(401).send({message:"Access is denied , No token is found"})
        }
    
        //verify token
        const verified = jwt.verify(token,process.env.SECRET_KEY);
        req.user=verified;
        next();

    } catch (error) {
        return res.status(403).send({
            message:"Invalid or Expired Token.."
        })
    }
}

module.exports = verifyToken;