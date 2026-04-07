const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const USDA_API_KEY = "nQkzCqk5jBlJU7xGy1GW4UoNaBvRnygXdDugh5YP"; // replace with your key

app.get("/api/food-search", async (req,res)=>{
    const query=req.query.query;
    if(!query) return res.status(400).json({error:"Missing query"});
    try{
        const url=`https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&requireAllWords=true&pageSize=5&api_key=${USDA_API_KEY}`;
        const response=await fetch(url);
        const data=await response.json();
        res.json(data);
    }catch(err){
        console.error(err);
        res.status(500).json({error:"Failed to fetch from USDA API"});
    }
});

app.get("/api/food/:fdcId", async (req,res)=>{
    const fdcId=req.params.fdcId;
    if(!fdcId) return res.status(400).json({error:"Missing fdcId"});
    try{
        const url=`https://api.nal.usda.gov/fdc/v1/food/${fdcId}?api_key=${USDA_API_KEY}`;
        const response=await fetch(url);
        const data=await response.json();
        res.json(data);
    }catch(err){
        console.error(err);
        res.status(500).json({error:"Failed to fetch nutrition data"});
    }
});

app.listen(PORT,()=>{console.log(`Server running on http://localhost:${PORT}`);});