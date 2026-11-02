export function createElement(tagName, attributes = {}, ...children){
    const element = document.createElement(tagName);
    for (const [name, value] of Object.entries(attributes)){
        element.setAttribute(name, value);
    }
    element.append(...children);
    return element;
}