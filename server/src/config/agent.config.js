import { promises as fs } from 'fs';
import path from 'path';
import chalk from 'chalk';
import { generateObject } from "ai";
import { z } from 'zod';


const ApplicationSchema = z.object({
    folderName: z.string().describe("Kebab-case folder name for the application"),
    description: z.string().describe("A brief description of the application, Which was created"),
    files: z.array(
        z.object({
            path: z.string().describe("Relative file path (e.g: src/App.jsx)"),
            content: z.string().describe("Content of the file")
        }).describe("All File Needed for the application")
    ),
    setupCommands: z.array(
        z.string().describe("Bash commands to setup and run ( e.g: npm install, npm run dev")
    ),
    dependencies: z.array(
        z.object({
            name: z.string().describe("Package name (e.g: react)"),
            version: z.string().describe("Package version (e.g: ^18.2.0)")
        })
    ).optional().describe("NPM dependencies with versions")
})


function printSystem(message) {
    console.log(message);
}

/**
 * Display file tree structure
 */
function displayFileTree(files, folderName) {
    printSystem(chalk.yellow('\n Project Structure:'));
    printSystem(chalk.cyan(`📁 ${folderName}/`));

    const filesByDir = {};
    files.forEach(file => {
        const parts = file.path.split('/');
        const dir = parts.length > 1 ? parts.slice(0, -1).join('/') : '';

        if (!filesByDir[dir]) {
            filesByDir[dir] = [];
        }
        filesByDir[dir].push(parts[parts.length - 1]);
    });

    Object.keys(filesByDir).sort().forEach(dir => {
        if (dir) {
            printSystem(chalk.white(`├── ${dir}/`));
            filesByDir[dir].forEach(file => {
                printSystem(chalk.white(`│   └── ${file}`));
            });
        } else {
            filesByDir[dir].forEach(file => {
                printSystem(chalk.white(`├── ${file}`));
            });
        }
    });
}

async function createApplicationFiles(baseDir, folderName, files) {
    const appDir = path.join(baseDir, folderName);

    await fs.mkdir(appDir, { recursive: true });
    printSystem(chalk.gray(`Created directory: ${folderName}/`));

    for (const file of files) {
        const filePath = path.join(appDir, file.path);
        const fileDir = path.dirname(filePath);

        await fs.mkdir(fileDir, { recursive: true });
        await fs.writeFile(filePath, file.content, 'utf8');
        printSystem(chalk.gray(`Created file: ${file.path}`));
    }

    return appDir;
}



export async function generateApplication(description, aiService, cwd = process.cwd()) {
    try {
        printSystem(chalk.yellow('\n ⬡ Initializing... Building your application!\n'));
        printSystem(chalk.gray(`📝 Task: ${description}\n`));
        printSystem(chalk.cyan('🤖 Orbis AI is working on it...\n'));

        const { object: application } = await generateObject({
            model: aiService.model,
            schema: ApplicationSchema,
            prompt: `Create a complete, production-ready application for: ${description}

CRITICAL REQUIREMENTS:
1. Generate ALL files needed for the application to run
2. Include package.json with ALL dependencies and correct versions (if needed)
3. Include README.md with setup instructions
4. Include configuration files (.gitignore, etc.) if needed
5. Write clean, well-commented, production-ready code
6. Include error handling and input validation
7. Use modern JavaScript/TypeScript best practices
8. Make sure all imports and paths are correct
9. NO PLACEHOLDERS - everything must be complete and working
10. For simple HTML/CSS/JS projects, you can skip package.json if not needed

Provide:
- A meaningful kebab-case folder name
- All necessary files with complete content
- Setup commands (for example: cd folder, npm install, npm run dev OR just open index.html)
- Make it visually appealing and functional`,
        });

        printSystem(chalk.green.bold(`\n✅ Generated: ${application.folderName}\n`));
        printSystem(chalk.gray(`📜 ${application.description}\n`));

        if (application.files.length === 0) {
            throw new Error("No files were generated. Please try again with a more detailed description.");
        }

        displayFileTree(application.files, application.folderName);

        printSystem(chalk.cyan('\n⬡ Writing files to disk...\n'));

        const appDir = await createApplicationFiles(cwd, application.folderName,
            application.files
        );

        // Display Result
        printSystem(chalk.yellow.bold(`\n 🌟 Application Created Successfully! 🌟\n`));
        printSystem(chalk.cyan(`📁 Location: ${chalk.bold(appDir)}\n`));

        if (application.setupCommands.length > 0) {
            printSystem(chalk.yellow('⚓ Next Steps:\n'));
            printSystem(chalk.gray('```bash'));
            application.setupCommands.forEach(cmd => {
                printSystem(chalk.white(`  ${cmd}`))
            });

            printSystem(chalk.gray("```\n"));
        }

        return {
            folderName: application.folderName,
            appDir,
            files: application.files.map(f => f.path),
            commands: application.setupCommands,
            success: true
        }

    } catch (error) {
        printSystem(chalk.red(`\nError: ${error.message}\n`));
        if (error.stack) {
            printSystem(chalk.dim(error.stack + '\n'));
        }
        throw error;
    }
}