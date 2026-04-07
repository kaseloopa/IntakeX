// --- Render Food Vault ---
function renderVault(){
  const list=document.getElementById("vaultList");
  list.innerHTML=""; // clear previous
  vault.forEach((f,index)=>{
    const li=document.createElement("li");
    li.innerHTML=`<span>${f.name} → ${f.calories} cal/100g, ${f.protein}g protein</span>`;

    // Edit button
    const editBtn=document.createElement("button");
    editBtn.className="edit-btn";
    editBtn.innerText="Edit";
    editBtn.onclick=()=>{ editVaultFood(index); };

    // Delete button
    const delBtn=document.createElement("button");
    delBtn.className="delete-btn";
    delBtn.innerText="Delete";
    delBtn.onclick=()=>{ deleteVaultFood(index); };

    li.appendChild(editBtn);
    li.appendChild(delBtn);
    list.appendChild(li);
  });
}

// --- Add Food to Vault ---
function addVaultFood(){
  const name=document.getElementById("vaultFoodName").value.trim();
  const calories=parseFloat(document.getElementById("vaultCalories").value);
  const protein=parseFloat(document.getElementById("vaultProtein").value);

  if(!name || isNaN(calories) || isNaN(protein)){
    alert("Enter valid food name, calories, and protein.");
    return;
  }

  // Add to vault array
  vault.push({name, calories, protein});
  localStorage.setItem("vault", JSON.stringify(vault)); // persist

  renderVault(); // refresh list

  // Clear inputs
  document.getElementById("vaultFoodName").value="";
  document.getElementById("vaultCalories").value="";
  document.getElementById("vaultProtein").value="";
}

// --- Edit Food in Vault ---
function editVaultFood(index){
  const food=vault[index];

  const newName = prompt("Food Name:", food.name);
  if(newName===null) return; // cancel

  const newCalories = parseFloat(prompt("Calories per 100g:", food.calories));
  if(isNaN(newCalories)) return;

  const newProtein = parseFloat(prompt("Protein per 100g:", food.protein));
  if(isNaN(newProtein)) return;

  vault[index] = {name: newName, calories: newCalories, protein: newProtein};
  localStorage.setItem("vault", JSON.stringify(vault));
  renderVault();
}

// --- Delete Food from Vault ---
function deleteVaultFood(index){
  vault.splice(index,1);
  localStorage.setItem("vault", JSON.stringify(vault));
  renderVault();
}