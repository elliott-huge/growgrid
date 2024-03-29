let plantsData = {};

// Function to load plants data from a JSON file
function loadPlantsData() {
  fetch('plants.json')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
      }
      return response.json();
    })
    .then(data => {
      plantsData = data; // Now plantsData will have the JSON data
      initializePlantSelection(); // Call a function to populate the plant selection dropdown
    })
    .catch(error => {
      console.error('There has been a problem with your fetch operation:', error);
    });
}

// Function to populate the varieties dropdown when a species is selected
function populateVarieties(selectedSpeciesId) {
    const species = plantsData.plants.find(plant => plant.id === selectedSpeciesId);
    if (!species) return;
  
    const varietySelect = document.getElementById('varietySelection');
    varietySelect.innerHTML = ''; // Clear existing options
    species.varieties.forEach(variety => {
      const option = document.createElement('option');
      option.value = variety.name; // Using variety name as value; adjust as needed
      option.textContent = variety.name;
      varietySelect.appendChild(option);
    });
  
    // Show the variety dropdown
    document.getElementById('varietySelection').style.display = 'block';
    document.getElementById('varietySelection').previousElementSibling.style.display = 'block';
  }
  

// Call the loadPlantsData function when the page loads
window.addEventListener('DOMContentLoaded', (event) => {
  loadPlantsData();
});

function initializePlantSelection() {
    const selectElement = document.getElementById('plantSelection');
    // Add a default "Select" option
    const defaultOption = document.createElement('option');
    defaultOption.value = "";
    defaultOption.textContent = "Select a plant";
    selectElement.appendChild(defaultOption);
  
    // Populate with species options
    plantsData.plants.forEach(plant => {
      const option = document.createElement('option');
      option.value = plant.id;
      option.textContent = plant.commonName;
      selectElement.appendChild(option);
    });
  }
  

// A function to update the canvas size based on user input
function updateCanvasSize() {
    const units = document.getElementById('units').value;
    let width = document.getElementById('rectWidth').value;
    let height = document.getElementById('rectHeight').value;
  
    // Convert to pixels - assume 100 pixels per meter/inch as an example
    const conversionFactor = units === 'metric' ? 100 : 39.37;
    width = width * conversionFactor;
    height = height * conversionFactor;
  
    const ctx = initializeCanvas(width, height, conversionFactor);
  }
  
  document.getElementById('plantSelection').addEventListener('change', function() {
    populateVarieties(this.value);
  });
  


  function initializeCanvas(gardenWidth, gardenHeight) {
    const canvas = document.getElementById('gardenCanvas');
    if (canvas.getContext) {
        const ctx = canvas.getContext('2d');

        // Adding extra space for labels and margins
        const extraWidth = 100; // Adjust based on your needs
        const extraHeight = 50; // Adjust based on your needs

        // Set canvas size including extra space
        canvas.width = gardenWidth + extraWidth;
        canvas.height = gardenHeight + extraHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
        return ctx;
    } else {
        console.error('Canvas is not supported by your browser.');
        return null;
    }
}

function drawCircle(ctx, x, y, radius, fillColor) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2, false);
  ctx.fillStyle = fillColor;
  ctx.fill();
}

function drawPlant(ctx, x, y, varietyData) {
  // Extract necessary data from varietyData
  const aboveGroundRadius = varietyData.spacing.aboveGround.metric.radius;
  const belowGroundRadius = varietyData.spacing.belowGround.metric.radius;
  const abbreviation = varietyData.name.substring(0, 2); // Or adjust logic as needed

  // Draw the underground radius circle in grey
  drawCircle(ctx, x, y, belowGroundRadius, '#80808080'); // Semi-transparent grey

  // Draw the above ground radius circle in green
  drawCircle(ctx, x, y, aboveGroundRadius, '#00800040'); // Semi-transparent green

  // Draw the plant abbreviation in white at the center
  ctx.fillStyle = '#FFFFFF'; // White
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(abbreviation, x, y);
}
  
// Function to draw the grid on the canvas, including underground spacing representation
function drawGrid(ctx, width, height, varietyData, units) {
  const aboveGroundRadius = varietyData.spacing.aboveGround.metric.radius;
  const belowGroundRadius = varietyData.spacing.belowGround.metric.radius;
  const plantRadius = Math.max(aboveGroundRadius, belowGroundRadius);
  const plantSpacing = plantRadius * 2; // Spacing is twice the radius
  const staggeredPlanting = document.getElementById('staggeredPlantingCheckbox').checked;
  
  // Calculate row height based on planting pattern
  let rowHeight = staggeredPlanting ? Math.sqrt(Math.pow(plantSpacing,2) - Math.pow(plantRadius,2)): plantSpacing;
  console.log(rowHeight);
  console.log(plantSpacing);
  console.log(height);
  
  // Calculate number of rows that can fit in the garden bed
  // TODO: fix this
  let plantsPerCol = staggeredPlanting ? Math.floor((height / rowHeight) - 0.1) : Math.floor(height / plantSpacing);
  console.log(plantsPerCol);
  if (!staggeredPlanting && height % rowHeight >= plantRadius) {
    plantsPerCol += 1; // Allow an additional row if there's enough space in grid mode
  }
  console.log(plantsPerCol);
  let totalPlants = 0;  // Counter for the total number of plants
  for (let row = 0; row < plantsPerCol; row++) {
    let offsetX = staggeredPlanting && row % 2 !== 0 ? plantRadius : 0; // Offset for staggered rows
    let availableWidth = width - offsetX;
    let plantsPerRow = Math.floor(availableWidth / plantSpacing);

    for (let col = 0; col < plantsPerRow; col++) {
      let x = col * plantSpacing + plantRadius + offsetX; // Adjust x-coordinate based on the planting pattern
      let y = row * rowHeight + plantRadius; // Adjust y-coordinate based on the planting pattern
      
      drawPlant(ctx, x, y, varietyData);
      totalPlants++; // Increment total plant count
    }
  }

  // Drawing the garden boundary and optionally the planting grid
  ctx.strokeStyle = '#000000'; // Black for the boundary
  ctx.strokeRect(0, 0, width, height);

  if (document.getElementById('drawPlantingGridCheckbox').checked) {
    drawPlantingGridLines(ctx, width, height, units);
  }

  updateGardenStats(totalPlants, aboveGroundRadius, width, height);
}

function updateGardenStats(totalPlants, plantRadius, width, height) {
  document.getElementById('numPlants').innerText = `${totalPlants}`;

  // Calculate the coverage area using the plant radius in cm
  const singlePlantArea = Math.PI * plantRadius * plantRadius; // in square cm
  const totalPlantArea = singlePlantArea * totalPlants; // in square cm

  // Garden area is already in square cm since 1 pixel = 1 cm
  const gardenArea = width * height; // in square cm

  // Calculate percentage coverage
  let coverage = ((totalPlantArea / gardenArea) * 100).toFixed(2);
  document.getElementById('coverage').innerText = `${coverage}%`;
}



function drawPlantingGridLines(ctx, width, height, units) {
    const gridSize = units === 'metric' ? 100 : 39.37; // 100 pixels = 1 meter or 39.37 pixels = 1 foot
    ctx.strokeStyle = '#BBBBBB'; // Light grey for grid lines
    ctx.beginPath();

    // Vertical grid lines
    for (let x = gridSize; x < width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
    }
    // Horizontal grid lines
    for (let y = gridSize; y < height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
    }
    ctx.stroke();

    // Labels for dimensions at the bottom and right side
    const unitLabel = units === 'metric' ? 'm' : 'ft';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = '#000000'; // Black for text
    ctx.fillText(`${(width / gridSize).toFixed(1)} ${unitLabel}`, width, height + 20); // Bottom label
    ctx.save();
    ctx.translate(width + 20, height);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${(height / gridSize).toFixed(1)} ${unitLabel}`, 0, 20); // Side label
    ctx.restore();
}


  // Function to export the canvas as a PNG
  function exportCanvasAsPNG() {
    const canvas = document.getElementById('gardenCanvas');
    const image = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
  
    // Create a temporary link to trigger the download
    const tempLink = document.createElement('a');
    tempLink.href = image;
    tempLink.download = 'garden-plan.png';
    tempLink.click();
  }
  
  // Event listener for the export button
  document.getElementById('exportButton').addEventListener('click', function() {
    exportCanvasAsPNG();
  });

function getPlantDataById(id) {
    return plantsData.plants.find(plant => plant.id === id);
  }
  
// Adjusted event listener for the 'Generate' button
document.getElementById('generate').addEventListener('click', function() {
    // Retrieve the selected plant and variety from the dropdowns
    const selectedPlantId = document.getElementById('plantSelection').value;
    const selectedVarietyName = document.getElementById('varietySelection').value;

    // Find the selected plant data
    const plantData = plantsData.plants.find(plant => plant.id === selectedPlantId);
    if (!plantData) {
        console.error('Selected plant data not found');
        return;
    }

    // Find the specific variety data within the selected plant
    const varietyData = plantData.varieties.find(variety => variety.name === selectedVarietyName);
    if (!varietyData) {
        console.error('Selected variety data not found');
        return;
    }

    // Retrieve the dimensions entered by the user
    const units = document.getElementById('units').value;
    let width = parseFloat(document.getElementById('rectWidth').value);
    let height = parseFloat(document.getElementById('rectHeight').value);

    // Convert the garden dimensions into pixels
    const conversionFactor = units === 'metric' ? 100 : 39.37; // Example conversion factor
    width *= conversionFactor;
    height *= conversionFactor;

    // Initialize the canvas with the calculated dimensions
    const ctx = initializeCanvas(width, height);
    if (ctx) {
        ctx.clearRect(0, 0, width, height); // Clear the canvas

        // Now that we have the correct variety data, which includes spacing, we can draw the grid
        // Ensure the drawGrid function uses the varietyData for spacing, plant name, etc.
        drawGrid(ctx, width, height, varietyData, units); // Pass the correct varietyData here
    }
});

document.addEventListener('keydown', function(event) {
  // Check if 'G' is pressed along with the Ctrl key
  if (event.ctrlKey && event.key === 'g') {
      // Prevent the default action to avoid any browser shortcut conflict
      event.preventDefault();

      // Trigger the click event on the Generate button
      document.getElementById('generate').click();
  }
});
