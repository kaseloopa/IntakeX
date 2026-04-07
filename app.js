let totalCalories = 0;
let totalProtein = 0;

let logs = JSON.parse(localStorage.getItem("logs")) || [];
const THIRTY_DAYS = 30;

// Remove logs older than 30 days on load
logs = logs.filter(log => {
  const logDate = new Date(log.date);
  const now = new Date();
  const diffDays = (now - logDate) / (1000 * 60 * 60 * 24);
  return diffDays <= THIRTY_DAYS;
});

// Track selected day (default today)
let selectedDay = new Date().toISOString().split("T")[0];

// Render tabs on load
renderTabs();
renderDay(selectedDay);

function addFood() {
    const foodName = document.getElementById("foodInput").value.trim();
    const grams = parseFloat(document.getElementById("gramInput").value);

    if (!foodName || !grams || grams <= 0) {
        alert("Please enter a valid food and grams.");
        return;
    }

    const API_KEY = "nQkzCqk5jBlJU7xGy1GW4UoNaBvRnygXdDugh5YP"; // Replace with your key
    const searchUrl = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${foodName}&pageSize=1&api_key=${API_KEY}`;

    fetch(searchUrl)
      .then(response => response.json())
      .then(data => {
          if (!data.foods || data.foods.length === 0) {
              alert("Food not found in USDA database.");
              return;
          }

          const foodData = data.foods[0];
          let caloriesPer100g = 0;
          let proteinPer100g = 0;

          foodData.foodNutrients.forEach(nutrient => {
              if (nutrient.nutrientName.toLowerCase().includes("energy")) {
                  caloriesPer100g = nutrient.value;
              }
              if (nutrient.nutrientName.toLowerCase().includes("protein")) {
                  proteinPer100g = nutrient.value;
              }
          });

          const calories = (caloriesPer100g / 100) * grams;
          const protein = (proteinPer100g / 100) * grams;

          const today = new Date().toISOString().split("T")[0];

          // Add to logs
          logs.push({date: today, food: foodName, grams, calories, protein});

          // Keep only last 30 days
          const now = new Date();
          logs = logs.filter(log => {
              const logDate = new Date(log.date);
              const diffDays = (now - logDate) / (1000 * 60 * 60 * 24);
              return diffDays <= THIRTY_DAYS;
          });

          localStorage.setItem("logs", JSON.stringify(logs));

          // Refresh tabs and day view
          selectedDay = today;
          renderTabs();
          renderDay(selectedDay);

          // Clear inputs
          document.getElementById("foodInput").value = "";
          document.getElementById("gramInput").value = "";

      })
      .catch(error => {
          console.error("Error fetching nutrition data:", error);
          alert("Failed to fetch nutrition data.");
      });
}

function renderTabs() {
    const dayTabs = document.getElementById("dayTabs");
    dayTabs.innerHTML = "";

    // Get unique dates from logs
    const uniqueDates = [...new Set(logs.map(log => log.date))].sort((a,b) => new Date(b) - new Date(a));

    uniqueDates.forEach(date => {
        const tab = document.createElement("div");
        tab.className = "day-tab" + (date === selectedDay ? " active" : "");
        tab.innerText = date;
        tab.onclick = () => {
            selectedDay = date;
            renderDay(selectedDay);
            renderTabs();
        };
        dayTabs.appendChild(tab);
    });
}

function renderDay(day) {
    const dayLogs = logs.filter(log => log.date === day);

    totalCalories = dayLogs.reduce((sum, log) => sum + log.calories, 0);
    totalProtein = dayLogs.reduce((sum, log) => sum + log.protein, 0);

    document.getElementById("calories").innerText = Math.round(totalCalories);
    document.getElementById("protein").innerText = totalProtein.toFixed(1);

    const foodList = document.getElementById("foodList");
    foodList.innerHTML = "";

    dayLogs.forEach(log => {
        const li = document.createElement("li");
        li.innerText = `${log.food} - ${log.grams}g → ${Math.round(log.calories)} cal, ${log.protein.toFixed(1)}g protein`;
        foodList.appendChild(li);
    });
}