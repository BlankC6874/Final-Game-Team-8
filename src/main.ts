const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

const titleElement = document.createElement("h1");
titleElement.textContent = "Farming Game";
titleElement.style.textAlign = "center";
document.body.insertBefore(titleElement, canvas);

const gridSize = 8;

const cellSize = 50;

// Grid state stored in a contiguous byte array (AoS format)
const gridState = new Uint8Array(gridSize * gridSize * 4); // [sun, water, plantType, growthLevel]

// Player state
const player = { x: 0, y: 0, color: "red" };

// Action history for undo/redo functionality
let actionHistory: {
  gridState: Uint8Array;
  player: { x: number; y: number };
}[] = [];
let redoStack: { gridState: Uint8Array; player: { x: number; y: number } }[] =
  [];

const messagePanel = document.getElementById("messagePanel") as HTMLDivElement;
// Plant types and initial conditions
const plantTypes = ["Plant A", "Plant B", "Plant C"] as const;
type PlantType = (typeof plantTypes)[number];
function showMessage(message: string, duration = 2000) {
  messagePanel.textContent = message;
  setTimeout(() => {
    messagePanel.textContent = "";
  }, duration);
}

function createGrid() {
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

function drawGrid() {
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

      ctx.fillStyle = "blue";
      ctx.fillText(`W:${water}`, x * cellSize + 5, y * cellSize + 20);
      ctx.fillStyle = "yellow";
      ctx.fillText(`S:${sun}`, x * cellSize + 5, y * cellSize + 35);

      if (plantType > 0) {
        ctx.fillStyle = "green";
        ctx.fillText(
          `P${plantType} L${growthLevel}`,
          x * cellSize + 5,
          y * cellSize + 50
        );
      }
    }
  }
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x * cellSize, player.y * cellSize, cellSize, cellSize);
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
    })
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
      (value: number, index: number) => (gridState[index] = value)
    );
    Object.assign(player, savedPlayer);
    actionHistory = savedActionHistory.map((state: any) => ({
      gridState: Uint8Array.from(state.gridState),
      player: { ...state.player },
    }));
    redoStack = savedRedoStack.map((state: any) => ({
      gridState: Uint8Array.from(state.gridState),
      player: { ...state.player },
    }));
    drawGrid();
    showMessage(`Game loaded from slot ${slot}`);
  } else {
    showMessage(`No save found for slot ${slot}`);
  }
}
//aud

// Auto-save functionality
function autoSave() {
  localStorage.setItem(
    "autosave",
    JSON.stringify({
      gridState: Array.from(gridState),
      player,
      actionHistory,
      redoStack,
    })
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
      (value: number, index: number) => (gridState[index] = value)
    );
    Object.assign(player, savedPlayer);
    actionHistory = savedActionHistory.map((state: any) => ({
      gridState: Uint8Array.from(state.gridState),
      player: { ...state.player },
    }));
    redoStack = savedRedoStack.map((state: any) => ({
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

function advanceTurn() {
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const index = (y * gridSize + x) * 4;
      gridState[index] = Math.random() > 0.5 ? 1 : 0; // sun
      gridState[index + 1] += Math.random() > 0.7 ? 1 : 0; // water

      const plantType = gridState[index + 2];
      const growthLevel = gridState[index + 3];
      if (
        plantType > 0 &&
        gridState[index] > 0 &&
        gridState[index + 1] >= growthLevel
      ) {
        gridState[index + 3]++;
        gridState[index + 1] -= growthLevel;
      }
    }
  }
  showMessage("Turn advanced!");

  saveStateToHistory();
  autoSave();
  drawGrid();
}

// Sow and reap plants
function sowPlant() {
  interactWithNearbyCell((index) => {
    if (gridState[index + 2] === 0) {
      gridState[index + 2] = Math.floor(Math.random() * plantTypes.length) + 1; // Plant type
      gridState[index + 3] = 1; // Initial growth level
      showMessage("Plant sown");
      saveStateToHistory();
      autoSave();
    } else {
      showMessage("Cell already contains a plant");
    }
  });
}

function reapPlant() {
  interactWithNearbyCell((index) => {
    if (gridState[index + 2] > 0) {
      gridState[index + 2] = 0; // Remove plant type
      gridState[index + 3] = 0; // Reset growth level
      showMessage("Plant reaped");
      saveStateToHistory();
      autoSave();
    }
  });
}

function interactWithNearbyCell(action: (index: number) => void) {
  const neighbors = [
    { x: player.x - 1, y: player.y },
    { x: player.x + 1, y: player.y },
    { x: player.x, y: player.y - 1 },
    { x: player.x, y: player.y + 1 },
  ];
  neighbors.forEach(({ x, y }) => {
    if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
      const index = (y * gridSize + x) * 4;
      action(index);
    }
  });
}

// Key controls
addEventListener("keydown", (e: KeyboardEvent) => {
  let majorAction = false;
  switch (e.key) {
    case "ArrowUp":
      if (player.y > 0) {
        player.y--;
        majorAction = true;
      }
      break;
    case "ArrowDown":
      if (player.y < gridSize - 1) {
        player.y++;
        majorAction = true;
      }
      break;
    case "ArrowLeft":
      if (player.x > 0) {
        player.x--;
        majorAction = true;
      }
      break;
    case "ArrowRight":
      if (player.x < gridSize - 1) {
        player.x++;
        majorAction = true;
      }
      break;
    case "Enter":
      advanceTurn();
      break;
    case "s":
      sowPlant();
      break;
    case "r":
      reapPlant();
      break;
    case "u":
      undo();
      break;
    case "d":
      redo();
      break;
    case "1":
      saveGame("slot1");
      break;
    case "2":
      loadGame("slot1");
      break;
  }
  if (majorAction) {
    saveStateToHistory();
    autoSave();
  }
  drawGrid();
});
// Initialize game
createGrid();
drawGrid();
saveStateToHistory();
loadAutoSave(); // Load auto-save on page load

// Auto-save on page unload
globalThis.addEventListener("beforeunload", autoSave);
