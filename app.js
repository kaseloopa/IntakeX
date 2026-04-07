// --- Tabs ---
function showTab(tab){
    document.getElementById("daily").style.display = (tab==='daily') ? 'block' : 'none';
    document.getElementById("vault").style.display = (tab==='vault') ? 'block' : 'none';

    document.getElementById("dailyTab").classList.toggle('active', tab==='daily');
    document.getElementById("vaultTab").classList.toggle('active', tab==='vault');
}

// --- Core Data ---
let logs = JSON.parse(localStorage.getItem("logs")) || [];
let vault = JSON.parse(localStorage.getItem("vault")) || [];
const THIRTY_DAYS = 30;
let selectedDay = new Date().toISOString().split("T")[0];

// --- Daily Log Functions ---
function addFood() {
    const foodName = document.getElementById("foodInput").value.trim();
    const grams = parseFloat(document.getElementById("gramInput").value);
    if (!foodName || !grams || grams<=0){ alert("Enter valid food & grams."); return; }

    const foodSource = vault.find(f => f.name.toLowerCase()===foodName.toLowerCase());
    if (!foodSource) { alert("Food not found in vault."); return; }

    const calories = (foodSource.calories/100)*grams;
    const protein = (foodSource.protein/100)*grams;

    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const time = now.toTimeString().split(" ")[0].slice(0,5);

    logs.push({date:today, time, food:foodName, grams, calories, protein});
    logs = logs.filter(log => (new Date() - new Date(log.date))/(1000*60*60*24) <= THIRTY_DAYS);
    localStorage.setItem("logs", JSON.stringify(logs));

    selectedDay = today;
    renderTabs(); renderDay(selectedDay);

    document.getElementById("foodInput").value="";
    document.getElementById("gramInput").value="";
}

function renderTabs() {
    const tabs = document.getElementById("dayTabs");
    tabs.innerHTML = "";
    const dates = [...new Set(logs.map(l=>l.date))].sort((a,b)=>new Date(b)-new Date(a));
    dates.forEach(date=>{
        const tab = document.createElement("div");
        tab.className = "tab" + (date===selectedDay?" active":"");
        tab.innerText = date;
        tab.onclick=()=>{ selectedDay=date; renderDay(date); renderTabs(); };
        tabs.appendChild(tab);
    });
}

function renderDay(day){
    const dayLogs = logs.filter(l=>l.date===day);
    const totalCalories = dayLogs.reduce((sum,l)=>sum+l.calories,0);
    const totalProtein = dayLogs.reduce((sum,l)=>sum+l.protein,0);

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

function deleteEntry(entry){
    logs = logs.filter(l=>!(l.date===entry.date && l.time===entry.time && l.food===entry.food));
    localStorage.setItem("logs", JSON.stringify(logs));
    renderTabs(); renderDay(selectedDay);
}

// --- Food Vault Functions ---
function renderVault(){
    const list=document.getElementById("vaultList");
    list.innerHTML="";
    vault.forEach((f,index)=>{
        const li=document.createElement("li");
        li.innerHTML=`<span>${f.name} → ${f.calories} cal/100g, ${f.protein}g protein</span>`;

        const editBtn=document.createElement("button");
        editBtn.className="edit-btn"; editBtn.innerText="Edit";
        editBtn.onclick=()=>{ editVaultFood(index); };

        const delBtn=document.createElement("button");
        delBtn.className="delete-btn"; delBtn.innerText="Delete";
        delBtn.onclick=()=>{ deleteVaultFood(index); };

        li.appendChild(editBtn);
        li.appendChild(delBtn);
        list.appendChild(li);
    });
}

function addVaultFood(){
    const name=document.getElementById("vaultFoodName").value.trim();
    const calories=parseFloat(document.getElementById("vaultCalories").value);
    const protein=parseFloat(document.getElementById("vaultProtein").value);
    if(!name||isNaN(calories)||isNaN(protein)){alert("Enter valid values."); return;}
    vault.push({name, calories, protein});
    localStorage.setItem("vault", JSON.stringify(vault));
    renderVault();
    document.getElementById("vaultFoodName").value="";
    document.getElementById("vaultCalories").value="";
    document.getElementById("vaultProtein").value="";
}

function editVaultFood(index){
    const food=vault[index];
    const newName=prompt("Food Name:", food.name); if(newName===null) return;
    const newCal=parseFloat(prompt("Calories per 100g:", food.calories)); if(isNaN(newCal)) return;
    const newProtein=parseFloat(prompt("Protein per 100g:", food.protein)); if(isNaN(newProtein)) return;
    vault[index]={name:newName, calories:newCal, protein:newProtein};
    localStorage.setItem("vault", JSON.stringify(vault));
    renderVault();
}

function deleteVaultFood(index){
    vault.splice(index,1);
    localStorage.setItem("vault", JSON.stringify(vault));
    renderVault();
}

// --- Initial Render ---
renderTabs();
renderDay(selectedDay);
renderVault();