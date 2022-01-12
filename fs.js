const fs = require("fs");

// fs.readFile("./fs.txt","utf-8",(err,data)=>{
//     console.log(data);
// })

const [,,num]=process.argv;
const quote = "Live more, worry less";
for(let i=1;i<=num;i++){
fs.writeFile(`./backup/quote-${i}`,quote,(err)=>{
    console.log("completed");
})
}
// const addQuote = "\nNode Is Awesome";
// fs.appendFile("./fs.txt",addQuote,(err)=>{
//     console.log("added File");
// })

// fs.readdir("./backup",(err,data)=>{
//     console.log(data);
// });

fs.readdir('./backup',(err,files)=>{
if(err){
    console.log(err);
}
for(let file of files){
    fs.rm(`./backup/${file}`,(err)=>{
        console.log("deleted");
    })
}
});
