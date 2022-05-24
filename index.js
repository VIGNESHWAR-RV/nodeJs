// const express = require("express");

import express from "express";
import {MongoClient,ObjectId} from "mongodb";
import dotenv from "dotenv";
import jwt from "jsonwebtoken"
import cors from "cors";
dotenv.config();

const app = express();
const PORT = process.env.PORT;

app.get("/",(request, response)=>{
    response.send("hello, 🌍20000")
});



//const MONGO_URL = "mongodb://localhost";//default port

const MONGO_URL = process.env.MONGO_URL
async function createConnection(){
    const client = new MongoClient(MONGO_URL);
    await client.connect();
    console.log("mongo is connected");
    return client;
}
const client = await createConnection();

app.use(express.json()); //middleWare

app.use(cors());

export const user_auth = (request,response,next)=>{
    try{
    if(request.header("user_auth")){
        const token = request.header("user_auth");
        jwt.verify(token, process.env.SECRET_KEY,async(err,decoded)=>{
            if(err || !decoded.id){
                // console.log(err);
                return response.status(406).send({message:"unAuthorized Access"});
            }
            else{
                // console.log(decoded.id);
                let user = await client.db("FirstDB").collection("reviewUsers").findOne({_id:ObjectId(decoded.id)});
                if(user){
                    // console.log(user);
                    request.params.user = user;
                    next();
                }
                else{
                   return response.status(406).send({message:"unauthorized Access"});
                }
            }
          });
    }else{

        return response.status(404).send({message:"Invalid request"});
    }
}
    catch(err){
         console.log(err);
         return  response.status(406).send({error:err.message})
    }
}

  app.post("/login",async(request,response)=>{

      try{

        const {email,googleId,userName,name,imageUrl} = request.body;

        if(userName){
              const isExistingUser = await client.db("FirstDB")
                                                 .collection("reviewUsers")
                                                 .findOne({email,userName});

              if(isExistingUser){

                const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY)

                return response.send({token});
                    
              }else{

                return response.status(404).send({message:"no such user exists"});
              }
        }

        if(googleId){

              const isExistingUser = await client.db("FirstDB")
                                                 .collection("reviewUsers")
                                                 .findOne({email,googleId});
            
              if(isExistingUser){

                const token = jwt.sign({ id: isExistingUser._id }, process.env.SECRET_KEY)

                return response.send({token});
                 
              }
              else{
                    // create an user
                    let newUserName = "";

                    const result = await client.db("FirstDB")
                                          .collection("reviewUsers")
                                          .insertOne({email,userName:newUserName,name,imageUrl,googleId});

                    if(result){
    
                        const user = await client.db("FirstDB")
                                                 .collection("reviewUsers")
                                                 .findOne({email,name,googleId});
    
                        if(user){
    
                            const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY)
    
                            return response.send({token});
                             
                        }
                        else{
                            return response.status(400).send({message:"Couldn't process the request , please try again"});
                        }
    
                    }
                    else{
                        return response.status(400).send({message:"Couldn't process the request , please try again"});
                    }
                
              }
        }
           
        return response.status(404).send({message:"invalid request"});
      }
      catch(e){
          console.log(e.message);
          return response.status(500).send({message:"something went wrong , please try again later"});
      }
  });

  app.post("/signup",async(request,response)=>{
     
       try{

          const {email,name,imageUrl,googleId} = request.body;

          if(email && name && googleId === undefined){
            
                const newUserName = name+Date.now().toString().split("").reverse().join("").slice(0,6);

                const result =  await client.db("FirstDB")
                                            .collection("reviewUsers")
                                            .insertOne({email,userName:newUserName,name,imageUrl:"",googleId:""});

                if(result){

                    const user = await client.db("FirstDB")
                                             .collection("reviewUsers")
                                             .findOne({email,userName:newUserName,name});

                        

                    if(user){

                        const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY)

                        return response.send({token});
    
                    }
                    else{
                        return response.status(400).send({message:"Couldn't process the request , please try again"});
                    }
                     
                }
                else{
                    return response.status(400).send({message:"Couldn't process the request , please try again"});
                }
          }
          else if(email,name,imageUrl,googleId){
               
               const userName="";

               const result = await client.db("FirstDB")
                                          .collection("reviewUsers")
                                          .insertOne({email,userName,name,imageUrl,googleId});

                if(result){

                    const user = await client.db("FirstDB")
                                             .collection("reviewUsers")
                                             .findOne({email,name,googleId});

                    if(user){

                        const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY)

                        return response.send({token});
                         
                    }
                    else{
                        return response.status(400).send({message:"Couldn't process the request , please try again"});
                    }

                }
                else{
                    return response.status(400).send({message:"Couldn't process the request , please try again"});
                }
                
             
          }

       }
       catch(e){
           console.log(e.message);
           return response.status(500).send({message:"something went wrong , please try again later"});
       }

  });

    //GET MOVIE WITH FILTERS IN REQUEST
  app.get("/movies",user_auth,async(req,res)=>{

      const queries = req.query;
      if(queries.rating){
          queries.rating = +queries.rating;
      }
      let filteredMovies = await client.db("FirstDB").collection("movies").find(queries).sort({id:1}).toArray();

       
       res.send(filteredMovies);
  })

     //GET MOVIE WITH ID
  app.get("/movies/:id",user_auth,async(request,response)=>{

      try{
          const user = request.params.user; 
          const id = request.params.id;
          if(user && id){
              const movie = await client.db("FirstDB")
                                  .collection("movies")
                                  .findOne({id});
              if(movie){
                //   console.log(user._id.toString());
                  const userReview = movie.reviews.filter((review)=>review._id === user._id.toString());
                //   console.log(userReview);
                  if(userReview.length > 0){
                    return  response.send({...movie,userReview:userReview[userReview.length - 1].text});
                  }else{
                    return response.send({...movie,userReview:""});
                  }
              }
              else{
                  return response.status(400).send({message:"error while getting the movie , please try again later"});
              }
         }    
      }
      catch(e){
          console.log(e.message);
          return response.status(500).send({message:"error while getting the movie data , please try again later"})
      }
  });


     //ADD NEW MOVIEs
  app.post("/movies",async(request,response)=>{
     const newMovies = request.body;
     
     const result = await client.db("FirstDB")
                                .collection("movies")
                                .insertMany(newMovies);
   
     response.send(result);
     console.log("addedd");
   });

   app.post("/movie/add",user_auth,async(request,response)=>{

      try{
        const newMovie = request.body;

        if(newMovie){
             const result = await client.db("FirstDB")
                                 .collection("movies")
                                 .insertOne({...newMovie,reviews:[]});
 
             if(result){
                  return response.send({message:"succesfully added the movie"});
             }else{
                 return response.status(400).send({message:"error while adding a movie, please try again"});
             }
        }
      }catch(e){
          console.log(e.message);
          return response.status(500).send({message:"error while adding a movie , please try again later"});
      }

   });


   //EDIT A MOVIE WITH ID
   app.put(`/movies/:id`,user_auth,async(request,response)=>{

      try{
        const id = request.params.id;
        const {user} = request.params;
        const { userReview } = request.body;
 
         if( user && userReview){
            
             const review = {_id:user._id.toString(),userName:user.name,text:userReview}
             
             const existingMovie = await client.db("FirstDB")
                                        .collection("movies")
                                        .findOne({id:id});


             if(existingMovie){


                const existingReview = existingMovie.reviews.filter((review) => review._id === user._id.toString())

                // console.log(existingReview);
                if(existingReview.length > 0){

                         const removed = await client.db("FirstDB")
                                            .collection("movies")
                                            .updateOne({id:id},{$pull:{reviews:{_id:user._id.toString(),userName:user.name}}});

                         const added = client.db("FirstDB")
                                                .collection("movies")
                                                .updateOne({id:id},{$push:{reviews:review}});
        
                        if(removed && added){
                              return response.send({message:"successfully updated the review"});
                        }
                        else{
                            return response.status(400).send({message:"couldnt update the review,Please try again"});
                        }

                }else{

                        const result = await client.db("FirstDB")
                                                   .collection("movies")
                                                   .updateOne({id:id},{$push:{reviews:review}});
            
                        if(result){
                            return response.send({message:"successfully added the review"});
                        }else{
                            return response.status(400).send({message:"couldnt update the review,Please try again"});
                        }

                }

             }

                
         }
      }
      catch(e){
          console.log(e.message);
          return res.status(500).send({message:"error while updating the review"});
      }

    //    const EditMovie = request.body;
    //    const result = await client.db("FirstDB")
    //                             .collection("movies")
    //                             .updateOne({id:id},{$set:EditMovie});
    //    response.send(result);
    //    console.log("edited");
   });

   
   //DELETE A MOVIE OR MOVIES
   app.delete("/movies/:id",async(req,res)=>{
       const id = req.params.id;
       const result = await client.db("FirstDB").collection("movies").deleteOne({id:id})
       res.send(result);
       console.log("deleted");
   });

   //DELETE MOVIES
   app.delete("/movies",async(req,res)=>{
    const id = req.params.id;
    const result = await client.db("FirstDB").collection("movies").deleteMany({})
    res.send(result);
    console.log("deleted");
    });

  

app.listen(PORT,()=> console.log("server started at ", PORT));


// Object.keys({"We":"Me"}) gives ["We"]
// Object.entries({"We":"Me"}) gives [["We","Me"]]

// if(rating){
//     filteredMovies = filteredMovies.filter(mv=>mv.rating === +rating);
// }

// toArray() --- removes cursor(pagination) of mongoDB and gives array of the required data