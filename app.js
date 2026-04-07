let totalCalories = 0;
let totalProtein = 0;
let logs = JSON.parse(localStorage.getItem("logs")) || [];
const THIRTY_DAYS = 30;
let selectedDay = new Date().toISOString().split("T")[0];
let selectedFDCId = null;

// Charts
let dailyChart, trendChart;

// Remove old logs
logs = logs.filter(log => (new Date() - new Date(log.date))/(1000*60*60*24) <= THIRTY_DAYS);
renderTabs();
renderDay(selectedDay);
renderDailyGraph();
renderTrendGraph();

// Debounce autocomplete
let debounceTimeout;
document.getElementById("foodInput").addEventListener("input", function() {
    clearTimeout(debounceTimeout);
    const query = this.value.trim();
    if (!query) { document.getElementById("suggestions").innerHTML=""; return; }
    debounceTimeout = setTimeout(() => getSuggestions(query), 300);
});

function getSuggestions(query) {
    fetch(`/api/food-search?query=${encodeURIComponent(query)}`)
    .then(res=>res.json())
    .then(data=>{
        const suggestionsDiv = document.getElementById("suggestions");
        suggestionsDiv.innerHTML="";
        if (!data.foods) return;
        data.foods.forEach(food=>{
            const desc = food.brandName ? `${food.description} (${food.brandName})` : food.description;
            const item = document.createElement("div");
            item.className="suggestion-item";
            item.innerText = desc;
            item.onclick = () => {
                document.getElementById("foodInput").value = desc;
                selectedFDCId = food.fdcId;
                suggestionsDiv.innerHTML="";
            };
            suggestionsDiv.appendChild(item);
        });
    })
    .catch(console.error);
}

function addFood() {
    const foodName = document.getElementById("foodInput").value.trim();
    const grams = parseFloat(document.getElementById("gramInput").value);
    if (!foodName || !grams || grams<=0) { alert("Enter valid food & grams."); return; }

    const url = selectedFDCId ? `/api/food/${selectedFDCId}` : `/api/food-search?query=${encodeURIComponent(foodName)}`;

    fetch(url).then(res=>res.json()).then(data=>{
        let foodData = data.foodNutrients ? data : data.foods[0];

        let caloriesPer100g=0, proteinPer100g=0;
        foodData.foodNutrients.forEach(n=>{
            const name=n.nutrientName.toLowerCase();
            if (name.includes("energy")) caloriesPer100g=n.value;
            if (name.includes("protein")) proteinPer100g=n.value;
        });

        const calories=(caloriesPer100g/100)*grams;
        const protein=(proteinPer100g/100)*grams;

        const now=new Date();
        const today=now.toISOString().split("T")[0];
        const time=now.toTimeString().split(" ")[0].slice(0,5);

        logs.push({date:today,time,food:foodName,grams,calories,protein,fdcId:foodData.fdcId});
        logs = logs.filter(log => (new Date() - new Date(log.date))/(1000*60*60*24) <= THIRTY_DAYS);
        localStorage.setItem("logs",JSON.stringify(logs));

        selectedDay = today;
        renderTabs(); renderDay(selectedDay);
        renderDailyGraph(); renderTrendGraph();

        document.getElementById("foodInput").value="";
        document.getElementById("gramInput").value="";
        selectedFDCId=null;
    }).catch(error=>{ console.error(error); alert("Failed to fetch nutrition."); });
}

// Tabs
function renderTabs() {
    const tabs=document.getElementById("dayTabs");
    tabs.innerHTML="";
    const dates=[...new Set(logs.map(l=>l.date))].sort((a,b)=>new Date(b)-new Date(a));
    dates.forEach(date=>{
        const tab=document.createElement("div");
        tab.className="day-tab"+(date===selectedDay?" active":"");
        tab.innerText=date;
        tab.onclick=()=>{ selectedDay=date; renderDay(date); renderTabs(); renderDailyGraph(); };
        tabs.appendChild(tab);
    });
}

// Render logs
function renderDay(day) {
    const dayLogs = logs.filter(l=>l.date===day);
    totalCalories = dayLogs.reduce((sum,l)=>sum+l.calories,0);
    totalProtein = dayLogs.reduce((sum,l)=>sum+l.protein,0);
    document.getElementById("calories").innerText=Math.round(totalCalories);
    document.getElementById("protein").innerText=totalProtein.toFixed(1);

    const foodList=document.getElementById("foodList");
    foodList.innerHTML="";
    dayLogs.forEach(log=>{
        const li=document.createElement("li");
        li.innerHTML=`<span>${log.food} - ${log.grams}g → ${Math.round(log.calories)} cal, ${log.protein.toFixed(1)}g protein (${log.time})</span>`;
        const delBtn=document.createElement("button");
        delBtn.className="delete-btn"; delBtn.innerText="Delete";
        delBtn.onclick=()=>{ deleteEntry(log); };
        li.appendChild(delBtn);
        foodList.appendChild(li);
    });
}

// Delete
function deleteEntry(entry) {
    logs = logs.filter(l=>!(l.date===entry.date && l.time===entry.time && l.food===entry.food));
    localStorage.setItem("logs",JSON.stringify(logs));
    renderTabs(); renderDay(selectedDay);
    renderDailyGraph(); renderTrendGraph();
}

// Daily Graph
function renderDailyGraph() {
    const dayLogs = logs.filter(l=>l.date===selectedDay);
    const labels = dayLogs.map(l=>`${l.food} (${l.time})`);
    const caloriesData = dayLogs.map(l=>Math.round(l.calories));
    const proteinData = dayLogs.map(l=>l.protein.toFixed(1));

    if (dailyChart) dailyChart.destroy();
    const ctx = document.getElementById("dailyGraph").getContext("2d");
    dailyChart = new Chart(ctx,{
        type:'bar',
        data:{
            labels:labels,
            datasets:[
                {label:'Calories', data:caloriesData, backgroundColor:'#ff6600'},
                {label:'Protein (g)', data:proteinData, backgroundColor:'#33cc33'}
            ]
        },
        options:{responsive:true, scales:{y:{beginAtZero:true}}}
    });
}

// 30-Day Trend
function renderTrendGraph() {
    const dates = [...new Set(logs.map(l=>l.date))].sort();
    const caloriesData = dates.map(d=>Math.round(logs.filter(l=>l.date===d).reduce((sum,l)=>sum+l.calories,0)));
    const proteinData = dates.map(d=>logs.filter(l=>l.date===d).reduce((sum,l)=>sum+l.protein,0).toFixed(1));

    if(trendChart) trendChart.destroy();
    const ctx = document.getElementById("trendGraph").getContext("2d");
    trendChart = new Chart(ctx,{
        type:'line',
        data:{
            labels:dates,
            datasets:[
                {label:'Calories', data:caloriesData, borderColor:'#ff6600', backgroundColor:'rgba(255,102,0,0.2)', fill:true},
                {label:'Protein (g)', data:proteinData, borderColor:'#33cc33', backgroundColor:'rgba(51,204,51,0.2)', fill:true}
            ]
        },
        options:{responsive:true, scales:{y:{beginAtZero:true}}}
    });
}