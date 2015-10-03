'use babel';

import { parseString as parseStringOld } from 'xml2js';

export const parseString = (xml) => {
  return new Promise((resolve, reject) => {
    parseStringOld(xml, (err, result) => {
      console.log(xml);
      console.log(err);
      resolve(result);
    });
  });
};
