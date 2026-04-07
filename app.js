let logs = JSON.parse(localStorage.getItem("logs")) || [];
let vault = JSON.parse(localStorage.getItem("vault")) || [];
let preloadedFoods = []; 
const THIRTY_DAYS = 30;
let selectedDay = new Date().toISOString().split("T")[0];
let dailyChart, trendChart;

// Load preloaded foods from JSON first
fetch("foods.json")
  .then(res => res.json())
  .then(data => {
    preloadedFoods = data;
    initAutocomplete();
  })
  .catch(err => console.error("Failed to load foods.json:", err));

// ---- Autocomplete ----
function initAutocomplete() {
  const input = document.getElementById("foodInput");
  const suggestionsDiv = document.getElementById("suggestions");

  input.addEventListener("input", function() {
    const query = this.value.trim().toLowerCase();
    suggestionsDiv.innerHTML = "";
    if (!query) return;

    const combined = [...vault, ...preloadedFoods];
    const matches = combined.filter(f => f.name.toLowerCase().includes(query)).slice(0, 10);

    matches.forEach(food => {
      const div = document.createElement("div");
      div.className = "suggestion-item";
      div.innerText = food.name;
      div.onclick = () => {
        input.value = food.name;
        suggestionsDiv.innerHTML = "";
      };
      suggestionsDiv.appendChild(div);
    });
  });
}

// ---- Add Food ----
function addFood() {
  const foodName = document.getElementById("foodInput").value.trim();
  const grams = parseFloat(document.getElementById("gramInput").value);
  if (!foodName || !grams || grams <= 0) { alert("Enter valid food & grams."); return; }

  const custom = vault.find(f => f.name.toLowerCase() === foodName.toLowerCase());
  const pre = preloadedFoods.find(f => f.name.toLowerCase() === foodName.toLowerCase());
  const foodSource = custom || pre;

  if (!foodSource) { alert("Food not found in vault or preloaded list."); return; }

  const calories = (foodSource.calories / 100) * grams;
  const protein = (foodSource.protein / 100) * grams;

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const time = now.toTimeString().split(" ")[0].slice(0,5);

  logs.push({date: today, time, food: foodName, grams, calories, protein});
  logs = logs.filter(log => (new Date() - new Date(log.date))/(1000*60*60*24) <= THIRTY_DAYS);
  localStorage.setItem("logs", JSON.stringify(logs));

  selectedDay = today;
  renderTabs();
  renderDay(selectedDay);
  renderDailyGraph();
  renderTrendGraph();

  document.getElementById("foodInput").value = "";
  document.getElementById("gramInput").value = "";
}

// ---- Tabs / Logs ----
function renderTabs() {
  const tabs = document.getElementById("dayTabs");
  tabs.innerHTML = "";
  const dates = [...new Set(logs.map(l => l.date))].sort((a,b)=>new Date(b)-new Date(a));
  dates.forEach(date => {
    const tab = document.createElement("div");
    tab.className = "day-tab" + (date===selectedDay ? " active" : "");
    tab.innerText = date;
    tab.onclick = () => { selectedDay = date; renderDay(date); renderTabs(); renderDailyGraph(); };
    tabs.appendChild(tab);
  });
}

function renderDay(day) {
  const dayLogs = logs.filter(l => l.date === day);
  const totalCalories = dayLogs.reduce((sum,l) => sum + l.calories, 0);
  const totalProtein = dayLogs.reduce((sum,l) => sum + l.protein, 0);

  document.getElementById("calories").innerText = Math.round(totalCalories);
  document.getElementById("protein").innerText = totalProtein.toFixed(1);

  const foodList = document.getElementById("foodList");
  foodList.innerHTML = "";
  dayLogs.forEach(log => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${log.food} - ${log.grams}g → ${Math.round(log.calories)} cal, ${log.protein.toFixed(1)}g protein (${log.time})</span>`;
    const delBtn = document.createElement("button");
    delBtn.className = "delete-btn"; delBtn.innerText = "Delete";
    delBtn.onclick = () => { deleteEntry(log); };
    li.appendChild(delBtn);
    foodList.appendChild(li);
  });
}

function deleteEntry(entry) {
  logs = logs.filter(l => !(l.date===entry.date && l.time===entry.time && l.food===entry.food));
  localStorage.setItem("logs", JSON.stringify(logs));
  renderTabs(); renderDay(selectedDay); renderDailyGraph(); renderTrendGraph();
}

// ---- Daily Graph (Line Graph) ----
function renderDailyGraph() {
  const dayLogs = logs.filter(l => l.date === selectedDay);
  const totalCalories = dayLogs.reduce((sum,l) => sum + l.calories, 0);
  const totalProtein = dayLogs.reduce((sum,l) => sum + l.protein, 0);

  if(dailyChart) dailyChart.destroy();
  const ctx = document.getElementById("dailyGraph").getContext("2d");
  dailyChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ["Calories", "Protein"],
      datasets: [{
        label: "Totals",
        data: [totalCalories, totalProtein],
        borderColor: '#ff6600',
        backgroundColor: 'rgba(255,102,0,0.2)',
        fill: true,
        tension: 0.3
      }]
    },
    options: { responsive:true, scales:{y:{beginAtZero:true}} }
  });
}

// ---- 30-Day Trend (Line Graph) ----
function renderTrendGraph() {
  const dates = [...new Set(logs.map(l => l.date))].sort();
  const caloriesData = dates.map(d => logs.filter(l=>l.date===d).reduce((sum,l)=>sum+l.calories,0));
  const proteinData = dates.map(d => logs.filter(l=>l.date===d).reduce((sum,l)=>sum+l.protein,0));

  if(trendChart) trendChart.destroy();
  const ctx = document.getElementById("trendGraph").getContext("2d");
  trendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dates,
      datasets:[
        {label:'Calories', data: caloriesData, borderColor:'#ff6600', backgroundColor:'rgba(255,102,0,0.2)', fill:true, tension:0.3},
        {label:'Protein', data: proteinData, borderColor:'#33cc33', backgroundColor:'rgba(51,204,51,0.2)', fill:true, tension:0.3}
      ]
    },
    options:{responsive:true, scales:{y:{beginAtZero:true}}}
  });
}