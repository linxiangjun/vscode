/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import platform = require('vs/platform/platform');
import { IJSONSchema } from 'vs/base/common/jsonSchema';
import { Color, RGBA } from 'vs/base/common/color';
import { ITheme } from 'vs/platform/theme/common/themeService';

import nls = require('vs/nls');

//  ------ API types

export type ColorIdentifier = string;

export interface ColorContribution {
	readonly id: ColorIdentifier;
	readonly description: string;
	readonly defaults: ColorDefaults;
}


export interface ColorFunction {
	(theme: ITheme): Color;
}

export interface ColorDefaults {
	light: ColorValue;
	dark: ColorValue;
	hc: ColorValue;
}

/**
 * A Color Value is either a color literal, a refence to other color or a derived color
 */
export type ColorValue = Color | string | ColorIdentifier | ColorFunction;

// color registry
export const Extensions = {
	ColorContribution: 'base.contributions.colors'
};

export interface IColorRegistry {

	/**
	 * Register a color to the registry.
	 * @param id The color id as used in theme descrition files
	 * @param defaults The default values
	 * @description the description
	 */
	registerColor(id: string, defaults: ColorDefaults, description: string): ColorIdentifier;

	/**
	 * Get all color contributions
	 */
	getColors(): ColorContribution[];

	/**
	 * Gets the default color of the given id
	 */
	resolveDefaultColor(id: ColorIdentifier, theme: ITheme): Color;

	/**
	 * JSON schema of all colors
	 */
	getColorSchema(): IJSONSchema;

}

const colorPattern = '^#([0-9A-Fa-f]{2}){3,4}$';
const colorPatternErrorMessage = nls.localize('invalid.color', 'Invalid color format. Use #RRGGBB or #RRGGBBAA');

class ColorRegistry implements IColorRegistry {
	private colorsById: { [key: string]: ColorContribution };
	private colorSchema: IJSONSchema = { type: 'object', description: nls.localize('schema.colors', "Colors used in the workbench."), properties: {}, additionalProperties: false };

	constructor() {
		this.colorsById = {};
	}

	public registerColor(id: string, defaults: ColorDefaults, description: string): ColorIdentifier {
		let colorContribution = { id, description, defaults };
		this.colorsById[id] = colorContribution;
		this.colorSchema.properties[id] = { type: 'string', description, format: 'color', pattern: colorPattern, patternErrorMessage: colorPatternErrorMessage };
		return id;
	}

	public getColors(): ColorContribution[] {
		return Object.keys(this.colorsById).map(id => this.colorsById[id]);
	}

	public resolveDefaultColor(id: ColorIdentifier, theme: ITheme): Color {
		let colorDesc = this.colorsById[id];
		if (colorDesc && colorDesc.defaults) {
			let colorValue = colorDesc.defaults[theme.type];
			return resolveColorValue(colorValue, theme);
		}
		return null;
	}

	public getColorSchema(): IJSONSchema {
		return this.colorSchema;
	}

	public toString() {
		return Object.keys(this.colorsById).sort().map(k => `- \`${k}\`: ${this.colorsById[k].description}`).join('\n');
	}

}

const colorRegistry = new ColorRegistry();
platform.Registry.add(Extensions.ColorContribution, colorRegistry);

export function registerColor(id: string, defaults: ColorDefaults, description: string): ColorIdentifier {
	return colorRegistry.registerColor(id, defaults, description);
}

// ----- base colors

export const foreground = registerColor('foreground', { dark: '#CCCCCC', light: '#6C6C6C', hc: '#FFFFFF' }, nls.localize('foreground', "Overall foreground color. This color is only used if not overridden by a component."));
export const focus = registerColor('focusedElementOutline', {
	dark: Color.fromRGBA(new RGBA(14, 99, 156)).transparent(0.6),
	light: Color.fromRGBA(new RGBA(0, 122, 204)).transparent(0.4),
	hc: '#F38518'
}, nls.localize('focusedElementOutline', "Overall outline/border color for focused elements. This color is only used if not overridden by a component."));

/**
 * Commonly used High contrast colors.
 */
export const highContrastBorder = registerColor('highContrastBorder', { light: null, dark: null, hc: '#6FC3DF' }, nls.localize('highContrastBorder', "Border color to separate components when high contrast theme is enabled."));
export const highContrastOutline = registerColor('highContrastOutline', { light: null, dark: null, hc: focus }, nls.localize('highContrastOutline', "Outline color for active components when high contrast theme is enabled."));

/**
 * Widgets
 */
export const inputBackground = registerColor('inputBoxBackground', { dark: '#3C3C3C', light: Color.white, hc: Color.black }, nls.localize('inputBoxBackground', "Input box background."));
export const inputForeground = registerColor('inputBoxForeground', { dark: foreground, light: foreground, hc: foreground }, nls.localize('inputBoxForeground', "Input box foreground."));
export const inputBorder = registerColor('inputBoxBorder', { dark: null, light: null, hc: highContrastBorder }, nls.localize('inputBoxBorder', "Input box border."));
export const inputActiveOptionBorder = registerColor('inputBoxActiveOptionBorder', { dark: '#007ACC', light: '#007ACC', hc: highContrastOutline }, nls.localize('inputBoxActiveOptionBorder', "Border color of activated options in input fields."));

export const selectBackground = registerColor('dropdownBackground', { dark: '#3C3C3C', light: Color.white, hc: '#3C3C3C' }, nls.localize('dropdownBackground', "Dropdown background."));
export const selectForeground = registerColor('dropdownForeground', { dark: '#F0F0F0', light: null, hc: Color.white }, nls.localize('dropdownForeground', "Dropdown foreground."));
export const selectBorder = registerColor('dropdownBorder', { dark: selectBackground, light: '#CECECE', hc: selectBackground }, nls.localize('dropdownBorder', "Dropdown border."));

export const listFocusBackground = registerColor('listFocusBackground', { dark: '#073655', light: '#DCEBFC', hc: null }, nls.localize('listFocusBackground', "List/Tree focus background when active."));
export const listInactiveFocusBackground = registerColor('listInactiveFocusBackground', { dark: null, light: null, hc: null }, nls.localize('listInactiveFocusBackground', "List/Tree focus background when inactive."));
export const listActiveSelectionBackground = registerColor('listActiveSelectionBackground', { dark: '#0E639C', light: '#4FA7FF', hc: null }, nls.localize('listActiveSelectionBackground', "List/Tree selection background when active."));
export const listActiveSelectionForeground = registerColor('listActiveSelectionForeground', { dark: Color.white, light: Color.white, hc: Color.white }, nls.localize('listActiveSelectionForeground', "List/Tree selection foreground when active."));
export const listFocusAndSelectionBackground = registerColor('listFocusAndSelectionBackground', { dark: '#094771', light: '#3399FF', hc: null }, nls.localize('listFocusAndSelectionBackground', "List/Tree focus and selection background."));
export const listFocusAndSelectionForeground = registerColor('listFocusAndSelectionForeground', { dark: Color.white, light: Color.white, hc: Color.white }, nls.localize('listFocusAndSelectionForeground', "List/Tree focus and selection foreground."));
export const listInactiveSelectionBackground = registerColor('listInactiveSelectionBackground', { dark: '#3F3F46', light: '#CCCEDB', hc: null }, nls.localize('listInactiveSelectionBackground', "List/Tree selection background when inactive."));
export const listHoverBackground = registerColor('listHoverBackground', { dark: '#2A2D2E', light: '#F0F0F0', hc: null }, nls.localize('listHoverBackground', "List/Tree hover background."));
export const listDropBackground = registerColor('listDropBackground', { dark: '#383B3D', light: '#DDECFF', hc: null }, nls.localize('listDropBackground', "List/Tree drag and drop background."));

export const listFocusOutline = registerColor('listFocusOutline', { dark: null, light: null, hc: highContrastOutline }, nls.localize('listFocusOutline', "List/Tree focus outline color when active."));
export const listInactiveFocusOutline = registerColor('listInactiveFocusOutline', { dark: null, light: null, hc: null }, nls.localize('listInactiveFocusOutline', "List/Tree focus outline color when inactive."));
export const listSelectionOutline = registerColor('listSelectionOutline', { dark: null, light: null, hc: highContrastOutline }, nls.localize('listSelectionOutline', "List/Tree selection outline color."));
export const listHoverOutline = registerColor('listHoverOutline', { dark: null, light: null, hc: highContrastOutline }, nls.localize('listHoverOutline', "List/Tree hover outline color."));

export const pickerGroupForeground = registerColor('pickerGroupForeground', { dark: Color.fromHex('#0097FB').transparent(0.6), light: Color.fromHex('#007ACC').transparent(0.6), hc: Color.white }, nls.localize('pickerGroupForeground', "Quick picker color for grouping labels."));
export const pickerGroupBorder = registerColor('pickerGroupBorder', { dark: '#3F3F46', light: '#CCCEDB', hc: Color.white }, nls.localize('pickerGroupBorder', "Quick picker color for grouping borders."));

export const buttonBackground = registerColor('buttonBackground', { dark: '#0E639C', light: '#007ACC', hc: null }, nls.localize('buttonBackground', "Button background color."));
export const buttonHoverBackground = registerColor('buttonHoverBackground', { dark: '#007ACC', light: '#006BB3', hc: null }, nls.localize('buttonHoverBackground', "Button background color when hovering."));

/**
 * Editor background color.
 * Because of bug https://monacotools.visualstudio.com/DefaultCollection/Monaco/_workitems/edit/13254
 * we are *not* using the color white (or #ffffff, rgba(255,255,255)) but something very close to white.
 */
export const editorBackground = registerColor('editorBackground', { light: '#fffffe', dark: '#1E1E1E', hc: Color.black }, nls.localize('editorBackground', "Editor background color."));

/**
 * Editor foreground color.
 */
export const editorForeground = registerColor('editorForeground', { light: '#333333', dark: '#BBBBBB', hc: Color.white }, nls.localize('editorForeground', "Editor default foreground color."));

/**
 * Editor selection colors.
 */
export const editorSelection = registerColor('editorSelection', { light: '#ADD6FF', dark: '#264F78', hc: '#f3f518' }, nls.localize('editorSelection', "Color of the editor selection."));
export const editorInactiveSelection = registerColor('editorInactiveSelection', { light: transparent(editorSelection, 0.5), dark: transparent(editorSelection, 0.5), hc: null }, nls.localize('editorInactiveSelection', "Color of the selection in an inactive editor."));
export const editorSelectionHighlight = registerColor('editorSelectionHighlight', { light: lessProminent(editorSelection, editorBackground, 0.3, 0.6), dark: lessProminent(editorSelection, editorBackground, 0.3, 0.6), hc: null }, nls.localize('editorSelectionHighlight', 'Color for regions with the same content as the selection.'));

/**
 * Editor find match colors.
 */
export const editorFindMatch = registerColor('editorFindMatch', { light: '#A8AC94', dark: '#515C6A', hc: null }, nls.localize('editorFindMatch', "Color of the current search match."));
export const editorFindMatchHighlight = registerColor('editorFindMatchHighlight', { light: '#EA5C0055', dark: '#EA5C0055', hc: null }, nls.localize('findMatchHighlight', "Color of the other search matches."));
export const editorFindRangeHighlight = registerColor('editorFindRangeHighlight', { dark: '#3a3d4166', light: '#b4b4b44d', hc: null }, nls.localize('findRangeHighlight', "Color the range limiting the search."));

/**
 * Editor link colors
 */
export const editorActiveLinkForeground = registerColor('editorActiveLinkForeground', { dark: '#4E94CE', light: Color.black, hc: Color.cyan }, nls.localize('activeLinkForeground', 'Color of active links.'));
export const editorLinkForeground = registerColor('editorLinkForeground', { dark: null, light: null, hc: null }, nls.localize('linkForeground', 'Color of links.'));

/**
 * Find widget
 */
export const editorWidgetBackground = registerColor('editorWidgetBackground', { dark: '#2D2D30', light: '#EFEFF2', hc: '#0C141F' }, nls.localize('editorWidgetBackground', 'Background color of editor widgets, such as find/replace.'));
export const editorWidgetShadow = registerColor('editorWidgetShadow', { dark: '#000000', light: '#A8A8A8', hc: null }, nls.localize('editorWidgetShadow', 'Shadow color of editor widgets such as find/replace.'));


// ----- color functions

export function darken(colorValue: ColorValue, factor: number): ColorFunction {
	return (theme) => {
		let color = resolveColorValue(colorValue, theme);
		if (color) {
			return color.darken(factor);
		}
		return null;
	};
}

export function transparent(colorValue: ColorValue, factor: number): ColorFunction {
	return (theme) => {
		let color = resolveColorValue(colorValue, theme);
		if (color) {
			return color.transparent(factor);
		}
		return null;
	};
}

function lessProminent(colorValue: ColorValue, backgroundColorValue: ColorValue, factor: number, transparency: number): ColorFunction {
	return (theme) => {
		let from = resolveColorValue(colorValue, theme);
		if (from) {
			let backgroundColor = resolveColorValue(backgroundColorValue, theme);
			if (backgroundColor) {
				if (from.isDarkerThan(backgroundColor)) {
					return Color.getLighterColor(from, backgroundColor, factor).transparent(transparency);
				}
				return Color.getDarkerColor(from, backgroundColor, factor).transparent(transparency);
			}
			return from.transparent(factor * transparency);
		}
		return null;
	};
}

// ----- implementation

/**
 * @param colorValue Resolve a color value in the context of a theme
 */
function resolveColorValue(colorValue: ColorValue, theme: ITheme): Color {
	if (colorValue === null) {
		return null;
	} else if (typeof colorValue === 'string') {
		if (colorValue[0] === '#') {
			return Color.fromHex(colorValue);
		}
		return theme.getColor(colorValue);
	} else if (colorValue instanceof Color) {
		return colorValue;
	} else if (typeof colorValue === 'function') {
		return colorValue(theme);
	}
	return null;
}

//setTimeout(_ => console.log(colorRegistry.toString()), 5000);



