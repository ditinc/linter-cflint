'use babel';

import { parseString as parseStringOld } from 'xml2js';

export const parseString = (xml) => {
  return new Promise((resolve) => {
    parseStringOld(xml, (err, result) => {
      resolve(result);
    });
  });
};
