require("dotenv").config();
const app = require("./src/app");
const PORT = process.env.PORT || 3001;

app.listen(PORT, (err) => {
  if(err){
    console.log("Error starting user-service at PORT:",PORT);
  }
  else{
    console.log(`Users Service running on port ${PORT}`);
  }
  
});