import {XMLBuilder, XMLParser} from 'fast-xml-parser'
import {parse, stringify} from "yaml";
import * as PROPERTIES from 'dot-properties'

import {parseINI, parseTOML, stringifyINI, stringifyTOML} from "confbox";

const FORMAT = {
    JSON: 'json',
    XML: 'xml',
    TOML: 'toml',
    PROPERTIES: 'properties',
    YAML: 'yaml',
    TEXT: 'text'
} as const;

const xmlParser = new XMLParser({
    ignoreDeclaration: true,
});
const xmlBuilder = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: '@',
    format: true,
    indentBy: '  '
})
const XML = {
    parse: (xml: string): any => {
        return xmlParser.parse(xml)
    },
    stringify: (obj: any): string => {
        return xmlBuilder.build(obj)
    }
}
const TOML = {
    parse: (toml: string): any => {
        return parseTOML(toml)
    },
    stringify: (obj: any): string => {
        return stringifyTOML(obj)
    }
}
const YAML = {
    parse: (yaml: string): any => {
        return parse(yaml)
    },
    stringify: (obj: any): string => {
        return stringify(obj)
    }
}
const INI = {
    parse: (ini: string): any => {
        return parseINI(ini)
    },
    stringify: (obj: any): string => {
        return stringifyINI(obj)
    }
}
const detect = (str: string): string => {
    if (str === null || str === undefined || str.trim() === '') {
        return FORMAT.TEXT
    }
    str = str.trim()

    if (str.startsWith('<') && str.endsWith('>')) {
        return FORMAT.XML
    }
    if (str.startsWith('{') && str.endsWith('}') || str.startsWith('[') && str.endsWith(']')) {
        return FORMAT.JSON
    }
    if (str.startsWith('---')) {
        return FORMAT.YAML
    }
    for (let s of str.split('\n')) {
        if ((s.startsWith(' ') || s.startsWith('\t')) && s.trim() != '' && s.indexOf(':') !== -1) {
            return FORMAT.YAML
        }
    }
    if (str.split('\n').find(s => s.indexOf('=') !== -1) !== undefined) {
        if (str.split('\n').find(s => s.indexOf('[') !== -1)) {
            return FORMAT.TOML
        } else {
            return FORMAT.PROPERTIES
        }
    }
    return FORMAT.TEXT
}
const detectAndConvert = (str: string, to: string): string => {
    return convert(str, detect(str), to)
}
const convert = (str: string, from: string, to: string): string => {
    if (to === FORMAT.TEXT) {
        return str
    }
    const mid = [from].map(f => {
        switch (f) {
            case FORMAT.XML:
                return XML.parse(str)
            case FORMAT.YAML:
                return YAML.parse(str)
            case FORMAT.TOML:
                return TOML.parse(str)
            case FORMAT.PROPERTIES:
                return PROPERTIES.parse(str)
            case FORMAT.TEXT:
                return str
            case FORMAT.JSON:
                return JSON.parse(str)
        }
    })
    if (mid === null) {
        return str
    }
    return [to].map(t => {
        switch (t) {
            case FORMAT.XML:
                return XML.stringify(mid[0])
            case FORMAT.YAML:
                return YAML.stringify(mid[0])
            case FORMAT.TOML:
                return TOML.stringify(mid[0])
            case FORMAT.PROPERTIES:
                return PROPERTIES.stringify(mid[0])
            case FORMAT.TEXT:
                return mid[0].toString()
            case FORMAT.JSON:
                return JSON.stringify(mid[0], null, 2)
        }
    })[0]
}
export {XML, YAML, TOML, INI, PROPERTIES, FORMAT, detect, detectAndConvert, convert}