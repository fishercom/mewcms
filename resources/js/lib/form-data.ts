function objectToFormData(
    obj: Record<string, unknown>,
    form?: FormData,
    namespace?: string,
): FormData {
    const fd = form || new FormData();
    let formKey: string;

    for (const property in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, property)) {
            if (namespace) {
                formKey = namespace + '[' + property + ']';
            } else {
                formKey = property;
            }

            const value = obj[property];

            if (value === null || value === undefined) {
                continue;
            }

            if (typeof value === 'boolean') {
                fd.append(formKey, value ? '1' : '0');
            } else if (Array.isArray(value)) { // Handle arrays
                value.forEach((element, index) => {
                    const arrayKey = `${formKey}[${index}]`;
                    if (typeof element === 'object' && !(element instanceof File)) {
                        objectToFormData(element as Record<string, unknown>, fd, arrayKey);
                    } else {
                        fd.append(arrayKey, element as string | Blob);
                    }
                });
            } else if (typeof value === 'object' && !(value instanceof File)) {
                objectToFormData(value as Record<string, unknown>, fd, formKey);
            } else {
                fd.append(formKey, value as string | Blob);
            }
        }
    }

    return fd;
}

export default objectToFormData;