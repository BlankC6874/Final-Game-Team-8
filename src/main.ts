import { parseYAML, GameDSL } from "./yamlParser.ts";

interface Translations {
    [language: string]: {
      [key: string]: string;
    };
  }
  
  let translations: Translations = {};
  let currentLanguage: keyof Translations = 'en';
  
  async function loadTranslations(): Promise<void> {
    try {
        const response = await fetch('./translations.json'); // Use a relative path
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        translations = await response.json();
        console.log('Loaded translations:', translations);
        applyTranslations();
    } catch (error) {
        console.error('Error loading translations:', error);
    }
}



  
function applyTranslations(): void {
    const t = translations[currentLanguage];
    if (!t) return;

    const infoElement = document.getElementById('info');
    const body = document.body;

    if (currentLanguage === 'ar') {
        body.setAttribute('dir', 'rtl'); // Set right-to-left for Arabic
    } else {
        body.setAttribute('dir', 'ltr'); // Set left-to-right for other languages
    }

    if (infoElement) {
        infoElement.innerHTML = `
            <strong style="grid-column: span 2">${t.operation_guide}</strong>
            <div>${t.arrows}</div><div>${t.move_player}</div>
            <div>${t.p_key}</div><div>${t.plant}</div>
            <div>${t.h_key}</div><div>${t.harvest}</div>
            <div>${t.t_key}</div><div>${t.advance_turn}</div>
            <div>${t.u_key}</div><div>${t.undo}</div>
            <div>${t.r_key}</div><div>${t.redo}</div>
            <div>${t.s_key}</div><div>${t.save}</div>
            <div>${t.l_key}</div><div>${t.load}</div>
        `;
    }
}

  
  
  // Event listener for language change
  document.getElementById('language')?.addEventListener('change', (event) => {
    const target = event.target as HTMLSelectElement;
    currentLanguage = target.value as keyof Translations;
    applyTranslations();
  });  

  console.log(`Current language: ${currentLanguage}`);
  console.log('Translations:', translations[currentLanguage]);

  loadTranslations().then(() => applyTranslations());


  
  // Initialize translations on page load
  loadTranslations();
  globalThis.onload = async () => {
    await loadTranslations();
};
  


//load the dsl
async function loadDSL(filePath: string): Promise<GameDSL> {
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`Failed to load DSL file: ${response.statusText}`);
        }
        const yamlText = await response.text();
        const parsedDSL = parseYAML(yamlText);
        console.log("Parsed DSL:", parsedDSL);
        return parsedDSL;
    } catch (error) {
        console.error("Error loading or parsing DSL:", error);
        throw error;
    }
}

const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
const titleElement = document.createElement("h1");
titleElement.textContent = "Farming Game";
titleElement.style.textAlign = "center";
document.body.insertBefore(titleElement, canvas);

const messagePanel = document.getElementById("messagePanel") as HTMLDivElement;

let gridSize = 8; // Default grid size
let availablePlants: string[] = [];
let winConditions: [string, string, number][] = [];
let gridState: Uint8Array; // Global gridState
const player = { x: 0, y: 0, color: "red" }; // Player state
let actionHistory: GameState[] = [];
let redoStack: GameState[] = [];

type GameState = {
    gridState: Uint8Array;
    player: { x: number; y: number };
};

let currentScenario = 'tutorial';

// Function to dynamically create scenario dropdown based on available scenarios
function createDynamicScenarioDropdown(scenarios: Record<string, any>) {
    const scenarioSelect = document.createElement("select");
    scenarioSelect.id = "scenarioSelect"; // Add an ID for reference

    // Add a default option
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Select a Scenario";
    defaultOption.disabled = true;
    defaultOption.selected = true;
    scenarioSelect.appendChild(defaultOption);

    // Add scenarios dynamically
    for (const scenarioName in scenarios) {
        const option = document.createElement("option");
        option.value = scenarioName;
        option.textContent =
            scenarioName;
        scenarioSelect.appendChild(option);
    }

    document.body.insertBefore(scenarioSelect, canvas);

    // Add an event listener to handle scenario changes
    scenarioSelect.addEventListener("change", (event) => {
        const selectedScenario = (event.target as HTMLSelectElement).value;
        if (selectedScenario) {
            handleScenarioChange(selectedScenario, scenarios[selectedScenario]);
        }
    });
}

// Handle scenario change
function handleScenarioChange(scenarioName: string, scenarioConfig: any) {
    showMessage(`Scenario changed to: ${scenarioName}`);
    console.log(`Selected scenario: ${scenarioName}`, scenarioConfig);

    // Apply the scenario-specific configuration to the game
    gridSize = scenarioConfig.grid_size[0]; // Adjust grid size dynamically
    createGrid(); // Reinitialize the grid
    drawGrid(); // Redraw the grid
    loadScenario(scenarioName);
}

// Initialize dropdown dynamically based on parsed DSL
async function initializeScenarioDropdown() {
    try {
        const dsl = await loadDSL("/Final-Game-Team-8/public/external.yml");
        createDynamicScenarioDropdown(dsl);
    } catch (error) {
        console.error("Failed to initialize scenario dropdown:", error);
    }
}

// Call the initialization function
initializeScenarioDropdown();

// Function to update game state based on selected scenario
function loadScenario(scenario: string) {
    loadDSL("/Final-Game-Team-8/public/external.yml")
        .then((dsl) => {
            const scenarioData = dsl[scenario];
            if (!scenarioData) {
                showMessage("Scenario not found!");
                return;
            }

            gridSize = scenarioData.grid_size[0];  // Adjusting grid size based on scenario
            availablePlants = scenarioData.available_plants;  // Available plants for this scenario
            winConditions = scenarioData.win_conditions;  // Win conditions for this scenario
            showMessage(`Scenario '${scenario}' loaded!`);
            createGrid();  // Recreate grid with the new size
            drawGrid();  // Redraw grid
        })
        .catch((error) => {
            console.error("Failed to load DSL:", error);
        });
}

// Create grid with updated size
function createGrid() {
    const cellSize = 50;
    gridState = new Uint8Array(gridSize * gridSize * 4);  // Create a new gridState with the updated gridSize
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            const index = (y * gridSize + x) * 4;
            gridState[index] = Math.random() > 0.5 ? 1 : 0; // sun
            gridState[index + 1] = Math.random() > 0.8 ? 1 : 0; // water
            gridState[index + 2] = 0; // plantType (0 = no plant)
            gridState[index + 3] = 0; // growthLevel
        }
    }
}

// Function to show messages in the game
function showMessage(message: string, duration = 2000) {
    messagePanel.textContent = message;
    setTimeout(() => {
        messagePanel.textContent = "";
    }, duration);
}

// Save and load functionality
function saveGame(slot: string) {
    localStorage.setItem(
        `save_${slot}`,
        JSON.stringify({
            gridState: Array.from(gridState),
            player,
            actionHistory,
            redoStack,
        }),
    );
    showMessage(`Game saved to slot: ${slot}`);
}

function loadGame(slot: string) {
    const saveData = localStorage.getItem(`save_${slot}`);
    if (saveData) {
        const {
            gridState: savedGrid,
            player: savedPlayer,
            actionHistory: savedActionHistory,
            redoStack: savedRedoStack,
        } = JSON.parse(saveData);
        savedGrid.forEach(
            (value: number, index: number) => (gridState[index] = value),
        );
        Object.assign(player, savedPlayer);
        actionHistory = savedActionHistory.map((state: GameState) => ({
            gridState: Uint8Array.from(state.gridState),
            player: { ...state.player },
        }));
        redoStack = savedRedoStack.map((state: GameState) => ({
            gridState: Uint8Array.from(state.gridState),
            player: { ...state.player },
        }));
        drawGrid();
        showMessage(`Game loaded from slot ${slot}`);
    } else {
        showMessage(`No save found for slot ${slot}`);
    }
}

// Auto-save functionality
function autoSave() {
    localStorage.setItem(
        "autosave",
        JSON.stringify({
            gridState: Array.from(gridState),
            player,
            actionHistory,
            redoStack,
        }),
    );
}

function loadAutoSave() {
    const autoSaveData = localStorage.getItem("autosave");
    if (autoSaveData) {
        const {
            gridState: savedGrid,
            player: savedPlayer,
            actionHistory: savedActionHistory,
            redoStack: savedRedoStack,
        } = JSON.parse(autoSaveData);
        savedGrid.forEach(
            (value: number, index: number) => (gridState[index] = value),
        );
        Object.assign(player, savedPlayer);
        actionHistory = savedActionHistory.map((state: GameState) => ({
            gridState: Uint8Array.from(state.gridState),
            player: { ...state.player },
        }));
        redoStack = savedRedoStack.map((state: GameState) => ({
            gridState: Uint8Array.from(state.gridState),
            player: { ...state.player },
        }));
        drawGrid();
        showMessage("Auto-save loaded");
    }
}

// Undo and redo functionality
function saveStateToHistory() {
    actionHistory.push({
        gridState: Uint8Array.from(gridState),
        player: { ...player },
    });
    if (actionHistory.length > 100) actionHistory.shift(); // Limit history size
}

function undo() {
    if (actionHistory.length > 0) {
        const lastState = actionHistory.pop()!;
        redoStack.push({
            gridState: Uint8Array.from(gridState),
            player: { ...player },
        });
        gridState.set(lastState.gridState);
        Object.assign(player, lastState.player);
        drawGrid();
        showMessage("Undo successful");
    } else {
        showMessage("No more actions to undo");
    }
}

function redo() {
    if (redoStack.length > 0) {
        const nextState = redoStack.pop()!;
        actionHistory.push({
            gridState: Uint8Array.from(gridState),
            player: { ...player },
        });
        gridState.set(nextState.gridState);
        Object.assign(player, nextState.player);
        drawGrid();
        showMessage("Redo successful");
    } else {
        showMessage("No more actions to redo");
    }
}

//advance turn and randomly generate sun/water
function advanceTurn() {
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            const index = (y * gridSize + x) * 4;

            // Randomly generate sun energy (binary: 1 = available, 0 = not available)
            gridState[index] = Math.random() > 0.5 ? 1 : 0;

            // Gradual water accumulation (max level is 5)
            gridState[index + 1] = Math.min(gridState[index + 1] + (Math.random() > 0.8 ? 1 : 0), 5);

            // Plant growth
            const plantType = gridState[index + 2];
            const growthLevel = gridState[index + 3];

            if (plantType > 0 && gridState[index] > 0 && gridState[index + 1] > 0) {
                gridState[index + 3]++; // Increment growth level
                gridState[index + 1]--; // Use water for growth
            }
        }
    }
    saveStateToHistory();
    drawGrid();
    showMessage("Turn advanced!");
}
function sowPlant() {
    interactWithCell((index) => {
        if (gridState[index + 2] === 0) {
            gridState[index + 2] = Math.floor(Math.random() * availablePlants.length) + 1; // Plant type
            gridState[index + 3] = 1; // Initial growth level
            saveStateToHistory();
            drawGrid();
            showMessage("Plant sown.");
        } else {
            showMessage("Cell already has a plant.");
        }
    });
}
function reapPlant() {
    interactWithCell((index) => {
        if (gridState[index + 2] > 0) {
            gridState[index + 2] = 0; // Remove plant
            gridState[index + 3] = 0; // Reset growth level
            saveStateToHistory();
            drawGrid();
            showMessage("Plant reaped.");
        } else {
            showMessage("No plant to reap.");
        }
    });
}

// Helper function to interact with cells
function interactWithCell(action: (index: number) => void) {
    const index = (player.y * gridSize + player.x) * 4;
    action(index);
}

//drawGrid function to show the current scenario and plant types
function drawGrid() {
    const cellSize = 50;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            const index = (y * gridSize + x) * 4;
            const sun = gridState[index];
            const water = gridState[index + 1];
            const plantType = gridState[index + 2];
            const growthLevel = gridState[index + 3];

            ctx.strokeStyle = "black";
            ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);

            ctx.fillStyle = "yellow";
            ctx.fillText(`S:${sun}`, x * cellSize + 5, y * cellSize + 20);

            ctx.fillStyle = "blue";
            ctx.fillText(`W:${water}`, x * cellSize + 5, y * cellSize + 35);

            if (plantType > 0) {
                ctx.fillStyle = "green";
                ctx.fillText(`P${plantType} L${growthLevel}`, x * cellSize + 5, y * cellSize + 50);
            }
        }
    }
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x * cellSize, player.y * cellSize, cellSize, cellSize);
}


// Handle keyboard controls
document.addEventListener("keydown", (event) => {
    const cellSize = 50;
    switch (event.key) {
        case "ArrowUp":
            if (player.y > 0) player.y--;
            break;
        case "ArrowDown":
            if (player.y < gridSize - 1) player.y++;
            break;
        case "ArrowLeft":
            if (player.x > 0) player.x--;
            break;
        case "ArrowRight":
            if (player.x < gridSize - 1) player.x++;
            break;
        case "s":
            saveGame("slot1");
            break;
        case "l":
            loadGame("slot1");
            break;
        case "u":
            undo();
            break;
        case "r":
            redo();
            break;
        case "t": // Advance turn
            advanceTurn();
            break;
        case "p": // Plant
            sowPlant();
            break;
        case "h": // Harvest (reap)
            reapPlant();
            break;
        case "d": // Harvest (reap)
            console.log(availablePlants);
            break;
        default:
            break;
    }
    drawGrid();
});

// Initialize game and load scenarios
createGrid();
drawGrid();
loadScenario(currentScenario);
