let commandCount = 0;

function createCommandElement(parent) {
    commandCount++;
    const commandDiv = document.createElement('div');
    commandDiv.className = 'command';
    commandDiv.innerHTML = `
        <label>Command Name:
          <input type="text" name="commandName" placeholder="Enter command name">
        </label>
        <label>Command Type:
          <select name="commandType">
            <option value="self">Self</option>
            <option value="framework">Framework</option>
          </select>
        </label>
        <label>Description:
          <input type="text" name="commandDescription" placeholder="Enter description">
        </label>
        <label>Handler Function Code:
          <textarea name="handlerCode" placeholder="Enter handler function code"></textarea>
        </label>
        <button class="addSubCommandButton">Add Sub-Command</button>
        <button class="removeCommandButton">Remove Command</button>
        <div class="subcommands"></div>
      `;

    // Add event listeners for the buttons
    const addSubCommandButton = commandDiv.querySelector('.addSubCommandButton');
    const removeCommandButton = commandDiv.querySelector('.removeCommandButton');
    const subcommandsDiv = commandDiv.querySelector('.subcommands');

    addSubCommandButton.addEventListener('click', () => {
        const subCommand = createCommandElement(commandDiv);
        subcommandsDiv.appendChild(subCommand);
    });

    removeCommandButton.addEventListener('click', () => {
        commandDiv.remove();
    });

    return commandDiv;
}

const commandsContainer = document.getElementById('commandsContainer');
const addCommandButton = document.getElementById('addCommandButton');
const generateButton = document.getElementById('generateButton');
const generatedCodeTextarea = document.getElementById('generatedCode');
const copyButton = document.getElementById('copyButton');

addCommandButton.addEventListener('click', () => {
    const commandElement = createCommandElement();
    commandsContainer.appendChild(commandElement);
});

function generateCode() {
    let code = '';

    function processCommand(commandElement, parentName) {
        const commandName = commandElement.querySelector('input[name="commandName"]').value.trim();
        const commandType = commandElement.querySelector('select[name="commandType"]').value;
        const commandDescription = commandElement.querySelector('input[name="commandDescription"]').value.trim();
        const handlerCode = commandElement.querySelector('textarea[name="handlerCode"]').value.trim();
        const subcommands = commandElement.querySelector('.subcommands').children;

        if (!commandName) {
            alert('Command name is required.');
            throw new Error('Command name is missing.');
        }

        // Generate handler function name
        const handlerFunctionName = `${commandName}Handler`;

        // Add handler function code
        if (handlerCode) {
            code += `
function ${handlerFunctionName}(lastAnswer, input) {
  ${handlerCode}
}
`;
        } else {
            code += `
function ${handlerFunctionName}(lastAnswer, input) {
  // Handler code for ${commandName}
}
`;
        }

        // Create command instance
        code += `
const ${commandName}Command = new Command('${commandName}', '${commandType}', '${commandDescription}', ${handlerFunctionName});
`;

        // Register command
        if (parentName) {
            code += `cli.registerCommand(${commandName}Command, ${parentName}Command);\n`;
        } else {
            code += `cli.registerCommand(${commandName}Command);\n`;
        }

        // Process sub-commands
        for (let subcommandElement of subcommands) {
            processCommand(subcommandElement, commandName);
        }
    }

    // Process top-level commands
    const topCommands = commandsContainer.children;
    for (let topCommand of topCommands) {
        processCommand(topCommand, null);
    }

    generatedCodeTextarea.value = code;
}

generateButton.addEventListener('click', () => {
    try {
        generatedCodeTextarea.value = '';
        generateCode();
    } catch (error) {
        console.error(error);
    }
});

copyButton.addEventListener('click', () => {
    generatedCodeTextarea.select();
    document.execCommand('copy');
    alert('Code copied to clipboard.');
});