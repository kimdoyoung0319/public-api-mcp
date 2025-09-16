import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { XMLParser } from "fast-xml-parser";
import { z, AnyZodObject } from "zod";

/**
 * Possible response data types for public API responses.
 */
export const PublicApiResponseTypeSchema = z.enum(["JSON", "XML"]);
export type PublicApiResponseType = z.infer<typeof PublicApiResponseTypeSchema>;

/**
 * An adapter that converts public API responses to MCP-compatible JSON data.
 */
export class PublicApiAdapter {
    private static _xmlParser = new XMLParser();

    constructor() {}

    /**
     * Converts a data string to `CallToolResult`.
     *
     * @param data - A public API response string, which is either valid JSON or XML.
     * @param responseType - Type of `data`. See `PublicApiResponseType` for further information.
     * @param outputSchema - An optional schema for the parsed result.
     *
     * @returns The converted object.
     *
     * @throws {SyntaxError} If `type` is `JSON` and `data` is not a valid JSON string.
     * @throws {ZodError} If parsed result of `data` does not agree to `outputSchema`.
     */
    convert(data: string, responseType: PublicApiResponseType, outputSchema?: AnyZodObject): CallToolResult {
        switch (responseType) {
            case "JSON":
                return this.convertJson(data, outputSchema);
            case "XML":
                return this.convertXml(data, outputSchema);
        }
    }

    /**
     * Converts a JSON string to `CallToolResult`.
     *
     * @param json - A valid JSON string.
     * @param outputSchema - An optional schema for the parsed result.
     *
     * @returns The converted object.
     *
     * @throws {SyntaxError} If `json` is not a valid JSON string.
     * @throws {ZodError} If `json` does not agree to `outputSchema`.
     */
    private convertJson(json: string, outputSchema?: AnyZodObject): CallToolResult {
        let parsed = JSON.parse(json);

        return this.validate(parsed, outputSchema);
    }

    /**
     * Converts a XML string to `CallToolResult`.
     *
     * @param xml - A valid XML string.
     * @param outputSchema - An optional schema for the parsed result.
     *
     * @returns The converted object.
     *
     * @throws {ZodError} If `xml` does not agree to `outputSchema`.
     */
    private convertXml(xml: string, outputSchema?: AnyZodObject): CallToolResult {
        let parsed = PublicApiAdapter._xmlParser.parse(xml);

        return this.validate(parsed, outputSchema);
    }

    /**
     * Validates and parses an object with given schema.
     *
     * @param content - An object that would agree with `outputSchema`.
     * @param outputSchema - An optional schema for the parsed result.
     *
     * @returns An object parsed using `outputSchema`.
     *
     * @throws {ZodError} If `content` does not agree to `outputSchema`.
     */
    private validate(content: any, outputSchema?: AnyZodObject): CallToolResult {
        if (outputSchema === undefined) {
            return {
                content: [],
                structuredContent: content,
            };
        }

        return {
            content: [],
            structuredContent: outputSchema.parse(content),
        };
    }
}
