const md2json = require('./md2json');
const fs = require('fs').promises;


const types = ["string", "object", "bool", "boolean", "array", "number", "function", "any", "boolean, 'mixed'"];
function typeFrom(rawData: string): string | undefined {
    if (!rawData) return undefined;
    // XXX could to better by splitting on |  or parse markdown tableau (m2json do not do it)
    for(const idxt in types) {
        const type = types[idxt];
        if (rawData.includes("| " + type  +" |")) {
            return type;
        }
    }
    if (rawData.includes("| function(")) {
        return "function";
    }
    
    return undefined;
}

async function start(rootPath: string, version: string) {
    var docPath = rootPath  // TODO or if version defined website\\versioned_docs\\version-<version>
    if (version == "main") {
        docPath += "docs\\"
    } else {
        docPath += "website\\versioned_docs\\version-" + version + "\\"
    }

    var result: {[key: string]: object}  = {};
    const components = ["activityindicator",
                        "button",
                        "flatlist",
                        "image",
                        "imagebackground",
                        "keyboardavoidingview",
                        "modal",
                        "pressable",
                        "refreshcontrol",
                        "scrollview",
                        "sectionlist",
                        "statusbar",
                        "switch",
                        "text",
                        "textinput",
                        "touchablehighlight",
                        "touchableopacity",
                        "touchablewithoutfeedback",
                        "view",
                        "virtualizedlist"];// XXX alternative of list, browse all md file or read /website/sidebars.json
    for(const idxc in components) {
        const component = components[idxc];
        // read or parse markdown to a json description
        // TODO: check if file exists, maybe not according to version (if list of components is not computed by version)
        const data = await fs.readFile(docPath + component + ".md");
        var string = data.toString('utf8');
        if (component=="pressable") {
            if (!string.includes("# Reference")) { // fix missing header in docs
                string = string.replace("## Props", "# Reference\n\n## Props")
            }
        }
        const parsed = md2json.parse(string);
        // get Props sectiojn
        var props: {[key: string]: any}
        if(parsed["Reference"] == undefined) {
            console.log("ignore " + component)
            continue;  
        } else {
            props = parsed["Reference"]["Props"];
        }  
        // sanetize prop name
        const htmlDefinedProperties: {[key: string]: string} = {
            "required": "<div class=\"label required basic\">Required</div>",
            "iOSOnly": "<div class=\"label ios\">iOS</div>",
            "androidOnly": "<div class=\"label android\">Android</div>"
        }
        for(const prop in props) {
            if ( typeof props[prop] === 'string') {
                continue
            }
            var name = prop.replaceAll("`", "");
            for(const htmlDefinedProperty in htmlDefinedProperties) {
                if (name.includes(htmlDefinedProperties[htmlDefinedProperty])) {
                    name = name.replace(htmlDefinedProperties[htmlDefinedProperty], "");
                    props[prop][htmlDefinedProperty] = true;
                }
            }
            name = name.trim()
            props[prop].type = typeFrom(props[prop].raw);
            props[name] = props[prop];
            delete props[prop];
        }
        result[component] = props;
    }
    const jsonString = JSON.stringify(result, null, 2);

    await fs.writeFile("components-" + version + ".json", jsonString);
}

// Call start
(async() => {
    
    const rootPath = "D:\\Downloads\\react-native-website-main\\react-native-website-main\\" // TODO get path from argument

    await start(rootPath, "main");
    await start(rootPath, "0.71");
})();
