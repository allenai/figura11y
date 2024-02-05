/**
 * Mapping from guideline identifier to list of strings representing guidelines.
 *
 * @interface GuidelinesMapping
 * @typedef {GuidelinesMapping}
 */
interface GuidelinesMapping {
    [key: string]: string[];
}

/**
 * A convenience mapping for nested guidelines.
 *
 * @interface Guidelines
 * @typedef {Guidelines}
 */
interface Guidelines {
    [key: string]: any;
}

/**
 * Nested guidelines for different figure types.
 *
 * @type {Guidelines}
 */
export const GUIDELINES: Guidelines = {
    "general": {
        "guidelines": [
            "Descriptions for the same image may differ vastly depending on context.",
            "Survey the text surrounding an image to understand how it fits into the bigger picture.",
            "Use context to decide which basic concepts and terms have already been explained, and avoid repetition of explanations.",
            "Reference examples and details that the reader will understand (this includes objects and attributes used in the description).",
            "Include color only when it is significant (e.g. arbitrary colors assigned for elements of bar graphs and line charts need not be specified).",
            "Avoid introducing new concepts or terms.",
            "Don't interpret or analyze the material. Instead, allow readers to form their own opinions."
        ]
    },
    "diagram": {
        "illustrated": {
            "sketch": {
                "guidelines": [
                    "Traditional descriptions of purely visual images benefit from descriptions that are brief and specific",
                    "Organize the description in a linear fashion, in this case, moving left to right and use bullet points or line breaks to aid in navigation",
                    "Focus on the intent of the image and the surrounding text",
                    "Check the sketch's caption. It is possible that the sketch may be decorative or only minimal additional information will be needed.",
                    "If the caption is brief, or missing some key details, describe setting, subject, and action first, then include texture, orientation, and color, if relevant. This type of description is more widely used.",
                    "All of the details may be relevant.",
                    "The description should not introduce any new terms or concepts that are not discussed or defined in the surrounding text."
                ]
            }
        },
        "relational": {
            "venn": {
                "guidelines": [
                    "Focus on the data in the Venn diagram, not on its appearance.",
                    "Provide the data in brief statements.",
                    "Give a summary if one is immediately apparent."
                ]
            },
            "hierarchy_tree": {
                "guidelines": [
                    "Set up the diagram by providing the title if there is one and a general overview, including its levels and parts.",
                    "Approach the diagram from top to bottom and from left to right.",
                    "Use a nested list.",
                    "Any art or photos included in the diagram should be described if they are the only example of the concepts described in the diagram. For this particular image, the photos are labeled with the names of each level, so there is no need for additional description of the photos."
                ]
            },
            "flow": {
                "guidelines": [
                    "Flow charts are a common method of presenting information and one of the most difficult images to describe.",
                    "Simple flow charts can be converted into nested lists with good results. Present the \u201cboxes\u201d as numbers and the possible transitions as sub-bullets.",
                    "It is not necessary to describe the visual attributes of the charts, e.g. yellow boxes, curved arrows, etc., unless there is an explicit need such as a reference in the caption or mentions to these attributes.",
                    "In some cases, the main process can begin in multiple different ways, with other processes that are closely related but not directly connected. The following guidelines pertain to such cases (those wich multiple start points).",
                    "Begin with a brief overview, explaining the distinct elements of the image, including if it has multiple starting points, additional lists, etc.",
                    "Describe each section of the flow chart linearly, using nested lists as an organizing tool.",
                    "It may be helpful to explicitly state when the different lines merge.",
                    "Some flow charts may also have multiple paths. If so, convert the flow chart into a single linear list, with the possible next steps of each box or item nested below it."
                ]
            }
        }
    },
    "graph": {
        "preamble": {
            "guidelines": [
                "For most graphs, give a brief description including the title and axis labels and mention trends not already described in the text.",
                "For simple charts, state the actual data points."
            ]
        },
        "levels": {
            "guidelines": [
                "The following is a conceptual model for categorizing and comparing the semantic content conveyed by natural language descriptions of visualizations. You can refer to it to consider which attributes are relevant to include in the description.",
                "Level 1: chart type, encoding channels, title, axis ranges, labels, colors",
                "Level 2: descriptive statistics, extrema, outliers, correlations, point-wise comparisons",
                "Level 3: complex trends, pattern synthesis, exceptions, commonplace concepts"
            ]
        },
        "bar": {
            "guidelines": [
                "Briefly describe the graph and give a summary if one is immediately apparent.",
                "Provide the title and axis labels.",
                "It is not necessary to describe the visual attributes of the bars, e.g. dark blue, light blue, unless there is an explicit need such as a reference in the caption or mentions to the colors.",
                "Explain the data on the x-axis and the y-axis and summarize the overall trend.",
                "For a simple chart, list the data in bullet form (approximate numbers if needed).",
                "Use the appropriate vocabulary in context with the surrounding text."
            ]
        },
        "line": {
            "guidelines": [
                "Briefly describe the chart and give a summary if one is immediately apparent.",
                "Provide the title and axis labels.",
                "It is not necessary to describe the visual attributes of the lines, e.g. solid, dashed, unless there is an explicit need such as a reference in the caption or mentions to these attributes. In this case, with just two lines, the added description is not a burden to the reader."
            ]
        },
        "pie": {
            "guidelines": [
                "Pie graphs should be converted into accessible tables (approximate numbers if needed).",
                "It is not necessary to describe the visual attributes of the charts, e.g., red wedge, blue lines, etc., unless there is an explicit need such as a reference in the caption or mentions to these attributes.",
                "It is helpful to list the numbers from smallest to largest, regardless of how they are presented in the image."
            ]
        },
        "box": {
            "guidelines": [
                "Boxplots typically communicate the mean or median, interquartile range, standard deviations, and outlier values of a variable or variables."
            ]
        },
        "scatter": {
            "guidelines": [
                "Provide the title and axis labels.",
                "Identify the image as a scatter plot and focus on the change of concentration of the data points."
            ]
        }
    }
};

/**
 * A service for getting guidelines for a figure based on its type.
 *
 * @export
 * @class GuidelineService
 * @typedef {GuidelineService}
 */
export class GuidelineService {
    // Unnested mapping ("." shows hierarchical relationship)
    private static GUIDELINES_MAPPING: GuidelinesMapping = {
        "Area chart": ["general", "graph.preamble", "graph.levels", "graph.line"],
        "Bar plots": ["general", "graph.preamble", "graph.levels", "graph.bar"],
        "Block diagram": ["general", "diagram.relational.flow"],
        "Box plot": ["general", "graph.preamble", "graph.box", "graph.levels"],
        "Bubble chart": ["general", "graph.preamble", "graph.levels"],
        "Confusion matrix": ["general", "graph.preamble", "graph.levels"],
        "Flow chart": ["general", "diagram.relational.flow"],
        "Line plot": ["general", "graph.preamble", "graph.levels", "graph.line"],
        "Histogram": ["general", "graph.preamble", "graph.levels", "graph.bar"],
        "Pareto charts": ["general", "graph.preamble", "graph.levels"],
        "Pie chart": ["general", "graph.preamble", "graph.levels", "graph.pie"],
        "Polar plot": ["general", "graph.preamble", "graph.levels"],
        "Radar chart": ["general", "graph.preamble", "graph.levels"],
        "Scatter plot": ["general", "graph.preamble", "graph.levels", "graph.scatter"],
        "Sketches": ["general", "diagram.illustrated.sketch"],
        "Tree Diagram": ["general", "diagram.relational.hierarchy_tree"],
        "Venn Diagram": ["general", "diagram.relational.venn"],
        "Other": ["general"]
    };

    private guidelines: Guidelines;

    /**
     * Creates an instance of the GuidelineService.
     *
     * @constructor
     * @param {*} yamlData - The data containing the (nested) guidelines.
     */
    constructor(yamlData: any) {
        this.guidelines = this.flattenDict(yamlData);
    }

    private flattenDict(d: { [key: string]: any }, parent_key: string = "", sep: string = "."): { [key: string]: any } {
        let items: { [key: string]: any } = {};
        // eslint-disable-next-line no-restricted-syntax
        for (const [k, v] of Object.entries(d)) {
            const new_key = parent_key ? parent_key + sep + k : k;
            if (typeof v === "object" && !Array.isArray(v)) {
                items = { ...items, ...this.flattenDict(v, new_key, sep) };
            } else {
                items[new_key] = v;
            }
        }
        return items;
    }

    /**
     * Returns the guidelines for a figure based on its type.
     *
     * @public
     * @param {string} figureType - Type of the figure to get guidelines for.
     * @returns {string}
     */
    public getGuidelines(figureType: string): string {
        let ft = figureType;
        if (!(figureType in GuidelineService.GUIDELINES_MAPPING)) {
            ft = "Figure";
        }
        const guidelines = GuidelineService.GUIDELINES_MAPPING[ft];
        return guidelines
            .map((guideline) => this.guidelines[`${guideline}.guidelines`].join("\n"))
            .join("\n");
    }
}
