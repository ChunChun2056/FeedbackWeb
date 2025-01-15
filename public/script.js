const form = document.getElementById('surveyForm');
const pagesContainer = document.getElementById('pagesContainer');
const addPageButton = document.getElementById('addPage');
const surveyList = document.getElementById('surveyList');

let pageCounter = 0;

function addPage() {
  const pageDiv = document.createElement('div');
  pageDiv.classList.add('page-group');
  pageDiv.innerHTML = `
    <h3>Page ${pageCounter + 1}</h3>
    <label>Page Name:</label>
    <input type="text" class="page-name" placeholder="Enter page name">
    <label>Figma URL:</label>
    <input type="text" name="figmaUrl[]">
    <div class="components-container" id="componentsContainer_page${pageCounter + 1}"></div>
    <button type="button" class="add-component-btn" data-page="${pageCounter + 1}">Add Component</button>
    <button type="button" class="remove-page-btn">Remove Page</button>
  `;
  pagesContainer.appendChild(pageDiv);

  const componentsContainer = pageDiv.querySelector(`#componentsContainer_page${pageCounter + 1}`);
  const addComponentBtn = pageDiv.querySelector('.add-component-btn');
  addComponentBtn.addEventListener('click', () => {
    addComponent(componentsContainer);
  });

  const removePageBtn = pageDiv.querySelector('.remove-page-btn');
  removePageBtn.addEventListener('click', () => {
    pagesContainer.removeChild(pageDiv);
  });

  pageCounter++;
}

function addOption(container, optionValue = '') {
  const optionDiv = document.createElement('div');
  optionDiv.classList.add('dropdown-option');
  optionDiv.innerHTML = `
    <input type="text" class="option-input" value="${optionValue}" placeholder="Enter option">
    <button type="button" class="remove-option-btn">Remove</button>
  `;

  const removeOptionBtn = optionDiv.querySelector('.remove-option-btn');
  removeOptionBtn.addEventListener('click', () => {
    container.removeChild(optionDiv);
  });

  container.appendChild(optionDiv);
}

function addComponent(container, componentData) {
  const componentDiv = document.createElement('div');
  componentDiv.classList.add('component');
  componentDiv.innerHTML = `
    <select class="component-type">
      <option value="input">Input Field</option>
      <option value="textarea">Text Area</option>
      <option value="dropdown">Dropdown</option>
    </select>
    <input type="text" class="component-label" placeholder="Component heading" value="${
      componentData?.label || ''
    }">
    <div class="dropdown-options-container" style="display: none;">
      <div class="options-list"></div>
      <button type="button" class="add-option-btn">Add Option</button>
    </div>
    <button type="button" class="remove-component-btn">Remove Component</button>
  `;

  const componentTypeSelect = componentDiv.querySelector('.component-type');
  const dropdownContainer = componentDiv.querySelector('.dropdown-options-container');
  const optionsList = componentDiv.querySelector('.options-list');
  const addOptionBtn = componentDiv.querySelector('.add-option-btn');

  // Set initial component type
  if (componentData?.type) {
    componentTypeSelect.value = componentData.type;
    if (componentData.type === 'dropdown') {
      dropdownContainer.style.display = 'block';
      componentData.options?.forEach(option => addOption(optionsList, option));
    }
  }

  // Handle component type changes
  componentTypeSelect.addEventListener('change', () => {
    if (componentTypeSelect.value === 'dropdown') {
      dropdownContainer.style.display = 'block';
      if (optionsList.children.length === 0) {
        addOption(optionsList); // Add default first option
      }
    } else {
      dropdownContainer.style.display = 'none';
      optionsList.innerHTML = '';
    }
  });

  addOptionBtn.addEventListener('click', () => addOption(optionsList));
  
  componentDiv.querySelector('.remove-component-btn').addEventListener('click', () => {
    container.removeChild(componentDiv);
  });

  container.appendChild(componentDiv);
}

function addOption(container, optionValue = '') {
  const optionDiv = document.createElement('div');
  optionDiv.classList.add('dropdown-option');
  optionDiv.innerHTML = `
    <input type="text" class="option-input" value="${optionValue}" placeholder="Enter option">
    <button type="button" class="remove-option-btn">×</button>
  `;

  optionDiv.querySelector('.remove-option-btn').addEventListener('click', () => {
    container.removeChild(optionDiv);
  });

  container.appendChild(optionDiv);
}

function addOption(container, optionValue = '') {
  const optionDiv = document.createElement('div');
  optionDiv.classList.add('dropdown-option');
  optionDiv.innerHTML = `
    <input type="text" class="option-input" value="${optionValue}" placeholder="Enter option">
    <button type="button" class="remove-option-btn">×</button>
  `;

  optionDiv.querySelector('.remove-option-btn').addEventListener('click', () => {
    container.removeChild(optionDiv);
  });

  container.appendChild(optionDiv);
}

addPageButton.addEventListener('click', addPage);

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const surveyName = document.getElementById('surveyName').value;
  const pages = [];

  for (let i = 0; i < pagesContainer.children.length; i++) {
    const pageDiv = pagesContainer.children[i];
    const pageName = pageDiv.querySelector('.page-name').value || `Page ${i + 1}`;
    const figmaUrl = pageDiv.querySelector('input[name="figmaUrl[]"]').value;
    const componentsContainer = pageDiv.querySelector('.components-container');
    const components = [];

    for (let j = 0; j < componentsContainer.children.length; j++) {
      const componentDiv = componentsContainer.children[j];
      const componentType = componentDiv.querySelector('.component-type').value;
      const componentLabel = componentDiv.querySelector('.component-label').value || `Component ${j + 1}`;
      const component = { type: componentType, label: componentLabel };

      if (componentType === 'dropdown') {
        const optionInputs = componentDiv.querySelectorAll('.option-input');
        component.options = Array.from(optionInputs).map(input => input.value);
      }

      components.push(component);
    }

    pages.push({
      pageName,
      figmaUrl,
      components,
    });
  }

  const surveyData = {
    name: surveyName || 'Untitled Survey',
    pages: pages,
  };

  console.log('Survey data being submitted:', surveyData);

  try {
    const response = await fetch('/surveys', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(surveyData),
    });

    if (response.ok) {
      const newSurvey = await response.json();
      console.log('Survey created:', newSurvey);
      alert(`Survey created with ID: ${newSurvey._id} and unique URL: ${newSurvey.uniqueUrl}`);
      window.location.href = '/';
    } else {
      console.error('Error response:', await response.text());
      alert('Error creating survey');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error creating survey');
  }
});

async function loadSurveys() {
  try {
    const response = await fetch('/surveys');
    if (response.ok) {
      const surveys = await response.json();
      surveyList.innerHTML = '';
      surveys.forEach((survey) => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
          ${survey.name} - <a href="/survey/${survey.uniqueUrl}" target="_blank">View</a>
          <button class="edit-btn" data-id="${survey._id}">Edit</button>
          <button class="delete-btn" data-id="${survey._id}">Delete</button>
        `;
        surveyList.appendChild(listItem);

        const editButton = listItem.querySelector('.edit-btn');
        editButton.addEventListener('click', () => {
          const surveyId = editButton.dataset.id;
          window.location.href = `/edit.html?id=${surveyId}`;
        });

        const deleteButton = listItem.querySelector('.delete-btn');
        deleteButton.addEventListener('click', () => {
          const surveyId = deleteButton.dataset.id;
          deleteSurvey(surveyId);
        });
      });
    } else if (response.status === 401) {
      // Check for unauthorized status
      window.location.href = '/login.html'; // Redirect to login
    } else {
      console.error('Error loading surveys');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

async function deleteSurvey(surveyId) {
  if (confirm('Are you sure you want to delete this survey?')) {
    try {
      const response = await fetch(`/surveys/${surveyId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Survey deleted successfully');
        loadSurveys();
      } else {
        alert('Error deleting survey');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error deleting survey');
    }
  }
}

if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
  loadSurveys();
}