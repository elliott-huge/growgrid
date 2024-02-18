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
  
    const ctx = initializeCanvas(width, height);
    if (ctx) {
      // Placeholder for drawing logic
      // drawGrid(ctx, ...);
    }
  }
  
  document.getElementById('plantSelection').addEventListener('change', function() {
    populateVarieties(this.value);
  });
  

  // Function to initialize the canvas
  function initializeCanvas(width, height) {
    const canvas = document.getElementById('gardenCanvas');
    if (canvas.getContext) {
      const ctx = canvas.getContext('2d');
  
      // Set canvas size
      canvas.width = width;
      canvas.height = height;
  
      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
  
      return ctx;
    } else {
      // Canvas not supported
      alert('Canvas is not supported by your browser.');
      return null;
    }
  }
  
// Function to draw the grid on the canvas
function drawGrid(ctx, width, height, plantSpacing, plantData) {
    console.log(plantData)
    const abbreviation = plantData.name.substring(0, 2).toUpperCase();
    const plantGrowRadius = plantData.spacing.belowGround.metric.radius;
  
    // Calculate the number of plants per row and column
    const plantsPerRow = Math.floor(width / plantSpacing);
    const plantsPerCol = Math.floor(height / plantSpacing);
  
    // Loop through each plant position and draw the circles
    for (let row = 0; row < plantsPerCol; row++) {
      for (let col = 0; col < plantsPerRow; col++) {
        // Calculate the center of each plant
        const x = col * plantSpacing + plantSpacing / 2;
        const y = row * plantSpacing + plantSpacing / 2;
  
        // Draw the larger growth radius circle
        ctx.beginPath();
        ctx.arc(x, y, plantGrowRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 128, 0, 0.2)'; // Semi-transparent
        ctx.fill();
  
        // Draw the smaller plant circle
        ctx.beginPath();
        ctx.arc(x, y, plantGrowRadius / 2, 0, Math.PI * 2);
        ctx.fillStyle = 'green';
        ctx.fill();
  
        // Draw the plant abbreviation
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(abbreviation, x, y);
      }
    }
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
  
// Assuming plants.json is loaded into a variable named plantsData
// For example: let plantsData = { "plants": [ ... ] };

// Function to find plant data by id
function getPlantDataById(id) {
    return plantsData.plants.find(plant => plant.id === id);
  }
  
// Adjusted event listener for the 'Generate' button
document.getElementById('generate').addEventListener('click', function() {
    const units = document.getElementById('units').value;
    let width = parseFloat(document.getElementById('rectWidth').value);
    let height = parseFloat(document.getElementById('rectHeight').value);
    const selectedSpeciesId = document.getElementById('plantSelection').value;
    const selectedVarietyName = document.getElementById('varietySelection').value;
  
    const species = getPlantDataById(selectedSpeciesId);
    const variety = species.varieties.find(variety => variety.name === selectedVarietyName);
  
    // Convert the garden dimensions into pixels
    const conversionFactor = units === 'metric' ? 100 : 39.37;
    width *= conversionFactor;
    height *= conversionFactor;
  
    // Assuming plantSpacing needs to be recalculated if it depends on the variety
    const plantSpacing = units === 'metric'
        ? variety.spacing.aboveGround.metric.radius * 2
        : variety.spacing.aboveGround.imperial.radius * 2;
  
    const ctx = initializeCanvas(width, height);
    if (ctx) {
        ctx.clearRect(0, 0, width, height);
        drawGrid(ctx, width, height, plantSpacing, variety); // Now passing the correct variety object
    }
  });
  