function objectToFormData(obj: Record<string, unknown>, form?: FormData, namespace?: string): FormData {
    const fd = form || new FormData();
    let formKey: string;

    for (const property in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, property)) {
            if (namespace) {
                formKey = namespace + '[' + property + ']';
            } else {
                formKey = property;
            }

            // if the property is an object, but not a File, use recursivity.
            if (typeof obj[property] === 'object' && !(obj[property] instanceof File)) {
                objectToFormData(obj[property] as Record<string, unknown>, fd, formKey);
            } else {
                // if it's a string or a File object
                fd.append(formKey, obj[property] as string | Blob);
            }
        }
    }

    return fd;
}

export default objectToFormData;
