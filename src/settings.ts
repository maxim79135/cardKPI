/*
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

"use strict";

import { dataViewObjectsParser } from "powerbi-visuals-utils-dataviewutils";
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;

export class Multiple {
    public cardsPerRow: number = 5;
    public cardsMargin: number = 5;
    public spaceBeforeFirstComponent: number = 15;
    public spaceBetweenCardComponent: number = 15;
}

export class Card {
    public backFill: string = null;
    public borderShow: boolean = false;
    public borderFill: string = "#000000";
    public borderType: string = "solid";
    public borderWeight: number = 1;
}

export class CategoryLabel {
    public show: boolean = true;
    public horizontalAlignment: string = "center";
    public paddingTop: number = 5;
    public paddingSide: number = 5;
    public color: string = "#333333";
    public textSize: number = 15;
    public fontFamily: string =
        "wf_standard-font, helvetica, arial, sans-serif";
    public wordWrap: boolean = false;
    public isItalic: boolean = false;
    public isBold: boolean = false;
}

export class DataLabel {
    public color: string = "#333333";
    public displayUnit: number = 0;
    public decimalPlaces: number = 0;
    public textSize: number = 27;
    public fontFamily: string =
        "wf_standard-font, helvetica, arial, sans-serif";
    public isItalic: boolean = false;
    public isBold: boolean = false;
}

export class AdditionalCategoryLabel {
    public show: boolean = true;
    public horizontalAlignment: string = "center";
    public paddingTop: number = 15;
    public paddingSide: number = 5;
    public color: string = "#333333";
    public textSize: number = 15;
    public fontFamily: string =
        "wf_standard-font, helvetica, arial, sans-serif";
    public isItalic: boolean = false;
    public isBold: boolean = false;
    public wordWrap: boolean = false;
}

export class MeasureComparison {
    public show: boolean = false;
    public componentType: string = "measure";
    public unmatchedColor: string = "#333333";
    public comparisonOperator: string = ">";
    public condition1: boolean = false;
    public condition2: boolean = false;
    public condition3: boolean = false;
    public condition4: boolean = false;
    public isItalic: boolean = false;
    public isBold: boolean = false;
    public textSize: number = 25;
    public fontFamily: string =
        "wf_standard-font, helvetica, arial, sans-serif";
    public paddingTop: number = 5;
}

export class CardSettings extends DataViewObjectsParser {
    public multiple: Multiple = new Multiple();
    public card: Card = new Card();
    public categoryLabel: CategoryLabel = new CategoryLabel();
    public dataLabel: DataLabel = new DataLabel();
    public additionalCategoryLabel: AdditionalCategoryLabel =
        new AdditionalCategoryLabel();
    public measureComparison1: MeasureComparison = new MeasureComparison();
    public measureComparison2: MeasureComparison = new MeasureComparison();
    public measureComparison3: MeasureComparison = new MeasureComparison();
    public measureComparison = {
        measureComparison1: this.measureComparison1,
        measureComparison2: this.measureComparison2,
        measureComparison3: this.measureComparison3,
    };
}
