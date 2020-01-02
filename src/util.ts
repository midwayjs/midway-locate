import * as fse from 'fs-extra';

export const exists = async (file: string) => {
  return fse.pathExists(file);
};

export const safeReadJSON = async (file: string) => {
  if (await exists(file)) {
    try {
      return fse.readJSON(file);
    } catch (_) {
      return {};
    }
  } else {
    return {};
  }
};

export const safeGetProperty = (json: object, property: string | string[]) => {
  if (!json) {
    return null;
  }

  let properties = property;
  if (typeof property === 'string') {
    properties = property.split('.');
  }

  const currentProperty = (properties as string[]).shift();

  if (properties.length > 0 && typeof json[currentProperty] === 'object') {
    return safeGetProperty(json[currentProperty], properties);
  }

  return json[currentProperty];
};

export const propertyExists = (json: object, properties: string[]): boolean => {
  for (let propertyText of properties) {
    const data = safeGetProperty(json, propertyText);
    if (data) {
      return true;
    }
  }
  return false;
};
