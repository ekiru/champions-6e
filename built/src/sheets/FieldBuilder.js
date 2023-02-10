var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _FieldBuilder_instances, _FieldBuilder_htmlEnricher, _FieldBuilder_object, _FieldBuilder_asyncField, _FieldBuilder_field, _FieldBuilder_get;
const TEMPLATE_BASE = "systems/champions-6e/templates/field";
const FIELD_TYPES = "checkbox editor number selection text".split(" ");
// this condition allows this file to be imported in the jest environment.
if (globalThis.Hooks) {
    Hooks.once("setup", async function () {
        const templates = {};
        const templateNames = FIELD_TYPES.map((type) => `${TEMPLATE_BASE}/${type}-field.hbs`);
        const loaded = await loadTemplates(templateNames);
        for (const i in templateNames) {
            templates[templateNames[i]] = loaded[i];
        }
        Handlebars.registerHelper({
            field: function (field, options) {
                const html = templates[field.template]({ ...field, ...options.hash }, {});
                return new Handlebars.SafeString(html);
            },
        });
    });
}
export default class FieldBuilder {
    constructor(object, { htmlEnricher = TextEditor } = {}) {
        _FieldBuilder_instances.add(this);
        _FieldBuilder_htmlEnricher.set(this, void 0);
        _FieldBuilder_object.set(this, void 0);
        __classPrivateFieldSet(this, _FieldBuilder_htmlEnricher, htmlEnricher, "f");
        __classPrivateFieldSet(this, _FieldBuilder_object, object, "f");
    }
    checkbox(label, path, data = {}) {
        return __classPrivateFieldGet(this, _FieldBuilder_instances, "m", _FieldBuilder_field).call(this, "checkbox", label, path, data);
    }
    async html(label, path, data = {}) {
        return __classPrivateFieldGet(this, _FieldBuilder_instances, "m", _FieldBuilder_asyncField).call(this, "editor", label, path, data, (html) => __classPrivateFieldGet(this, _FieldBuilder_htmlEnricher, "f").enrichHTML(html, { async: true }));
    }
    number(label, path, data = {}) {
        return __classPrivateFieldGet(this, _FieldBuilder_instances, "m", _FieldBuilder_field).call(this, "number", label, path, data);
    }
    selection(label, path, options, data = {}) {
        const field = __classPrivateFieldGet(this, _FieldBuilder_instances, "m", _FieldBuilder_field).call(this, "selection", label, path, data);
        field.options = options;
        if (field.value in options) {
            field.valueLabel = options[field.value];
        }
        else {
            throw new Error(`current value "${field.value}" is not a valid option`);
        }
        return field;
    }
    text(label, path, data = {}) {
        return __classPrivateFieldGet(this, _FieldBuilder_instances, "m", _FieldBuilder_field).call(this, "text", label, path, data);
    }
}
_FieldBuilder_htmlEnricher = new WeakMap(), _FieldBuilder_object = new WeakMap(), _FieldBuilder_instances = new WeakSet(), _FieldBuilder_asyncField = async function _FieldBuilder_asyncField(type, label, path, data, mapper) {
    const field = __classPrivateFieldGet(this, _FieldBuilder_instances, "m", _FieldBuilder_field).call(this, type, label, path, data);
    if (mapper) {
        field.value = await mapper(field.value);
    }
    return field;
}, _FieldBuilder_field = function _FieldBuilder_field(type, label, path, data = {}) {
    const template = `${TEMPLATE_BASE}/${type}-field.hbs`;
    return { label, path, template, value: __classPrivateFieldGet(this, _FieldBuilder_instances, "m", _FieldBuilder_get).call(this, path), ...data };
}, _FieldBuilder_get = function _FieldBuilder_get(path) {
    let object = __classPrivateFieldGet(this, _FieldBuilder_object, "f");
    for (const prop of path.split(".")) {
        object = object[prop];
    }
    return object;
};
