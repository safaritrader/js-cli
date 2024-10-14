class Command {
    constructor(name, type = 'self', description = '', handler = null) {
        this.name = name;
        this.type = type; // 'framework' or 'self'
        this.description = description;
        this.handler = handler; // Function to execute
        this.subCommands = {};
    }

    addSubCommand(command) {
        this.subCommands[command.name] = command;
    }

    getSubCommand(name) {
        return this.subCommands[name];
    }

    hasSubCommand(name) {
        return this.subCommands.hasOwnProperty(name);
    }
}

class CLI {
    constructor(outputElement) {
        this.outputElement = outputElement;
        this.root = new Command('root', 'framework', 'Root framework');
        this.currentFramework = this.root;
        this.lastAnswer = null;
        this.isAwaitingInput = false;
        this.awaitingCommand = null;
        this.commandHistory = [];
        this.historyIndex = -1;
    }

    registerCommand(command, parent = this.root) {
        parent.addSubCommand(command);
    }

    parseInput(input) {
        if (input.trim() === '') return;

        // Add command to history
        this.commandHistory.push(input);
        this.historyIndex = this.commandHistory.length;

        if (input.trim() === 'exit()') {
            this.currentFramework = this.root;
            this.print('<span style="color: #f700ff;">Exited to root framework.</span>');
            return;
        }

        if (input.trim() === 'clear') {
            this.clearOutput();
            return;
        }

        if (input.trim() === 'help') {
            this.displayHelp(this.currentFramework);
            return;
        }

        if (this.isAwaitingInput && this.awaitingCommand) {
            this.processAwaitingInput(input);
            return;
        }

        const args = input.split(' ');
        const commandSequence = args.filter(arg => !arg.startsWith('-'));
        const options = args.filter(arg => arg.startsWith('-'));

        let command = this.currentFramework;
        for (let cmdName of commandSequence) {
            if (command.hasSubCommand(cmdName)) {
                command = command.getSubCommand(cmdName);
            } else {
                this.print(`<span style="color: red;">Command</span> "${cmdName}" <span style="color: red;">not found.</span>`);
                return;
            }
        }

        if (options.includes('-help')) {
            this.displayHelp(command);
            return;
        }

        this.executeCommand(command);
    }

    executeCommand(command) {
        if (command.type === 'framework') {
            this.currentFramework = command;
            this.print(`<span style="color: deepskyblue">Switched to framework:</span> <span style="color: #50fa7b"> ${command.name} </span> Use exit()`);
            if (command.description) {
                this.print(command.description);
            }
        } else {
            if (command.handler) {
                const result = command.handler(this.lastAnswer);
                if (result && result.requiresInput) {
                    this.isAwaitingInput = true;
                    this.awaitingCommand = command;
                    this.print(result.message);
                } else if (result && result.response) {
                    this.print(result.response);
                }
            }
        }
    }

    processAwaitingInput(input) {
        const result = this.awaitingCommand.handler(this.lastAnswer, input);
        this.lastAnswer = input;
        if (result && result.response) {
            this.print(result.response);
        }
        this.isAwaitingInput = false;
        this.awaitingCommand = null;
    }

    displayHelp(command) {
        this.print(`Commands for framework "${command.name}":`);
        this.displaySubCommands(command, 0);
    }

    displaySubCommands(command, indentLevel) {
        const indent = '  '.repeat(indentLevel);
        for (let subCmdName in command.subCommands) {
            const subCmd = command.subCommands[subCmdName];
            this.print(`${indent}- ${subCmd.name}: ${subCmd.description}`);
            if (Object.keys(subCmd.subCommands).length > 0) {
                this.displaySubCommands(subCmd, indentLevel + 1);
            }
        }
    }

    print(message) {
        this.outputElement.innerHTML += message + '\n';
        this.outputElement.scrollTop = this.outputElement.scrollHeight;
    }

    clearOutput() {
        this.outputElement.innerHTML = '';
    }
}

// Create CLI instance
const outputElement = document.getElementById('output');
const cli = new CLI(outputElement);

function clearHandler() {
    cli.clearOutput();
}

// Input handling
const inputElement = document.getElementById('input');
inputElement.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        const input = inputElement.value;
        cli.print(`> ${input}`); // Echo the command
        cli.parseInput(input);
        inputElement.value = '';
    } else if (event.key === 'ArrowUp') {
        if (cli.historyIndex > 0) {
            cli.historyIndex--;
            inputElement.value = cli.commandHistory[cli.historyIndex];
        }
        event.preventDefault();
    } else if (event.key === 'ArrowDown') {
        if (cli.historyIndex < cli.commandHistory.length - 1) {
            cli.historyIndex++;
            inputElement.value = cli.commandHistory[cli.historyIndex];
        } else {
            cli.historyIndex = cli.commandHistory.length;
            inputElement.value = '';
        }
        event.preventDefault();
    }
});

// Welcome message
cli.print('Welcome to the CLI. Type "type" to switch to the type framework.');
cli.print('Type "help" to see available commands.');
