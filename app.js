let totalCalories = 0;
let totalProtein = 0;

// Load logs from localStorage
let logs = JSON.parse(localStorage.getItem("logs")) || [];

// Keep only last 30 days on load
const THIRTY_DAYS = 30;
logs = logs.filter(log => {
  const logDate = new Date(log.date);
  const now = new Date();
  const diffDays = (now - logDate) / (1000 * 60 * 60 * 24);
  return diffDays <= THIRTY_DAYS;
});

// Update UI totals and list
logs.forEach(log => {
  totalCalories += log.calories;
  totalProtein += log.protein;
  addListItem(log.food, log.grams, log.calories, log.protein);
});

function addFood() {
    const foodName = document.getElementById("foodInput").value.trim();
    const grams = parseFloat(document.getElementById("gramInput").value);

    if (!foodName || !grams || grams <= 0) {
        alert("Please enter a valid food and grams.");
        return;
    }

    const API_KEY = "nQkzCqk5jBlJU7xGy1GW4UoNaBvRnygXdDugh5YP"; // <-- Replace this with user generated API key
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

          totalCalories += calories;
          totalProtein += protein;

          document.getElementById("calories").innerText = Math.round(totalCalories);
          document.getElementById("protein").innerText = totalProtein.toFixed(1);

          addListItem(foodName, grams, calories, protein);

          // Save log
          const today = new Date().toISOString().split("T")[0];
          logs.push({date: today, food: foodName, grams, calories, protein});

          // Keep only last 30 days
          const now = new Date();
          logs = logs.filter(log => {
              const logDate = new Date(log.date);
              const diffDays = (now - logDate) / (1000 * 60 * 60 * 24);
              return diffDays <= THIRTY_DAYS;
          });

          localStorage.setItem("logs", JSON.stringify(logs));

          // Clear inputs
          document.getElementById("foodInput").value = "";
          document.getElementById("gramInput").value = "";

      })
      .catch(error => {
          console.error("Error fetching nutrition data:", error);
          alert("Failed to fetch nutrition data.");
      });
}

function addListItem(food, grams, calories, protein) {
    const li = document.createElement("li");
    li.innerText = `${food} - ${grams}g → ${Math.round(calories)} cal, ${protein.toFixed(1)}g protein`;
    document.getElementById("foodList").appendChild(li);
}