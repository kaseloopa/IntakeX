let totalCalories = 0;
let totalProtein = 0;

function addFood() {
    const input = document.getElementById("foodInput").value;

    // TEMP FAKE DATA (we'll replace with AI + API next)
    const calories = Math.floor(Math.random() * 200);
    const protein = Math.floor(Math.random() * 20);

    totalCalories += calories;
    totalProtein += protein;

    document.getElementById("calories").innerText = totalCalories;
    document.getElementById("protein").innerText = totalProtein;

    const li = document.createElement("li");
    li.innerText = `${input} → ${calories} cal, ${protein}g protein`;
    document.getElementById("foodList").appendChild(li);
}