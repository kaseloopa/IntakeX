let totalCalories = 0;
let totalProtein = 0;

function addFood() {
    const foodName = document.getElementById("foodInput").value.trim();
    const grams = parseFloat(document.getElementById("gramInput").value);

    if (!foodName || !grams || grams <= 0) {
        alert("Please enter a valid food and grams.");
        return;
    }

    // TEMP DATA: Replace later with USDA API lookup
    const caloriesPer100g = 300;  // Example placeholder
    const proteinPer100g = 8;     // Example placeholder

    const calories = (caloriesPer100g / 100) * grams;
    const protein = (proteinPer100g / 100) * grams;

    totalCalories += calories;
    totalProtein += protein;

    document.getElementById("calories").innerText = Math.round(totalCalories);
    document.getElementById("protein").innerText = totalProtein.toFixed(1);

    const li = document.createElement("li");
    li.innerText = `${foodName} - ${grams}g → ${Math.round(calories)} cal, ${protein.toFixed(1)}g protein`;
    document.getElementById("foodList").appendChild(li);

    // Clear inputs
    document.getElementById("foodInput").value = "";
    document.getElementById("gramInput").value = "";
}