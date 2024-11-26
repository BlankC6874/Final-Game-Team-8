const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

const gridSize = 8;
const cellSize = 50;
const grid: Cell[][] = [];
const player = { x: 0, y: 0, color: "red" };

const plantTypes = ["Plant A", "Plant B", "Plant C"] as const;
type PlantType = (typeof plantTypes)[number];
type Plant = {
  type: PlantType;
  growthLevel: number;
};
type Cell = {
  sun: number;
  water: number;
  plant: Plant | null;
};

function createGrid() {
  for (let y = 0; y < gridSize; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < gridSize; x++) {
      row.push({
        sun: Math.random() > 0.5 ? 1 : 0,
        water: Math.random() > 0.8 ? 1 : 0,
        plant: null,
      });
    }
    grid.push(row);
  }
}

function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const cell = grid[y][x];
      ctx.strokeStyle = "black";
      ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);

      ctx.fillStyle = "blue";
      ctx.fillText(`W:${cell.water}`, x * cellSize + 5, y * cellSize + 20);
      ctx.fillStyle = "yellow";
      ctx.fillText(`S:${cell.sun}`, x * cellSize + 5, y * cellSize + 35);

      if (cell.plant) {
        ctx.fillStyle = "green";
        ctx.fillText(
          `${cell.plant.type} L${cell.plant.growthLevel}`,
          x * cellSize + 5,
          y * cellSize + 50,
        );
      }
    }
  }

  ctx.fillStyle = player.color;
  ctx.fillRect(player.x * cellSize, player.y * cellSize, cellSize, cellSize);
}

function advanceTurn() {
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const cell = grid[y][x];
      cell.sun = Math.random() > 0.5 ? 1 : 0;
      cell.water += Math.random() > 0.7 ? 1 : 0;

      if (cell.plant && cell.sun > 0 && cell.water >= cell.plant.growthLevel) {
        cell.plant.growthLevel++;
        cell.water -= cell.plant.growthLevel;
      }
    }
  }
  console.log("Turn advanced!");
  checkWinCondition();
}

function sowPlant() {
  interactWithNearbyCell((cell) => {
    if (!cell.plant) {
      const randomPlantType =
        plantTypes[Math.floor(Math.random() * plantTypes.length)];
      cell.plant = { type: randomPlantType, growthLevel: 1 };
      console.log(`Planted ${randomPlantType}`);
    } else {
      console.log("Cell already contains a plant!");
    }
  });
}

function reapPlant() {
  interactWithNearbyCell((cell) => {
    if (cell.plant) {
      console.log("Reaped Plant!");
      cell.plant = null;
    }
  });
}

function interactWithNearbyCell(action: (cell: Cell) => void) {
  const neighbors = [
    { x: player.x - 1, y: player.y },
    { x: player.x + 1, y: player.y },
    { x: player.x, y: player.y - 1 },
    { x: player.x, y: player.y + 1 },
  ];
  neighbors.forEach(({ x, y }) => {
    if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
      action(grid[y][x]);
    }
  });
}

function checkWinCondition() {
  let count = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (cell.plant && cell.plant.growthLevel >= 3) {
        count++;
      }
    }
  }
  if (count >= 5) {
    console.log("You win!");
  }
}

addEventListener("keydown", (e: KeyboardEvent) => {
  switch (e.key) {
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
    case "Enter":
      advanceTurn();
      break;
    case "S":
      sowPlant();
      break;
    case "R":
      reapPlant();
      break;
  }
  drawGrid();
});
//hi
createGrid();
drawGrid();
