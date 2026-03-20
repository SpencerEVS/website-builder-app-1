// Template Registry - Centralized loader for all templates
// New templates can be added by simply creating a new .ts file in the templates folder
// and importing it here

// JavaScript Templates
import { simpleCounter } from './simple-counter';
import { simpleChart } from './simple-chart';
import { interactiveForm } from './interactive-form';
import { digitalClock } from './digital-clock';
import { variablesDisplay } from './variables-display';
import { ioField } from './io-field';
import { eventButton } from './event-button';
import { colorDropdown } from './color-dropdown';
import { pageNavigation } from './page-navigation';

// HTML Templates
import { landingPage } from './landing-page';
import { fontLoader } from './font-loader';
import { dashboardHtml } from './dashboard-html';

export interface Template {
  name: string;
  description: string;
  code: string;
}

// Separate templates into JavaScript and HTML categories
// This keeps them properly organized for tab-based selection in the UI
const codeTemplates: Record<string, Template> = {
  'simple-counter': simpleCounter,
  'data-visualization': simpleChart,
  'interactive-form': interactiveForm,
  'clock-widget': digitalClock,
  'variables-display': variablesDisplay,
  'io-field': ioField,
  'event-button': eventButton,
  'color-dropdown': colorDropdown,
  'page-navigation': pageNavigation,
};

const htmlTemplates: Record<string, Template> = {
  'landing-page': landingPage,
  'font-loader': fontLoader,
  'dashboard': dashboardHtml,
};

/**
 * Get all JavaScript templates
 */
export function getCodeTemplates(): Record<string, Template> {
  return codeTemplates;
}

/**
 * Get all HTML templates
 */
export function getHtmlTemplates(): Record<string, Template> {
  return htmlTemplates;
}

/**
 * Get all loaded templates (both JavaScript and HTML)
 * @returns Object with all templates keyed by ID
 */
export function getAllTemplates(): Record<string, Template> {
  return {
    ...codeTemplates,
    ...htmlTemplates,
  };
}

/**
 * Get a specific template by ID
 * @param templateId - The ID of the template to retrieve
 * @returns The template object or undefined if not found
 */
export function getTemplate(templateId: string): Template | undefined {
  return getAllTemplates()[templateId];
}

/**
 * Get all templates as an array
 * @returns Array of templates with their IDs
 */
export function getTemplatesArray(): Array<{ id: string; template: Template }> {
  return Object.entries(getAllTemplates()).map(([id, template]) => ({
    id,
    template,
  }));
}

/**
 * List all available template IDs
 * @returns Array of template IDs
 */
export function listTemplateIds(): string[] {
  return Object.keys(getAllTemplates());
}

export default getAllTemplates();
