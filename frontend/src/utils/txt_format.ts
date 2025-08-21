import {XMLBuilder, XMLParser, XMLValidator} from 'fast-xml-parser'
import {parse, stringify} from "yaml";
import * as TOML from '@iarna/toml'
import * as PROPERTIES from 'dot-properties'

import {parseINI, stringifyINI,} from "confbox";

const FORMAT = {
    JSON: Symbol('json'),
    XML: Symbol('xml'),
    TOML: Symbol('toml'),
    INI: Symbol('ini'),
    PROPERTIES: Symbol('properties'),
    YAML: Symbol('yaml'),
    TEXT: Symbol('text')
};
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
const detect = (str: string): symbol => {
    if (str === null || str === undefined || str.trim() === '') {
        return FORMAT.TEXT
    }
    str = str.trim()
    try {
        if (XMLValidator.validate(str)) {
            return FORMAT.XML
        }
    } catch (e) {
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
const detectAndConvert = (str: string, to: symbol): any => {
    return convert(str, detect(str), to)
}
const convert = (str: string, from: symbol, to: symbol): any => {
    const mid = [from].map(f => {
        switch (f) {
            case FORMAT.XML:
                return XML.parse(str)
            case FORMAT.YAML:
                return YAML.parse(str)
            case FORMAT.TOML:
                return TOML.parse(str)
            case FORMAT.INI:
                return INI.parse(str)
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
            case FORMAT.INI:
                return INI.stringify(mid[0])
            case FORMAT.PROPERTIES:
                return PROPERTIES.stringify(mid[0])
            case FORMAT.TEXT:
                return mid[0]
            case FORMAT.JSON:
                return JSON.stringify(mid[0], null, 2)
        }
    })
}
export {XML, YAML, TOML, INI, PROPERTIES, FORMAT, detect, detectAndConvert, convert}