const form = document.getElementById("surveyForm");
const pagesContainer = document.getElementById("pagesContainer");
const addPageButton = document.getElementById("addPage");
const surveyList = document.getElementById("surveyList");

let pageCounter = 0;

function addPage() {
  const pageDiv = document.createElement("div");
  pageDiv.classList.add("page-group");
  pageDiv.innerHTML = `
        <h3>Page ${pageCounter + 1}</h3>
        <label>Figma URL:</label>
        <input type="text" name="figmaUrl[]">

        <div class="components-container" id="componentsContainer_page${
          pageCounter + 1
        }">
            </div>

        <button type="button" class="add-component-btn" data-page="${
          pageCounter + 1
        }">Add Component</button>
        <button type="button" class="remove-page-btn">Remove Page</button>
    `;
  pagesContainer.appendChild(pageDiv);

  const componentsContainer = pageDiv.querySelector(
    `#componentsContainer_page${pageCounter + 1}`
  );
  const addComponentBtn = pageDiv.querySelector(".add-component-btn");
  addComponentBtn.addEventListener("click", () => {
    addComponent(componentsContainer);
  });

  const removePageBtn = pageDiv.querySelector(".remove-page-btn");
  removePageBtn.addEventListener("click", () => {
    pagesContainer.removeChild(pageDiv);
  });

  pageCounter++;
}

function addComponent(container) {
  const componentDiv = document.createElement("div");
  componentDiv.classList.add("component");
  componentDiv.innerHTML = `
        <select class="component-type">
            <option value="input">Input Field</option>
            <option value="textarea">Text Area</option>
            <option value="dropdown">Dropdown</option>
        </select>
        <input type="text" class="component-label" placeholder="Component heading">
        <button type="button" class="add-option-btn" style="display: none;">Add Option</button>
        <button type="button" class="remove-component-btn">Remove Component</button>
    `;

  const componentTypeSelect = componentDiv.querySelector(".component-type");
  const addOptionBtn = componentDiv.querySelector(".add-option-btn");
  const removeComponentBtn = componentDiv.querySelector(
    ".remove-component-btn"
  );

  componentTypeSelect.addEventListener("change", () => {
    if (componentTypeSelect.value === "dropdown") {
      addOptionBtn.style.display = "inline-block";
    } else {
      addOptionBtn.style.display = "none";
    }
  });

  addOptionBtn.addEventListener("click", () => {
    const optionInput = document.createElement("input");
    optionInput.type = "text";
    optionInput.placeholder = "Option value";
    optionInput.classList.add("dropdown-option");
    componentDiv.insertBefore(optionInput, addOptionBtn);
  });

  removeComponentBtn.addEventListener("click", () => {
    container.removeChild(componentDiv);
  });

  container.appendChild(componentDiv);
}

addPageButton.addEventListener("click", addPage);

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const surveyName = document.getElementById("surveyName").value;
  const pages = [];

  for (let i = 0; i < pagesContainer.children.length; i++) {
    const pageDiv = pagesContainer.children[i];
    const figmaUrl = pageDiv.querySelector('input[name="figmaUrl[]"]').value;
    const componentsContainer = pageDiv.querySelector(`.components-container`);
    const components = [];

    for (let j = 0; j < componentsContainer.children.length; j++) {
      const componentDiv = componentsContainer.children[j];
      const componentType = componentDiv.querySelector(".component-type").value;
      const componentLabel =
        componentDiv.querySelector(".component-label").value; // Get label
      const component = { type: componentType, label: componentLabel }; // Add label to component

      if (componentType === "dropdown") {
        const optionInputs = componentDiv.querySelectorAll(".dropdown-option");
        component.options = Array.from(optionInputs).map(
          (input) => input.value
        );
      }

      components.push(component);
    }

    pages.push({
      figmaUrl,
      components,
    });
  }
  const surveyData = {
    name: surveyName,
    pages: pages,
  };

  try {
    const response = await fetch("/surveys", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(surveyData),
    });

    if (response.ok) {
      const newSurvey = await response.json();
      alert(
        `Survey created with ID: ${newSurvey.id} and unique URL: ${newSurvey.uniqueUrl}`
      );
      window.location.href = '/';
    } else {
      alert("Error creating survey");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Error creating survey");
  }
});

async function loadSurveys() {
  try {
    const response = await fetch("/surveys");
    if (response.ok) {
      const surveys = await response.json();
      surveyList.innerHTML = "";
      surveys.forEach((survey) => {
        const listItem = document.createElement("li");
        listItem.innerHTML = `
                    ${survey.name} - <a href="/survey/${survey.uniqueUrl}" target="_blank">View</a>
                    <button class="edit-btn" data-id="${survey._id}">Edit</button>
                    <button class="delete-btn" data-id="${survey._id}">Delete</button>
                `;
        surveyList.appendChild(listItem);

        const editButton = listItem.querySelector(".edit-btn");
        editButton.addEventListener("click", () => {
          const surveyId = editButton.dataset.id;
          window.location.href = `/edit.html?id=${surveyId}`;
        });

        const deleteButton = listItem.querySelector(".delete-btn");
        deleteButton.addEventListener("click", () => {
          const surveyId = deleteButton.dataset.id;
          deleteSurvey(surveyId);
        });
      });
    } else {
      console.error("Error loading surveys");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

async function deleteSurvey(surveyId) {
  if (confirm("Are you sure you want to delete this survey?")) {
    try {
      const response = await fetch(`/surveys/${surveyId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Survey deleted successfully");
        loadSurveys();
      } else {
        alert("Error deleting survey");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error deleting survey");
    }
  }
}

// Initial load of surveys
loadSurveys();
