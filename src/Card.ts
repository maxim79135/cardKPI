"use strict";
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import DataView = powerbi.DataView;
import {
    stringExtensions as StringExtensions,
    textMeasurementService as TextMeasurementService,
    wordBreaker,
    interfaces,
} from "powerbi-visuals-utils-formattingutils";
import { manipulation } from "powerbi-visuals-utils-svgutils";

import { BaseType, select, Selection } from "d3-selection";
import powerbi from "powerbi-visuals-api";
import { CardSettings } from "./settings";
import { TextProperties } from "powerbi-visuals-utils-formattingutils/lib/src/interfaces";

import translate = manipulation.translate;

export enum CardClassNames {
    Root = "root",
    CardsContainer = "cardsContainer",
    CardContainer = "card card-",
    CategoryLabel = "category category-",
    DataLabel = "data data-",
    AdditionalCategoryContainer = "additional-category-container additional-category-container-",
    AdditionalCategoryLabel = "additional-category additional-category-",
    AdditionalMeasureContainer = "additional-measure-container additional-measure-container-",
    AdditionalMeasureLabel = "additional-measure additional-measure-",
}

interface IAdditionalCategory {
    name?: string;
    value?: string;
}

interface IDataGroup {
    displayName?: string;
    mainMeasureValue?: number;
    additionalCategory?: IAdditionalCategory[];
}

interface ICardViewModel {
    settings: CardSettings;
    dataGroups: IDataGroup[];
}

interface ILabelProperties {
    textSize: number;
    fontFamily: string;
    isBold: boolean;
    isItalic: boolean;
    color: string;
}

export class Card {
    private root: Selection<BaseType, any, any, any>;
    private cardsContainer: Selection<BaseType, any, any, any>;
    private model: ICardViewModel;
    private cardViewport: { width: number; height: number };
    private cardMargin: {
        left: number;
        top: number;
        right: number;
        bottom: number;
    };
    private numberOfCards: number;
    private cardsPerRow: number;
    private numberOfRows: number;
    private svgRect: SVGRect[];

    constructor(target: HTMLElement) {
        this.root = select(target).classed(CardClassNames.Root, true);
        this.cardsContainer = this.root
            .append("div")
            .classed(CardClassNames.CardsContainer, true);
    }

    public getModel(): ICardViewModel {
        return this.model;
    }

    public visualTransform(
        options: VisualUpdateOptions,
        settings: CardSettings
    ) {
        let dataViews: DataView[] = options.dataViews;
        let dataGroups: IDataGroup[] = [];
        if (
            dataViews &&
            dataViews[0] &&
            dataViews[0].categorical &&
            dataViews[0].categorical.values
        ) {
            let dataCategorical = dataViews[0].categorical;
            let category = dataCategorical.categories
                ? dataCategorical.categories[
                      dataCategorical.categories.length - 1
                  ]
                : null;
            let categories = category ? category.values : [""];

            for (let i = 0; i < categories.length; i++) {
                let dataGroup: IDataGroup = {};
                dataGroup.additionalCategory = [];

                for (let ii = 0; ii < dataCategorical.values.length; ii++) {
                    let dataValue = dataCategorical.values[ii];
                    let value: any = dataValue.values[i];

                    if (dataValue.source.roles["main_measure"]) {
                        dataGroup.displayName = category
                            ? categories[i].toString()
                            : dataValue.source.displayName;
                        dataGroup.mainMeasureValue = value;
                    }

                    [
                        "measure_comparison_1",
                        "measure_comparison_2",
                        "measure_comparison_3",
                    ].map((v) => {
                        if (dataValue.source.roles[v])
                            dataGroup.additionalCategory.push({
                                name: v,
                                value: dataValue.source.displayName,
                            });
                    });
                    dataGroup.additionalCategory.sort((a, b) => {
                        if (a.name > b.name) return 1;
                        if (a.name < b.name) return -1;
                        return 0;
                    });
                }
                dataGroups.push(dataGroup);
            }
        }

        this.model = { settings, dataGroups };
        this.numberOfCards = this.model.dataGroups.length;
        this.cardsPerRow = Math.min(
            this.numberOfCards,
            this.model.settings.multiple.cardsPerRow
        );
        this.numberOfRows = Math.ceil(this.numberOfCards / this.cardsPerRow);
    }

    public updateViewport(viewport: powerbi.IViewport) {
        this.cardMargin = {
            left: 0,
            top: 0,
            right:
                this.cardsPerRow > 1
                    ? this.model.settings.multiple.cardsMargin
                    : 0,
            bottom:
                this.numberOfRows > 1
                    ? this.model.settings.multiple.cardsMargin
                    : 0,
        };

        this.cardViewport = {
            width: Math.floor(
                (viewport.width -
                    (this.cardMargin.left + this.cardMargin.right) *
                        this.cardsPerRow) /
                    this.cardsPerRow
            ),
            height: Math.floor(
                (viewport.height -
                    (this.cardMargin.top + this.cardMargin.bottom) *
                        this.numberOfRows) /
                    this.numberOfRows
            ),
        };
    }

    public createCardContainer() {
        this.cardsContainer.selectAll(".card").remove();
        this.svgRect = [];

        for (let i = 0; i < this.model.dataGroups.length; i++) {
            let cardContainer = this.cardsContainer
                .append("div")
                .classed(CardClassNames.CardContainer + i, true)
                .style("margin-left", this.cardMargin.left + "px")
                .style("margin-right", this.cardMargin.right + "px")
                .style("margin-top", this.cardMargin.top + "px")
                .style("margin-bottom", this.cardMargin.bottom + "px")
                .style("width", this.cardViewport.width + "px")
                .style("height", this.cardViewport.height + "px")
                .style("background", this.model.settings.card.backFill)
                .style(
                    "border",
                    this.model.settings.card.borderShow
                        ? this.model.settings.card.borderWeight +
                              "px " +
                              this.model.settings.card.borderType +
                              " " +
                              this.model.settings.card.borderFill
                        : ""
                );
            let svg = cardContainer
                .append("svg")
                .style("width", "100%")
                .style("height", "100%");
            this.svgRect.push(
                <SVGRect>(<SVGElement>svg.node()).getBoundingClientRect()
            );
        }
    }

    public createLabels() {
        if (this.model.settings.categoryLabel.show) {
            this.createCategoryLabel();
        }
        if (this.model.settings.additionalCategoryLabel.show) {
            this.createAdditionalCategoryLabel();
        }
        this.createDataLabel();
    }

    private createCategoryLabel() {
        for (let i = 0; i < this.model.dataGroups.length; i++) {
            let svg = this.cardsContainer.select(".card-" + i).select("svg");
            let categoryLabel = svg
                .append("g")
                .classed(CardClassNames.CategoryLabel + i, true);
            categoryLabel.append("text");

            let svgRect = this.svgRect[i];
            let textProperties = this.getTextProperties(
                this.model.settings.categoryLabel
            );
            textProperties.text = this.model.dataGroups[i].displayName;
            this.updateLabelStyles(
                categoryLabel,
                this.model.settings.categoryLabel
            );

            if (this.model.settings.categoryLabel.wordWrap) {
                let maxDataHeight = svgRect.height / 2;
                this.updateLabelValueWithWrapping(
                    categoryLabel,
                    textProperties,
                    this.model.dataGroups[i].displayName,
                    svgRect.width,
                    maxDataHeight
                );
            } else {
                let categoryValue =
                    TextMeasurementService.getTailoredTextOrDefault(
                        textProperties,
                        svgRect.width
                    );
                this.updateLabelValueWithoutWrapping(
                    categoryLabel,
                    categoryValue
                );
            }
            let categoryLabelSize = this.getLabelSize(categoryLabel);
            let x: number;
            let y: number =
                this.model.settings.categoryLabel.paddingTop +
                categoryLabelSize.height;

            if (
                this.model.settings.categoryLabel.horizontalAlignment ==
                "center"
            ) {
                x = svgRect.width / 2;
                categoryLabel.select("text").attr("text-anchor", "middle");
            } else if (
                this.model.settings.categoryLabel.horizontalAlignment == "left"
            ) {
                x = this.model.settings.categoryLabel.paddingSide;
                categoryLabel.select("text").attr("text-anchor", "start");
            } else if (
                this.model.settings.categoryLabel.horizontalAlignment == "right"
            ) {
                x =
                    svgRect.width -
                    this.model.settings.categoryLabel.paddingSide;
                categoryLabel.select("text").attr("text-anchor", "end");
            }

            categoryLabel.attr("transform", translate(x, y));
        }
    }

    private createDataLabel() {
        for (let i = 0; i < this.model.dataGroups.length; i++) {
            let svg = this.cardsContainer.select(".card-" + i).select("svg");
            let dataLabel = svg
                .append("g")
                .classed(CardClassNames.DataLabel + i, true);
            dataLabel.append("text");

            let svgRect = this.svgRect[i];
            let textProperties = this.getTextProperties(
                this.model.settings.dataLabel
            );
            textProperties.text = Number(
                this.model.dataGroups[i].mainMeasureValue
            ).toFixed(this.model.settings.dataLabel.decimalPlaces);

            this.updateLabelStyles(dataLabel, this.model.settings.dataLabel);
            let categoryValue = TextMeasurementService.getTailoredTextOrDefault(
                textProperties,
                svgRect.width / 2
            );
            this.updateLabelValueWithoutWrapping(dataLabel, categoryValue);

            let additionalCategoryExist = this.elementExist(
                svg.select(".additional-category-container-" + i)
            );
            let additionalMeasuresExist = this.elementExist(
                svg.select(".additional-measure-container-" + i)
            );
            let isDisableAdditionalMeasures =
                !additionalMeasuresExist && !additionalCategoryExist;

            let x: number, y: number;
            let categoryLabelSize = this.getLabelSize(
                svg.select(".category-" + i)
            );
            y =
                this.model.settings.categoryLabel.paddingTop +
                categoryLabelSize.height +
                (svgRect.height -
                    this.model.settings.categoryLabel.paddingTop -
                    categoryLabelSize.height) /
                    2;
            if (isDisableAdditionalMeasures) x = svgRect.width / 2;
            else x = svgRect.width / 4;

            dataLabel.select("text").style("dominant-baseline", "middle");
            dataLabel.select("text").attr("text-anchor", "middle");
            dataLabel.attr("transform", translate(x, y));
        }
    }

    private createAdditionalCategoryLabel() {
        for (let i = 0; i < this.model.dataGroups.length; i++) {
            let svg = this.cardsContainer.select(".card-" + i).select("svg");
            let svgRect = this.svgRect[i];
            let additionalCategoryContainter = svg
                .append("g")
                .classed(CardClassNames.AdditionalCategoryContainer + i, true);

            let categoryLabelSize = this.getLabelSize(
                svg.select(".category-" + i)
            );

            this.model.dataGroups[0].additionalCategory.map((v, j, array) => {
                let additionalCategoryLabel = additionalCategoryContainter
                    .append("g")
                    .classed(
                        CardClassNames.AdditionalCategoryLabel + i + j,
                        true
                    );
                additionalCategoryLabel.append("text");
                let textProperties = this.getTextProperties(
                    this.model.settings.additionalCategoryLabel
                );
                textProperties.text = v.value;
                let additionalCategoryWidth =
                    svgRect.width / (2 * array.length);

                this.updateLabelStyles(
                    additionalCategoryLabel,
                    this.model.settings.additionalCategoryLabel
                );

                if (this.model.settings.additionalCategoryLabel.wordWrap) {
                    let maxDataHeight = svgRect.height / 2;
                    this.updateLabelValueWithWrapping(
                        additionalCategoryLabel,
                        textProperties,
                        v.value,
                        additionalCategoryWidth,
                        maxDataHeight
                    );
                } else {
                    let categoryValue =
                        TextMeasurementService.getTailoredTextOrDefault(
                            textProperties,
                            additionalCategoryWidth
                        );
                    this.updateLabelValueWithoutWrapping(
                        additionalCategoryLabel,
                        categoryValue
                    );
                }

                let additionalCategoryLabelSize = this.getLabelSize(
                    additionalCategoryLabel
                );
                let y =
                    this.model.settings.categoryLabel.paddingTop +
                    categoryLabelSize.height +
                    additionalCategoryLabelSize.height / 2 +
                    this.model.settings.additionalCategoryLabel.paddingTop;
                let x: number;
                if (
                    this.model.settings.additionalCategoryLabel
                        .horizontalAlignment == "center"
                ) {
                    x =
                        svgRect.width / 2 +
                        j * additionalCategoryWidth +
                        additionalCategoryWidth / 2;
                    additionalCategoryLabel
                        .select("text")
                        .attr("text-anchor", "middle");
                } else if (
                    this.model.settings.additionalCategoryLabel
                        .horizontalAlignment == "left"
                ) {
                    x =
                        svgRect.width / 2 +
                        j * additionalCategoryWidth +
                        this.model.settings.additionalCategoryLabel.paddingSide;
                    additionalCategoryLabel
                        .select("text")
                        .attr("text-anchor", "start");
                } else if (
                    this.model.settings.additionalCategoryLabel
                        .horizontalAlignment == "right"
                ) {
                    x =
                        svgRect.width / 2 +
                        j * additionalCategoryWidth +
                        additionalCategoryWidth -
                        this.model.settings.multiple.spaceBetweenCardComponent -
                        this.model.settings.additionalCategoryLabel.paddingSide;
                    additionalCategoryLabel
                        .select("text")
                        .attr("text-anchor", "end");
                }
                additionalCategoryLabel
                    .select("text")
                    .style("dominant-baseline", "middle");
                additionalCategoryLabel.attr("transform", translate(x, y));
            });
        }
    }

    private getTextProperties(properties: ILabelProperties): TextProperties {
        return {
            fontFamily: properties.fontFamily,
            fontSize: properties.textSize + "px",
            fontWeight: properties.isBold ? "bold" : "normal",
            fontStyle: properties.isItalic ? "italic" : "normal",
        };
    }

    private updateLabelStyles(
        label: Selection<BaseType, any, any, any>,
        styles: ILabelProperties
    ) {
        label
            .select("text")
            .style("font-family", styles.fontFamily)
            .style("font-size", styles.textSize + "px")
            .style("font-style", styles.isItalic === true ? "italic" : "normal")
            .style("font-weight", styles.isBold === true ? "bold" : "normal")
            .style("fill", styles.color);
    }

    private updateLabelValueWithoutWrapping(
        label: Selection<BaseType, any, any, any>,
        value: string
    ) {
        label.select("text").text(value);
    }

    private updateLabelValueWithWrapping(
        label: Selection<BaseType, any, any, any>,
        textProperties: TextProperties,
        value: string,
        maxWidth: number,
        maxHeight: number
    ) {
        let textHeight: number =
            TextMeasurementService.estimateSvgTextHeight(textProperties);
        let maxNumLines: number = Math.max(
            1,
            Math.floor(maxHeight / textHeight)
        );
        let labelValues = wordBreaker.splitByWidth(
            value,
            textProperties,
            TextMeasurementService.measureSvgTextWidth,
            maxWidth,
            maxNumLines,
            TextMeasurementService.getTailoredTextOrDefault
        );
        label
            .select("text")
            .selectAll("tspan")
            .data(labelValues)
            .enter()
            .append("tspan")
            .attr("x", 0)
            .attr("dy", (d, i) => {
                if (i === 0) {
                    return 0;
                } else {
                    return textHeight;
                }
            })
            .text((d) => {
                return d;
            });
    }

    private elementExist(element: Selection<BaseType, any, any, any>) {
        if (!element.empty()) {
            return true;
        } else {
            return false;
        }
    }

    private getLabelSize(
        labelGroup: Selection<BaseType, any, any, any>
    ): SVGRect {
        if (this.elementExist(labelGroup)) {
            return <SVGRect>(<any>labelGroup.node()).getBBox();
        } else {
            return {
                width: 0,
                height: 0,
                x: 0,
                y: 0,
                bottom: 0,
                top: 0,
                left: 0,
                right: 0,
                toJSON: null,
            };
        }
    }
}
