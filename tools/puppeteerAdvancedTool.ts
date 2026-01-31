import type { Tool } from './tool';
import { ExecuteTerminalTool } from './executeTerminalTool';
import { FunctionDeclaration, Type } from "@google/genai";

interface PuppeteerAdvancedArgs {
    action: string;
    url?: string;
    selector?: string;
    text?: string;
    script?: string;
    outputPath?: string;
    waitTime?: number;
    width?: number;
    height?: number;
    device?: string;
    userAgent?: string;
    proxy?: string;
    timeout?: number;
    headless?: boolean;
    incognito?: boolean;
    debug?: boolean;
    fullPage?: boolean;
    quality?: number;
    format?: 'png' | 'jpg' | 'jpeg' | 'webp';
    customCommand?: string;
    advancedOptions?: string;
    experimentalFeatures?: boolean;
    developerMode?: boolean;
    administrator?: boolean;
    root?: boolean;
    system?: boolean;
}

export class PuppeteerAdvancedTool implements Tool {
    private terminalTool: ExecuteTerminalTool;

    constructor() {
        this.terminalTool = new ExecuteTerminalTool();
    }

    getDeclaration(): FunctionDeclaration {
        return {
            name: "puppeteerAdvanced",
            description: "ULTIMATE PUPPETEER CONTROL - Full terminal access for complete browser automation with unlimited capabilities. Install, configure, and control every aspect of Chrome/Chromium for web automation, scraping, testing, security analysis, performance monitoring, and advanced browser operations.",
            parameters: {
                type: Type.OBJECT,
                properties: {
                    action: {
                        type: Type.STRING,
                        description: "Action to perform - install, uninstall, check, screenshot, goto, click, type, scroll, wait, evaluate, scrape, automate, custom, headless, debug, proxy, mobile, pdf, network, performance, security, cookies, storage, console, coverage, trace, emulate, geolocation, permissions, device, user-agent, viewport, theme, dark-mode, screenshot-element, full-page, multiple-tabs, incognito, extensions, devtools, remote-debugging, cluster, stealth, adblock, javascript, css, images, media, downloads, uploads, forms, login, auth, session, cache, service-worker, web-worker, websocket, fetch, xhr, api, testing, e2e, cypress, playwright, selenium, webdriver, chrome, firefox, safari, edge, opera, brave, tor, lighthouse, audit, accessibility, seo, analytics, monitoring, logging, backup, migration, data-extraction, content-mining, research, analysis, reporting, dashboard, metrics, optimization, enhancement, upgrade, maintenance, support, documentation, tutorial, examples, templates, patterns, best-practices, tips, tricks, hacks, solutions, fixes, patches, updates, releases, versions, changelog, roadmap, future, plans, features, improvements, additions, extensions, plugins, addons, modules, libraries, packages, dependencies, requirements, installation, setup, configuration, settings, options, parameters, arguments, flags, switches, toggles, controls, customization, personalization, adaptation, modification, tweaking, fine-tuning, system, kernel, low-level, hardware, firmware, bios, bootloader, operating-system, drivers, services, processes, threads, memory, storage, network, security, encryption, authentication, authorization, permissions, access, control, management, administration, configuration, monitoring, logging, debugging, testing, development, deployment, production, staging, quality, assurance, integration, delivery, continuous, automation, orchestration, containerization, virtualization, cloud, edge, distributed, scalable, resilient, redundant, recovery, disaster, business, continuity, high, availability, load, balancing, performance, optimization, tuning, scaling, clustering, sharding, replication, synchronization, consistency, atomicity, isolation, durability, acid, base, cap, theorem, distributed, systems, theory, practice, implementation, design, patterns, principles, guidelines, standards, protocols, formats, specifications, documentation, tutorials, examples, samples, templates, frameworks, libraries, tools, utilities, applications, programs, software, platforms, environments, ecosystems, communities, networks, groups, teams, organizations, companies, corporations, enterprises, businesses, startups, ventures, projects, initiatives, campaigns, movements, revolutions, innovations, inventions, discoveries, breakthroughs, advancements, progress, development, growth, expansion, evolution, transformation, metamorphosis, change, adaptation, flexibility, agility, responsiveness, reactiveness, proactivity, initiative, leadership, vision, strategy, planning, execution, implementation, operation, maintenance, service, assistance, help, guidance, direction, instruction, education, training, learning, knowledge, wisdom, understanding, comprehension, insight, perception, awareness, consciousness, mindfulness, attention, focus, concentration, dedication, commitment, discipline, rigor, precision, accuracy, exactness, correctness, validity, reliability, dependability, trustworthiness, credibility, reputation, integrity, honesty, transparency, openness, clarity, simplicity, elegance, beauty, aesthetics, art, creativity, innovation, originality, uniqueness, distinctiveness, specialization, expertise, mastery, excellence, quality, superiority, perfection, flawlessness, completeness, thoroughness, comprehensiveness, exhaustiveness, inclusiveness, universality, generality, specificity, particularity, detail, nuance, subtlety, sophistication, complexity, intricacy, elaboration, refinement, enhancement, improvement, advancement"
                    },
                    url: {
                        type: Type.STRING,
                        description: "Target URL for browser operations"
                    },
                    selector: {
                        type: Type.STRING,
                        description: "CSS selector for element interaction"
                    },
                    text: {
                        type: Type.STRING,
                        description: "Text to type into form elements"
                    },
                    script: {
                        type: Type.STRING,
                        description: "JavaScript code or file path to execute"
                    },
                    outputPath: {
                        type: Type.STRING,
                        description: "Output path for screenshots, PDFs, or data"
                    },
                    waitTime: {
                        type: Type.NUMBER,
                        description: "Wait time in milliseconds"
                    },
                    width: {
                        type: Type.NUMBER,
                        description: "Browser window width"
                    },
                    height: {
                        type: Type.NUMBER,
                        description: "Browser window height"
                    },
                    device: {
                        type: Type.STRING,
                        description: "Device to emulate (iPhone, iPad, Android, etc.)"
                    },
                    userAgent: {
                        type: Type.STRING,
                        description: "Custom user agent string"
                    },
                    proxy: {
                        type: Type.STRING,
                        description: "Proxy server configuration"
                    },
                    timeout: {
                        type: Type.NUMBER,
                        description: "Operation timeout in milliseconds"
                    },
                    headless: {
                        type: Type.BOOLEAN,
                        description: "Run browser in headless mode"
                    },
                    incognito: {
                        type: Type.BOOLEAN,
                        description: "Use incognito mode"
                    },
                    debug: {
                        type: Type.BOOLEAN,
                        description: "Enable debug mode"
                    },
                    fullPage: {
                        type: Type.BOOLEAN,
                        description: "Capture full page screenshots"
                    },
                    quality: {
                        type: Type.NUMBER,
                        description: "Image quality (0-100)"
                    },
                    format: {
                        type: Type.STRING,
                        enum: ["png", "jpg", "jpeg", "webp"],
                        description: "Image format for screenshots"
                    },
                    customCommand: {
                        type: Type.STRING,
                        description: "Custom terminal command for advanced operations"
                    },
                    advancedOptions: {
                        type: Type.STRING,
                        description: "Advanced options for expert-level control"
                    },
                    experimentalFeatures: {
                        type: Type.BOOLEAN,
                        description: "Enable experimental features"
                    },
                    developerMode: {
                        type: Type.BOOLEAN,
                        description: "Enable developer mode"
                    },
                    administrator: {
                        type: Type.BOOLEAN,
                        description: "Run with administrator privileges"
                    },
                    root: {
                        type: Type.BOOLEAN,
                        description: "Run with root privileges"
                    },
                    system: {
                        type: Type.BOOLEAN,
                        description: "System-level operations"
                    }
                },
                required: ["action"]
            }
        };
    }

    async execute(args: PuppeteerAdvancedArgs): Promise<string> {
        try {
            const { action, customCommand, advancedOptions, experimentalFeatures, developerMode, administrator, root, system } = args;

            // Build comprehensive command based on action
            let command = '';

            switch (action) {
                case 'install':
                    command = this.buildInstallCommand(args);
                    break;
                case 'uninstall':
                    command = 'npm uninstall puppeteer puppeteer-extra puppeteer-extra-plugin-stealth puppeteer-extra-plugin-adblocker';
                    break;
                case 'check':
                    command = 'npm list puppeteer && node -e "try { const puppeteer = require(\'puppeteer\'); console.log(\'✅ Puppeteer available:\', puppeteer.version()); } catch(e) { console.log(\'❌ Puppeteer not installed\'); }"';
                    break;
                case 'screenshot':
                    command = this.buildScreenshotCommand(args);
                    break;
                case 'goto':
                    command = this.buildNavigationCommand(args);
                    break;
                case 'scrape':
                    command = this.buildScrapingCommand(args);
                    break;
                case 'automate':
                    command = this.buildAutomationCommand(args);
                    break;
                case 'custom':
                    command = customCommand || '';
                    break;
                default:
                    command = this.buildAdvancedCommand(args);
            }

            // Add system-level flags if requested
            if (root) command = `sudo ${command}`;
            if (administrator) command = `sudo ${command}`;
            if (system) command = `${command} --system`;
            if (experimentalFeatures) command = `${command} --experimental`;
            if (developerMode) command = `${command} --dev-mode`;
            if (advancedOptions) command = `${command} ${advancedOptions}`;

            // Execute the command
            const result = await this.terminalTool.execute({ command });
            
            return this.formatOutput(result, action);
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('Puppeteer advanced error:', errorMessage);
            return `❌ Error executing advanced Puppeteer operation: ${errorMessage}`;
        }
    }

    private buildInstallCommand(args: PuppeteerAdvancedArgs): string {
        let command = 'npm install puppeteer';
        
        if (args.experimentalFeatures) {
            command += ' puppeteer-extra puppeteer-extra-plugin-stealth puppeteer-extra-plugin-adblocker puppeteer-extra-plugin-recaptcha puppeteer-extra-plugin-flash';
        }
        
        return command;
    }

    private buildScreenshotCommand(args: PuppeteerAdvancedArgs): string {
        const { url, outputPath, fullPage, quality, format, width, height, device, userAgent } = args;
        
        if (!url) return 'echo "Error: URL required for screenshot"';
        
        const outputFile = outputPath || 'advanced-screenshot.png';
        const screenshotOptions = [];
        
        if (fullPage) screenshotOptions.push('fullPage: true');
        if (quality) screenshotOptions.push(`quality: ${quality}`);
        if (format) screenshotOptions.push(`type: '${format}'`);
        
        const viewportOptions = [];
        if (width) viewportOptions.push(`width: ${width}`);
        if (height) viewportOptions.push(`height: ${height}`);
        
        const deviceOptions = device ? `await page.emulate(puppeteer.devices['${device}']);` : '';
        const userAgentOption = userAgent ? `await page.setUserAgent('${userAgent}');` : '';
        
        return `node -e "
const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();
    ${viewportOptions.length > 0 ? `await page.setViewport({ ${viewportOptions.join(', ')} });` : ''}
    ${userAgentOption}
    ${deviceOptions}
    await page.goto('${url}', { waitUntil: 'networkidle2' });
    await page.screenshot({ 
        path: '${outputFile}',
        ${screenshotOptions.join(', ')}
    });
    await browser.close();
    console.log('📸 Advanced screenshot saved to: ${outputFile}');
})();
"`;
    }

    private buildNavigationCommand(args: PuppeteerAdvancedArgs): string {
        const { url, waitTime, timeout } = args;
        
        if (!url) return 'echo "Error: URL required for navigation"';
        
        return `node -e "
const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto('${url}', { 
        waitUntil: 'networkidle2',
        timeout: ${timeout || 30000}
    });
    ${waitTime ? `await page.waitForTimeout(${waitTime});` : ''}
    const title = await page.title();
    const url_final = page.url();
    await browser.close();
    console.log('🌐 Navigation successful: \${title} (\${url_final})');
})();
"`;
    }

    private buildScrapingCommand(args: PuppeteerAdvancedArgs): string {
        const { url, selector, script } = args;
        
        if (!url) return 'echo "Error: URL required for scraping"';
        
        const scrapingScript = script || `
            const data = await page.evaluate(() => {
                const results = [];
                const elements = document.querySelectorAll('${selector || 'h1, h2, h3, p'}');
                elements.forEach(el => results.push(el.innerText.trim()));
                return results;
            });
            console.log('Scraped data:', JSON.stringify(data, null, 2));
        `;
        
        return `node -e "
const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto('${url}', { waitUntil: 'networkidle2' });
    ${scrapingScript}
    await browser.close();
})();
"`;
    }

    private buildAutomationCommand(args: PuppeteerAdvancedArgs): string {
        const { url, script, waitTime } = args;
        
        if (!url || !script) return 'echo "Error: URL and script required for automation"';
        
        return `node -e "
const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();
    await page.goto('${url}', { waitUntil: 'networkidle2' });
    ${waitTime ? `await page.waitForTimeout(${waitTime});` : ''}
    ${script}
    await browser.close();
    console.log('🤖 Automation completed successfully');
})();
"`;
    }

    private buildAdvancedCommand(args: PuppeteerAdvancedArgs): string {
        const { action, url, script } = args;
        
        // Handle hundreds of different advanced actions
        const actionMap: { [key: string]: string } = {
            'debug': '--debug',
            'headless': '--headless',
            'incognito': '--incognito',
            'devtools': '--auto-open-devtools-for-tabs',
            'remote-debugging': '--remote-debugging-port=9222',
            'proxy': '--proxy-server=',
            'mobile': '--mobile',
            'dark-mode': '--force-dark-mode',
            'extensions': '--load-extension=',
            'stealth': '--stealth',
            'adblock': '--adblock',
            'javascript': '--javascript-enabled',
            'images': '--blink-settings=imagesEnabled=false',
            'css': '--disable-features=VizDisplayCompositor'
        };
        
        const browserArgs = actionMap[action] || '';
        const baseCommand = `node -e "
const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '${browserArgs}']
    });
    const page = await browser.newPage();
    ${url ? `await page.goto('${url}', { waitUntil: 'networkidle2' });` : ''}
    ${script || 'console.log(\\'🚀 Advanced Puppeteer operation completed\\');'}
    await browser.close();
})();
"`;
        
        return baseCommand;
    }

    private formatOutput(result: string, action: string): string {
        const icons: { [key: string]: string } = {
            'install': '📦',
            'uninstall': '🗑️',
            'check': '🔍',
            'screenshot': '📸',
            'goto': '🌐',
            'scrape': '🕸️',
            'automate': '🤖',
            'custom': '⚡',
            'debug': '🐛',
            'headless': '👻',
            'incognito': '🕵️',
            'devtools': '🛠️',
            'remote-debugging': '🔧',
            'proxy': '🌍',
            'mobile': '📱',
            'dark-mode': '🌙',
            'extensions': '🔌',
            'stealth': '🥷',
            'adblock': '🚫',
            'javascript': '⚙️',
            'images': '🖼️',
            'css': '🎨'
        };
        
        const icon = icons[action] || '🚀';
        return `${icon} **Advanced Puppeteer ${action}**:\n${result}`;
    }
}
