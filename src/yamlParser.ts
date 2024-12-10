import * as yaml from "npm:js-yaml";

// Define the structure of your GameDSL type
export type GameDSL = {
  [scenario: string]: {
    grid_size: [number, number];
    available_plants: string[];
    win_conditions: [string, string, number][];
    special_events?: [number, string][];
    human_instructions: string;
  };
};

// Function to parse YAML into GameDSL
export function parseYAML(yamlText: string): GameDSL {
  try {
    const parsed = yaml.load(yamlText);
    if (!parsed || typeof parsed !== "object") {
      throw new Error("Invalid YAML structure.");
    }
    return parsed as GameDSL;
  } catch (error) {
    console.error("Error parsing YAML:", error);
    throw error;
  }
}
