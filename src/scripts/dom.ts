export function getElement<T extends Element>(selector: string, type: new () => T) : T {
    const element = document.querySelector(selector);

    if (!(element instanceof type)){
        throw new Error('The selector "${selector}" was not found or the element is not of type "${type.name}"');
    }
    return element;
}