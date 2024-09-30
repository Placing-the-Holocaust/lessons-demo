// scripts/map.js

// Ensure that MapLibre GL and PMTiles are loaded before this script runs

// Add the PMTiles plugin to the maplibregl global.
const protocol = new pmtiles.Protocol();
maplibregl.addProtocol('pmtiles', protocol.tile);

// Replace 'YOUR_CONFIG_PATH' with the actual path to your config.json
const CONFIG_PATH = '/config/layer_config.json'; // Example path

document.addEventListener('DOMContentLoaded', function () {
  // Initialize the map with desired center and zoom
  const map = new maplibregl.Map({
    container: 'map', // container id
    center: [22, 52], // desired starting position [lng, lat]
    zoom: 3.2, // desired starting zoom
    style: '/styles/style.json' // relative path to your custom style
  });

  // Debugging: Log initial view
  map.on('load', () => {
    console.log('Map loaded with center:', map.getCenter(), 'and zoom:', map.getZoom());

    // After map is loaded, load the configuration and create the Data Selection Menu
    fetch(CONFIG_PATH)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(config => {
        createDataSelectionMenu(config.variables, config.options);
      })
      .catch(error => {
        console.error('Error loading configuration:', error);
      });
  });

  // Add event listener for moveend event
  map.on('moveend', function () {
    const center = map.getCenter();
    const zoom = map.getZoom();
    console.log('New center:', center);
    console.log('New zoom:', zoom);
  });

  // Variable to store the current feature
  let currentFeature = null;

  // Add click event listeners for the specified layers
  ['ss_camps', 'ghettos', 'death_camps'].forEach(layer => {
    map.on('click', layer, function (e) {
      const feature = e.features[0];
      const properties = feature.properties;

      // Update the panel with the feature information
      document.getElementById('feature-info').innerHTML = `<strong>${layer}</strong><br><pre>${JSON.stringify(properties, null, 2)}</pre>`;
      document.getElementById('info-panel').style.display = 'block';

      // Store the current feature
      currentFeature = feature;
    });

    // Change the cursor to a pointer when the mouse is over the layer.
    map.on('mouseenter', layer, function () {
      map.getCanvas().style.cursor = 'pointer';
    });

    // Change it back to default when it leaves.
    map.on('mouseleave', layer, function () {
      map.getCanvas().style.cursor = '';
    });
  });

  // Close the panel if the user clicks anywhere else on the map
  map.on('click', function (e) {
    if (currentFeature) {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['ss_camps', 'ghettos', 'death_camps']
      });

      // If no features are found, hide the panel
      if (!features.length) {
        document.getElementById('info-panel').style.display = 'none';
        currentFeature = null;
      }
    }
  });

  /**
   * Function to create the Data Selection Menu based on configuration
   * @param {Array} variables - Array of variable configurations
   * @param {Object} options - Object containing options arrays
   */
  function createDataSelectionMenu(variables, options) {
    const menu = document.getElementById('data-selection-menu');

    variables.forEach(variable => {
      // Create a container for each input group
      const group = document.createElement('div');
      group.className = 'input-group';

      // Create and append the question label
      const questionLabel = document.createElement('label');
      questionLabel.textContent = variable.question;
      questionLabel.setAttribute('for', variable.id);
      group.appendChild(questionLabel);

      // Determine the input type
      let inputElement;

      switch (variable.type) {
        case 'dropdown':
          inputElement = document.createElement('select');
          inputElement.id = variable.id;
          inputElement.name = variable.id;

          // Populate options
          if (variable.options) {
            // Static options
            variable.options.forEach(option => {
              const opt = document.createElement('option');
              opt.value = option;
              opt.textContent = option;
              inputElement.appendChild(opt);
            });
          } else if (variable.optionsSource && options[variable.optionsSource]) {
            // Dynamic options from options object
            options[variable.optionsSource].forEach(option => {
              const opt = document.createElement('option');
              opt.value = option;
              opt.textContent = option;
              inputElement.appendChild(opt);
            });
          }
          break;

        case 'slider':
          inputElement = document.createElement('input');
          inputElement.type = 'range';
          inputElement.id = variable.id;
          inputElement.name = variable.id;
          inputElement.min = variable.min;
          inputElement.max = variable.max;
          inputElement.step = variable.step || 1;
          inputElement.value = variable.min;

          // Display current slider value
          const sliderValue = document.createElement('div');
          sliderValue.className = 'slider-value';
          sliderValue.id = `${variable.id}-value`;
          sliderValue.textContent = `${variable.min}`;
          group.appendChild(sliderValue);

          // Update slider value display on input
          inputElement.addEventListener('input', function () {
            sliderValue.textContent = `${this.value}`;
          });
          break;

        case 'date':
          inputElement = document.createElement('input');
          inputElement.type = 'date';
          inputElement.id = variable.id;
          inputElement.name = variable.id;
          break;

        case 'number':
          inputElement = document.createElement('input');
          inputElement.type = 'number';
          inputElement.id = variable.id;
          inputElement.name = variable.id;
          inputElement.min = variable.min || 0;
          inputElement.max = variable.max || 10000;
          inputElement.step = variable.step || 1;
          break;

        default:
          console.warn(`Unsupported input type: ${variable.type}`);
          return; // Skip this variable
      }

      // Add event listener to handle changes
      inputElement.addEventListener('change', () => handleSelectionChange(variable.id, inputElement.value));

      // Append the input element to the group
      group.appendChild(inputElement);

      // If there are hover definitions, add tooltip
      if (variable.hoverDefinitions) {
        const tooltipSpan = document.createElement('span');
        tooltipSpan.className = 'tooltip';
        tooltipSpan.textContent = ' (?)';

        const tooltipText = document.createElement('span');
        tooltipText.className = 'tooltiptext';
        tooltipText.textContent = 'Definitions available on hover.';

        tooltipSpan.appendChild(tooltipText);
        group.appendChild(tooltipSpan);
      }

      menu.appendChild(group);
    });
  }

  /**
   * Function to handle changes in the Data Selection Menu
   * @param {string} variableId - The ID of the variable
   * @param {string} selectedValue - The selected value
   */
  function handleSelectionChange(variableId, selectedValue) {
    console.log(`Variable ${variableId} changed to ${selectedValue}`);
    updateMapLayers();
  }

  /**
   * Function to update map layers based on current selections
   */
  function updateMapLayers() {
    // Collect all current selections
    const selections = {};
    document.querySelectorAll('#data-selection-menu select, #data-selection-menu input').forEach(input => {
      if (input.type === 'range' || input.type === 'number') {
        selections[input.id] = input.value;
      } else if (input.type === 'date') {
        selections[input.id] = input.value; // YYYY-MM-DD
      } else {
        selections[input.id] = input.value;
      }
    });

    console.log('Current Selections:', selections);

    // Example: Update ss_camps layer filter
    if (map.getLayer('ss_camps')) {
      // Implement filtering logic based on selections
      // Example:
      // map.setFilter('ss_camps', ['==', ['get', 'attribute'], selections.attribute]);
    }

    // Example: Update ghettos layer filter
    if (map.getLayer('ghettos')) {
      // Initialize filter array
      let filter = ['all'];

      // Iterate through selections and build filter expressions
      for (const [key, value] of Object.entries(selections)) {
        if (value === 'all' || value === 'All') continue; // Skip 'all' selections

        // Handle different variable IDs and types
        switch (key) {
          case 'GhettoRegion':
            filter.push(['==', ['get', 'GhettoRegion'], value]);
            break;

          case 'GerOcMid':
            if (value) {
              const date = new Date(value).getTime() / 1000; // Convert to UNIX timestamp if needed
              filter.push(['>=', ['to-number', ['get', 'GerOcMid']], date]);
            }
            break;

          case 'StartMid':
            if (value) {
              const date = new Date(value).getTime() / 1000;
              filter.push(['>=', ['to-number', ['get', 'StartMid']], date]);
            }
            break;

          case 'EndMid':
            if (value) {
              const date = new Date(value).getTime() / 1000;
              filter.push(['<=', ['to-number', ['get', 'EndMid']], date]);
            }
            break;

          case 'DurMid':
            filter.push(['<=', ['get', 'DurMid'], parseInt(value)]);
            break;

          case 'HoldPStruc':
            filter.push(['==', ['get', 'HoldPStruc'], value]);
            break;

          case 'EnclType':
            filter.push(['==', ['get', 'EnclType'], value]);
            break;

          case 'GType':
            filter.push(['==', ['get', 'GType'], value]);
            break;

          case 'GPopMax':
            filter.push(['==', ['get', 'GPopMax'], value]);
            break;

          case 'NonLocalJews':
            if (value !== 'All') {
              filter.push(['==', ['get', 'NonLocalJews'], value === 'Yes']);
            }
            break;

          case 'Epidemics':
            filter.push(['==', ['get', 'Epidemics'], value]);
            break;

          case 'Judenrat':
            if (value !== 'All') {
              filter.push(['==', ['get', 'Judenrat'], value === 'Yes']);
            }
            break;

          case 'RestrType':
            filter.push(['==', ['get', 'RestrType'], value]);
            break;

          case 'LaborType':
            filter.push(['==', ['get', 'LaborType'], value]);
            break;

          case 'EventNo':
            filter.push(['>=', ['get', 'EventNo'], parseInt(value)]);
            break;

          case 'Action':
            filter.push(['==', ['get', 'Action'], value]);
            break;

          case 'NumberOfActions':
            filter.push(['>=', ['get', 'NumberOfActions'], parseInt(value)]);
            break;

          case 'PlaceName':
            filter.push(['==', ['get', 'PlaceName'], value]);
            break;

          case 'DeathCampName':
            filter.push(['==', ['get', 'DeathCampName'], value]);
            break;

          case 'Site':
            filter.push(['==', ['get', 'Site'], value]);
            break;

          case 'FirstRemovalEvent':
            if (value) {
              const date = new Date(value).getTime() / 1000;
              filter.push(['>=', ['to-number', ['get', 'FirstRemovalEvent']], date]);
            }
            break;

          case 'LastRemovalEvent':
            if (value) {
              const date = new Date(value).getTime() / 1000;
              filter.push(['<=', ['to-number', ['get', 'LastRemovalEvent']], date]);
            }
            break;

          case 'VicNum':
            filter.push(['>=', ['get', 'VicNum'], parseInt(value)]);
            break;

          default:
            console.warn(`Unhandled filter variable: ${key}`);
            break;
        }
      }

      // Apply the filter to the ghettos layer
      if (filter.length > 1) { // 'all' is already present
        map.setFilter('ghettos', filter);
      } else {
        map.setFilter('ghettos', null); // Remove filter if only 'all' is selected
      }
    }

    /**
     * Function to add event listeners for layer visibility checkboxes
     */
    function addLayerVisibilityListeners() {
      ['ss_camps', 'ghettos', 'death_camps'].forEach(layer => {
        const checkbox = document.getElementById(layer);
        if (checkbox) {
          checkbox.addEventListener('change', function () {
            map.setLayoutProperty(layer, 'visibility', this.checked ? 'visible' : 'none');
          });
        }
      });
    }

    // Initialize layer visibility listeners
    addLayerVisibilityListeners();
  }
});
