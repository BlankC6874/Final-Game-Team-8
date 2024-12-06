tutorial:
  grid_size: [5,5]
  available_plants:
    - weed
  win_conditions:
    - [weed,min,5]
  human_instructions:
    "grow at least 5 weeds"

sunny:
  grid_size: [8,8]
  available_plants:
    - sunflower
    - cactus
  win_conditions:
    - [sunflower,min,20]
    - [weed,max,0]
  special_events:
    - [3, heavy_rain]
    - [7, drought]
  human_instructions:
    "survive 10 days!"
