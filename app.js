let totalCalories = 0;
let totalProtein = 0;
let logs = JSON.parse(localStorage.getItem("logs")) || [];
const THIRTY_DAYS = 30;
let selectedDay = new Date().toISOString().split("T")[0];
let selectedFDCId = null;

// Clean old logs
logs = logs.filter(log => {
  const logDate = new Date(log.date);
  const now = new Date();
  return (now - logDate)/(1000*60*60*24) <= THIRTY_DAYS;
});

// Render tabs and today's data
renderTabs();
renderDay(selectedDay);

// Debounce for suggestions
let debounceTimeout;
document.getElementById("foodInput").addEventListener("input", function() {
    clearTimeout(debounceTimeout);
    const query = this.value.trim();
    if (!query) {
        document.getElementById("suggestions").innerHTML = "";
        return;
    }
    debounceTimeout = setTimeout(() => getSuggestions(query), 300);
});

// Fetch suggestions from USDA
function getSuggestions(query) {
    const API_KEY = "YOUR_USDA_API_KEY"; // Replace
    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=5&api_key=${API_KEY}`;

    fetch(url)
        .then(res => res.json())
        .then(data => {
            const suggestionsDiv = document.getElementById("suggestions");
            suggestionsDiv.innerHTML = "";
            if (!data.foods) return;
            data.foods.forEach(food => {
                const item = document.createElement("div");
                item.className = "suggestion-item";
                item.innerText = food.description;
                item.onclick = () => {
                    document.getElementById("foodInput").value = food.description;
                    selectedFDCId = food.fdcId;
                    suggestionsDiv.innerHTML = "";
                };
                suggestionsDiv.appendChild(item);
            });
        })
        .catch(console.error);
}

// Add food
function addFood() {
    const foodName = document.getElementById("foodInput").value.trim();
    const grams = parseFloat(document.getElementById("gramInput").value);
    if (!foodName || !grams || grams <= 0) {
        alert("Enter valid food and grams.");
        return;
    }

    const API_KEY = "nQkzCqk5jBlJU7xGy1GW4UoNaBvRnygXdDugh5YP"; // Replace
    const searchUrl = selectedFDCId
        ? `https://api.nal.usda.gov/fdc/v1/food/${selectedFDCId}?api_key=${API_KEY}`
        : `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(foodName)}&pageSize=1&api_key=${API_KEY}`;

    fetch(searchUrl)
        .then(res => res.json())
        .then(data => {
            let foodData = data.foodNutrients ? data : data.foods[0]; // handle search or direct fetch

            let caloriesPer100g = 0, proteinPer100g = 0;
            foodData.foodNutrients.forEach(nutrient => {
                const name = nutrient.nutrientName.toLowerCase();
                if (name.includes("energy")) caloriesPer100g = nutrient.value;
                if (name.includes("protein")) proteinPer100g = nutrient.value;
            });

            const calories = (caloriesPer100g/100)*grams;
            const protein = (proteinPer100g/100)*grams;

            const now = new Date();
            const today = now.toISOString().split("T")[0];
            const time = now.toTimeString().split(" ")[0].slice(0,5);

            logs.push({date: today, time, food: foodName, grams, calories, protein, fdcId: foodData.fdcId});
            logs = logs.filter(log => (new Date() - new Date(log.date))/(1000*60*60*24) <= THIRTY_DAYS);
            localStorage.setItem("logs", JSON.stringify(logs));

            selectedDay = today;
            renderTabs();
            renderDay(selectedDay);

            document.getElementById("foodInput").value = "";
            document.getElementById("gramInput").value = "";
            selectedFDCId = null;
        })
        .catch(error => {
            console.error(error);
            alert("Failed to fetch nutrition data.");
        });
}

// Render day tabs
function renderTabs() {
    const dayTabs = document.getElementById("dayTabs");
    dayTabs.innerHTML = "";
    const uniqueDates = [...new Set(logs.map(log => log.date))].sort((a,b) => new Date(b)-new Date(a));
    uniqueDates.forEach(date => {
        const tab = document.createElement("div");
        tab.className = "day-tab" + (date===selectedDay?" active":"");
        tab.innerText = date;
        tab.onclick = () => { selectedDay=date; renderDay(date); renderTabs(); };
        dayTabs.appendChild(tab);
    });
}

// Render logs for selected day
function renderDay(day) {
    const dayLogs = logs.filter(log => log.date === day);
    totalCalories = dayLogs.reduce((sum, log) => sum+log.calories, 0);
    totalProtein = dayLogs.reduce((sum, log) => sum+log.protein, 0);

    document.getElementById("calories").innerText = Math.round(totalCalories);
    document.getElementById("protein").innerText = totalProtein.toFixed(1);

    const foodList = document.getElementById("foodList");
    foodList.innerHTML = "";

    dayLogs.forEach((log,index) => {
        const li = document.createElement("li");
        li.innerHTML = `<span>${log.food} - ${log.grams}g → ${Math.round(log.calories)} cal, ${log.protein.toFixed(1)}g protein (${log.time})</span>`;
        const delBtn = document.createElement("button");
        delBtn.className="delete-btn";
        delBtn.innerText="Delete";
        delBtn.onclick = () => { deleteEntry(log); };
        li.appendChild(delBtn);
        foodList.appendChild(li);
    });
}

// Delete single entry
function deleteEntry(entry) {
    logs = logs.filter(l => !(l.date===entry.date && l.time===entry.time && l.food===entry.food));
    localStorage.setItem("logs", JSON.stringify(logs));
    renderTabs();
    renderDay(selectedDay);
}